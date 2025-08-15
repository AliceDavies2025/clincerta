'use client';

import { useState, useEffect } from 'react';

export interface ProcessingMetricsProps {
  isProcessing: boolean;
  processingTime: number;
  fileSize?: number;
  pageCount?: number;
  isCached: boolean;
}

export const ProcessingMetrics = ({ 
  isProcessing, 
  processingTime, 
  fileSize, 
  pageCount, 
  isCached 
}: ProcessingMetricsProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (time: number): string => {
    if (time < 1000) return `${Math.round(time)}ms`;
    if (time < 60000) return `${(time / 1000).toFixed(1)}s`;
    return `${(time / 60000).toFixed(1)}m`;
  };

  const calculateSpeed = (): string => {
    if (!fileSize || processingTime === 0) return 'N/A';
    const bytesPerSecond = fileSize / (processingTime / 1000);
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const getPerformanceRating = (): { rating: string; color: string; description: string } => {
    if (isCached) {
      return { rating: 'Instant', color: 'text-green-600', description: 'Loaded from cache' };
    }
    
    if (processingTime < 1000) {
      return { rating: 'Excellent', color: 'text-green-600', description: 'Very fast processing' };
    } else if (processingTime < 3000) {
      return { rating: 'Good', color: 'text-blue-600', description: 'Fast processing' };
    } else if (processingTime < 10000) {
      return { rating: 'Average', color: 'text-yellow-600', description: 'Normal processing time' };
    } else {
      return { rating: 'Slow', color: 'text-red-600', description: 'Processing may take time' };
    }
  };

  const performance = getPerformanceRating();

  if (!isProcessing && processingTime === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Processing Performance
        </h4>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        <div className="text-center">
          <div className={`text-lg font-bold ${performance.color}`}>
            {performance.rating}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Performance
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatTime(processingTime)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Processing Time
          </div>
        </div>
        
        {fileSize && (
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatBytes(fileSize)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              File Size
            </div>
          </div>
        )}
        
        {pageCount && (
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {pageCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Pages
            </div>
          </div>
        )}
      </div>

      <div className="text-center mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {performance.description}
        </p>
      </div>

      {showDetails && (
        <div className="border-t pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Processing Speed:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {calculateSpeed()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Cache Status:</span>
              <span className={`ml-2 ${isCached ? 'text-green-600' : 'text-gray-600'}`}>
                {isCached ? 'Hit' : 'Miss'}
              </span>
            </div>
          </div>
          
          {fileSize && processingTime > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Efficiency:</span> 
              {processingTime < 1000 ? ' Excellent' : 
               processingTime < 3000 ? ' Good' : 
               processingTime < 10000 ? ' Average' : ' Could be improved'}
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Performance metrics help optimize document processing workflow
          </div>
        </div>
      )}
    </div>
  );
};
