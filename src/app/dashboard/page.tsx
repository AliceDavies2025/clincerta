'use client';

// Ensure the file exists at src/lib/supabase-provider.tsx or .ts
import SupabaseProvider from "../../lib/supabase-provider";
import { DocumentHistory } from "@/components/DocumentHistory";
import { useSupabase } from "@/lib/supabase-provider";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useState, useRef } from "react";

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
  const [latestResults, setLatestResults] = useState<any>(null);

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
              Manage your documents and view history
            </p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section - Takes 2/3 on larger screens */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Upload & Review Documents</h2>
              <DocumentUpload
                demoMode={false}
                onDocumentUploaded={() => {
                  if (historyRef.current && historyRef.current.refresh) {
                    historyRef.current.refresh();
                  }
                }}
              />
              {/* Optionally show latest audit results here if you wire up the callback */}
              {/* {latestResults && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-2">Latest Audit Results</h3>
                  // ...show results as in DocumentUpload...
                </div>
              )} */}
            </div>
            
            {/* History Section - Takes 1/3 on larger screens */}
            <div className="lg:col-span-1">
              {session && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 h-full">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
                  <DocumentHistory ref={historyRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}