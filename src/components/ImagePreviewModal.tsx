import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult, highlightSearchTerms } from '@/lib/search';
import { AlertCircle, X, Eye, EyeOff, Copy, Calendar, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Id } from '../../convex/_generated/dataModel';

// Screenshot type from Convex database
interface Screenshot {
  _id: Id<'screenshots'>;
  filename: string;
  uploadedAt: number;
  ocrText: string;
  visualDescription: string;
  imageUrl: string;
  fileSize: number;
  processingStatus: 'pending' | 'completed' | 'failed';
}

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: Screenshot | SearchResult;
  showOcrOverlay?: boolean;
  showDescription?: boolean;
  searchQuery?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  screenshot,
  showOcrOverlay = false,
  showDescription = true,
  searchQuery = ''
}) => {
  const [ocrOverlayVisible, setOcrOverlayVisible] = useState(showOcrOverlay);
  const [descriptionExpanded, setDescriptionExpanded] = useState(showDescription);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Helper functions to handle both Screenshot and SearchResult types
  const getScreenshotId = (screenshot: Screenshot | SearchResult): string => {
    return '_id' in screenshot ? screenshot._id : screenshot.id;
  };

  const getProcessingStatus = (screenshot: Screenshot | SearchResult): string => {
    return 'processingStatus' in screenshot ? screenshot.processingStatus : 'completed';
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Extract screenshot ID for dependency array
  const screenshotId = getScreenshotId(screenshot);
  
  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageLoading(true);
      setImageError(false);
      setCopied(false);
    }
  }, [isOpen, screenshotId]);

  const handleCopyText = async () => {
    if (screenshot.ocrText) {
      try {
        await navigator.clipboard.writeText(screenshot.ocrText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUploadDate = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const highlightedOcrText = searchQuery 
    ? highlightSearchTerms(screenshot.ocrText, searchQuery)
    : screenshot.ocrText;

  const highlightedVisualDescription = searchQuery 
    ? highlightSearchTerms(screenshot.visualDescription, searchQuery)
    : screenshot.visualDescription;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate pr-2">
              {screenshot.filename}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatUploadDate(screenshot.uploadedAt)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(screenshot.fileSize)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Image Display Area */}
          <div className="flex-1 relative bg-gray-50 min-h-[300px] lg:min-h-[500px]">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle size={48} className="mb-2" />
                  <p>Failed to load image</p>
                </div>
              </div>
            ) : (
              <Image
                src={screenshot.imageUrl}
                alt={screenshot.filename}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 70vw"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageError(true)}
                style={{ display: imageLoading ? 'none' : 'block' }}
              />
            )}

            {/* OCR Text Overlay */}
            {ocrOverlayVisible && screenshot.ocrText && !imageLoading && !imageError && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-4 max-w-2xl max-h-96 overflow-y-auto shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Extracted Text</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOcrOverlayVisible(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{highlightedOcrText}</p>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {screenshot.ocrText && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOcrOverlayVisible(!ocrOverlayVisible)}
                  className="bg-white/90 hover:bg-white"
                >
                  {ocrOverlayVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar with Metadata */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-background">
            <div className="p-4 space-y-4">
              {/* Processing Status */}
              <div>
                <Badge
                  variant={
                    getProcessingStatus(screenshot) === 'completed'
                      ? 'default'
                      : getProcessingStatus(screenshot) === 'failed'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {getProcessingStatus(screenshot).charAt(0).toUpperCase() + 
                   getProcessingStatus(screenshot).slice(1)}
                </Badge>
              </div>

              {/* OCR Text Section */}
              {screenshot.ocrText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Extracted Text</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyText}
                      disabled={!screenshot.ocrText}
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-xs whitespace-pre-wrap">
                      {highlightedOcrText || 'No text extracted'}
                    </p>
                  </div>
                </div>
              )}

              {/* Visual Description Section */}
              {screenshot.visualDescription && showDescription && (
                <div className="space-y-2">
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="font-semibold text-sm">Visual Description</h3>
                    <Button variant="ghost" size="sm">
                      {descriptionExpanded ? '−' : '+'}
                    </Button>
                  </button>
                  {descriptionExpanded && (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs">
                        {highlightedVisualDescription || 'No description available'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* File Info */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold text-sm">File Information</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Size: {formatFileSize(screenshot.fileSize)}</div>
                  <div>Uploaded: {formatUploadDate(screenshot.uploadedAt)}</div>
                  <div className="break-all">File: {screenshot.filename}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};