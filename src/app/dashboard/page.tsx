'use client';

// Ensure the file exists at src/lib/supabase-provider.tsx or .ts
import SupabaseProvider from "../../lib/supabase-provider";
import { DocumentHistory } from "@/components/DocumentHistory";
import { useSupabase } from "@/lib/supabase-provider";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useState, useRef } from "react";
import { DocumentActions } from "@/components/DocumentActions";

export default function Dashboard() {
  return (
    <SupabaseProvider>
      <DashboardContent />
    </SupabaseProvider>
  );
}

function DashboardContent() {
  const { session } = useSupabase();
  const historyRef = useRef<any>(null);
  const [currentDocument, setCurrentDocument] = useState<{
    text: string;
    fileName: string;
    documentId?: number;
  } | null>(null);

  const handleTextExtracted = (text: string, fileName: string, documentId?: number) => {
    // Just store the document data for later use by action buttons
    setCurrentDocument({
      text,
      fileName,
      documentId
    });
    
    // Log successful processing
    console.log(`Document "${fileName}" processed. ${text.length} characters extracted.`);
    
    // We don't automatically run any analysis - user will use action buttons
  };

  const handleDocumentUploaded = () => {
    // Refresh document history if we have that functionality
    if (historyRef.current && historyRef.current.refresh) {
      historyRef.current.refresh();
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              Welcome back{session?.user?.email ? `, ${session.user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your documents and analyze clinical compliance
            </p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Upload and Actions */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upload Component */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Upload Documents</h2>
                <DocumentUpload
                  demoMode={false}
                  onDocumentUploaded={handleDocumentUploaded}
                  onTextExtracted={handleTextExtracted}
                />
              </div>
              
              {/* Document Actions Component - Only show when document is loaded */}
              {currentDocument && (
                <DocumentActions
                  documentText={currentDocument.text}
                  documentName={currentDocument.fileName}
                  documentId={currentDocument.documentId}
                />
              )}
              
              {/* Placeholder when no document is loaded */}
              {!currentDocument && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 text-center">
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    Upload a document to access analysis tools
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Clinical document analysis tools will appear here after uploading a document
                  </p>
                </div>
              )}
            </div>
            
            {/* Right Column - History */}
            <div className="lg:col-span-1">
              {session && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 h-full">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
                  <DocumentHistory 
                    ref={historyRef}
                  />
                </div>
              )}
              
              {!session && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Sign In Required</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please sign in to view your document history and save analysis results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}