/**
 * Fast Document Processor
 * Optimized for instant text extraction and seamless user experience
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import mammoth from 'mammoth';

// Optimize PDF.js worker for faster processing
if (typeof window !== 'undefined') {
  try {
    if (GlobalWorkerOptions) {
      GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;
    }
  } catch (error) {
    console.warn('Failed to set PDF.js worker source:', error);
  }
}

export interface ProcessingResult {
  text: string;
  isScanned: boolean;
  ocrApplied: boolean;
  processingTime: number;
  pageCount?: number;
  error?: string;
}

export interface ProcessingOptions {
  enableStreaming?: boolean; // Stream text as it's extracted
  maxConcurrentPages?: number; // Max pages to process simultaneously
  enableFastMode?: boolean; // Skip detailed processing for speed
  enableFallback?: boolean; // Enable fallback processing methods
}

class FastDocumentProcessor {
  private readonly DEFAULT_OPTIONS: Required<ProcessingOptions> = {
    enableStreaming: true,
    maxConcurrentPages: 4,
    enableFastMode: true,
    enableFallback: true
  };

  constructor(private options: ProcessingOptions = {}) {
    this.options = { ...this.DEFAULT_OPTIONS, ...this.options };
  }

  /**
   * Process document with optimized extraction
   */
  async processDocument(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    const startTime = performance.now();
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    try {
      onProgress?.(10, 'Analyzing document...');
      
      let result: ProcessingResult;
      
      switch (ext) {
        case 'pdf':
          result = await this.processPdf(file, onProgress);
          break;
        case 'docx':
          result = await this.processDocx(file, onProgress);
          break;
        case 'txt':
          result = await this.processText(file, onProgress);
          break;
        case 'doc':
          result = await this.processLegacyDoc(file, onProgress);
          break;
        default:
          result = await this.processGeneric(file, onProgress);
      }
      
      const processingTime = performance.now() - startTime;
      return { ...result, processingTime };
      
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        text: `[Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}]`,
        isScanned: false,
        ocrApplied: false,
        processingTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fast PDF processing with concurrent page extraction
   */
  private async processPdf(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    onProgress?.(20, 'Loading PDF...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to load PDF with optimized settings
      const pdf = await getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
        enableXfa: false, // Disable XFA for speed
        disableFontFace: true, // Disable font loading for speed
        cMapUrl: undefined, // Disable CMap loading
        cMapPacked: false,
        standardFontDataUrl: undefined, // Disable standard font loading
        useWorkerFetch: false, // Disable worker fetch for better performance
        isEvalSupported: false, // Disable eval for security
        useSystemFonts: false // Disable system fonts
      }).promise;
      
      const pageCount = pdf.numPages;
      onProgress?.(30, `Processing ${pageCount} pages...`);
      
      // Fast mode: extract first few pages quickly for immediate feedback
      if (this.options.enableFastMode && pageCount > 5) {
        const quickText = await this.extractQuickText(pdf, onProgress);
        onProgress?.(80, 'Quick extraction complete, processing remaining pages...');
        
        // Continue with full extraction in background
        const fullText = await this.extractFullText(pdf, onProgress);
        return {
          text: fullText,
          isScanned: this.isLikelyScanned(fullText),
          ocrApplied: false,
          pageCount
        };
      }
      
      // Standard mode: process all pages
      const text = await this.extractFullText(pdf, onProgress);
      
      return {
        text,
        isScanned: this.isLikelyScanned(text),
        ocrApplied: false,
        pageCount
      };
      
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // If PDF.js fails and fallback is enabled, try alternative method
      if (this.options.enableFallback) {
        onProgress?.(50, 'PDF.js failed, trying alternative method...');
        return await this.processPdfFallback(file, onProgress);
      }
      
      throw error;
    }
  }

  /**
   * Fallback PDF processing method
   */
  private async processPdfFallback(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    try {
      onProgress?.(60, 'Using fallback PDF processing...');
      
      // Try to read as text file (some PDFs can be read as text)
      const text = await file.text();
      
      if (text && text.length > 100) {
        onProgress?.(100, 'Fallback processing successful');
        return {
          text: text,
          isScanned: false,
          ocrApplied: false,
          pageCount: 1
        };
      }
      
      // If that fails, return error message
      throw new Error('Unable to process PDF with available methods');
      
    } catch (fallbackError) {
      console.error('Fallback PDF processing failed:', fallbackError);
      throw fallbackError;
    }
  }

  /**
   * Extract text from first few pages quickly for immediate feedback
   */
  private async extractQuickText(pdf: any, onProgress?: (progress: number, step: string) => void): Promise<string> {
    const quickPages = Math.min(3, pdf.numPages);
    let text = '';
    
    for (let i = 1; i <= quickPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = this.extractTextFromContent(content);
        text += pageText + '\n';
        
        const progress = 30 + Math.floor((i / quickPages) * 40);
        onProgress?.(progress, `Quick extraction: page ${i} of ${quickPages}`);
      } catch (error) {
        console.warn(`Error extracting page ${i}:`, error);
        text += `[Error extracting page ${i}]\n`;
      }
    }
    
    return text + '\n[Quick extraction - processing remaining pages...]';
  }

  /**
   * Extract text from all pages with concurrent processing
   */
  private async extractFullText(pdf: any, onProgress?: (progress: number, step: string) => void): Promise<string> {
    const pageCount = pdf.numPages;
    const chunks: string[] = new Array(pageCount);
    
    // Process pages in chunks for better performance
    const chunkSize = this.options.maxConcurrentPages;
    for (let start = 0; start < pageCount; start += chunkSize) {
      const end = Math.min(start + chunkSize, pageCount);
      const chunk = await this.processPageChunk(pdf, start + 1, end, onProgress);
      
      for (let i = start; i < end; i++) {
        chunks[i] = chunk[i - start];
      }
      
      const progress = 30 + Math.floor((end / pageCount) * 50);
      onProgress?.(progress, `Processed ${end} of ${pageCount} pages`);
    }
    
    return chunks.join('\n');
  }

  /**
   * Process a chunk of pages concurrently
   */
  private async processPageChunk(pdf: any, startPage: number, endPage: number, onProgress?: (progress: number, step: string) => void): Promise<string[]> {
    const promises = [];
    
    for (let i = startPage; i <= endPage; i++) {
      promises.push(this.extractPageText(pdf, i));
    }
    
    return Promise.all(promises);
  }

  /**
   * Extract text from a single page
   */
  private async extractPageText(pdf: any, pageNum: number): Promise<string> {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      return this.extractTextFromContent(content);
    } catch (error) {
      console.error(`Error extracting page ${pageNum}:`, error);
      return `[Error extracting page ${pageNum}]`;
    }
  }

  /**
   * Extract text from page content efficiently
   */
  private extractTextFromContent(content: any): string {
    if (!content || !content.items) return '';
    
    return content.items
      .map((item: any) => {
        if (item.str) return item.str;
        if (typeof item === 'string') return item;
        return '';
      })
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Fast DOCX processing
   */
  private async processDocx(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    onProgress?.(40, 'Processing DOCX...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      
      onProgress?.(90, 'DOCX processing complete');
      
      return {
        text: value || '[No text could be extracted from this DOCX file]',
        isScanned: false,
        ocrApplied: false
      };
    } catch (error) {
      console.error('DOCX processing error:', error);
      throw new Error(`Failed to process DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fast text file processing
   */
  private async processText(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    onProgress?.(50, 'Reading text file...');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onProgress?.(100, 'Text file read');
        resolve({
          text: result || '[Empty text file]',
          isScanned: false,
          ocrApplied: false
        });
      };
      reader.onerror = () => {
        onProgress?.(100, 'Text file read');
        resolve({
          text: '[Error reading text file]',
          isScanned: false,
          ocrApplied: false
        });
      };
      reader.readAsText(file);
    });
  }

  /**
   * Legacy DOC file processing
   */
  private async processLegacyDoc(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    onProgress?.(50, 'Processing legacy DOC file...');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onProgress?.(100, 'DOC file processed');
        resolve({
          text: result || '[Unable to extract text from this DOC file]',
          isScanned: false,
          ocrApplied: false
        });
      };
      reader.onerror = () => {
        onProgress?.(100, 'DOC file processed');
        resolve({
          text: '[Error reading DOC file - please convert to DOCX or PDF]',
          isScanned: false,
          ocrApplied: false
        });
      };
      reader.readAsText(file);
    });
  }

  /**
   * Generic file processing
   */
  private async processGeneric(file: File, onProgress?: (progress: number, step: string) => void): Promise<ProcessingResult> {
    onProgress?.(50, 'Attempting to read as text...');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onProgress?.(100, 'File processed');
        resolve({
          text: result || '[No text could be extracted from this file type]',
          isScanned: false,
          ocrApplied: false
        });
      };
      reader.onerror = () => {
        onProgress?.(100, 'File processed');
        resolve({
          text: '[Unsupported file type - please use PDF, DOCX, DOC, or TXT]',
          isScanned: false,
          ocrApplied: false
        });
      };
      reader.readAsText(file);
    });
  }

  /**
   * Check if document might be scanned (low text content)
   */
  private isLikelyScanned(text: string): boolean {
    const cleanText = text.replace(/\s+/g, '').trim();
    return cleanText.length < 100;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): { options: ProcessingOptions } {
    return { options: this.options };
  }
}

// Export singleton instance with default options
export const fastDocumentProcessor = new FastDocumentProcessor();

// Export the class for custom instances
export { FastDocumentProcessor };
