import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { PDFThumbnail } from '../../components/pdf/PDFThumbnail';
import { pdfjsLib } from '../../lib/pdfjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AlertCircle, Download, CheckCircle2, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

export const PDFToJPG: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setSelectedPages(new Set());
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      
      const all = new Set<number>();
      for (let i = 1; i <= pdf.numPages; i++) all.add(i);
      setSelectedPages(all);
    } catch (err) {
      console.error(err);
      setError("Failed to load PDF. The file might be corrupted or encrypted.");
      setFile(null);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNum)) {
        newSet.delete(pageNum);
      } else {
        newSet.add(pageNum);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const convertToJPG = async () => {
    if (!file || selectedPages.size === 0) return;

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: selectedPages.size });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const zip = new JSZip();
      
      const pagesToProcess = Array.from(selectedPages).sort((a, b) => a - b);
      const baseFilename = file.name.replace(/\.[^/.]+$/, "");

      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageNum = pagesToProcess[i];
        const page = await pdf.getPage(pageNum);
        
        const scale = quality > 0.8 ? 3.0 : 2.0; 
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1];
        
        zip.file(`${baseFilename}_page_${pageNum}.jpg`, base64Data, { base64: true });
        setProgress({ current: i + 1, total: pagesToProcess.length });
      }

      setProgress(null);
      
      if (pagesToProcess.length === 1) {
        const content = await zip.file(`${baseFilename}_page_${pagesToProcess[0]}.jpg`)!.async("blob");
        saveAs(content, `${baseFilename}_page_${pagesToProcess[0]}.jpg`);
      } else {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${baseFilename}_images.zip`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to convert pages. An error occurred during rendering.");
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <SEO 
        title="PDF to JPG - Extract Images from PDF Online" 
        description="Convert your PDF files to high-quality JPG images. Fast, free, and secure client-side extraction."
        path="/pdf-to-jpg"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">PDF to JPG</h1>
        <p className="text-lg text-zinc-400">
          Convert each page of your PDF into high-quality JPG images.
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
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 pb-6 border-b border-zinc-800 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {pageCount} pages • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => setFile(null)} size="sm" disabled={isProcessing}>
                  Change File
                </Button>
                
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 h-9">
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400 font-medium">Quality:</span>
                  <select 
                    value={quality} 
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none"
                    disabled={isProcessing}
                  >
                    <option value={0.5} className="bg-zinc-900">Low</option>
                    <option value={0.8} className="bg-zinc-900">Medium</option>
                    <option value={1.0} className="bg-zinc-900">High</option>
                  </select>
                </div>
                
                <Button variant="secondary" onClick={selectAll} size="sm" disabled={isProcessing}>All</Button>
                <Button variant="secondary" onClick={clearSelection} size="sm" disabled={isProcessing}>Clear</Button>
                
                <Button 
                  onClick={convertToJPG} 
                  isLoading={isProcessing}
                  disabled={selectedPages.size === 0 || isProcessing}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Convert to JPG
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {progress && (
              <div className="mb-8 p-6 border border-zinc-800 rounded-3xl bg-zinc-900">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-semibold text-white">Converting Images...</span>
                  <span className="text-zinc-400 font-medium">{progress.current} / {progress.total} pages</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: pageCount }).map((_, i) => {
                const pageNum = i + 1;
                const isSelected = selectedPages.has(pageNum);
                
                return (
                  <div 
                    key={pageNum}
                    onClick={() => !isProcessing && togglePageSelection(pageNum)}
                    className={cn(
                      "relative group cursor-pointer rounded-2xl border-2 transition-all overflow-hidden bg-zinc-900",
                      isSelected ? "border-white" : "border-zinc-800 hover:border-zinc-600",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <PDFThumbnail file={file} pageNumber={pageNum} width={150} className="w-full bg-zinc-800" />
                    
                    <div className={cn(
                      "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                      isSelected ? "opacity-100 bg-white text-black scale-100" : "opacity-0 group-hover:opacity-100 bg-black/50 text-white/50 scale-90 backdrop-blur-sm"
                    )}>
                      {isSelected && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white text-xs text-center py-2 font-medium">
                      Page {pageNum}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder type="banner" className="my-8 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
