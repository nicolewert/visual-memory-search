import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SearchResult, highlightSearchTerms } from '@/lib/search';
import { ImageIcon, AlertCircle } from 'lucide-react';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: SearchResult;
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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const highlightedOcrText = searchQuery 
    ? highlightSearchTerms(screenshot.ocrText, searchQuery)
    : screenshot.ocrText;

  const highlightedVisualDescription = searchQuery 
    ? highlightSearchTerms(screenshot.visualDescription, searchQuery)
    : screenshot.visualDescription;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{screenshot.filename}</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                {(screenshot.confidence * 100).toFixed(0)}% Match
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {screenshot.matchType} Match
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Uploaded on {new Date(screenshot.uploadedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Image Preview */}
          <div className="relative aspect-square w-full bg-muted/20 rounded-md">
            {imageError ? (
              <div className="flex flex-col items-center justify-center h-full text-muted">
                <AlertCircle size={48} className="mb-4" />
                <span className="text-center">Failed to load image</span>
              </div>
            ) : (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded-md">
                    <ImageIcon size={48} className="text-muted animate-pulse" />
                  </div>
                )}
                <Image 
                  src={screenshot.imageUrl} 
                  alt={screenshot.filename} 
                  fill 
                  className="object-contain rounded-md shadow-md"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageLoading(false)}
                />
                {showOcrOverlay && !imageError && (
                  <div className="absolute inset-0 bg-black/50 text-white p-4 overflow-auto rounded-md">
                    <div className="text-sm">{highlightedOcrText}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Details Panel */}
          <div className="space-y-4">
            {showDescription && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Visual Description</h3>
                  <p className="text-muted">
                    {highlightedVisualDescription}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">OCR Text</h3>
                  <p className="text-muted font-mono text-sm">
                    {highlightedOcrText}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};