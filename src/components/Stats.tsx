'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArchiveIcon, ImageIcon, DatabaseIcon } from 'lucide-react';

export interface StatsProps {
  totalScreenshots: number;
  storageUsed: number; // in bytes
}

export function Stats({ 
  totalScreenshots, 
  storageUsed 
}: StatsProps) {
  // Helper function to format storage size
  const formatStorageSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-primary/5 border-primary/10 hover:shadow-sm transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Screenshots
          </CardTitle>
          <ArchiveIcon className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totalScreenshots.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Your visual memory archive
          </p>
        </CardContent>
      </Card>

      <Card className="bg-secondary/5 border-secondary/10 hover:shadow-sm transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Storage Used
          </CardTitle>
          <DatabaseIcon className="h-5 w-5 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatStorageSize(storageUsed)}
          </div>
          <p className="text-xs text-muted-foreground">
            Saved and searchable
          </p>
        </CardContent>
      </Card>

      <Card className="bg-accent/5 border-accent/10 hover:shadow-sm transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Searchable Content
          </CardTitle>
          <ImageIcon className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {(totalScreenshots > 0 
              ? (totalScreenshots / 50 * 100).toFixed(0) 
              : 0) + '%'}
          </div>
          <p className="text-xs text-muted-foreground">
            Progress towards 50 screenshot goal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}