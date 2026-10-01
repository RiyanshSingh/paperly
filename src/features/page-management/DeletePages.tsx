import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { PDFThumbnail } from '../../components/pdf/PDFThumbnail';
import { PDFDocument, degrees } from 'pdf-lib';
import { AlertCircle, RotateCw, Trash2, CheckCircle2, Download, Scissors } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SEO } from '../../components/SEO';

interface PageItem {
  id: string; 
  originalPageNum: number;
  rotation: number;
  isSelected: boolean;
  isDeleted: boolean;
}

export const DeletePages: React.FC = () => {
  const [state, setState] = usePersistentState('delete-pages-state', {
    file: null as File | null,
    pages: [] as PageItem[],
  });

  const { file, pages } = state;
  const setFile = (f: File | null) => setState(s => ({ ...s, file: f }));
  const setPages = (updater: any) => setState(s => ({
    ...s,
    pages: typeof updater === 'function' ? updater(s.pages) : updater
  }));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      const newPages: PageItem[] = [];
      for (let i = 1; i <= pdf.getPageCount(); i++) {
        newPages.push({
          id: `page-${i}-${Math.random().toString(36).substr(2, 9)}`,
          originalPageNum: i,
          rotation: 0,
          isSelected: false,
          isDeleted: false,
        });
      }
      setPages(newPages);
    } catch (err) {
      console.error(err);
      setError("Failed to load PDF. The file might be corrupted or encrypted.");
      setFile(null);
    }
  };

  const toggleSelection = (index: number) => {
    setPages((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], isSelected: !next[index].isSelected };
      return next;
    });
  };

  const rotateSelected = () => {
    setPages((prev: any[]) => prev.map((p: any) => 
      p.isSelected && !p.isDeleted ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const deleteSelected = () => {
    setPages((prev: any[]) => prev.map((p: any) => 
      p.isSelected ? { ...p, isDeleted: true, isSelected: false } : p
    ));
  };

  const selectAll = () => {
    setPages((prev: any[]) => prev.map((p: any) => (!p.isDeleted ? { ...p, isSelected: true } : p)));
  };

  const clearSelection = () => {
    setPages((prev: any[]) => prev.map((p: any) => ({ ...p, isSelected: false })));
  };

  // Drag and Drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setPages((prev: any[]) => {
      const next = [...prev];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(index, 0, draggedItem);
      setDraggedIndex(index);
      return next;
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const processAndDownload = async (action: 'save' | 'extract') => {
    if (!file) return;

    const activePages = pages.filter(p => !p.isDeleted);
    const pagesToProcess = action === 'extract' ? activePages.filter(p => p.isSelected) : activePages;

    if (pagesToProcess.length === 0) {
      setError(`No pages selected to ${action}.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      for (const p of pagesToProcess) {
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [p.originalPageNum - 1]);
        
        if (p.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + p.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${action}_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (action === 'extract') {
        clearSelection();
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to ${action} PDF. The file might be protected.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = pages.filter(p => p.isSelected).length;
  const activeCount = pages.filter(p => !p.isDeleted).length;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <SEO 
        title="Organize PDF - Delete & Rearrange Pages Online" 
        description="Delete pages from a PDF, reorder, rotate, or extract them easily. Secure client-side processing."
        path="/delete-pdf-pages"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Organize PDF</h1>
        <p className="text-lg text-zinc-400">
          Delete, extract, reorder, and rotate pages in your PDF document.
        </p>
      </div>

      <div className="bg-[#111] rounded-3xl border border-zinc-800 p-6 md:p-8 mb-8">
        {!file ? (
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            multiple={false}
            title="Select PDF File"
            description="or drag & drop it here"
          />
        ) : (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 pb-6 border-b border-zinc-800 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {activeCount} active pages • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => setFile(null)} size="sm">
                  Change File
                </Button>
                <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block"></div>
                <Button variant="secondary" onClick={selectAll} size="sm">Select All</Button>
                <Button variant="secondary" onClick={clearSelection} size="sm">Clear</Button>
                <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block"></div>
                
                <Button 
                  variant="secondary" 
                  onClick={rotateSelected} 
                  disabled={selectedCount === 0 || isProcessing}
                  size="sm"
                >
                  <RotateCw className="w-4 h-4 mr-1" />
                  Rotate
                </Button>
                <Button 
                  variant="danger" 
                  onClick={deleteSelected} 
                  disabled={selectedCount === 0 || isProcessing}
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                
                <div className="h-6 w-px bg-zinc-800 mx-1 hidden lg:block"></div>
                
                <Button 
                  variant="outline"
                  onClick={() => processAndDownload('extract')} 
                  isLoading={isProcessing}
                  disabled={selectedCount === 0 || isProcessing}
                  size="sm"
                >
                  <Scissors className="w-4 h-4 mr-1" />
                  Extract Selected
                </Button>
                
                <Button 
                  onClick={() => processAndDownload('save')} 
                  isLoading={isProcessing}
                  disabled={activeCount === 0 || isProcessing}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Save PDF
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map((p, index) => {
                if (p.isDeleted) return null;

                return (
                  <div 
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => toggleSelection(index)}
                    className={cn(
                      "relative group cursor-pointer rounded-2xl border-2 transition-all hover:shadow-2xl cursor-grab active:cursor-grabbing bg-zinc-900",
                      p.isSelected ? "border-white" : "border-zinc-800 hover:border-zinc-600",
                      draggedIndex === index && "opacity-50"
                    )}
                  >
                    <div 
                      className="overflow-hidden rounded-xl flex justify-center transition-transform duration-300 pointer-events-none bg-zinc-800"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    >
                      <PDFThumbnail file={file} pageNumber={p.originalPageNum} width={130} className="w-full pointer-events-none" />
                    </div>
                    
                    <div className={cn(
                      "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                      p.isSelected ? "opacity-100 bg-white text-black scale-100" : "opacity-0 group-hover:opacity-100 bg-black/50 text-white/50 scale-90 backdrop-blur-sm"
                    )}>
                      {p.isSelected && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white text-xs py-2 px-3 flex justify-between items-center rounded-b-2xl font-medium">
                      <span>Page {p.originalPageNum}</span>
                      <span className="text-zinc-500">{index + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {activeCount === 0 && (
              <div className="text-center py-16 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl mt-4">
                <p className="text-lg font-medium text-white mb-2">All pages have been deleted.</p>
                <button onClick={() => setPages((prev: any[]) => prev.map((p: any) => ({...p, isDeleted: false})))} className="text-zinc-400 hover:text-white underline transition-colors">Restore all pages</button>
              </div>
            )}
          </div>
        )}
      </div>

      <AdPlaceholder type="banner" className="my-8 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
