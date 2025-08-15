'use client';

// NOTE: This component requires <SupabaseProvider> to be present higher up in the React tree.
// Example:
// <SupabaseProvider>
//   <DocumentUpload />
// </SupabaseProvider>

import { useState } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import type { Database } from '@/lib/database.types';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// Fix the PDF.js worker loading issue without using a CDN
if (typeof window !== 'undefined' && GlobalWorkerOptions) {
  // Try multiple approaches to load the worker
  try {
    // First try the local worker file
    GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;
  } catch (error) {
    console.warn('Failed to set local worker, falling back to fake worker mode');
    // If that fails, PDF.js will use fake worker mode
    GlobalWorkerOptions.workerSrc = '';
  }
}

export const DocumentUpload = ({
  demoMode = false,
  onDocumentUploaded,
  onTextExtracted,
}: {
  demoMode?: boolean;
  onDocumentUploaded?: () => void;
  onTextExtracted?: (text: string, fileName: string, documentId?: number) => void;
}) => {
  const { supabase, session, isGuest } = useSupabase();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isScannedPdf, setIsScannedPdf] = useState<boolean>(false);
  const [useOcr, setUseOcr] = useState<boolean>(false);
  const [uploadedDocId, setUploadedDocId] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setProcessingStep('');
      setProcessingProgress(0);
      setIsScannedPdf(false);
      setUseOcr(false);
      setUploadedDocId(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      let fileText = '';
      let uploadedDocId: number | null = null;
      let publicUrl: string = '';
      
      // Skip server processing and do everything client side
      setProcessingStep('Extracting text from document...');
      setProcessingProgress(10);
      
      // Extract text on the client side
      fileText = await extractTextFromFile(file);
      
      if (file.type === 'application/pdf' && fileText.trim().length < 100) {
        setIsScannedPdf(true);
        setProcessingStep('Detected scanned PDF, using OCR...');
        setProcessingProgress(30);
        
        if (typeof window !== 'undefined') {
          fileText = await extractTextFromScannedPdf(file);
          setUseOcr(true);
        }
      }
      
      setProcessingProgress(60);
      
      // Upload to storage if authenticated
      if (session?.user?.id) {
        setProcessingStep('Uploading to storage...');
        
        try {
          // Upload file to Supabase storage directly from client
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
        } catch (storageError) {
          console.warn('Storage upload failed:', storageError);
          // Continue with processing even if storage fails
        }
        
        setProcessingStep('Saving document metadata...');
        
        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: session.user.id,
            title: file.name,
            file_type: file.type,
            file_url: publicUrl,
            text_content: fileText.substring(0, 10000), // Store first 10K chars for quick search
            is_scanned_document: isScannedPdf,
            ocr_applied: useOcr,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        uploadedDocId = dbData?.id;
        setUploadedDocId(uploadedDocId);
      }
      
      setProcessingProgress(100);
      setProcessingStep('Document processed successfully');
      
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
    } finally {
      setIsUploading(false);
    }
  };

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

  // Extract text from uploaded file
  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (ext === 'pdf') {
        console.log('Extracting text from PDF...');
        setProcessingStep('Processing PDF pages...');
        
        // PDF extraction using pdfjs with better error handling
        const arrayBuffer = await file.arrayBuffer();
        console.log('PDF arrayBuffer size:', arrayBuffer.byteLength);
        
        const pdf = await getDocument({ 
          data: arrayBuffer,
          verbosity: 0 // Reduce console output
        }).promise;
        
        console.log('PDF loaded, pages:', pdf.numPages);
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            setProcessingProgress(10 + Math.floor((i / pdf.numPages) * 30));
            setProcessingStep(`Processing page ${i} of ${pdf.numPages}...`);
            
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => {
                // Handle different item types
                if (item.str) {
                  return item.str;
                } else if (typeof item === 'string') {
                  return item;
                } else {
                  return '';
                }
              })
              .join(' ');
            
            text += pageText + '\n';
            console.log(`Page ${i} extracted, length:`, pageText.length);
          } catch (pageError) {
            console.error(`Error extracting page ${i}:`, pageError);
            text += `[Error extracting page ${i}]\n`;
          }
        }
        
        console.log('Total extracted text length:', text.length);
        return text.trim() || '[No text could be extracted from this PDF]';
        
      } else if (ext === 'docx') {
        console.log('Extracting text from DOCX...');
        setProcessingStep('Processing DOCX document...');
        
        // DOCX extraction using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        console.log('DOCX extracted text length:', value.length);
        return value || '[No text could be extracted from this DOCX file]';
        
      } else if (ext === 'doc') {
        console.log('Processing DOC file...');
        setProcessingStep('Processing DOC document...');
        
        // For .doc files, try reading as text (limited support)
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log('DOC file read as text, length:', result.length);
            resolve(result || '[Unable to extract text from this DOC file]');
          };
          reader.onerror = () => {
            console.error('Error reading DOC file');
            resolve('[Error reading DOC file - please convert to DOCX or PDF]');
          };
          reader.readAsText(file);
        });
        
      } else if (ext === 'txt') {
        console.log('Reading TXT file...');
        setProcessingStep('Reading text file...');
        
        // Plain text file
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log('TXT file read, length:', result.length);
            resolve(result || '[Empty text file]');
          };
          reader.onerror = () => {
            console.error('Error reading TXT file');
            resolve('[Error reading text file]');
          };
          reader.readAsText(file);
        });
        
      } else {
        console.log('Unknown file type, trying to read as text...');
        setProcessingStep('Attempting to read as text...');
        
        // Fallback: try to read as plain text
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log('File read as text, length:', result.length);
            resolve(result || '[No text could be extracted from this file type]');
          };
          reader.onerror = () => {
            console.error('Error reading file as text');
            resolve('[Unsupported file type - please use PDF, DOCX, DOC, or TXT]');
          };
          reader.readAsText(file);
        });
      }
    } catch (error) {
      console.error('Error in text extraction:', error);
      return `[Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-12">
      <h2 className="text-xl font-bold mb-4">
        {isGuest || demoMode ? "Guest Analysis" : "Document Upload"}
      </h2>
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
        </p>
      </div>
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Upload Document"}
      </button>

      {isUploading && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">{processingStep}</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {processingStep === 'Document processed successfully' && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-300">
            Document successfully uploaded and text extracted. You can now analyze the document using the tools below.
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