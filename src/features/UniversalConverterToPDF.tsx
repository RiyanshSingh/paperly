import React, { useCallback, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, FileText, Loader2, Download, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';

export const UniversalConverterToPDF: React.FC = () => {
  const { format } = useParams<{ format: string }>();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const formatName = format?.toUpperCase() || 'DOCUMENT';
  const displayTitle = `Convert ${formatName} to PDF`;

  // Map format to accepted MIME types for the dropzone
  const getAcceptedTypes = (): any => {
    const f = format?.toLowerCase();
    if (f === 'docx' || f === 'word') return { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] };
    if (f === 'xlsx' || f === 'excel') return { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] };
    if (f === 'pptx' || f === 'powerpoint') return { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], 'application/vnd.ms-powerpoint': ['.ppt'] };
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'image', 'picture'].includes(f || '')) return { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] };
    if (f === 'txt') return { 'text/plain': ['.txt'] };
    if (f === 'html') return { 'text/html': ['.html', '.htm'] };
    if (f === 'epub') return { 'application/epub+zip': ['.epub'] };
    return undefined; // Accept anything if unknown
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setDownloadUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    multiple: false
  });

  const handleConvert = async () => {
    if (!file || !format) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    try {
      const response = await fetch('http://localhost:3001/api/convert-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `converted.pdf`;

      if (contentDisposition && contentDisposition.includes('filename="')) {
         filename = contentDisposition.split('filename="')[1].split('"')[0];
      } else if (file.name) {
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          filename = `${baseName}.pdf`;
      }
      setDownloadFilename(filename);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <SEO 
        title={`${displayTitle} - Paperly`} 
        description={`Easily convert your ${formatName} files to PDF format with Paperly.`} 
      />

      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            {displayTitle}
          </h1>
          <p className="text-xl text-zinc-400">
            Upload your {formatName} file and instantly convert it to a high-quality PDF.
          </p>
        </div>

        {!downloadUrl ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                isDragActive ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50",
                file ? "border-emerald-500 bg-emerald-500/5" : ""
              )}
            >
              <input {...getInputProps()} />
              
              {file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white">{file.name}</p>
                    <p className="text-sm text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-medium text-white mb-2">
                      Drop your {formatName} file here
                    </p>
                    <p className="text-zinc-400">
                      or click to browse from your device
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleConvert}
                disabled={!file || isProcessing}
                className={cn(
                  "px-8 py-4 rounded-xl font-medium text-lg transition-all flex items-center gap-2",
                  !file || isProcessing
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Converting to PDF...
                  </>
                ) : (
                  <>
                    Convert to PDF
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center backdrop-blur-sm">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Download className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Conversion Complete!</h2>
            <p className="text-zinc-400 mb-8">Your PDF file is ready to download.</p>
            
            <div className="flex items-center justify-center gap-4">
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-5 h-5" /> Download PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setDownloadUrl(null);
                  setError(null);
                }}
                className="px-8 py-4 rounded-xl font-medium text-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Convert Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
