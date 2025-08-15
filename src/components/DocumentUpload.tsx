'use client';

// NOTE: This component requires <SupabaseProvider> to be present higher up in the React tree.
// Example:
// <SupabaseProvider>
//   <DocumentUpload />
// </SupabaseProvider>

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import type { Database } from '@/lib/database.types';
import { createWorker } from 'tesseract.js';
import { documentCache } from '@/lib/document-cache';
import { fastDocumentProcessor } from '@/lib/fast-document-processor';
import { ProcessingMetrics } from './ProcessingMetrics';

export const DocumentUpload = ({
  demoMode = false,
  onDocumentUploaded,
  onTextExtracted,
}: {
  demoMode?: boolean;
  onDocumentUploaded?: () => void;
  onTextExtracted?: (text: string, fileName: string, documentId?: string) => void;
}) => {
  const { supabase, session, isGuest } = useSupabase();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isScannedPdf, setIsScannedPdf] = useState<boolean>(false);
  const [useOcr, setUseOcr] = useState<boolean>(false);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<{ totalDocuments: number; totalSize: number } | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);

  // Load cache statistics on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCacheStats(documentCache.getCacheStats());
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessingStep('');
      setProcessingProgress(0);
      setIsScannedPdf(false);
      setUseOcr(false);
      setUploadedDocId(null);
      setProcessingTime(0);

      // Check if file is already cached for instant feedback
      if (documentCache.isCached(selectedFile)) {
        setProcessingStep('Document found in cache - ready for instant processing!');
        setProcessingProgress(100);
      }
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setIsUploading(true);
    const startTime = performance.now();

    try {
      let fileText = '';
      let uploadedDocId: string | null = null;
      let publicUrl: string = '';
      
      // Check cache first for instant processing
      const cachedText = documentCache.getCachedText(file);
      if (cachedText) {
        setProcessingStep('Loading from cache...');
        setProcessingProgress(90);
        
        // Use cached text immediately
        fileText = cachedText;
        setProcessingProgress(100);
        setProcessingStep('Document loaded from cache successfully');
        
        // Update cache stats
        setCacheStats(documentCache.getCacheStats());
        
        // Pass the cached text to parent component
        if (onTextExtracted) {
          onTextExtracted(fileText, file.name, undefined);
        }
        
        // Notify parent to refresh history
        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
        
        setIsUploading(false);
        return;
      }
      
      // Process new document with fast processor
      setProcessingStep('Analyzing document...');
      setProcessingProgress(10);
      
      // Use fast document processor for instant extraction
      const result = await fastDocumentProcessor.processDocument(
        file,
        (progress, step) => {
          setProcessingProgress(progress);
          setProcessingStep(step);
        }
      );
      
      fileText = result.text;
      setIsScannedPdf(result.isScanned);
      setProcessingTime(result.processingTime);
      setPageCount(result.pageCount || 0);
      
      // Check if there was an error in processing
      if (result.error) {
        console.error('Document processing error:', result.error);
        setProcessingStep(`Processing completed with warnings: ${result.error}`);
      }
      
      // Handle scanned PDFs with OCR if needed
      if (result.isScanned && file.type === 'application/pdf') {
        setProcessingStep('Detected scanned PDF, applying OCR...');
        setProcessingProgress(85);
        
        try {
          const ocrText = await extractTextFromScannedPdf(file);
          fileText = ocrText;
          setUseOcr(true);
          setProcessingProgress(95);
        } catch (ocrError) {
          console.warn('OCR failed, using extracted text:', ocrError);
          // Continue with extracted text if OCR fails
          setProcessingStep('OCR failed, using extracted text');
        }
      }
      
      // Cache the extracted text for future use
      documentCache.cacheDocument(file, fileText, result.isScanned, useOcr);
      setCacheStats(documentCache.getCacheStats());
      
      setProcessingProgress(100);
      setProcessingStep('Document processed successfully');
      
      // Upload to storage if authenticated
      if (session?.user?.id) {
        try {
          // Upload file to Supabase storage
          const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
          const filePath = `${session.user.id}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('documents')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          // Get public URL for the file
          const { data: publicUrlData } = await supabase
            .storage
            .from('documents')
            .getPublicUrl(filePath);
          
          publicUrl = publicUrlData?.publicUrl || '';
          
          // Save to database with extracted text and metadata
          const { data: dbData, error: dbError } = await supabase
            .from('documents')
            .insert({
              user_id: session.user.id,
              title: file.name,
              file_type: file.type,
              file_url: publicUrl,
              file_size: file.size,
              analysis_results: {
                extracted_text: fileText,
                processing_time: result.processingTime,
                page_count: result.pageCount || 0,
                is_scanned: result.isScanned,
                ocr_applied: useOcr,
                processing_metadata: {
                  cache_hit: false,
                  errors: result.error ? [result.error] : []
                }
              },
              is_guest_upload: false
            })
            .select()
            .single();

          if (dbError) throw dbError;
          uploadedDocId = dbData?.id;
          setUploadedDocId(uploadedDocId);
        } catch (storageError) {
          console.warn('Storage/database upload failed:', storageError);
          // Continue with processing even if storage fails
        }
      } else {
        // For guest users, we'll store the analysis results in a different way
        // or handle it through the analysis APIs
        console.log('Guest user - document processed but not saved to database');
      }
      
      // Pass the extracted text to parent component
      if (onTextExtracted) {
        onTextExtracted(fileText, file.name, uploadedDocId || undefined);
      }
      
      // Notify parent to refresh history
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStep(`Error: ${error instanceof Error ? error.message : 'Failed to process document'}`);
      setProcessingProgress(0);
      
      // Show more detailed error information
      if (error instanceof Error) {
        if (error.message.includes('PDF')) {
          setProcessingStep('PDF processing failed. Please ensure the file is a valid PDF document.');
        } else if (error.message.includes('DOCX')) {
          setProcessingStep('DOCX processing failed. Please ensure the file is a valid DOCX document.');
        } else {
          setProcessingStep(`Processing failed: ${error.message}`);
        }
      }
    } finally {
      setIsUploading(false);
    }
  }, [file, session, onTextExtracted, onDocumentUploaded]);

  // OCR for scanned PDFs
  const extractTextFromScannedPdf = async (file: File): Promise<string> => {
    setUseOcr(true);
    try {
      // For browser-side OCR
      const worker = await createWorker('eng');
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = new Blob([uint8Array], { type: file.type });
      const imageUrl = URL.createObjectURL(blob);
      
      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();
      
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      return 'OCR FAILED: Unable to extract text from scanned document.';
    }
  };

  const clearCache = useCallback(() => {
    documentCache.clearCache();
    setCacheStats(documentCache.getCacheStats());
    setProcessingStep('Cache cleared successfully');
  }, []);

  const formatProcessingTime = (time: number): string => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-12">
      <h2 className="text-xl font-bold mb-4">
        {isGuest || demoMode ? "Guest Analysis" : "Document Upload"}
      </h2>
      
      {/* Cache Status */}
      {cacheStats && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Cache Status:</span> {cacheStats.totalDocuments} documents cached 
              ({Math.round(cacheStats.totalSize / 1024)}KB)
            </div>
            <button
              onClick={clearCache}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          title="Upload clinical document"
          placeholder="Choose a document to upload"
        />
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, DOCX, DOC, TXT. Scanned PDFs will be processed using OCR.
          {file && documentCache.isCached(file) && (
            <span className="text-green-600 font-medium"> ✓ Document found in cache - instant processing available!</span>
          )}
        </p>
      </div>
      
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isUploading ? "Processing..." : file && documentCache.isCached(file) ? "Process from Cache" : "Upload & Process"}
      </button>

      {/* Processing Metrics */}
      {(isUploading || processingTime > 0) && (
        <ProcessingMetrics
          isProcessing={isUploading}
          processingTime={processingTime}
          fileSize={file?.size}
          pageCount={pageCount}
          isCached={file ? documentCache.isCached(file) : false}
        />
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">{processingStep}</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          {processingTime > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Processing time: {formatProcessingTime(processingTime)}
            </div>
          )}
        </div>
      )}

      {processingStep === 'Document processed successfully' && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-300">
            Document successfully processed and cached in {formatProcessingTime(processingTime)}! 
            You can now analyze the document using the tools below.
          </p>
        </div>
      )}

      {processingStep === 'Document loaded from cache successfully' && (
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Document loaded instantly from cache! Ready for analysis.
          </p>
        </div>
      )}

      {isGuest && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
          <p className="text-sm">
            You're analyzing as a guest. Sign up to save your results and access your history.
          </p>
        </div>
      )}
    </div>
  );
};