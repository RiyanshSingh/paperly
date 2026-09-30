import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { AlertCircle, Download, FileArchive } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SEO } from '../../components/SEO';

export const CompressPDF: React.FC = () => {
  const [state, setState] = usePersistentState('compress-pdf-state', {
    file: null as File | null,
    level: 'high' as 'minimum' | 'recommended' | 'high' | 'extreme' | 'custom',
    customSize: '',
  });
  
  const { file, level, customSize } = state;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob, originalSize: number, newSize: number } | null>(null);

  const setFile = (f: File | null) => setState(s => ({ ...s, file: f }));
  const setLevel = (l: any) => setState(s => ({ ...s, level: l }));
  const setCustomSize = (cs: string) => setState(s => ({ ...s, customSize: cs }));


  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
    setResult(null);
  };

  const compressPDF = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      // Send directly to backend
      formData.append('level', level);
      if (level === 'custom' && customSize) {
        formData.append('targetSize', customSize);
      }

      const response = await fetch('http://localhost:3001/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to compress PDF.');
      }

      const blob = await response.blob();
      
      setResult({
        blob,
        originalSize: file.size,
        newSize: blob.size,
      });

    } catch (err) {
      console.error(err);
      setError("Failed to compress PDF. The server might be unreachable or the file is corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result || !file) return;
    
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO 
        title="Compress PDF - Reduce PDF File Size Online" 
        description="Reduce your PDF file size while maintaining quality. Fast, free, and secure client-side compression."
        path="/compress-pdf"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Compress PDF</h1>
        <p className="text-lg text-zinc-400">
          Reduce the file size of your PDF document.
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
                  {formatSize(file.size)}
                </p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} size="sm" disabled={isProcessing}>
                Change File
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!result ? (
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold text-white mb-6 text-center text-xl">Select Compression Level</h4>
                
                <div className="space-y-4 mb-10 text-left">
                  {[
                    { id: 'minimum', label: 'Minimum Compression', desc: 'Highest quality, keeps large images (300dpi)' },
                    { id: 'recommended', label: 'Recommended Compression', desc: 'High quality, good for printing (300dpi optimized)' },
                    { id: 'high', label: 'High Compression', desc: 'Standard web viewing, good size reduction (150dpi)' },
                    { id: 'extreme', label: 'Extreme Compression', desc: 'Smallest file size, lowest image quality (72dpi)' },
                    { id: 'custom', label: 'Custom Target Size', desc: 'Attempt to hit a specific file size in MB' }
                  ].map(opt => (
                    <div key={opt.id}>
                      <label 
                        className={cn(
                          "flex items-start p-5 border-2 rounded-2xl cursor-pointer transition-all",
                          level === opt.id ? "border-white bg-zinc-900" : "border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                        )}
                      >
                        <input 
                          type="radio" 
                          name="compression_level" 
                          value={opt.id}
                          checked={level === opt.id}
                          onChange={() => setLevel(opt.id as any)}
                          className="mt-1 mr-4 text-white focus:ring-white bg-zinc-900 border-zinc-700"
                        />
                        <div>
                          <div className="font-semibold text-white mb-1">{opt.label}</div>
                          <div className="text-sm text-zinc-500">{opt.desc}</div>
                        </div>
                      </label>
                      {level === 'custom' && opt.id === 'custom' && (
                        <div className="mt-3 ml-10 p-4 border border-zinc-800 bg-zinc-900/50 rounded-xl flex items-center">
                          <span className="text-zinc-400 mr-3">Target Size:</span>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0.1"
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value)}
                            placeholder="e.g. 5"
                            className="bg-black border border-zinc-700 text-white px-4 py-2 w-28 rounded-lg focus:outline-none focus:border-white transition-colors text-center"
                          />
                          <span className="text-zinc-400 ml-3">MB</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={compressPDF} 
                  isLoading={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <FileArchive className="w-5 h-5 mr-2" />
                  Compress PDF
                </Button>
                
                <p className="text-xs text-center text-emerald-500 mt-6 px-4">
                  Powered by our secure backend for maximum image downsampling and font subsetting.
                </p>
              </div>
            ) : (
              <div className="text-center max-w-md mx-auto py-8">
                <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <FileArchive className="w-10 h-10" />
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-2">Compression Complete</h3>
                <p className="text-zinc-400 mb-8">Your file is ready to download.</p>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-zinc-800">
                    <span className="text-zinc-400">Original Size:</span>
                    <span className="font-semibold text-white text-lg">{formatSize(result.originalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-zinc-800">
                    <span className="text-zinc-400">New Size:</span>
                    <span className="font-semibold text-white text-lg">{formatSize(result.newSize)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold text-emerald-400">
                    <span>Reduction:</span>
                    <span>
                      {result.originalSize > result.newSize 
                        ? ((1 - (result.newSize / result.originalSize)) * 100).toFixed(0) + '%'
                        : '0% (Already optimized)'}
                    </span>
                  </div>
                </div>

                <Button onClick={downloadResult} size="lg" className="w-full">
                  <Download className="w-5 h-5 mr-2" />
                  Download Compressed PDF
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AdPlaceholder type="banner" className="my-8 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
