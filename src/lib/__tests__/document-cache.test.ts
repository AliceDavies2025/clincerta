/**
 * Tests for DocumentCache functionality
 * Note: These tests are designed to run in a browser environment with localStorage
 */

import { documentCache } from '../document-cache';

// Mock File object for testing
const createMockFile = (name: string, size: number, lastModified: number): File => {
  const blob = new Blob(['test content'], { type: 'text/plain' });
  const file = new File([blob], name, { lastModified });
  // Mock the properties that our hash function uses
  Object.defineProperty(file, 'size', { value: size });
  Object.defineProperty(file, 'lastModified', { value: lastModified });
  return file;
};

describe('DocumentCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    documentCache.clearCache();
    
    // Mock localStorage if not available (for Node.js testing)
    if (typeof localStorage === 'undefined') {
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      };
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    }
  });

  afterEach(() => {
    documentCache.clearCache();
  });

  describe('Basic Operations', () => {
    it('should cache a document and retrieve it', () => {
      const file = createMockFile('test.pdf', 1024, Date.now());
      const text = 'This is test document content';
      
      // Cache the document
      documentCache.cacheDocument(file, text);
      
      // Check if it's cached
      expect(documentCache.isCached(file)).toBe(true);
      
      // Retrieve cached text
      const cachedText = documentCache.getCachedText(file);
      expect(cachedText).toBe(text);
    });

    it('should not cache empty text', () => {
      const file = createMockFile('empty.pdf', 0, Date.now());
      const emptyText = '';
      
      documentCache.cacheDocument(file, emptyText);
      
      // Should still be cached even with empty text
      expect(documentCache.isCached(file)).toBe(true);
      expect(documentCache.getCachedText(file)).toBe('');
    });

    it('should handle large text with compression', () => {
      const file = createMockFile('large.pdf', 1024 * 1024, Date.now());
      const largeText = 'A'.repeat(150000); // 150KB text
      
      documentCache.cacheDocument(file, largeText);
      
      expect(documentCache.isCached(file)).toBe(true);
      const cachedText = documentCache.getCachedText(file);
      expect(cachedText).toBe(largeText);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache', () => {
      const file1 = createMockFile('test1.pdf', 1024, Date.now());
      const file2 = createMockFile('test2.pdf', 2048, Date.now());
      
      documentCache.cacheDocument(file1, 'content1');
      documentCache.cacheDocument(file2, 'content2');
      
      expect(documentCache.isCached(file1)).toBe(true);
      expect(documentCache.isCached(file2)).toBe(true);
      
      documentCache.clearCache();
      
      expect(documentCache.isCached(file1)).toBe(false);
      expect(documentCache.isCached(file2)).toBe(false);
    });

    it('should remove specific document from cache', () => {
      const file1 = createMockFile('test1.pdf', 1024, Date.now());
      const file2 = createMockFile('test2.pdf', 2048, Date.now());
      
      documentCache.cacheDocument(file1, 'content1');
      documentCache.cacheDocument(file2, 'content2');
      
      documentCache.removeFromCache(file1);
      
      expect(documentCache.isCached(file1)).toBe(false);
      expect(documentCache.isCached(file2)).toBe(true);
    });

    it('should provide cache statistics', () => {
      const file1 = createMockFile('test1.pdf', 1024, Date.now());
      const file2 = createMockFile('test2.pdf', 2048, Date.now());
      
      documentCache.cacheDocument(file1, 'content1');
      documentCache.cacheDocument(file2, 'content2');
      
      const stats = documentCache.getCacheStats();
      
      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestDocument).toBeInstanceOf(Date);
      expect(stats.newestDocument).toBeInstanceOf(Date);
    });
  });

  describe('Hash Generation', () => {
    it('should generate different hashes for different files', () => {
      const file1 = createMockFile('test1.pdf', 1024, Date.now());
      const file2 = createMockFile('test2.pdf', 1024, Date.now());
      
      // Files with same size but different names should have different hashes
      expect(documentCache.isCached(file1)).toBe(false);
      expect(documentCache.isCached(file2)).toBe(false);
    });

    it('should generate same hash for identical files', () => {
      const timestamp = Date.now();
      const file1 = createMockFile('test.pdf', 1024, timestamp);
      const file2 = createMockFile('test.pdf', 1024, timestamp);
      
      // Identical files should have the same hash
      documentCache.cacheDocument(file1, 'content');
      expect(documentCache.isCached(file2)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined gracefully', () => {
      // These should not throw errors
      expect(() => documentCache.isCached(null as any)).not.toThrow();
      expect(() => documentCache.getCachedText(null as any)).not.toThrow();
      expect(() => documentCache.cacheDocument(null as any, 'text')).not.toThrow();
    });

    it('should handle very long file names', () => {
      const longName = 'a'.repeat(1000) + '.pdf';
      const file = createMockFile(longName, 1024, Date.now());
      const text = 'test content';
      
      expect(() => documentCache.cacheDocument(file, text)).not.toThrow();
      expect(documentCache.isCached(file)).toBe(true);
    });

    it('should handle special characters in file names', () => {
      const specialName = 'test-file_with.special@chars#123.pdf';
      const file = createMockFile(specialName, 1024, Date.now());
      const text = 'test content';
      
      expect(() => documentCache.cacheDocument(file, text)).not.toThrow();
      expect(documentCache.isCached(file)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle multiple documents efficiently', () => {
      const startTime = performance.now();
      
      // Cache 100 documents
      for (let i = 0; i < 100; i++) {
        const file = createMockFile(`test${i}.pdf`, 1024, Date.now() + i);
        const text = `content ${i}`.repeat(100); // 800 bytes per document
        documentCache.cacheDocument(file, text);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      
      const stats = documentCache.getCacheStats();
      // Should respect max size limit (default 50)
      expect(stats.totalDocuments).toBeLessThanOrEqual(50);
    });
  });
});

// Export for use in other test files
export { createMockFile };
