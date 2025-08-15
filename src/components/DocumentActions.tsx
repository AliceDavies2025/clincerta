'use client';

import { useState } from 'react';

type AnalysisResult = {
  clonability?: {
    originality_score: number;
    details: string;
    similarity: number;
    most_similar_document?: string;
  };
  integrity?: {
    integrity_score: number;
    feedback: string;
    missing_elements: string[];
    entities: any[];
    key_phrases: string[];
    category_coverage: Record<string, number>;
  };
  goldenThread?: {
    golden_thread_compliance: string;
    compliance_score: number;
    feedback: string;
    actions_found: string[];
    interventions_found: string[];
    sections_covered: string[];
    missing_connections: string[];
    section_coverage: Record<string, boolean>;
  };
  audit?: {
    audit_score: number;
    feedback: string[];
    suggestions: string[];
    training_recommendations: string[];
  };
};

export const DocumentActions = ({
  documentText,
  documentName,
  documentId,
}: {
  documentText: string;
  documentName: string;
  documentId?: number;
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult>({});
  const [activeTab, setActiveTab] = useState<string>('');

  const handleAnalysis = async (analysisType: string) => {
    if (!documentText || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setCurrentAction(`Analyzing ${analysisType}...`);
    
    try {
      let endpoint = '';
      
      switch (analysisType) {
        case 'clonability':
          endpoint = '/api/clonability';
          break;
        case 'integrity':
          endpoint = '/api/integrity';
          break;
        case 'goldenThread':
          endpoint = '/api/golden-thread';
          break;
        case 'audit':
          endpoint = '/api/audit';
          break;
        case 'all':
          // Handle the comprehensive analysis
          const [clonability, integrity, goldenThread, audit] = await Promise.all([
            fetch('/api/clonability', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: documentText }),
            }).then(res => res.json()),
            fetch('/api/integrity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: documentText }),
            }).then(res => res.json()),
            fetch('/api/golden-thread', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: documentText }),
            }).then(res => res.json()),
            fetch('/api/audit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                text: documentText, 
                documentId: documentId 
              }),
            }).then(res => res.json()),
          ]);
          
          setAnalysisResults({
            clonability,
            integrity,
            goldenThread,
            audit
          });
          
          setActiveTab('all');
          setIsAnalyzing(false);
          setCurrentAction('');
          return;
      }
      
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: documentText,
            ...(analysisType === 'audit' && documentId ? { documentId } : {})
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error analyzing ${analysisType}`);
        }
        
        const result = await response.json();
        setAnalysisResults(prev => ({ ...prev, [analysisType]: result }));
        setActiveTab(analysisType);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setCurrentAction('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Document Analysis Tools</h2>
      
      {documentText ? (
        <>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="font-medium">Current document: {documentName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {documentText.length.toLocaleString()} characters • {documentText.split(/\s+/).length.toLocaleString()} words
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <button
              onClick={() => handleAnalysis('clonability')}
              disabled={isAnalyzing}
              className="px-4 py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg text-green-800 dark:text-green-300 font-medium transition-colors disabled:opacity-50"
            >
              Originality Check
            </button>
            <button
              onClick={() => handleAnalysis('integrity')}
              disabled={isAnalyzing}
              className="px-4 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg text-blue-800 dark:text-blue-300 font-medium transition-colors disabled:opacity-50"
            >
              Clinical Integrity
            </button>
            <button
              onClick={() => handleAnalysis('goldenThread')}
              disabled={isAnalyzing}
              className="px-4 py-3 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-lg text-purple-800 dark:text-purple-300 font-medium transition-colors disabled:opacity-50"
            >
              Golden Thread
            </button>
            <button
              onClick={() => handleAnalysis('all')}
              disabled={isAnalyzing}
              className="px-4 py-3 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg text-indigo-800 dark:text-indigo-300 font-medium transition-colors disabled:opacity-50"
            >
              Full Analysis
            </button>
          </div>
          
          {isAnalyzing && (
            <div className="mb-6">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>{currentAction}</p>
              </div>
            </div>
          )}
          
          {/* Tabs for different analysis results */}
          {Object.keys(analysisResults).length > 0 && (
            <div>
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-4 overflow-x-auto pb-2">
                  {Object.keys(analysisResults).map(type => (
                    <button
                      key={type}
                      className={`py-2 px-4 text-sm font-medium ${
                        activeTab === type || (activeTab === 'all' && type !== 'all')
                          ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      onClick={() => setActiveTab(type)}
                    >
                      {type === 'clonability' ? 'Originality' : 
                       type === 'integrity' ? 'Clinical Integrity' :
                       type === 'goldenThread' ? 'Golden Thread' : 
                       type === 'audit' ? 'Audit Results' : 'All Results'}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="mt-6">
                {/* Clonability Results */}
                {(activeTab === 'clonability' || activeTab === 'all') && analysisResults.clonability && (
                  <div className={`space-y-4 ${activeTab !== 'clonability' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Originality Analysis</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="text-2xl font-bold">
                          {analysisResults.clonability.originality_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Originality Score</div>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              analysisResults.clonability.originality_score > 75 
                                ? 'bg-green-500' 
                                : analysisResults.clonability.originality_score > 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${analysisResults.clonability.originality_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p>{analysisResults.clonability.details}</p>
                    {analysisResults.clonability.similarity > 0.5 && analysisResults.clonability.most_similar_document && (
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                        <p className="text-sm font-medium">
                          High similarity detected with: {analysisResults.clonability.most_similar_document}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Integrity Results */}
                {(activeTab === 'integrity' || activeTab === 'all') && analysisResults.integrity && (
                  <div className={`space-y-4 ${activeTab !== 'integrity' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Clinical Integrity Analysis</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="text-2xl font-bold">
                          {analysisResults.integrity.integrity_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Integrity Score</div>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              analysisResults.integrity.integrity_score > 75 
                                ? 'bg-green-500' 
                                : analysisResults.integrity.integrity_score > 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${analysisResults.integrity.integrity_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <p>{analysisResults.integrity.feedback}</p>
                    
                    {analysisResults.integrity.missing_elements.length > 0 && (
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                        <p className="text-sm font-medium">Missing elements:</p>
                        <ul className="list-disc ml-5 text-sm">
                          {analysisResults.integrity.missing_elements.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Optional: Show categories coverage */}
                    {analysisResults.integrity.category_coverage && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Category Coverage</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(analysisResults.integrity.category_coverage).map(([category, score]) => (
                            <div key={category} className="flex items-center">
                              <div className="w-32">{category}</div>
                              <div className="flex-1 ml-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${score > 75 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="w-8 text-right text-xs">{score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Golden Thread Results */}
                {(activeTab === 'goldenThread' || activeTab === 'all') && analysisResults.goldenThread && (
                  <div className={`space-y-4 ${activeTab !== 'goldenThread' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Golden Thread Analysis</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="text-2xl font-bold">
                          {analysisResults.goldenThread.compliance_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Compliance: {analysisResults.goldenThread.golden_thread_compliance}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              analysisResults.goldenThread.compliance_score > 75 
                                ? 'bg-green-500' 
                                : analysisResults.goldenThread.compliance_score > 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${analysisResults.goldenThread.compliance_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <p>{analysisResults.goldenThread.feedback}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Sections Covered</h4>
                        <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                          <ul className="list-disc ml-5 text-sm">
                            {analysisResults.goldenThread.sections_covered.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {analysisResults.goldenThread.missing_connections.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Missing Connections</h4>
                          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                            <ul className="list-disc ml-5 text-sm">
                              {analysisResults.goldenThread.missing_connections.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Audit Results */}
                {(activeTab === 'audit' || activeTab === 'all') && analysisResults.audit && (
                  <div className={`space-y-4 ${activeTab !== 'audit' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Clinical Audit Results</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="text-2xl font-bold">
                          {analysisResults.audit.audit_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Audit Score</div>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              analysisResults.audit.audit_score > 75 
                                ? 'bg-green-500' 
                                : analysisResults.audit.audit_score > 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${analysisResults.audit.audit_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Feedback</h4>
                      {analysisResults.audit.feedback.map((item, idx) => (
                        <p key={idx} className="text-sm mb-1">{item}</p>
                      ))}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Improvement Suggestions</h4>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <ul className="list-disc ml-5 text-sm">
                          {analysisResults.audit.suggestions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Training Recommendations</h4>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
                        <ul className="list-disc ml-5 text-sm">
                          {analysisResults.audit.training_recommendations.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-6">
          <p className="text-gray-500 dark:text-gray-400">
            Upload a document to access analysis tools
          </p>
        </div>
      )}
    </div>
  );
};
