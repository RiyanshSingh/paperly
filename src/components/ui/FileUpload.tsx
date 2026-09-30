import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  title = "Choose Files",
  description = "or drop files here",
  className,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-colors",
        isDragActive ? "border-zinc-400 bg-zinc-900" : "border-zinc-800 bg-[#111] hover:bg-zinc-900 hover:border-zinc-700",
        isDragReject && "border-red-500 bg-red-950/20",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-zinc-900 rounded-full mb-6">
          <UploadCloud className={cn("w-10 h-10", isDragActive ? "text-white" : "text-zinc-500")} />
        </div>
        <p className="text-xl font-semibold text-white mb-2 tracking-tight">{title}</p>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
};
