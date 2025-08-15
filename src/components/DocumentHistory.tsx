'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import type { Database } from '@/lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type AuditHistory = Database['public']['Tables']['audit_history']['Row'];

interface DocumentWithAudit extends Document {
  audit_history?: AuditHistory[];
}

export const DocumentHistory = forwardRef(function DocumentHistory(_, ref) {
  const { supabase, session } = useSupabase();
  const [documents, setDocuments] = useState<DocumentWithAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithAudit | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchDocuments = async () => {
    if (!session) return;
    setIsLoading(true);
    
    try {
      // Fetch documents with their audit history
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select(`
          *,
          audit_history (
            id,
            created_at,
            originality_score,
            integrity_score,
            compliance_score,
            issues,
            suggestions,
            training_recommendations
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
      } else {
        setDocuments(docsData || []);
      }
    } catch (error) {
      console.error('Error fetching document history:', error);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, supabase]);

  useImperativeHandle(ref, () => ({
    refresh: fetchDocuments,
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleReloadDocument = (document: DocumentWithAudit) => {
    // This would trigger the parent component to reload the document
    // For now, we'll just show a message
    alert(`Reloading document: ${document.title}`);
    // TODO: Implement document reload functionality
  };

  const handleViewDetails = (document: DocumentWithAudit) => {
    setSelectedDocument(document);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Document History ({documents.length})
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No documents analyzed yet</p>
            <p className="text-gray-400 text-xs mt-1">Upload a document to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const latestAudit = doc.audit_history?.[0];
              const hasAnalysis = doc.analysis_results && Object.keys(doc.analysis_results).length > 0;
              
              return (
                <div 
                  key={doc.id} 
                  className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Document Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(doc)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleReloadDocument(doc)}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Reload
                      </button>
                    </div>
                  </div>

                  {/* Analysis Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        hasAnalysis 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {hasAnalysis ? 'Analyzed' : 'Uploaded'}
                      </span>
                      {doc.file_size && (
                        <span className="text-xs text-gray-500">
                          {(doc.file_size / 1024).toFixed(1)}KB
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {doc.file_type?.split('/')[1] || 'Unknown'}
                    </span>
                  </div>

                  {/* Latest Audit Scores */}
                  {latestAudit && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className={`font-semibold ${getScoreColor(latestAudit.originality_score)}`}>
                          {latestAudit.originality_score || 'N/A'}%
                        </div>
                        <div className="text-gray-500">Originality</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${getScoreColor(latestAudit.integrity_score)}`}>
                          {latestAudit.integrity_score || 'N/A'}%
                        </div>
                        <div className="text-gray-500">Integrity</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${getScoreColor(latestAudit.compliance_score)}`}>
                          {latestAudit.compliance_score || 'N/A'}%
                        </div>
                        <div className="text-gray-500">Compliance</div>
                      </div>
                    </div>
                  )}

                  {/* Quick Issues Preview */}
                  {latestAudit?.issues && latestAudit.issues.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Issues found: {latestAudit.issues.length}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 truncate">
                        {latestAudit.issues[0]}
                        {latestAudit.issues.length > 1 && ` +${latestAudit.issues.length - 1} more`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Details Modal */}
      {showDetails && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Document Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Document Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedDocument.title}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Uploaded:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {formatDate(selectedDocument.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">File Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">
                      {selectedDocument.file_type?.split('/')[1] || 'Unknown'}
                    </span>
                  </div>
                  {selectedDocument.file_size && (
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {(selectedDocument.file_size / 1024).toFixed(1)}KB
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Analyses:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {selectedDocument.audit_history?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis History */}
              {selectedDocument.audit_history && selectedDocument.audit_history.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Analysis History</h4>
                  {selectedDocument.audit_history.map((audit, index) => (
                    <div key={audit.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm text-gray-500">
                          Analysis #{selectedDocument.audit_history!.length - index}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(audit.created_at)}
                        </span>
                      </div>
                      
                      {/* Scores */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(audit.originality_score)}`}>
                            {audit.originality_score || 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-500">Originality</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(audit.integrity_score)}`}>
                            {audit.integrity_score || 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-500">Integrity</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(audit.compliance_score)}`}>
                            {audit.compliance_score || 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-500">Compliance</div>
                        </div>
                      </div>

                      {/* Issues */}
                      {audit.issues && audit.issues.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Issues Found</h5>
                          <ul className="space-y-1">
                            {audit.issues.map((issue, idx) => (
                              <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start">
                                <span className="text-red-500 mr-2">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {audit.suggestions && audit.suggestions.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Suggestions</h5>
                          <ul className="space-y-1">
                            {audit.suggestions.slice(0, 3).map((suggestion, idx) => (
                              <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                            {audit.suggestions.length > 3 && (
                              <li className="text-xs text-gray-500">
                                +{audit.suggestions.length - 3} more suggestions
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Training Recommendations */}
                      {audit.training_recommendations && audit.training_recommendations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                            Training Resources ({audit.training_recommendations.length})
                          </h5>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {audit.training_recommendations.length} training resources recommended
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => handleReloadDocument(selectedDocument)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Reload for Analysis
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});