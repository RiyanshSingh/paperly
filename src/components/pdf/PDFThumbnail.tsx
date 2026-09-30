import React, { useEffect, useRef, useState } from 'react';
import { pdfjsLib } from '../../lib/pdfjs';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface PDFThumbnailProps {
  file: File;
  pageNumber: number;
  width?: number;
  className?: string;
  onLoad?: () => void;
}

export const PDFThumbnail: React.FC<PDFThumbnailProps> = ({ 
  file, 
  pageNumber, 
  width = 200,
  className,
  onLoad
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let renderTask: any = null;
    let isMounted = true;

    const renderPage = async () => {
      try {
        setLoading(true);
        setError(false);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNumber);
        
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        
        // Use devicePixelRatio for high-quality retina rendering
        const pixelRatio = window.devicePixelRatio || 2;
        const scaledViewport = page.getViewport({ scale: scale * pixelRatio });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set actual canvas size to high resolution
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (isMounted) {
          setLoading(false);
          onLoad?.();
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        console.error("Error rendering PDF thumbnail:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [file, pageNumber, width, onLoad]);

  return (
    <div className={cn("relative flex items-center justify-center bg-slate-100 rounded overflow-hidden", className)} style={{ width, minHeight: width * 1.4 }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <span className="text-xs text-red-500 text-center px-2">Failed to load preview</span>
        </div>
      )}
      <canvas ref={canvasRef} className={cn("block w-full h-auto", (loading || error) && "opacity-0")} />
    </div>
  );
};
