# Document Cache System

## Overview

The document cache system provides seamless and fast document processing by storing extracted text in the browser's localStorage. This eliminates the need to re-process documents that have already been uploaded, resulting in instant access to previously processed documents.

## Features

### 🚀 **Instant Processing**
- Documents found in cache are processed instantly (no re-upload needed)
- Automatic detection of cached documents when files are selected
- Visual indicators show when documents are available from cache

### 💾 **Smart Caching**
- Automatic text compression for large documents (>100KB)
- Configurable cache size limits (default: 50 documents)
- Automatic expiration after 24 hours
- Memory-efficient storage with cleanup routines

### 🔍 **Cache Management**
- Real-time cache statistics display
- Manual cache clearing options
- Individual document removal from cache
- Automatic cleanup of expired documents

## How It Works

### 1. **Document Upload Flow**
```
User selects file → Check cache → If cached: instant load, If not: process & cache
```

### 2. **Cache Key Generation**
- Uses file name, size, and last modified timestamp
- Creates unique hash for each document
- Prevents duplicate caching of identical files

### 3. **Text Extraction & Storage**
- Extracts text using appropriate libraries (PDF.js, Mammoth, etc.)
- Applies OCR for scanned documents when needed
- Compresses text for efficient storage
- Stores metadata (file type, size, OCR status, etc.)

## Components

### `DocumentCache` Class (`src/lib/document-cache.ts`)
- Core caching logic and localStorage management
- Automatic cleanup and size management
- Text compression and decompression

### `useDocumentCache` Hook (`src/lib/hooks/useDocumentCache.ts`)
- React hook for cache state management
- Provides cache operations to components
- Automatic cache statistics updates

### `CacheManager` Component (`src/components/CacheManager.tsx`)
- Dashboard widget showing cache status
- Cache management controls
- Visual cache statistics display

### `DocumentUpload` Component (Enhanced)
- Integrated cache checking
- Instant processing for cached documents
- Cache status indicators

## Usage

### Basic Cache Operations

```typescript
import { documentCache } from '@/lib/document-cache';

// Check if document is cached
const isCached = documentCache.isCached(file);

// Get cached text
const cachedText = documentCache.getCachedText(file);

// Cache a new document
documentCache.cacheDocument(file, extractedText, isScanned, ocrApplied);

// Clear all cache
documentCache.clearCache();
```

### Using the Hook

```typescript
import { useDocumentCache } from '@/lib/hooks/useDocumentCache';

function MyComponent() {
  const { cacheStats, clearCache, isCached } = useDocumentCache();
  
  // Access cache statistics and operations
  return (
    <div>
      <p>Documents cached: {cacheStats?.totalDocuments}</p>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  );
}
```

## Configuration

### Cache Options

```typescript
interface CacheOptions {
  maxSize?: number;        // Max documents (default: 50)
  maxAge?: number;         // Max age in ms (default: 24 hours)
  enableCompression?: boolean; // Text compression (default: true)
}
```

### Default Settings
- **Maximum Documents**: 50
- **Expiration Time**: 24 hours
- **Compression Threshold**: 100KB
- **Auto-cleanup**: Every hour

## Performance Benefits

### **First Upload**
- Normal processing time (varies by document size)
- Text extraction and OCR if needed
- Automatic caching for future use

### **Subsequent Access**
- **Instant** text retrieval
- No file re-upload required
- No re-processing needed
- Immediate availability for analysis

### **Memory Efficiency**
- Automatic compression for large texts
- LRU-style eviction for old documents
- Configurable size limits
- Automatic cleanup routines

## Browser Compatibility

- **localStorage**: All modern browsers
- **Fallback**: Graceful degradation if storage unavailable
- **Error Handling**: Automatic cleanup on storage errors

## Security Considerations

- **Local Storage Only**: No server-side caching
- **User Isolation**: Cache is per-browser/device
- **No Sensitive Data**: Only extracted text, not original files
- **Automatic Expiration**: Prevents long-term data retention

## Future Enhancements

- **IndexedDB Integration**: For larger document storage
- **Service Worker Caching**: For offline access
- **Cloud Sync**: Cross-device cache synchronization
- **Advanced Compression**: LZMA or similar algorithms
- **Cache Analytics**: Usage patterns and optimization

## Troubleshooting

### Cache Not Working
1. Check browser localStorage support
2. Verify file hasn't changed (name, size, timestamp)
3. Check cache expiration (24 hours)
4. Clear browser data if needed

### Performance Issues
1. Monitor cache size and document count
2. Check for large documents consuming memory
3. Adjust compression settings if needed
4. Clear cache if performance degrades

### Storage Errors
1. Check available localStorage space
2. Clear old cache entries
3. Verify browser permissions
4. Check for private/incognito mode restrictions

## API Reference

### DocumentCache Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `isCached(file)` | Check if file is cached | `File` | `boolean` |
| `getCachedText(file)` | Get cached text | `File` | `string \| null` |
| `cacheDocument(file, text, isScanned?, ocrApplied?)` | Cache document | `File, string, boolean?, boolean?` | `void` |
| `clearCache()` | Clear all cache | None | `void` |
| `getCacheStats()` | Get cache statistics | None | `CacheStats` |
| `cleanup()` | Remove expired documents | None | `void` |

### CacheStats Interface

```typescript
interface CacheStats {
  totalDocuments: number;
  totalSize: number;
  oldestDocument: Date | null;
  newestDocument: Date | null;
}
```

## Contributing

When modifying the cache system:

1. **Test Performance**: Verify cache operations remain fast
2. **Check Memory**: Ensure no memory leaks in cleanup routines
3. **Validate Storage**: Test with various file types and sizes
4. **Update Tests**: Add tests for new cache functionality
5. **Document Changes**: Update this documentation

---

*This cache system significantly improves user experience by eliminating redundant document processing while maintaining efficient memory usage and automatic cleanup.*
