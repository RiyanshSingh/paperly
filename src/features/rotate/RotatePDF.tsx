import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { PDFThumbnail } from '../../components/pdf/PDFThumbnail';
import { PDFDocument, degrees } from 'pdf-lib';
import { AlertCircle, RotateCw } from 'lucide-react';
import { SEO } from '../../components/SEO';

export const RotatePDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setRotations({});
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
      
      const initialRotations: Record<number, number> = {};
      for (let i = 1; i <= pdf.getPageCount(); i++) {
        initialRotations[i] = 0;
      }
      setRotations(initialRotations);
    } catch (err) {
      console.error(err);
      setError("Failed to load PDF. The file might be corrupted or encrypted.");
      setFile(null);
    }
  };

  const rotatePage = (pageNum: number, angle: number = 90) => {
    setRotations(prev => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + angle) % 360
    }));
  };

  const rotateAll = () => {
    setRotations(prev => {
      const next = { ...prev };
      for (let i = 1; i <= pageCount; i++) {
        next[i] = ((next[i] || 0) + 90) % 360;
      }
      return next;
    });
  };

  const applyRotationsAndDownload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      const pages = pdf.getPages();
      pages.forEach((page, index) => {
        const pageNum = index + 1;
        const addedRotation = rotations[pageNum] || 0;
        if (addedRotation !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + addedRotation));
        }
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `rotated_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to rotate PDF. The file might be protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <SEO 
        title="Rotate PDF - Rotate PDF Pages Online for Free" 
        description="Rotate individual PDF pages or your entire PDF document easily and securely in your browser."
        path="/rotate-pdf"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Rotate PDF</h1>
        <p className="text-lg text-zinc-400">
          Rotate individual pages or the entire document, then download the result.
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
                <Button variant="secondary" onClick={rotateAll} size="sm">
                  <RotateCw className="w-4 h-4 mr-2" />
                  Rotate All
                </Button>
                <Button 
                  onClick={applyRotationsAndDownload} 
                  isLoading={isProcessing}
                  size="sm"
                >
                  Apply & Download
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: pageCount }).map((_, i) => {
                const pageNum = i + 1;
                const rotation = rotations[pageNum] || 0;
                
                return (
                  <div key={pageNum} className="relative group rounded-2xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-600 hover:shadow-2xl">
                    <div 
                      className="overflow-hidden transition-transform duration-300 flex justify-center rounded-xl bg-zinc-800"
                      style={{ transform: `rotate(${rotation}deg)` }}
                    >
                      <PDFThumbnail file={file} pageNumber={pageNum} width={130} />
                    </div>
                    
                    <button
                      onClick={() => rotatePage(pageNum)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black/80 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black border border-white/20"
                      aria-label={`Rotate page ${pageNum}`}
                    >
                      <RotateCw className="w-6 h-6" />
                    </button>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-2 text-white text-xs text-center rounded-b-2xl font-medium">
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
