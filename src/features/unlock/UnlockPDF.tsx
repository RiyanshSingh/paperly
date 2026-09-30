import React, { useState } from 'react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { AdPlaceholder } from '../../components/ui/AdPlaceholder';
import { PDFDocument } from 'pdf-lib';
import { AlertCircle, Download, Unlock, KeyRound } from 'lucide-react';
import { SEO } from '../../components/SEO';

export const UnlockPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setUnlockedBlob(null);
    setPassword('');
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      // Try to load without a password first
      await PDFDocument.load(arrayBuffer);
      
      // If it succeeds, the PDF is not encrypted
      setError("This PDF is not password protected.");
      setNeedsPassword(false);
    } catch (err: any) {
      if (err.message?.includes("encrypted") || err.name === "EncryptedPDFError") {
        setNeedsPassword(true);
      } else {
        console.error(err);
        setError("Failed to load PDF. The file might be corrupted.");
        setFile(null);
      }
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password) return;

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { password });
      
      // Save it without encryption
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      
      setUnlockedBlob(blob);
      setSuccess(true);
    } catch (err: any) {
      console.error("Local decryption failed, attempting backend fallback...", err);
      const msg = err.message || '';
      
      if (msg.includes("Invalid password") || msg.includes("password is incorrect")) {
        setError("Incorrect password. Please try again.");
        setIsProcessing(false);
      } else {
        // Fallback to backend API
        try {
          const formData = new FormData();
          formData.append('pdf', file);
          formData.append('password', password);

          const response = await fetch('http://localhost:3001/api/unlock', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            let errorMsg = 'Failed to unlock PDF via backend.';
            try {
              const data = await response.json();
              errorMsg = data.error;
            } catch {
              // ignore
            }
            throw new Error(errorMsg);
          }

          const blob = await response.blob();
          setUnlockedBlob(blob);
          setSuccess(true);
          setNeedsPassword(false);
          setError(null);
        } catch (backendErr: any) {
          console.error(backendErr);
          setError(backendErr.message || "Failed to unlock PDF. Incorrect password or corrupted file.");
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const downloadUnlocked = () => {
    if (!unlockedBlob || !file) return;
    
    const url = URL.createObjectURL(unlockedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unlocked_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO 
        title="Unlock PDF - Remove PDF Password Online" 
        description="Remove password protection from your PDF files instantly. Secure, free, and fast client-side unlocking."
        path="/unlock-pdf"
      />
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Unlock PDF</h1>
        <p className="text-lg text-zinc-400">
          Remove password security from your PDF document securely in your browser.
        </p>
      </div>

      <div className="bg-[#111] rounded-3xl border border-zinc-800 p-6 md:p-8 mb-8 min-h-[400px]">
        {!file ? (
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            multiple={false}
            title="Select Protected PDF"
            description="or drag & drop it here"
          />
        ) : (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-zinc-800 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setNeedsPassword(false); setSuccess(false); setUnlockedBlob(null); }} size="sm" disabled={isProcessing}>
                Change File
              </Button>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {needsPassword && !success && (
              <div className="max-w-md mx-auto py-8">
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <KeyRound className="w-8 h-8" />
                </div>
                
                <h4 className="font-bold text-white text-2xl mb-2 text-center">File is Protected</h4>
                <p className="text-zinc-400 mb-8 text-center">Please enter the password to unlock this document.</p>
                
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full bg-zinc-900 border border-zinc-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white transition-all"
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    isLoading={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    <Unlock className="w-5 h-5 mr-2" />
                    Unlock PDF
                  </Button>
                </form>
              </div>
            )}

            {success && unlockedBlob && (
              <div className="text-center max-w-md mx-auto py-8">
                <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Unlock className="w-10 h-10" />
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-2">PDF Unlocked!</h3>
                <p className="text-zinc-400 mb-8">The password protection has been successfully removed.</p>
                
                <Button onClick={downloadUnlocked} size="lg" className="w-full">
                  <Download className="w-5 h-5 mr-2" />
                  Download Unlocked PDF
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
