'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractTextFromImage } from '@/lib/ocr';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { AlertCircle, UploadCloud, CheckCircle, FolderOpen, Image } from 'lucide-react';

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

interface UploadProgress {
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface UploadZoneProps {
  onUploadComplete?: (screenshotIds: Id<"screenshots">[]) => void;
  onUploadProgress?: (progress: UploadProgress[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

interface FolderPreview {
  totalFiles: number;
  totalSize: number;
  files: File[];
  folderName: string;
}

export function UploadZone({ 
  onUploadComplete, 
  onUploadProgress, 
  maxFiles = 50, 
  maxFileSize 
}: UploadZoneProps) {
  // Use maxFiles for display
  console.debug('Max files allowed:', maxFiles);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('single');
  const [folderPreview, setFolderPreview] = useState<FolderPreview | null>(null);
  const [showFolderPreview, setShowFolderPreview] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Convex mutations
  const generateUploadUrl = useMutation(api.screenshots.generateUploadUrl);
  const storeScreenshot = useMutation(api.screenshots.storeScreenshot);

  // File validation constants (memoized to prevent re-renders)
  const MAX_FILE_SIZE = useMemo(() => maxFileSize || 10 * 1024 * 1024, [maxFileSize]); // 10MB default
  const ACCEPTED_FILE_TYPES = useMemo(() => [
    'image/png', 
    'image/jpeg', 
    'image/jpg', 
    'image/webp'
  ], []);

  const updateUploadStatus = (index: number, updates: Partial<UploadStatus>) => {
    setUploadStatuses(prev => prev.map((status, i) => 
      i === index ? { ...status, ...updates } : status
    ));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFolderSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Filter for image files only
    const imageFiles = files.filter(file => ACCEPTED_FILE_TYPES.includes(file.type));
    
    if (imageFiles.length === 0) {
      alert('No valid image files found in the selected folder.');
      return;
    }

    if (imageFiles.length > maxFiles) {
      alert(`Too many files. Maximum ${maxFiles} files allowed. Found ${imageFiles.length} image files.`);
      return;
    }

    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    const folderName = imageFiles[0]?.webkitRelativePath?.split('/')[0] || 'Selected Folder';
    
    setFolderPreview({
      totalFiles: imageFiles.length,
      totalSize,
      files: imageFiles,
      folderName
    });
    setShowFolderPreview(true);
  }, [ACCEPTED_FILE_TYPES, maxFiles]);

  const processFolderUpload = useCallback(async (files: File[]) => {
    const BATCH_SIZE = 3; // Process 3 files at a time to avoid overwhelming the system
    setShowFolderPreview(false);
    
    // Initialize upload statuses
    const initialStatuses = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadStatuses(initialStatuses);
    setIsProcessing(true);

    const screenshotIds: Id<"screenshots">[] = [];
    
    // Process files in batches
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      // Process batch concurrently
      await Promise.all(
        batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          try {
            // Validate file
            if (!ACCEPTED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
              updateUploadStatus(globalIndex, { 
                status: 'error', 
                errorMessage: 'Invalid file type or size. Must be PNG/JPG/JPEG/WebP under 10MB.' 
              });
              return;
            }

            updateUploadStatus(globalIndex, { status: 'uploading', progress: 25 });
            
            // Call progress callback if provided
            if (onUploadProgress) {
              onUploadProgress([{
                filename: file.name,
                status: 'uploading',
                progress: 25
              }]);
            }

            // Process with Claude API
            const formData = new FormData();
            formData.append('files', file);
            
            const apiResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });

            if (!apiResponse.ok) {
              throw new Error('Failed to process with Claude API');
            }

            const apiData = await apiResponse.json();
            const processedFiles = apiData?.processedFiles || [];
            const processedFile = processedFiles[0];

            if (!processedFile) {
              throw new Error('No processed file data received from Claude API');
            }

            updateUploadStatus(globalIndex, { status: 'processing', progress: 50 });

            // OCR Text Extraction
            const ocrText = await extractTextFromImage(file);
            updateUploadStatus(globalIndex, { progress: 75 });

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

            // Store screenshot metadata
            const screenshotId = await storeScreenshot({
              filename: file.name,
              ocrText,
              visualDescription: processedFile.visualDescription || 'Image uploaded successfully',
              fileId: storageId,
              fileSize: file.size
            });

            screenshotIds.push(screenshotId);
            updateUploadStatus(globalIndex, { status: 'success', progress: 100 });

          } catch (error) {
            updateUploadStatus(globalIndex, { 
              status: 'error', 
              errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
            });
          }
        })
      );

      // Small delay between batches to prevent overwhelming the system
      if (i + BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsProcessing(false);
    
    // Call completion callback
    if (onUploadComplete && screenshotIds.length > 0) {
      onUploadComplete(screenshotIds);
    }
  }, [generateUploadUrl, storeScreenshot, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, onUploadComplete, onUploadProgress]);

  // Dropzone configuration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadMode === 'folder') {
      // For folder mode, use the dedicated folder processing
      await processFolderUpload(acceptedFiles);
      return;
    }

    // For single file mode, use the same batch processing logic
    await processFolderUpload(acceptedFiles);
  }, [uploadMode, processFolderUpload]);

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
      {/* Upload Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-white rounded-lg p-1 border border-orange-300">
          <button
            onClick={() => {
              setUploadMode('single');
              setShowFolderPreview(false);
              setFolderPreview(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              uploadMode === 'single' 
                ? 'bg-orange-500 text-white' 
                : 'text-orange-700 hover:bg-orange-100'
            }`}
          >
            <Image className="h-4 w-4" aria-label="Single images icon" />
            <span>Single Images</span>
          </button>
          <button
            onClick={() => {
              setUploadMode('folder');
              setShowFolderPreview(false);
              setFolderPreview(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              uploadMode === 'folder' 
                ? 'bg-orange-500 text-white' 
                : 'text-orange-700 hover:bg-orange-100'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Folder Upload</span>
          </button>
        </div>
      </div>

      {/* Folder Preview */}
      {showFolderPreview && folderPreview && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-3">
            📁 {folderPreview.folderName}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Files found:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {folderPreview.totalFiles}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total size:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {formatFileSize(folderPreview.totalSize)}
              </span>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <Button 
              onClick={() => processFolderUpload(folderPreview.files)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Upload {folderPreview.totalFiles} Images
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setShowFolderPreview(false);
                setFolderPreview(null);
              }}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!showFolderPreview && (
        <>
          {uploadMode === 'folder' ? (
            // Folder Selection UI
            <div className="text-center">
              <input
                ref={folderInputRef}
                type="file"
                {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                multiple
                accept="image/*"
                onChange={handleFolderSelection}
                className="hidden"
              />
              <div 
                onClick={() => folderInputRef.current?.click()}
                className="p-8 cursor-pointer rounded-xl border-2 border-dashed border-orange-300 
                  bg-white hover:border-orange-500 hover:bg-orange-50 transition-all duration-300"
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <FolderOpen className="h-12 w-12 text-orange-500" />
                  <p className="text-lg font-semibold text-orange-700">
                    Select Folder with Images
                  </p>
                  <p className="text-sm text-gray-500">
                    Choose a folder containing PNG, JPG, JPEG, WebP images (Max {maxFiles} files)
                  </p>
                  <Button 
                    variant="outline" 
                    className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300"
                  >
                    Browse Folders
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Single File Upload UI (Drag & Drop)
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
                  PNG, JPG, JPEG, WebP (Max 10MB each)
                </p>
                <Button 
                  variant="outline" 
                  className="bg-orange-100 text-orange-700 
                    hover:bg-orange-200 border-orange-300"
                >
                  Select Images
                </Button>
              </div>
            </div>
          )}
        </>
      )}

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