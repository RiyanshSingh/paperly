import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from '../../lib/pdfjs';
import { fabric } from 'fabric';
import { Type, PenTool, Square, Trash2, Download, ChevronLeft, ChevronRight, Eraser, MousePointer2, AlertCircle, Image as ImageIcon, LayoutGrid, ZoomIn, ZoomOut, ArrowLeft, Undo, Redo, X, Highlighter, Menu, Circle, Minus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette, Ban } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SEO } from '../../components/SEO';
import { PDFThumbnail } from '../../components/pdf/PDFThumbnail';

// Customize Fabric.js selection handles to look modern
fabric.Object.prototype.set({
  transparentCorners: false,
  cornerColor: '#000000ff', 
  cornerStrokeColor: '#ffffff',
  borderColor: '#000000ff',
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
  drawMode: 'pen' | 'highlighter' | 'eraser';
  drawThickness: number;
  pageStates: React.MutableRefObject<Map<number, any>>;
  fabricInstances: React.MutableRefObject<Map<number, fabric.Canvas>>;
  onVisible: (pageNum: number) => void;
  containerWidth: number;
  zoomLevel: number;
  undoStacks: React.MutableRefObject<Map<number, any[]>>;
  redoStacks: React.MutableRefObject<Map<number, any[]>>;
  isHistoryProcessing: React.MutableRefObject<boolean>;
}

const PDFPageEditor: React.FC<PDFPageEditorProps> = ({ pageNum, pdfDoc, activeTool, color, drawMode, drawThickness, pageStates, fabricInstances, onVisible, containerWidth, zoomLevel, undoStacks, redoStacks, isHistoryProcessing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 1130 });

  // Keep track of current modes for event listeners without rebinding
  const modeRef = useRef({ activeTool, drawMode, drawThickness });
  useEffect(() => {
    modeRef.current = { activeTool, drawMode, drawThickness };
  }, [activeTool, drawMode, drawThickness]);

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
    let renderTask: any = null;

    const renderPage = async () => {
      let lockAcquired = false;
      const bgCanvas = bgCanvasRef.current;
      if (!bgCanvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        
        // Render exactly at the PDF's intrinsic size
        const cssScale = 1.2; 
        const cssWidth = unscaledViewport.width * cssScale;
        const cssHeight = unscaledViewport.height * cssScale;
        
        if (isMounted) setDimensions({ width: cssWidth, height: cssHeight });

        const pixelRatio = window.devicePixelRatio || 2;
        const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });

        const context = bgCanvas.getContext('2d');
        if (!context) return;

        // Wait for any pending renders on this canvas to fully abort (React Strict Mode)
        while (bgCanvas.getAttribute('data-rendering') === 'true') {
          await new Promise(resolve => setTimeout(resolve, 10));
          if (!isMounted) return; // if unmounted while waiting, finally block will NOT clear lock since lockAcquired=false
        }
        bgCanvas.setAttribute('data-rendering', 'true');
        lockAcquired = true;

        // Reset canvas state completely
        bgCanvas.width = renderViewport.width;
        bgCanvas.height = renderViewport.height;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

        renderTask = page.render({ canvasContext: context, viewport: renderViewport });
        await renderTask.promise;
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

          // Erasing logic
          let isErasing = false;
          fCanvas.on('mouse:down', (options) => {
             const state = modeRef.current;
             if (state.activeTool === 'draw' && state.drawMode === 'eraser') {
               isErasing = true;
               if (options.target) fCanvas?.remove(options.target);
             }
          });
          fCanvas.on('mouse:over', (options) => {
             const state = modeRef.current;
             if (isErasing && state.activeTool === 'draw' && state.drawMode === 'eraser') {
               if (options.target) fCanvas?.remove(options.target);
             }
          });
          fCanvas.on('mouse:up', () => {
             isErasing = false;
          });
        }

        if (fCanvas) {
          fCanvas.setDimensions({ width: cssWidth * zoomLevel, height: cssHeight * zoomLevel });
          fCanvas.setZoom(zoomLevel);

          const savedState = pageStates.current.get(pageNum);
          if (savedState) {
            isHistoryProcessing.current = true;
            fCanvas.loadFromJSON(savedState, () => {
              fCanvas?.renderAll();
              applyToolSettings(fCanvas!, activeTool, color, drawMode, drawThickness);
              
              if (!undoStacks.current.has(pageNum)) {
                 undoStacks.current.set(pageNum, [fCanvas!.toJSON()]);
              }
              isHistoryProcessing.current = false;
            });
          } else {
            applyToolSettings(fCanvas, activeTool, color, drawMode, drawThickness);
            if (!undoStacks.current.has(pageNum)) {
               undoStacks.current.set(pageNum, [fCanvas.toJSON()]);
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        console.error('Error rendering page:', err);
      } finally {
        if (bgCanvas && lockAcquired) bgCanvas.setAttribute('data-rendering', 'false');
      }
    };
    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {}
      }
      // On unmount, save state if fabric exists
      const fCanvas = fabricInstances.current.get(pageNum);
      if (fCanvas) {
        pageStates.current.set(pageNum, fCanvas.toJSON());
      }
    }
  }, [pdfDoc, pageNum]);

  useEffect(() => {
    const fCanvas = fabricInstances.current.get(pageNum);
    if (fCanvas) applyToolSettings(fCanvas, activeTool, color, drawMode, drawThickness);
  }, [activeTool, color, drawMode, drawThickness, pageNum]);

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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const applyToolSettings = (canvas: fabric.Canvas, tool: string, currentColor: string, mode: string, thickness: number) => {
    const isEraser = (tool === 'draw' && mode === 'eraser');
    canvas.isDrawingMode = (tool === 'draw' && !isEraser);
    canvas.selection = !isEraser;
    canvas.defaultCursor = isEraser ? 'crosshair' : 'default';
    canvas.hoverCursor = isEraser ? 'crosshair' : 'move';

    // Prevent selecting objects while erasing
    canvas.forEachObject(obj => {
      obj.selectable = !isEraser;
    });

    if (tool === 'draw' && !isEraser) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      if (mode === 'pen') {
        canvas.freeDrawingBrush.color = currentColor;
        canvas.freeDrawingBrush.width = thickness;
      } else if (mode === 'highlighter') {
        const rgb = hexToRgb(currentColor);
        canvas.freeDrawingBrush.color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
        canvas.freeDrawingBrush.width = thickness * 4;
      }
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
  const [drawMode, setDrawMode] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [drawThickness, setDrawThickness] = useState(3);
  const [showThicknessMenu, setShowThicknessMenu] = useState(false);
  
  const [fontSize, setFontSize] = useState(24);
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  
  const [shapeType, setShapeType] = useState<'rect' | 'circle' | 'line'>('rect');
  const [fillColor, setFillColor] = useState('transparent');
  const [redactColor, setRedactColor] = useState('#000000');

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

  const updateActiveObject = (props: any) => {
    fabricInstances.current.forEach(canvas => {
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        activeObj.set(props);
        canvas.renderAll();
        canvas.fire('object:modified', { target: activeObj });
      }
    });
  };

  const handleColorChange = (c: string) => {
    setColor(c);
    if (activeTool === 'text') updateActiveObject({ fill: c });
    if (activeTool === 'rect') updateActiveObject({ stroke: c });
    if (activeTool === 'draw') {
      fabricInstances.current.forEach(canvas => {
        if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = c;
      });
    }
  };

  const handleRedactColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const c = e.target.value;
    setRedactColor(c);
    if (activeTool === 'whiteout') updateActiveObject({ fill: c });
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (activeTool === 'text') updateActiveObject({ fontSize: size });
  };

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    if (activeTool === 'text') updateActiveObject({ fontFamily: font });
  };

  const handleFontWeightChange = (bold: boolean) => {
    setIsBold(bold);
    if (activeTool === 'text') updateActiveObject({ fontWeight: bold ? 'bold' : 'normal' });
  };

  const handleTextAlign = (align: 'left' | 'center' | 'right') => {
    setTextAlign(align);
    if (activeTool === 'text') updateActiveObject({ textAlign: align });
  };

  const handleShapeTypeChange = (type: 'rect' | 'circle' | 'line') => {
    setShapeType(type);
    // Note: Changing shape type of an existing object is complex in Fabric, so we usually just set state for the next spawn
  };

  const handleFillColorChange = (c: string) => {
    setFillColor(c);
    if (activeTool === 'rect') updateActiveObject({ fill: c });
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
    let canvas = fabricInstances.current.get(pageNum);
    if (!canvas && fabricInstances.current.size > 0) {
      // Fallback to the first available canvas if pageNum is somehow out of sync
      canvas = Array.from(fabricInstances.current.values())[0];
    }
    return canvas;
  };

  const getInsertPosition = () => {
    const el = document.getElementById(`page-${pageNum}`);
    const scrollContainer = scrollContainerRef.current;
    if (!el || !scrollContainer) return { left: 50, top: 50 };

    const elRect = el.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // Calculate the vertical center of the scroll container relative to the page element
    const yInElement = (containerRect.top + containerRect.height / 2) - elRect.top;
    
    // Convert to Fabric's internal (unzoomed) coordinates
    // Ensure it doesn't spawn off the top or bottom edge of the page
    let top = Math.max(50, yInElement / zoomLevel);
    const canvas = getActiveCanvas();
    if (canvas && canvas.height) {
      top = Math.min(top, (canvas.height / zoomLevel) - 100);
    }
    
    return { left: 50, top };
  };

  const addText = () => {
    setActiveTool('text');
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const pos = getInsertPosition();
    const text = new fabric.IText('Type here...', {
      left: pos.left, top: pos.top, fontSize: fontSize, fill: color, fontFamily: fontFamily, fontWeight: isBold ? 'bold' : 'normal'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addShape = (type: 'rect' | 'circle' | 'line' = shapeType) => {
    setActiveTool('rect');
    if (type !== shapeType) setShapeType(type);
    
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const pos = getInsertPosition();
    let shape: fabric.Object;
    
    const baseOptions = { left: pos.left, top: pos.top, fill: fillColor, stroke: color, strokeWidth: drawThickness };
    
    if (type === 'circle') {
      shape = new fabric.Circle({ ...baseOptions, radius: 50 });
    } else if (type === 'line') {
      shape = new fabric.Line([pos.left, pos.top, pos.left + 150, pos.top], { stroke: color, strokeWidth: Math.max(drawThickness, 2) });
    } else {
      shape = new fabric.Rect({ ...baseOptions, width: 100, height: 100 });
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addWhiteout = () => {
    setActiveTool('whiteout');
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const pos = getInsertPosition();
    const rect = new fabric.Rect({
      left: pos.left, top: pos.top, width: 150, height: 50, fill: redactColor, stroke: 'transparent',
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.renderAll();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const canvas = getActiveCanvas();
    if (!file || !canvas) return;
    
    const pos = getInsertPosition();
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.Image.fromURL(data, (img) => {
        if (img.width && img.width > 300) img.scaleToWidth(300);
        img.set({ left: pos.left, top: pos.top });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
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
        <div className="container mx-auto px-4 py-12 max-w-4xl h-full flex flex-col justify-center relative">
          <button 
            onClick={() => navigate('/')} 
            className="absolute top-4 left-4 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </button>
          
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
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  setFile(null);
                  setPageNum(1);
                  fabricInstances.current.clear();
                  pageStates.current.clear();
                  undoStacks.current.clear();
                  redoStacks.current.clear();
                }} 
                className="flex flex-col items-center justify-center w-12 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors mr-1"
              >
                <ArrowLeft className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Close</span>
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

              <button onClick={() => addShape()} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
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

              {/* Zoom Controls */}
              <div className="flex items-center bg-zinc-900 rounded-lg p-1.5 mx-2 border border-zinc-800">
                <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-zinc-300 w-12 text-center tabular-nums">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(3.0, z + 0.1))} className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
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

              <Button onClick={savePDF} isLoading={isProcessing} className="shadow-lg shadow-blue-900/20">
                <Download className="w-4 h-4 mr-2" /> 
                {isProcessing ? 'Saving...' : 'Download'}
              </Button>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Left Sidebar - Thumbnails */}
            <div className="w-64 flex-none bg-[#0a0a0a] border-r border-zinc-800 overflow-y-auto scrollbar-hide hidden md:flex flex-col">
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
                  drawMode={drawMode}
                  drawThickness={drawThickness}
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

            {/* Apple Pencil Style Floating Toolbar */}
            {activeTool === 'draw' && (
              <div className="absolute top-1/2 left-4 md:left-[272px] -translate-y-1/2 bg-white/30 dark:bg-black/60 backdrop-blur-3xl p-2 rounded-3xl border border-white/80 dark:border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_0_4px_12px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(255,255,255,0.3)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_4px_12px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(255,255,255,0.1)] flex flex-col items-center gap-2 z-50 animate-in fade-in slide-in-from-left-4 duration-300 w-12">
                
                {/* Close Button */}
                <button onClick={() => setActiveTool('select')} className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors mb-1">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800"></div>

                {/* Draw Modes */}
                <button 
                  onClick={() => setDrawMode('pen')} 
                  className={cn("p-2 rounded-2xl transition-all relative group", drawMode === 'pen' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                  title="Pen"
                >
                  <PenTool className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDrawMode('highlighter')} 
                  className={cn("p-2 rounded-2xl transition-all relative group", drawMode === 'highlighter' ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                  title="Highlighter"
                >
                  <Highlighter className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDrawMode('eraser')} 
                  className={cn("p-2 rounded-2xl transition-all relative group", drawMode === 'eraser' ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                  title="Eraser (Delete Drawings)"
                >
                  <Eraser className="w-5 h-5" />
                </button>

                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>

                {/* Thickness */}
                <div className="relative">
                  <button 
                    onClick={() => setShowThicknessMenu(!showThicknessMenu)}
                    className={cn("p-2 rounded-2xl transition-colors relative", showThicknessMenu ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                    title={`Thickness: ${drawThickness}px`}
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* Thickness Popover */}
                  {showThicknessMenu && (
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 min-w-[200px] z-[60] animate-in fade-in slide-in-from-left-2">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Thickness</div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="20" 
                          value={drawThickness}
                          onChange={(e) => setDrawThickness(parseInt(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums w-4">
                          {drawThickness}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>

                {/* Colors */}
                <div className="flex flex-col gap-2 items-center">
                  {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => handleColorChange(c)} 
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", 
                        color === c ? "border-blue-500 scale-110 shadow-lg" : "border-zinc-300 dark:border-zinc-700 shadow-sm"
                      )} 
                      style={{ backgroundColor: c }} 
                      title={c} 
                    />
                  ))}
                  
                  {/* Custom Color Wheel */}
                  <div 
                    className="relative w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer mt-1" 
                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                    title="Custom Color"
                  >
                    <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                </div>
              </div>
            )}

            {/* TEXT Floating Toolbar */}
            {activeTool === 'text' && (
              <div className="absolute top-1/2 left-4 md:left-[272px] -translate-y-1/2 bg-white/30 dark:bg-black/60 backdrop-blur-3xl p-2 rounded-3xl border border-white/80 dark:border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_0_4px_12px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(255,255,255,0.3)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_4px_12px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(255,255,255,0.1)] flex flex-col items-center gap-2 z-50 animate-in fade-in slide-in-from-left-4 duration-300 w-12">
                <button onClick={() => setActiveTool('select')} className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors mb-1">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800"></div>

                {/* Font Family */}
                <div className="relative">
                  <button 
                    onClick={() => { setShowFontMenu(!showFontMenu); setShowTextSizeMenu(false); }}
                    className={cn("p-2 rounded-2xl transition-colors relative font-bold text-sm", showFontMenu ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                    title="Font Family"
                  >
                    Aa
                  </button>
                  {showFontMenu && (
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1a1a] p-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 min-w-[160px] max-h-[300px] overflow-y-auto z-[60] animate-in fade-in slide-in-from-left-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {[
                        'Helvetica', 'Arial', 'Arial Black', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact',
                        'Times New Roman', 'Georgia', 'Garamond', 'Palatino', 'Bookman',
                        'Courier New', 'Comic Sans MS'
                      ].map(font => (
                        <button 
                          key={font} 
                          onClick={() => { handleFontFamilyChange(font); setShowFontMenu(false); }} 
                          className={cn("text-left px-3 py-2 rounded-xl text-sm transition-colors whitespace-nowrap", fontFamily === font ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300")}
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>

                {/* Bold */}
                <button 
                  onClick={() => handleFontWeightChange(!isBold)}
                  className={cn("p-2 rounded-2xl transition-colors", isBold ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                  title="Bold"
                >
                  <Bold className="w-5 h-5" />
                </button>
                
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>

                {/* Font Size */}
                <div className="relative">
                  <button 
                    onClick={() => { setShowTextSizeMenu(!showTextSizeMenu); setShowFontMenu(false); }}
                    className={cn("p-2 rounded-2xl transition-colors relative font-bold text-sm", showTextSizeMenu ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                  >
                    {fontSize}
                  </button>
                  {showTextSizeMenu && (
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 min-w-[200px] z-[60] animate-in fade-in slide-in-from-left-2">
                      <div className="text-sm font-medium">Font Size</div>
                      <div className="flex items-center gap-4">
                        <input type="range" min="10" max="72" value={fontSize} onChange={(e) => handleFontSizeChange(parseInt(e.target.value))} className="flex-1 accent-blue-500" />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums w-4">{fontSize}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>

                {/* Colors */}
                <div className="flex flex-col gap-2 items-center">
                  {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                    <button key={c} onClick={() => handleColorChange(c)} className={cn("w-6 h-6 rounded-full border-2", color === c ? "border-blue-500 scale-110" : "border-zinc-300 dark:border-zinc-700")} style={{ backgroundColor: c }} />
                  ))}
                  
                  {/* Custom Color Wheel */}
                  <div 
                    className="relative w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer mt-1" 
                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                    title="Custom Color"
                  >
                    <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                </div>
              </div>
            )}

            {/* SHAPE Floating Toolbar */}
            {activeTool === 'rect' && (
              <div className="absolute top-1/2 left-4 md:left-[272px] -translate-y-1/2 bg-white/30 dark:bg-black/60 backdrop-blur-3xl p-2 rounded-3xl border border-white/80 dark:border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_0_4px_12px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(255,255,255,0.3)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_4px_12px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(255,255,255,0.1)] flex flex-col items-center gap-2 z-50 animate-in fade-in slide-in-from-left-4 duration-300 w-12">
                <button onClick={() => setActiveTool('select')} className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors mb-1">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800"></div>

                {/* Shape Types */}
                <button onClick={() => addShape('rect')} className={cn("p-2 rounded-2xl transition-colors", shapeType === 'rect' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")} title="Rectangle"><Square className="w-5 h-5" /></button>
                <button onClick={() => addShape('circle')} className={cn("p-2 rounded-2xl transition-colors", shapeType === 'circle' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")} title="Circle"><Circle className="w-5 h-5" /></button>
                <button onClick={() => addShape('line')} className={cn("p-2 rounded-2xl transition-colors", shapeType === 'line' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")} title="Line"><Minus className="w-5 h-5" /></button>
                
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>

                {/* Fill / Stroke Colors */}
                <div className="flex flex-col gap-2 items-center w-full relative pb-1">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Str</span>
                  <div className="relative w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} title="Stroke Color">
                    <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                  
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Fill</span>
                  <div className="relative w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} title="Fill Color">
                    <input type="color" value={fillColor} onChange={(e) => handleFillColorChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                  
                  <button onClick={() => handleFillColorChange('transparent')} className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors mt-2" title="No Fill">
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* REDACT Floating Toolbar */}
            {activeTool === 'whiteout' && (
              <div className="absolute top-1/2 left-4 md:left-[272px] -translate-y-1/2 bg-white/30 dark:bg-black/60 backdrop-blur-3xl p-2 rounded-3xl border border-white/80 dark:border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_0_4px_12px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(255,255,255,0.3)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_4px_12px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(255,255,255,0.1)] flex flex-col items-center gap-2 z-50 animate-in fade-in slide-in-from-left-4 duration-300 w-12">
                <button onClick={() => setActiveTool('select')} className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors mb-1">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800"></div>

                {/* Custom Redact Color */}
                <div className="flex flex-col gap-2 items-center w-full pb-2 pt-1">
                   <Palette className="w-5 h-5 text-zinc-400 mb-1" />
                   <div className="relative w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} title="Pick Redact Color">
                     <input type="color" value={redactColor} onChange={handleRedactColorChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                   </div>
                </div>
                
                <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-800 my-1"></div>
                <div className="flex flex-col gap-2 items-center pb-1">
                  {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                    <button key={c} onClick={() => { setRedactColor(c); updateActiveObject({ fill: c }); }} className={cn("w-6 h-6 rounded-full border-2", redactColor === c ? "border-blue-500 scale-110" : "border-zinc-300 dark:border-zinc-700")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
