import { useState, useEffect, useCallback } from 'react';
import { documentCache, type CachedDocument } from '@/lib/document-cache';

export interface UseDocumentCacheReturn {
  cacheStats: {
    totalDocuments: number;
    totalSize: number;
    oldestDocument: Date | null;
    newestDocument: Date | null;
  } | null;
  cachedDocuments: CachedDocument[];
  refreshCache: () => void;
  clearCache: () => void;
  removeFromCache: (file: File) => void;
  isCached: (file: File) => boolean;
  getCachedText: (file: File) => string | null;
}

export function useDocumentCache(): UseDocumentCacheReturn {
  const [cacheStats, setCacheStats] = useState<UseDocumentCacheReturn['cacheStats']>(null);
  const [cachedDocuments, setCachedDocuments] = useState<CachedDocument[]>([]);

  const refreshCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stats = documentCache.getCacheStats();
      setCacheStats(stats);
      
      // Get all cached documents (this would need to be exposed from the cache class)
      // For now, we'll just update the stats
      setCacheStats(stats);
    }
  }, []);

  const clearCache = useCallback(() => {
    documentCache.clearCache();
    refreshCache();
  }, [refreshCache]);

  const removeFromCache = useCallback((file: File) => {
    documentCache.removeFromCache(file);
    refreshCache();
  }, [refreshCache]);

  const isCached = useCallback((file: File) => {
    return documentCache.isCached(file);
  }, []);

  const getCachedText = useCallback((file: File) => {
    return documentCache.getCachedText(file);
  }, []);

  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  return {
    cacheStats,
    cachedDocuments,
    refreshCache,
    clearCache,
    removeFromCache,
    isCached,
    getCachedText
  };
}
