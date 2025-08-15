/**
 * Document Cache Utility
 * Provides fast, seamless document text caching for improved user experience
 */

export interface CachedDocument {
  id: string;
  fileName: string;
  text: string;
  fileType: string;
  fileSize: number;
  isScanned: boolean;
  ocrApplied: boolean;
  timestamp: number;
  hash: string;
}

export interface CacheOptions {
  maxSize?: number; // Maximum number of cached documents
  maxAge?: number;  // Maximum age in milliseconds (default: 24 hours)
  enableCompression?: boolean; // Enable text compression for large documents
}

class DocumentCache {
  private readonly STORAGE_KEY = 'clincerta_document_cache';
  private readonly DEFAULT_MAX_SIZE = 50;
  private readonly DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private readonly COMPRESSION_THRESHOLD = 100000; // Compress texts larger than 100KB

  constructor(private options: CacheOptions = {}) {
    this.options = {
      maxSize: this.options.maxSize || this.DEFAULT_MAX_SIZE,
      maxAge: this.options.maxAge || this.DEFAULT_MAX_AGE,
      enableCompression: this.options.enableCompression !== false
    };
  }

  /**
   * Generate a hash for a file to use as cache key
   */
  private generateFileHash(file: File): string {
    // Simple hash based on file name, size, and last modified
    const hashString = `${file.name}-${file.size}-${file.lastModified}`;
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Compress text for storage (simple compression for large texts)
   */
  private compressText(text: string): string {
    if (!this.options.enableCompression || text.length < this.COMPRESSION_THRESHOLD) {
      return text;
    }
    
    // Simple compression: remove extra whitespace and newlines
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Decompress text
   */
  private decompressText(text: string): string {
    // For now, compression is lossless, so no decompression needed
    // In the future, this could implement actual compression algorithms
    return text;
  }

  /**
   * Get all cached documents
   */
  private getCachedDocuments(): CachedDocument[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (!cached) return [];
      
      const documents: CachedDocument[] = JSON.parse(cached);
      return documents.filter(doc => {
        const age = Date.now() - doc.timestamp;
        return age < this.options.maxAge!;
      });
    } catch (error) {
      console.warn('Error reading document cache:', error);
      return [];
    }
  }

  /**
   * Save documents to cache
   */
  private saveToCache(documents: CachedDocument[]): void {
    try {
      if (typeof window === 'undefined') return;
      
      // Limit cache size
      if (documents.length > this.options.maxSize!) {
        documents = documents
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.options.maxSize!);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
    } catch (error) {
      console.warn('Error saving to document cache:', error);
      // If storage fails, try to clear some space
      this.clearCache();
    }
  }

  /**
   * Check if a document is already cached
   */
  isCached(file: File): boolean {
    const hash = this.generateFileHash(file);
    const documents = this.getCachedDocuments();
    return documents.some(doc => doc.hash === hash);
  }

  /**
   * Get cached document text
   */
  getCachedText(file: File): string | null {
    const hash = this.generateFileHash(file);
    const documents = this.getCachedDocuments();
    const cached = documents.find(doc => doc.hash === hash);
    
    if (cached) {
      // Update access timestamp
      cached.timestamp = Date.now();
      this.saveToCache(documents);
      return this.decompressText(cached.text);
    }
    
    return null;
  }

  /**
   * Cache a processed document
   */
  cacheDocument(
    file: File,
    text: string,
    isScanned: boolean = false,
    ocrApplied: boolean = false
  ): void {
    try {
      const hash = this.generateFileHash(file);
      const documents = this.getCachedDocuments();
      
      // Remove existing entry if it exists
      const existingIndex = documents.findIndex(doc => doc.hash === hash);
      if (existingIndex !== -1) {
        documents.splice(existingIndex, 1);
      }
      
      // Add new entry
      const newDocument: CachedDocument = {
        id: hash,
        fileName: file.name,
        text: this.compressText(text),
        fileType: file.type,
        fileSize: file.size,
        isScanned,
        ocrApplied,
        timestamp: Date.now(),
        hash
      };
      
      documents.unshift(newDocument); // Add to beginning
      this.saveToCache(documents);
      
      console.log(`Document "${file.name}" cached successfully`);
    } catch (error) {
      console.warn('Error caching document:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalDocuments: number;
    totalSize: number;
    oldestDocument: Date | null;
    newestDocument: Date | null;
  } {
    const documents = this.getCachedDocuments();
    const totalSize = documents.reduce((sum, doc) => sum + doc.text.length, 0);
    
    return {
      totalDocuments: documents.length,
      totalSize,
      oldestDocument: documents.length > 0 ? new Date(Math.min(...documents.map(d => d.timestamp))) : null,
      newestDocument: documents.length > 0 ? new Date(Math.max(...documents.map(d => d.timestamp))) : null
    };
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Document cache cleared');
    } catch (error) {
      console.warn('Error clearing document cache:', error);
    }
  }

  /**
   * Remove a specific document from cache
   */
  removeFromCache(file: File): void {
    const hash = this.generateFileHash(file);
    const documents = this.getCachedDocuments();
    const filtered = documents.filter(doc => doc.hash !== hash);
    
    if (filtered.length !== documents.length) {
      this.saveToCache(filtered);
      console.log(`Document "${file.name}" removed from cache`);
    }
  }

  /**
   * Clean up expired documents
   */
  cleanup(): void {
    const documents = this.getCachedDocuments();
    const now = Date.now();
    const validDocuments = documents.filter(doc => {
      const age = now - doc.timestamp;
      return age < this.options.maxAge!;
    });
    
    if (validDocuments.length !== documents.length) {
      this.saveToCache(validDocuments);
      console.log(`Cleaned up ${documents.length - validDocuments.length} expired documents`);
    }
  }
}

// Export singleton instance
export const documentCache = new DocumentCache();

// Auto-cleanup every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    documentCache.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}
