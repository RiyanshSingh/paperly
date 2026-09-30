import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { AlertCircle, X, RotateCw, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

interface ImageItem {
  id: string;
  file: File;
  dataUrl: string;
  rotation: number;
}

export const JPGToPDF: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Settings
  const [pageSize, setPageSize] = useState<'A4' | 'FIT'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(0);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    
    const newImages = await Promise.all(
      files.map(async (file) => {
        return new Promise<ImageItem>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              file,
              dataUrl: e.target?.result as string,
              rotation: 0,
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const rotateImage = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setImages(prev => {
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

  const createPDF = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pdf = await PDFDocument.create();

      for (const img of images) {
        const imageBytes = await img.file.arrayBuffer();
        let pdfImage;
        
        if (img.file.type === 'image/jpeg') {
          pdfImage = await pdf.embedJpg(imageBytes);
        } else if (img.file.type === 'image/png') {
          pdfImage = await pdf.embedPng(imageBytes);
        } else {
          continue; // Skip unsupported
        }

        let imgWidth = pdfImage.width;
        let imgHeight = pdfImage.height;

        if (img.rotation === 90 || img.rotation === 270) {
          imgWidth = pdfImage.height;
          imgHeight = pdfImage.width;
        }

        let pageWidth, pageHeight;
        
        if (pageSize === 'FIT') {
          pageWidth = imgWidth + (margin * 2);
          pageHeight = imgHeight + (margin * 2);
        } else {
          pageWidth = orientation === 'portrait' ? PageSizes.A4[0] : PageSizes.A4[1];
          pageHeight = orientation === 'portrait' ? PageSizes.A4[1] : PageSizes.A4[0];
        }

        const page = pdf.addPage([pageWidth, pageHeight]);

        let scale = 1;
        if (pageSize === 'A4') {
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          const scaleX = availableWidth / imgWidth;
          const scaleY = availableHeight / imgHeight;
          scale = Math.min(scaleX, scaleY);
        }

        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;
        
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        page.drawImage(pdfImage, {
          x: x + (finalWidth / 2),
          y: y + (finalHeight / 2),
          width: pdfImage.width * scale,
          height: pdfImage.height * scale,
          rotate: degrees(-img.rotation),
          xSkew: degrees(0),
          ySkew: degrees(0),
        });
      }

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `images_to_pdf_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to create PDF. Some images might be corrupted or unsupported.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <SEO 
        title="JPG to PDF - Convert Images to PDF Online" 
        description="Convert JPG, JPEG, and PNG images to a PDF document. Reorder, rotate, and adjust margins for free."
        path="/jpg-to-pdf"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">JPG to PDF</h1>
        <p className="text-lg text-zinc-400">
          Convert your JPG or PNG images into a single PDF document.
        </p>
      </div>

      <div className="bg-[#111] rounded-3xl border border-zinc-800 p-6 md:p-8 mb-8">
        <FileUpload 
          onFilesSelected={handleFilesSelected}
          accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
          multiple={true}
          title="Select Images"
          description="or drag & drop them here (JPG, PNG)"
        />

        {error && (
          <div className="mt-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Settings Sidebar */}
              <div className="w-full md:w-72 flex-shrink-0 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <h3 className="font-semibold text-white mb-5 text-lg">Page Setup</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Page Size</label>
                      <select 
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as 'A4' | 'FIT')}
                        className="w-full border border-zinc-700 rounded-xl p-3 text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 appearance-none"
                        disabled={isProcessing}
                      >
                        <option value="A4">A4 Standard</option>
                        <option value="FIT">Fit to Image</option>
                      </select>
                    </div>

                    {pageSize === 'A4' && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Orientation</label>
                        <div className="flex bg-black border border-zinc-800 p-1 rounded-xl">
                          <button 
                            className={cn("flex-1 text-sm py-2 rounded-lg transition-colors font-medium", orientation === 'portrait' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white')}
                            onClick={() => setOrientation('portrait')}
                            disabled={isProcessing}
                          >
                            Portrait
                          </button>
                          <button 
                            className={cn("flex-1 text-sm py-2 rounded-lg transition-colors font-medium", orientation === 'landscape' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white')}
                            onClick={() => setOrientation('landscape')}
                            disabled={isProcessing}
                          >
                            Landscape
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="block text-sm font-medium text-zinc-400">Margin</label>
                        <span className="text-xs font-semibold text-zinc-300">{margin}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="w-full accent-white"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={createPDF} 
                  isLoading={isProcessing}
                  className="w-full shadow-xl"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Create PDF
                </Button>
              </div>

              {/* Images Grid */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white text-lg">Images ({images.length})</h3>
                  <span className="text-sm text-zinc-500">Drag to reorder</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div 
                      key={img.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "relative group rounded-2xl border-2 bg-zinc-900 p-2 transition-all cursor-grab active:cursor-grabbing aspect-[3/4] flex flex-col justify-center",
                        draggedIndex === index ? "border-white opacity-50" : "border-zinc-800 hover:border-zinc-600 hover:shadow-lg"
                      )}
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-xs font-bold text-white z-10">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 overflow-hidden">
                        <img 
                          src={img.dataUrl} 
                          alt={img.file.name}
                          className="max-w-full max-h-full object-contain transition-transform duration-300 rounded"
                          style={{ transform: `rotate(${img.rotation}deg)` }}
                        />
                      </div>
                      
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => rotateImage(img.id)}
                          className="p-1.5 bg-black/70 backdrop-blur-md text-white rounded-full hover:bg-black transition-colors"
                          title="Rotate"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="p-1.5 bg-red-500/80 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-2 text-xs font-medium text-center text-zinc-500 truncate px-1">
                        {img.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder type="banner" className="my-8 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
