import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { PDFThumbnail } from '../../components/pdf/PDFThumbnail';
import { PDFDocument } from 'pdf-lib';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

export const SplitPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setSelectedPages(new Set());
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
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

  const splitPDF = async () => {
    if (!file || selectedPages.size === 0) {
      setError("Please select at least one page to extract.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Pages are 0-indexed in pdf-lib, but our UI is 1-indexed
      const pagesToCopy = Array.from(selectedPages).sort((a, b) => a - b).map(p => p - 1);
      
      const copiedPages = await newPdf.copyPages(sourcePdf, pagesToCopy);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to extract pages. The file might be protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <SEO 
        title="Split PDF - Extract Pages from PDF Online" 
        description="Extract specific pages from your PDF securely in your browser. Free online PDF page extractor."
        path="/split-pdf"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Split PDF</h1>
        <p className="text-lg text-zinc-400">
          Extract specific pages from your PDF document easily and securely.
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-zinc-800 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {pageCount} pages • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setFile(null)} size="sm">
                  Change File
                </Button>
                <Button variant="secondary" onClick={selectAll} size="sm">
                  Select All
                </Button>
                <Button variant="secondary" onClick={clearSelection} size="sm">
                  Clear
                </Button>
                <Button 
                  onClick={splitPDF} 
                  isLoading={isProcessing}
                  disabled={selectedPages.size === 0 || isProcessing}
                  size="sm"
                >
                  Extract ({selectedPages.size})
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: pageCount }).map((_, i) => {
                const pageNum = i + 1;
                const isSelected = selectedPages.has(pageNum);
                
                return (
                  <div 
                    key={pageNum}
                    onClick={() => togglePageSelection(pageNum)}
                    className={cn(
                      "relative group cursor-pointer rounded-2xl border-2 transition-all overflow-hidden bg-zinc-900",
                      isSelected ? "border-white" : "border-zinc-800 hover:border-zinc-600"
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
