'use client';

import { useDocumentCache } from '@/lib/hooks/useDocumentCache';
import { useState } from 'react';

export const CacheManager = () => {
  const { cacheStats, clearCache, refreshCache } = useDocumentCache();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!cacheStats) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Document Cache
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshCache}
            className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Details'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {cacheStats.totalDocuments}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Documents Cached
          </div>
        </div>
        
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatBytes(cacheStats.totalSize)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Total Size
          </div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {cacheStats.totalDocuments > 0 ? 'Active' : 'Empty'}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">
            Cache Status
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Oldest Document:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {formatDate(cacheStats.oldestDocument)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Newest Document:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {formatDate(cacheStats.newestDocument)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cache automatically expires documents after 24 hours and limits storage to 50 documents.
            </p>
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Clear All Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
