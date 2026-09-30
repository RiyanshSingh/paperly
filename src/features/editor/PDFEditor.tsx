import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from '../../lib/pdfjs';
import { fabric } from 'fabric';
import { Type, PenTool, Square, Trash2, Download, ChevronLeft, ChevronRight, Eraser, MousePointer2, AlertCircle, Image as ImageIcon, LayoutGrid, ZoomIn, ZoomOut, ArrowLeft, Undo, Redo } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SEO } from '../../components/SEO';
import { PDFThumbnail } from '../../components/pdf/PDFThumbnail';

// Customize Fabric.js selection handles to look modern
fabric.Object.prototype.set({
  transparentCorners: false,
  cornerColor: '#ec4899', 
  cornerStrokeColor: '#ffffff',
  borderColor: '#ec4899',
  cornerSize: 12,
  padding: 6,
  cornerStyle: 'circle',
  borderDashArray: [4, 4],
});

// Custom Rotate Icon
const rotateIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='12' fill='%233b82f6' stroke='none'/%3E%3Cpath d='M21.13 15.118l-1.077-1.428m0 0l-1.428 1.077m1.428-1.077A9.002 9.002 0 1112 3a9 9 0 018.053 5.372'/%3E%3C/svg%3E";
const rotImg = document.createElement('img');
rotImg.src = rotateIcon;

if (fabric.Object.prototype.controls.mtr) {
  fabric.Object.prototype.controls.mtr.withConnection = false;
  fabric.Object.prototype.controls.mtr.offsetY = -24;
  fabric.Object.prototype.controls.mtr.render = function(ctx, left, top, styleOverride, fabricObject) {
    const size = 24;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
    ctx.drawImage(rotImg, -size/2, -size/2, size, size);
    ctx.restore();
  };
}

// ----------------- PDF Page Component -----------------
interface PDFPageEditorProps {
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  activeTool: string;
  color: string;
  pageStates: React.MutableRefObject<Map<number, any>>;
  fabricInstances: React.MutableRefObject<Map<number, fabric.Canvas>>;
  onVisible: (pageNum: number) => void;
  containerWidth: number;
  zoomLevel: number;
  undoStacks: React.MutableRefObject<Map<number, any[]>>;
  redoStacks: React.MutableRefObject<Map<number, any[]>>;
  isHistoryProcessing: React.MutableRefObject<boolean>;
}

const PDFPageEditor: React.FC<PDFPageEditorProps> = ({ pageNum, pdfDoc, activeTool, color, pageStates, fabricInstances, onVisible, containerWidth, zoomLevel, undoStacks, redoStacks, isHistoryProcessing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 1130 });

  // Intersection Observer for updating active page
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onVisible(pageNum);
        }
      });
    }, { 
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0 
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pageNum, onVisible]);

  // Render PDF
  useEffect(() => {
    let isMounted = true;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        
        // Render exactly at the PDF's intrinsic size (with a slight 1.2x baseline for modern screens)
        // No artificial stretching to fill container width!
        const cssScale = 1.2; 
        const cssWidth = unscaledViewport.width * cssScale;
        const cssHeight = unscaledViewport.height * cssScale;
        
        if (isMounted) setDimensions({ width: cssWidth, height: cssHeight });

        const pixelRatio = window.devicePixelRatio || 2;
        const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });

        const bgCanvas = bgCanvasRef.current;
        if (!bgCanvas) return;
        const context = bgCanvas.getContext('2d');
        if (!context) return;

        bgCanvas.width = renderViewport.width;
        bgCanvas.height = renderViewport.height;

        await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        if (!isMounted) return;

        // Setup Fabric
        let fCanvas = fabricInstances.current.get(pageNum);
        if (!fCanvas && fabricCanvasRef.current) {
          fCanvas = new fabric.Canvas(fabricCanvasRef.current, {
            isDrawingMode: false,
            preserveObjectStacking: true,
            enableRetinaScaling: true
          });
          fabricInstances.current.set(pageNum, fCanvas);

          const saveHistory = () => {
             if (isHistoryProcessing.current) return;
             const stacks = undoStacks.current.get(pageNum) || [];
             stacks.push(fCanvas!.toJSON());
             undoStacks.current.set(pageNum, stacks);
             redoStacks.current.set(pageNum, []); 
             pageStates.current.set(pageNum, fCanvas!.toJSON());
          };

          fCanvas.on('object:added', saveHistory);
          fCanvas.on('object:modified', saveHistory);
          fCanvas.on('object:removed', saveHistory);
        }

        if (fCanvas) {
          fCanvas.setDimensions({ width: cssWidth * zoomLevel, height: cssHeight * zoomLevel });
          fCanvas.setZoom(zoomLevel);
          fCanvas.clear();

          const savedState = pageStates.current.get(pageNum);
          if (savedState) {
            isHistoryProcessing.current = true;
            fCanvas.loadFromJSON(savedState, () => {
              fCanvas?.renderAll();
              applyToolSettings(fCanvas!, activeTool, color);
              
              if (!undoStacks.current.has(pageNum)) {
                 undoStacks.current.set(pageNum, [fCanvas!.toJSON()]);
              }
              isHistoryProcessing.current = false;
            });
          } else {
            applyToolSettings(fCanvas, activeTool, color);
            if (!undoStacks.current.has(pageNum)) {
               undoStacks.current.set(pageNum, [fCanvas.toJSON()]);
            }
          }
        }
      } catch (err) {
        if (err?.name === 'RenderingCancelledException') return;
        console.error('Error rendering page:', err);
      }
    };
    renderPage();

    return () => {
      isMounted = false;
      // On unmount, save state if fabric exists
      const fCanvas = fabricInstances.current.get(pageNum);
      if (fCanvas) {
        pageStates.current.set(pageNum, fCanvas.toJSON());
      }
    }
  }, [pdfDoc, pageNum, containerWidth]);

  useEffect(() => {
    const fCanvas = fabricInstances.current.get(pageNum);
    if (fCanvas) applyToolSettings(fCanvas, activeTool, color);
  }, [activeTool, color, pageNum]);

  // Handle zooming smoothly without re-rendering the PDF
  useEffect(() => {
    const fCanvas = fabricInstances.current.get(pageNum);
    if (fCanvas && dimensions.width > 0) {
      fCanvas.setDimensions({ 
        width: dimensions.width * zoomLevel, 
        height: dimensions.height * zoomLevel 
      });
      fCanvas.setZoom(zoomLevel);
    }
  }, [zoomLevel, dimensions]);

  const applyToolSettings = (canvas: fabric.Canvas, tool: string, currentColor: string) => {
    canvas.isDrawingMode = (tool === 'draw');
    if (tool === 'draw') {
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = 3;
    }
  };

  return (
    <div 
      id={`page-${pageNum}`} 
      ref={containerRef}
      className="relative shadow-2xl bg-white mx-auto mb-12 flex-none transition-all duration-200"
      style={{ width: `${dimensions.width * zoomLevel}px`, height: `${dimensions.height * zoomLevel}px` }}
    >
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 w-full h-full">
        <canvas ref={fabricCanvasRef} />
      </div>
    </div>
  );
};
// ----------------------------------------------------


export const PDFEditor: React.FC = () => {
  const [state, setState, isReady] = usePersistentState('pdf-editor-state', {
    file: null as File | null,
    pageNum: 1,
  });

  const { file, pageNum } = state;
  const setFile = (f: File | null) => setState(s => ({ ...s, file: f }));
  const setPageNum = (pn: number) => setState(s => ({ ...s, pageNum: pn }));

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'draw' | 'rect' | 'whiteout'>('select');
  const [color, setColor] = useState('#ef4444');
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const navigate = useNavigate();
  
  const pageStates = useRef<Map<number, any>>(new Map());
  const fabricInstances = useRef<Map<number, fabric.Canvas>>(new Map());
  const undoStacks = useRef<Map<number, any[]>>(new Map());
  const redoStacks = useRef<Map<number, any[]>>(new Map());
  const isHistoryProcessing = useRef(false);

  const handleUndo = () => {
    const stacks = undoStacks.current.get(pageNum) || [];
    if (stacks.length <= 1) return; // Need at least initial state + 1 action

    isHistoryProcessing.current = true;
    const currentState = stacks.pop();
    const redos = redoStacks.current.get(pageNum) || [];
    redos.push(currentState);
    redoStacks.current.set(pageNum, redos);
    
    const previousState = stacks[stacks.length - 1];
    undoStacks.current.set(pageNum, stacks);
    pageStates.current.set(pageNum, previousState);

    const fCanvas = fabricInstances.current.get(pageNum);
    if (fCanvas) {
      fCanvas.loadFromJSON(previousState, () => {
        fCanvas.renderAll();
        isHistoryProcessing.current = false;
      });
    } else {
      isHistoryProcessing.current = false;
    }
  };

  const handleRedo = () => {
    const redos = redoStacks.current.get(pageNum) || [];
    if (redos.length === 0) return;

    isHistoryProcessing.current = true;
    const nextState = redos.pop();
    const undos = undoStacks.current.get(pageNum) || [];
    undos.push(nextState);
    undoStacks.current.set(pageNum, undos);
    pageStates.current.set(pageNum, nextState);
    redoStacks.current.set(pageNum, redos);

    const fCanvas = fabricInstances.current.get(pageNum);
    if (fCanvas) {
      fCanvas.loadFromJSON(nextState, () => {
        fCanvas.renderAll();
        isHistoryProcessing.current = false;
      });
    } else {
      isHistoryProcessing.current = false;
    }
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // File Upload
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    pageStates.current.clear();
    fabricInstances.current.clear();
    setPageNum(1);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(loadedPdf);
      setNumPages(loadedPdf.numPages);
    } catch (err) {
      console.error(err);
      setError("Failed to load PDF. It might be encrypted or corrupted.");
    }
  };

  useEffect(() => {
    if (file && !pdfDoc && isReady) {
      const loadPersistedPdf = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          setPdfDoc(loadedPdf);
          setNumPages(loadedPdf.numPages);
        } catch (err) {
          console.error(err);
          setError("Failed to restore PDF from storage.");
        }
      };
      loadPersistedPdf();
    }
  }, [file, pdfDoc, isReady]);

  // Auto-scroll left sidebar thumbnail into view when pageNum changes
  useEffect(() => {
    const thumbnailEl = document.getElementById(`thumbnail-page-${pageNum}`);
    if (thumbnailEl) {
      thumbnailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [pageNum]);

  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(Math.min(scrollContainerRef.current.clientWidth - 64, 900));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc]);

  const handlePageVisible = useCallback((num: number) => {
    setPageNum(num);
  }, []);

  const scrollToPage = (num: number) => {
    const el = document.getElementById(`page-${num}`);
    if (el && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: el.offsetTop - 20,
        behavior: 'smooth'
      });
    }
    setPageNum(num);
  };

  const getActiveCanvas = () => {
    return fabricInstances.current.get(pageNum);
  };

  const addText = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const text = new fabric.IText('Type here...', {
      left: 50, top: 50, fontSize: 24, fill: color, fontFamily: 'Helvetica',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('select');
  };

  const addRect = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 50, top: 50, width: 100, height: 100, fill: 'transparent', stroke: color, strokeWidth: 3,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveTool('select');
  };

  const addWhiteout = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 50, top: 50, width: 150, height: 50, fill: 'white', stroke: 'transparent',
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveTool('select');
  };

  const deleteSelected = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach(obj => canvas.remove(obj));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const canvas = getActiveCanvas();
    if (!file || !canvas) return;
    
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.Image.fromURL(data, (img) => {
        if (img.width && img.width > 300) img.scaleToWidth(300);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        setActiveTool('select');
      });
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const savePDF = async () => {
    if (!file || !pdfDoc) return;
    setIsProcessing(true);

    try {
      // Sync all instances to state
      fabricInstances.current.forEach((instance, num) => {
        pageStates.current.set(num, instance.toJSON());
      });

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();

      for (let i = 1; i <= numPages; i++) {
        const state = pageStates.current.get(i);
        if (state && state.objects && state.objects.length > 0) {
          
          const tempCanvas = new fabric.Canvas(null);
          // Get the CSS dimensions for this page from the instance if it's alive, or assume standard
          const instance = fabricInstances.current.get(i);
          if (instance) {
             tempCanvas.setWidth((instance.width || 800) / zoomLevel);
             tempCanvas.setHeight((instance.height || 1000) / zoomLevel);
          } else {
             // If unmounted, we don't know the exact CSS dimensions, but this is an edge case in full render.
             tempCanvas.setWidth(800);
             tempCanvas.setHeight(1000);
          }

          await new Promise<void>((resolve) => {
            tempCanvas.loadFromJSON(state, () => {
              tempCanvas.renderAll();
              resolve();
            });
          });

          const dataUrl = tempCanvas.toDataURL({ format: 'png', multiplier: 3 });
          const pngImage = await pdf.embedPng(dataUrl);
          const pdfPage = pages[i - 1];
          const { width, height } = pdfPage.getSize();

          pdfPage.drawImage(pngImage, { x: 0, y: 0, width, height });
        }
      }

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to save edited PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <SEO title="Edit PDF - Annotate, Draw & Sign Online" description="..." path="/edit-pdf" />

      {!file ? (
        <div className="container mx-auto px-4 py-12 max-w-4xl h-full flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">PDF Editor</h1>
            <p className="text-lg text-zinc-400">Annotate, draw, add text, and whiteout your documents locally.</p>
          </div>
          <div className="bg-[#111] rounded-3xl border border-zinc-800 p-6 md:p-12 shadow-2xl">
            <FileUpload onFilesSelected={handleFilesSelected} multiple={false} title="Select PDF to Edit" description="or drag & drop it here" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
          {/* Top Toolbar */}
          <div className="flex-none bg-[#111] border-b border-zinc-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-hide pb-2 sm:pb-0">
              
              {/* Back Button */}
              <button onClick={() => navigate(-1)} className="flex flex-col items-center justify-center w-12 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors mr-1">
                <ArrowLeft className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Back</span>
              </button>
              
              <div className="w-px h-8 bg-zinc-800 mx-1 flex-shrink-0"></div>

              <button onClick={() => setActiveTool('select')} className={cn("flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors", activeTool === 'select' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200")}>
                <MousePointer2 className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Select</span>
              </button>
              
              <button onClick={() => setActiveTool('draw')} className={cn("flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors", activeTool === 'draw' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200")}>
                <PenTool className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Draw</span>
              </button>

              <button onClick={addText} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                <Type className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Text</span>
              </button>

              <button onClick={addRect} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                <Square className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Shape</span>
              </button>

              <button onClick={addWhiteout} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                <Eraser className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Redact</span>
              </button>

              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                <ImageIcon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Image</span>
              </button>

              <div className="w-px h-8 bg-zinc-800 mx-2 flex-shrink-0"></div>

              {/* Colors */}
              <div className="flex items-center gap-1.5 px-2">
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000', '#ffffff'].map(c => (
                  <button key={c} onClick={() => setColor(c)} className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0", color === c ? "border-zinc-400 scale-110" : "border-transparent")} style={{ backgroundColor: c }} title={c} />
                ))}
              </div>

              <div className="w-px h-8 bg-zinc-800 mx-2 flex-shrink-0"></div>

              <button onClick={deleteSelected} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors">
                <Trash2 className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Delete</span>
              </button>
              <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

              <div className="w-px h-8 bg-zinc-800 mx-2 flex-shrink-0"></div>
              
              <button onClick={handleUndo} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                <Undo className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Undo</span>
              </button>
              <button onClick={handleRedo} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                <Redo className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Redo</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-zinc-300 w-12 text-center tabular-nums">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(3.0, z + 0.1))} className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <Button onClick={savePDF} isLoading={isProcessing} className="shadow-lg shadow-blue-900/20">
                <Download className="w-4 h-4 mr-2" /> 
                {isProcessing ? 'Saving...' : 'Download'}
              </Button>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Left Sidebar - Thumbnails */}
            <div className="w-64 flex-none bg-[#0a0a0a] border-r border-zinc-800 overflow-y-auto hidden md:flex flex-col">
              <div className="p-4 border-b border-zinc-800 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10 flex items-center gap-2 text-zinc-300">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-semibold">Pages</span>
              </div>
              <div className="p-4 space-y-4">
                {Array.from({ length: numPages }).map((_, i) => (
                  <div 
                    key={i} 
                    id={`thumbnail-page-${i + 1}`}
                    className={cn(
                      "cursor-pointer rounded-xl overflow-hidden transition-all border-2",
                      pageNum === i + 1 ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100"
                    )}
                    onClick={() => scrollToPage(i + 1)}
                  >
                    <div className="bg-white pointer-events-none">
                      <PDFThumbnail file={file} pageNumber={i + 1} width={220} />
                    </div>
                    <div className={cn("text-center py-1.5 text-xs font-medium", pageNum === i + 1 ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400")}>
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas Area (Scrollable) */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-[#161616] relative p-8 scroll-smooth">
              {error && (
                <div className="sticky top-4 mx-auto w-full max-w-md p-3 bg-red-950/90 backdrop-blur text-red-200 border border-red-900/50 rounded-xl flex items-center gap-3 shadow-2xl z-50 mb-8">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {pdfDoc && Array.from({ length: numPages }).map((_, i) => (
                <PDFPageEditor
                  key={i + 1}
                  pageNum={i + 1}
                  pdfDoc={pdfDoc}
                  activeTool={activeTool}
                  color={color}
                  pageStates={pageStates}
                  fabricInstances={fabricInstances}
                  onVisible={handlePageVisible}
                  containerWidth={containerWidth}
                  zoomLevel={zoomLevel}
                  undoStacks={undoStacks}
                  redoStacks={redoStacks}
                  isHistoryProcessing={isHistoryProcessing}
                />
              ))}
            </div>

            {/* Floating Page Navigator */}
            <div className="fixed bottom-8 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 bg-[#111]/90 backdrop-blur-xl border border-zinc-700/50 rounded-full px-2 py-1.5 flex items-center shadow-2xl z-50">
              <button onClick={() => scrollToPage(pageNum - 1)} disabled={pageNum <= 1 || isProcessing} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 text-white text-sm font-medium tabular-nums border-x border-zinc-800 mx-1">
                Page {pageNum} <span className="text-zinc-500">of {numPages}</span>
              </div>
              <button onClick={() => scrollToPage(pageNum + 1)} disabled={pageNum >= numPages || isProcessing} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
