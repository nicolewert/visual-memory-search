'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractTextFromImage } from '@/lib/ocr';
import { api } from '../../convex/_generated/api';
import { useMutation } from 'convex/react';
import { AlertCircle, UploadCloud, CheckCircle } from 'lucide-react';

// Interfaces for type safety
interface UploadFile extends File {
  preview?: string;
}

interface UploadStatus {
  file: UploadFile;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

export function UploadZone() {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Convex mutations
  const generateUploadUrl = useMutation(api.screenshots.generateUploadUrl);
  const storeScreenshot = useMutation(api.screenshots.storeScreenshot);

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_FILE_TYPES = [
    'image/png', 
    'image/jpeg', 
    'image/jpg', 
    'image/webp'
  ];

  const updateUploadStatus = (index: number, updates: Partial<UploadStatus>) => {
    setUploadStatuses(prev => prev.map((status, i) => 
      i === index ? { ...status, ...updates } : status
    ));
  };

  // Dropzone configuration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Initialize upload statuses
    const initialStatuses = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadStatuses(initialStatuses);
    setIsProcessing(true);

    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        // Validate file
        if (!ACCEPTED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
          updateUploadStatus(i, { 
            status: 'error', 
            errorMessage: 'Invalid file type or size. Must be PNG/JPG/JPEG/WebP under 10MB.' 
          });
          continue;
        }

        updateUploadStatus(i, { status: 'uploading', progress: 25 });

        // Send to API for Claude processing first
        const formData = new FormData();
        formData.append('files', file);
        
        const apiResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to process with Claude API');
        }

        const { processedFiles } = await apiResponse.json();
        const processedFile = processedFiles[0];

        updateUploadStatus(i, { status: 'processing', progress: 50 });

        // OCR Text Extraction (client-side)
        const ocrText = await extractTextFromImage(file);

        updateUploadStatus(i, { progress: 75 });

        // Store file in Convex storage
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to Convex storage');
        }
        
        const { storageId } = await uploadResponse.json();
        const imageUrl = uploadUrl;

        // Store screenshot metadata
        await storeScreenshot({
          filename: file.name,
          ocrText,
          visualDescription: processedFile.visualDescription,
          fileId: storageId,
          fileSize: file.size
        });

        updateUploadStatus(i, { status: 'success', progress: 100 });

      } catch (error) {
        updateUploadStatus(i, { 
          status: 'error', 
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }

    setIsProcessing(false);
  }, [generateUploadUrl, storeScreenshot]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxSize: MAX_FILE_SIZE
  });

  // Render upload statuses with social-impact styling
  const renderUploadStatuses = () => {
    return uploadStatuses.map((status, index) => (
      <div 
        key={index} 
        className="mb-2 p-2 rounded-lg bg-orange-50 border border-orange-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm truncate">{status.file.name}</span>
          {status.status === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Processed
            </div>
          )}
          {status.status === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Failed
            </div>
          )}
        </div>
        {status.status !== 'success' && status.status !== 'error' && (
          <Progress 
            value={status.progress} 
            className="w-full mt-2 h-2 bg-orange-200"
          />
        )}
        {status.status === 'error' && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>
              {status.errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    ));
  };

  return (
    <Card 
      className="p-6 rounded-2xl border-2 border-orange-300 
        bg-gradient-to-br from-orange-50 to-orange-100 
        hover:shadow-lg transition-all duration-300 ease-in-out"
    >
      <div 
        {...getRootProps()} 
        className={`p-8 text-center cursor-pointer rounded-xl border-2 border-dashed 
          ${isDragActive 
            ? 'border-orange-500 bg-orange-100' 
            : 'border-orange-300 bg-white'
          } transition-all duration-300`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud 
            className="h-12 w-12 text-orange-500 
              animate-bounce-slow transition-transform"
          />
          <p className="text-lg font-semibold text-orange-700">
            {isDragActive 
              ? 'Drop files here' 
              : 'Drag & Drop Images or Click to Upload'}
          </p>
          <p className="text-sm text-gray-500">
            PNG, JPG, JPEG, WebP (Max 10MB)
          </p>
          <Button 
            variant="outline" 
            className="bg-orange-100 text-orange-700 
              hover:bg-orange-200 border-orange-300"
          >
            Select Files
          </Button>
        </div>
      </div>

      {uploadStatuses.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-orange-800">
            Upload Status
          </h3>
          {renderUploadStatuses()}
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 text-center text-orange-700">
          Processing images... Please wait.
        </div>
      )}
    </Card>
  );
}

export default UploadZone;