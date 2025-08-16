import React, { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SearchResult, highlightSearchTerms } from '@/lib/search';
import { ImageIcon, AlertCircle } from 'lucide-react';

export interface SearchResultCardProps {
  result: SearchResult;
  onClick: (result: SearchResult) => void;
  searchQuery?: string;
  showConfidence?: boolean;  // default: true
  showMatchType?: boolean;   // default: true
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
    ? highlightSearchTerms(truncateText(result.ocrText || result.visualDescription), searchQuery)
    : truncateText(result.ocrText || result.visualDescription);

  // Match type color mapping
  const matchTypeColors = {
    'text': 'bg-blue-100 text-blue-800',
    'visual': 'bg-green-100 text-green-800', 
    'both': 'bg-purple-100 text-purple-800'
  };

  return (
    <Card 
      className={`
        hover:shadow-lg transition-all duration-300 ease-in-out 
        cursor-pointer group border-gray-200 dark:border-gray-700 
        max-w-sm w-full
      `}
      onClick={() => onClick(result)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Filename and Match Type */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-base truncate max-w-[70%]">
            {result.filename}
          </h3>
          {showMatchType && (
            <Badge 
              variant="outline" 
              className={`
                text-xs px-2 py-1 rounded-full 
                ${matchTypeColors[result.matchType]}
              `}
            >
              {result.matchType.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Thumbnail Image */}
        <div className="aspect-video relative w-full rounded-lg overflow-hidden">
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
                alt={`Thumbnail for ${result.filename}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
                onLoad={() => setImageLoading(false)}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            </>
          )}
        </div>

        {/* Confidence Meter */}
        {showConfidence && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Confidence</span>
              <span>{Math.round(result.confidence * 100)}%</span>
            </div>
            <Progress 
              value={result.confidence * 100} 
              className="h-2 bg-gray-200" 
            />
          </div>
        )}

        {/* Text Preview & Upload Date */}
        <div className="space-y-1">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {highlightedOcrText}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(result.uploadedAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};