import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { GripVertical, X, File as FileIcon, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SEO } from '../../components/SEO';

interface PDFFile {
  id: string;
  file: File;
  pageCount: number | null;
  hasError: boolean;
}

export const MergePDF: React.FC = () => {
  const [state, setState] = usePersistentState('merge-pdf-state', {
    files: [] as PDFFile[],
  });

  const { files } = state;
  const setFiles = (updater: any) => setState(s => ({
    ...s,
    files: typeof updater === 'function' ? updater(s.files) : updater
  }));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setError(null);
    const newFiles: PDFFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      pageCount: null,
      hasError: false
    }));
    
    setFiles((prev: any[]) => [...prev, ...newFiles]);

    // Load page counts asynchronously
    for (const item of newFiles) {
      try {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdf.getPageCount();
        setFiles((prev: any[]) => prev.map((f: any) => f.id === item.id ? { ...f, pageCount } : f));
      } catch (err) {
        console.error("Failed to load PDF:", err);
        setFiles((prev: any[]) => prev.map((f: any) => f.id === item.id ? { ...f, hasError: true } : f));
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev: any[]) => prev.filter((f: any) => f.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = document.getElementById(`file-item-${id}`);
      if (el) el.style.opacity = '0.5';
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedItemId || draggedItemId === id) return;

    const draggedIndex = files.findIndex(f => f.id === draggedItemId);
    const hoverIndex = files.findIndex(f => f.id === id);

    if (draggedIndex === -1 || hoverIndex === -1) return;

    const newFiles = [...files];
    const [draggedItem] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(hoverIndex, 0, draggedItem);
    setFiles(newFiles);
  };

  const handleDragEnd = () => {
    if (draggedItemId) {
      const el = document.getElementById(`file-item-${draggedItemId}`);
      if (el) el.style.opacity = '1';
    }
    setDraggedItemId(null);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Please add at least 2 PDF files to merge.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        if (item.hasError) continue;
        
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while merging the PDFs. Some files might be corrupted or password-protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO 
        title="Merge PDF - Combine PDF Files Online for Free" 
        description="Combine multiple PDF files into one single document securely in your browser. Drag and drop reordering supported."
        path="/merge-pdf"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Merge PDF</h1>
        <p className="text-lg text-zinc-400">
          Combine multiple PDF files into a single document. Drag and drop to reorder.
        </p>
      </div>

      <div className="bg-[#111] rounded-3xl border border-zinc-800 p-6 md:p-8 mb-8">
        <FileUpload 
          onFilesSelected={handleFilesSelected} 
          title="Select PDF Files"
          description="or drag & drop them here"
        />

        {error && (
          <div className="mt-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Selected Files ({files.length})</h3>
            <div className="space-y-3">
              {files.map((item) => (
                <div
                  key={item.id}
                  id={`file-item-${item.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-move",
                    item.hasError ? "border-red-900/50 bg-red-950/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                  )}
                >
                  <GripVertical className="w-5 h-5 text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0" />
                  
                  <div className="p-2 bg-zinc-800 rounded-xl text-white flex-shrink-0">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      {item.pageCount !== null && ` • ${item.pageCount} pages`}
                      {item.hasError && <span className="text-red-400 ml-2">Error loading file</span>}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => removeFile(item.id)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-xl transition-colors flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                onClick={mergePDFs} 
                isLoading={isProcessing}
                disabled={files.length < 2 || isProcessing}
                size="lg"
                className="w-full md:w-auto"
              >
                Merge PDFs
              </Button>
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder type="banner" className="my-8 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
