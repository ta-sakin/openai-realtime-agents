"use client";

import React, { useState, useRef } from 'react';
import { UploadIcon, FileTextIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

interface PDFUploadProps {
  onUploadComplete?: (filename: string, chunks: number) => void;
}

export default function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadStatus('error');
      setUploadMessage('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(`Successfully processed ${result.chunks} chunks from ${result.filename}`);
        onUploadComplete?.(result.filename, result.chunks);
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-800">Document Upload</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 border-dashed transition-colors ${
            isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <UploadIcon className={`w-5 h-5 ${isUploading ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm ${isUploading ? 'text-gray-400' : 'text-gray-600'}`}>
            {isUploading ? 'Processing PDF...' : 'Click to upload PDF'}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            uploadStatus === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : uploadStatus === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {uploadStatus === 'success' && <CheckCircledIcon className="w-4 h-4" />}
            {uploadStatus === 'error' && <CrossCircledIcon className="w-4 h-4" />}
            <span>{uploadMessage}</span>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Upload PDF documents to enhance conversations with relevant context. 
          Documents are automatically processed and embedded for semantic search.
        </p>
      </div>
    </div>
  );
}