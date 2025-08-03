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
import { fromPath as convertPdfToImage } from 'pdf2pic';
import * as docx from 'docx';

// Set pdfjs workerSrc (required for browser usage)
if (typeof window !== 'undefined' && GlobalWorkerOptions) {
  // Use the installed version from pdfjs-dist
  const pdfJsVersion = '5.4.54'; // Match the version in package.json
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
}

export const DocumentUpload = ({
  demoMode = false,
  onDocumentUploaded,
}: {
  demoMode?: boolean;
  onDocumentUploaded?: () => void;
}) => {
  const { supabase, session, isGuest } = useSupabase();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isScannedPdf, setIsScannedPdf] = useState<boolean>(false);
  const [useOcr, setUseOcr] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setAnalysisResults(null);
      setProcessingStep('');
      setProcessingProgress(0);
      setIsScannedPdf(false);
      setUseOcr(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      let fileText = '';
      let uploadedDocId: number | null = null;
      let publicUrl: string = ''; // Add variable to store public URL
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      if (demoMode || isGuest) {
        // Client-side processing for demo/guest mode
        setProcessingStep('Extracting text from document...');
        setProcessingProgress(10);
        
        fileText = await extractTextFromFile(file);
        
        // If text extraction yields very little text from a PDF, it might be scanned
        if (file.type === 'application/pdf' && fileText.trim().length < 100) {
          setIsScannedPdf(true);
          setProcessingStep('Detected scanned PDF, using OCR...');
          setProcessingProgress(30);
          
          if (typeof window !== 'undefined') {
            // Only run OCR if in browser environment
            fileText = await extractTextFromScannedPdf(file);
            setUseOcr(true);
          }
        }
        setProcessingProgress(50);
      } 
      else {
        // Server-side processing for authenticated users
        setProcessingStep('Processing document with advanced tools...');
        setProcessingProgress(20);
        
        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Server failed to process document');
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        fileText = result.text;
        uploadedDocId = result.documentId;
        publicUrl = result.publicUrl || ''; // Get publicUrl from result
        
        // Update state based on processing results
        setIsScannedPdf(result.metadata?.isScanned || false);
        setUseOcr(result.metadata?.ocrApplied || false);
        
        // Notify parent to refresh document history
        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
        
        setProcessingProgress(50);
      }

      setProcessingStep('Saving document metadata...');
      setProcessingProgress(60);
      
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

      // Notify parent to refresh history
      if (onDocumentUploaded) onDocumentUploaded();

      setProcessingStep('Analyzing document content...');
      setProcessingProgress(70);
      
      // Call backend APIs for analysis
      const [clonability, integrity, goldenThread, audit] = await Promise.all([
        fetch('/api/clonability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fileText }),
        }).then(res => res.json()),
        fetch('/api/integrity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fileText }),
        }).then(res => res.json()),
        fetch('/api/golden-thread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fileText }),
        }).then(res => res.json()),
        fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fileText, documentId: uploadedDocId }),
        }).then(res => res.json()),
      ]);

      setProcessingProgress(100);
      setProcessingStep('Analysis complete');
      
      setAnalysisResults({
        clonability,
        integrity,
        goldenThread,
        audit,
        textLength: fileText.length,
        isScannedDocument: isScannedPdf,
        ocrApplied: useOcr,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStep('Error processing document');
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
    if (ext === 'pdf') {
      // PDF extraction using pdfjs
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setProcessingProgress(10 + Math.floor((i / pdf.numPages) * 30));
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    } else if (ext === 'docx') {
      // DOCX extraction using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      return value;
    } else if (ext === 'doc') {
      // Plain text
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } else if (ext === 'txt') {
      // Plain text
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } else {
      // Fallback: try plain text
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-12">
      <h2 className="text-xl font-bold mb-4">
        {isGuest || demoMode ? "Guest Analysis" : "Document Analysis"}
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
        {isUploading ? "Uploading & Analyzing..." : "Upload & Review"}
      </button>

      {isUploading && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">{processingStep}</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className={`bg-blue-600 h-2.5 rounded-full w-[${processingProgress}%]`}
            ></div>
          </div>
        </div>
      )}

      {isGuest && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
          <p className="text-sm">
            You're analyzing as a guest. Sign up to save your results and access your history.
          </p>
        </div>
      )}

      {analysisResults && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Audit Results</h3>
          
          {/* Document info */}
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-md">
            <h4 className="text-sm font-medium mb-1">Document Information</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Text length: {analysisResults.textLength} characters
              {analysisResults.isScannedDocument && " (Scanned document detected)"}
              {analysisResults.ocrApplied && " (OCR applied)"}
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Clonability */}
            <div>
              <span className="font-medium">Originality Score:</span> {analysisResults.clonability.originality_score}%
              <div className="text-xs text-gray-500">{analysisResults.clonability.details}</div>
              {analysisResults.clonability.similarity > 0.5 && (
                <div className="text-xs text-red-500">Most similar document: {analysisResults.clonability.most_similar_document}</div>
              )}
            </div>
            {/* Integrity */}
            <div>
              <span className="font-medium">Clinical Integrity Score:</span> {analysisResults.integrity.integrity_score}%
              <div className="text-xs text-gray-500">{analysisResults.integrity.feedback}</div>
              {analysisResults.integrity.missing_elements.length > 0 && (
                <div className="text-xs text-yellow-500">Missing: {analysisResults.integrity.missing_elements.join(", ")}</div>
              )}
            </div>
            {/* Golden Thread */}
            <div>
              <span className="font-medium">Golden Thread Compliance:</span> {analysisResults.goldenThread.golden_thread_compliance}
              <div className="text-xs text-gray-500">{analysisResults.goldenThread.feedback}</div>
              <div className="text-xs text-blue-500">
                Actions found: {analysisResults.goldenThread.actions_found.join(", ")}<br />
                Interventions found: {analysisResults.goldenThread.interventions_found.join(", ")}
              </div>
            </div>
            {/* Audit */}
            <div>
              <span className="font-medium">Audit Score:</span> {analysisResults.audit.audit_score}%
              <div className="text-xs text-gray-500">{analysisResults.audit.feedback.join(" ")}</div>
            </div>
            <div>
              <span className="font-medium">Improvement Suggestions:</span>
              <ul className="list-disc ml-6 text-sm">
                {analysisResults.audit.suggestions.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium">Training Recommendations:</span>
              <ul className="list-disc ml-6 text-sm">
                {analysisResults.audit.training_recommendations.map((t: string, idx: number) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}