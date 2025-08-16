import React from 'react';
import { Id } from '../../convex/_generated/dataModel'

export interface SearchResult {
  id: Id<"screenshots">;
  filename: string;
  imageUrl: string;
  ocrText: string;
  visualDescription: string;
  confidence: number; // 0-1 score
  uploadedAt: number;
  matchType: 'text' | 'visual' | 'both';
  fileSize: number;
}

// Stop words to filter out of search queries
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
  'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
]);

/**
 * Tokenizes a query string by removing stop words and normalizing
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Calculates TF-IDF-like scoring for search relevance with performance optimizations
 */
export function calculateRelevanceScore(
  query: string, 
  ocrText: string, 
  visualDescription: string
): { score: number; matchType: 'text' | 'visual' | 'both' } {
  const queryTokens = tokenizeQuery(query);
  const normalizedQuery = query.toLowerCase();
  const normalizedOcr = ocrText.toLowerCase();
  const normalizedVisual = visualDescription.toLowerCase();
  
  if (queryTokens.length === 0) {
    return { score: 0, matchType: 'text' };
  }

  // Early exit if no text content
  if (!ocrText.trim() && !visualDescription.trim()) {
    return { score: 0, matchType: 'text' };
  }

  let ocrScore = 0;
  let visualScore = 0;
  let hasOcrMatch = false;
  let hasVisualMatch = false;

  // Check for exact phrase matches first (highest priority)
  const ocrExactMatch = normalizedOcr.includes(normalizedQuery);
  const visualExactMatch = normalizedVisual.includes(normalizedQuery);
  
  if (ocrExactMatch) {
    ocrScore += 2.0; // Higher weight for exact matches
    hasOcrMatch = true;
  }
  if (visualExactMatch) {
    visualScore += 2.0;
    hasVisualMatch = true;
  }

  // Token-based scoring with optimizations
  const ocrWords = normalizedOcr.split(/\s+/);
  const visualWords = normalizedVisual.split(/\s+/);
  
  for (const token of queryTokens) {
    // Use indexOf for better performance than regex for simple string matching
    const ocrTokenCount = ocrWords.filter(word => word.includes(token)).length;
    const visualTokenCount = visualWords.filter(word => word.includes(token)).length;
    
    if (ocrTokenCount > 0) {
      // TF-IDF inspired scoring: frequency * inverse document frequency
      const tf = ocrTokenCount / ocrWords.length;
      const boost = token.length > 3 ? 1.2 : 1.0; // Longer tokens get slight boost
      ocrScore += Math.min(tf * boost, 0.8); // Cap contribution per token
      hasOcrMatch = true;
    }

    if (visualTokenCount > 0) {
      const tf = visualTokenCount / visualWords.length;
      const boost = token.length > 3 ? 1.2 : 1.0;
      visualScore += Math.min(tf * boost, 0.8);
      hasVisualMatch = true;
    }
  }

  // Normalize scores with length penalty for very long content
  const ocrLength = Math.max(ocrText.length, 1);
  const visualLength = Math.max(visualDescription.length, 1);
  
  // Less aggressive length normalization to preserve relevance of longer content
  if (ocrLength > 1000) {
    ocrScore *= 0.9; // Small penalty for very long OCR text
  }
  if (visualLength > 500) {
    visualScore *= 0.9; // Small penalty for very long descriptions
  }

  // Determine final score and match type
  const finalScore = Math.min(Math.max(ocrScore, visualScore), 1.0);
  
  let matchType: 'text' | 'visual' | 'both';
  if (hasOcrMatch && hasVisualMatch) {
    matchType = 'both';
    // Bonus for matching in both fields
    return { score: Math.min(finalScore * 1.1, 1.0), matchType };
  } else if (hasOcrMatch) {
    matchType = 'text';
  } else if (hasVisualMatch) {
    matchType = 'visual';
  } else {
    matchType = 'text';
  }

  return { 
    score: finalScore, 
    matchType 
  };
}

/**
 * Searches through screenshots and returns ranked results with performance optimizations
 */
export function searchScreenshots(
  query: string,
  screenshots: Array<{
    _id: Id<"screenshots">;
    filename: string;
    imageUrl: string;
    ocrText: string;
    visualDescription: string;
    uploadedAt: number;
    fileSize: number;
    processingStatus: string;
  }>,
  limit: number = 5
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  // Early exit if no screenshots
  if (!screenshots || screenshots.length === 0) {
    return [];
  }

  // Filter and process in one step for better performance
  const processedScreenshots = screenshots.filter(
    s => s.processingStatus === 'completed' && 
        (s.ocrText.trim() || s.visualDescription.trim()) // Skip empty content
  );

  if (processedScreenshots.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];
  const queryTokens = tokenizeQuery(query);
  const normalizedQuery = query.toLowerCase();

  // Pre-filter screenshots that might contain matches for better performance
  const candidateScreenshots = processedScreenshots.filter(screenshot => {
    const normalizedOcr = screenshot.ocrText.toLowerCase();
    const normalizedVisual = screenshot.visualDescription.toLowerCase();
    const normalizedFilename = screenshot.filename.toLowerCase();
    
    // Quick check for exact phrase or filename match
    if (normalizedOcr.includes(normalizedQuery) || 
        normalizedVisual.includes(normalizedQuery) ||
        normalizedFilename.includes(normalizedQuery)) {
      return true;
    }
    
    // Check for token matches
    return queryTokens.some(token => 
      normalizedOcr.includes(token) || 
      normalizedVisual.includes(token) ||
      normalizedFilename.includes(token)
    );
  });

  for (const screenshot of candidateScreenshots) {
    const { score, matchType } = calculateRelevanceScore(
      query,
      screenshot.ocrText,
      screenshot.visualDescription
    );

    // Only include results with meaningful confidence scores
    if (score > 0.05) { // Lowered threshold slightly for better recall
      results.push({
        id: screenshot._id,
        filename: screenshot.filename,
        imageUrl: screenshot.imageUrl,
        ocrText: screenshot.ocrText,
        visualDescription: screenshot.visualDescription,
        confidence: score,
        uploadedAt: screenshot.uploadedAt,
        matchType,
        fileSize: screenshot.fileSize,
      });
    }
  }

  // Sort by confidence score (descending), then by upload date (newest first) as tiebreaker
  return results
    .sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) < 0.01) {
        return b.uploadedAt - a.uploadedAt; // Newer first for ties
      }
      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

/**
 * Highlights search terms in text content for display using JSX elements
 */
export function highlightSearchTerms(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const queryTokens = tokenizeQuery(query);
  if (queryTokens.length === 0) {
    return text;
  }

  // Create a pattern that matches exact phrase or individual tokens
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTokens = queryTokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  // Combine exact phrase and token patterns
  const patterns = [escapedQuery, ...escapedTokens.map(token => `\\b${token}\\b`)];
  const combinedPattern = `(${patterns.join('|')})`;
  const regex = new RegExp(combinedPattern, 'gi');

  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    // Check if this part matches any of our search terms
    const isMatch = regex.test(part);
    regex.lastIndex = 0; // Reset regex for next test
    
    if (isMatch && part.trim()) {
      return (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      );
    }
    return part;
  }).filter(part => part !== ''); // Remove empty parts
}