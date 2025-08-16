import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchResult, highlightSearchTerms } from '@/lib/search';
import { ImageIcon, AlertCircle } from 'lucide-react';

export interface SearchResultCardProps {
  result: SearchResult;
  onClick?: () => void;
  searchQuery?: string;
  showConfidence?: boolean;
  showMatchType?: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result, 
  onClick,
  searchQuery = '',
  showConfidence = true, 
  showMatchType = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Truncate text to a reasonable preview length
  const truncateText = (text: string, maxLength = 100) => 
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

  // Create JSX for highlighted OCR text
  const highlightedOcrText = searchQuery 
    ? highlightSearchTerms(truncateText(result.ocrText), searchQuery)
    : truncateText(result.ocrText);

  return (
    <Card 
      className={`hover:bg-background/80 transition-all duration-200 ease-in-out cursor-pointer 
        border-muted/30 shadow-sm hover:shadow-md ${onClick ? 'hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col sm:flex-row gap-3">
        {/* Image Preview */}
        <div className="w-full sm:w-1/3 relative aspect-square overflow-hidden rounded-md bg-muted/20">
          {imageError ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <AlertCircle size={24} className="mb-2" />
              <span className="text-xs text-center">Failed to load image</span>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                  <ImageIcon size={24} className="text-muted animate-pulse" />
                </div>
              )}
              <Image 
                src={result.imageUrl} 
                alt={result.filename} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setImageError(true)}
                onLoad={() => setImageLoading(false)}
              />
            </>
          )}
        </div>

        {/* Result Details */}
        <div className="flex-grow space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-base truncate max-w-[80%]">
              {result.filename}
            </h3>

            {/* Badges */}
            <div className="flex gap-2">
              {showConfidence && (
                <Badge 
                  variant="outline" 
                  className={`
                    ${result.confidence > 0.8 ? 'bg-success/10 text-success' : 
                      result.confidence > 0.5 ? 'bg-accent/10 text-accent' : 
                      'bg-muted/10 text-muted'}
                  `}
                >
                  {(result.confidence * 100).toFixed(0)}% Match
                </Badge>
              )}
              
              {showMatchType && (
                <Badge variant="secondary" className="capitalize">
                  {result.matchType} Match
                </Badge>
              )}
            </div>
          </div>

          {/* OCR Text Preview */}
          <p className="text-sm text-muted">
            {highlightedOcrText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};