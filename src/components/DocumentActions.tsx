'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import { saveAnalysisResults, updateDocumentAnalysisResults, type AnalysisResults } from '@/lib/audit-utils';

type AnalysisResult = {
  clonability?: {
    originality_score: number;
    risk_level: string;
    risk_description: string;
    overall_similarity: number;
    most_similar_document?: {
      id: number;
      title: string;
      content: string;
      category: string;
      similarity: number;
      breakdown: {
        jaccard: number;
        cosine: number;
        lcs: number;
        trigram: number;
      };
    };
    text_analysis: {
      sentenceCount: number;
      wordCount: number;
      uniqueWordCount: number;
      averageSentenceLength: number;
      vocabularyDiversity: number;
    };
    plagiarism_patterns: {
      exactPhrases: number;
      repeatedStructures: number;
      unusualFormatting: number;
    };
    all_similarities: Array<{
      documentId: number;
      title: string;
      category: string;
    similarity: number;
      breakdown: {
        jaccard: number;
        cosine: number;
        lcs: number;
        trigram: number;
      };
    }>;
    recommendations: string[];
  };
  integrity?: {
    integrity_score: number;
    feedback: string;
    missing_elements: string[];
    entities: any[];
    key_phrases: string[];
    category_coverage: Record<string, number>;
    recommendations: string[];
    detailed_analysis: {
      soap: {
        score: number;
        breakdown: any;
        missing: string[];
      };
      documentation: {
        score: number;
        breakdown: any;
        missing: string[];
      };
      safety: {
        score: number;
        breakdown: any;
        missing: string[];
      };
      quality: {
        score: number;
        breakdown: any;
        missing: string[];
      };
      complexity: {
        score: number;
        metrics: any;
      };
    };
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
    detailed_analysis: {
      section_coverage: {
        coverage: Record<string, { present: boolean; content: string[]; score: number }>;
        overallScore: number;
        missingSections: string[];
      };
      patient_care_actions: {
        actions: Record<string, { found: string[]; count: number; score: number }>;
        totalActions: number;
      };
      clinical_interventions: {
        interventions: Record<string, { found: string[]; count: number; score: number }>;
        totalInterventions: number;
      };
      golden_thread_connections: {
        connections: Array<{ from: string; to: string; type: string; present: boolean; strength: number }>;
        connectionScore: number;
        missingConnections: string[];
        strongConnections: string[];
      };
    };
  };
  audit?: {
    audit_score: number;
    feedback: string[];
    suggestions: string[];
    training_recommendations: Array<{
      category: string;
      area: string;
      performance: number;
      resources: Array<{
        name: string;
        type: string;
        duration: string;
        description: string;
        url: string;
        level: string;
      }>;
    }>;
    detailed_analysis: {
      categories: Record<string, {
        score: number;
        breakdown: Record<string, {
          name: string;
          score: number;
          maxScore: number;
          percentage: number;
        }>;
        feedback: string[];
      }>;
      total_score: number;
      max_possible_score: number;
    };
  };
};

export const DocumentActions = ({
  documentText,
  documentName,
  documentId,
}: {
  documentText: string;
  documentName: string;
  documentId?: string;
}) => {
  const { supabase, session, isGuest } = useSupabase();
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
          
          const allResults = {
            clonability,
            integrity,
            goldenThread,
            audit
          };
          
          setAnalysisResults(allResults);
          
          // Save analysis results to database if user is authenticated
          if (session?.user?.id) {
            try {
              await saveAnalysisResults(
                supabase,
                session.user.id,
                documentId || null,
                allResults as AnalysisResults,
                isGuest
              );
              
              // Update document with analysis results if documentId exists
              if (documentId) {
                await updateDocumentAnalysisResults(
                  supabase,
                  documentId,
                  allResults as AnalysisResults
                );
              }
            } catch (error) {
              console.error('Failed to save analysis results:', error);
              // Continue even if saving fails
            }
          }
          
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
        
        // Save individual analysis result to database if user is authenticated
        if (session?.user?.id) {
          try {
            const analysisData = { [analysisType]: result } as AnalysisResults;
            await saveAnalysisResults(
              supabase,
              session.user.id,
              documentId || null,
              analysisData,
              isGuest
            );
            
            // Update document with analysis results if documentId exists
            if (documentId) {
              await updateDocumentAnalysisResults(
                supabase,
                documentId,
                analysisData
              );
            }
          } catch (error) {
            console.error('Failed to save analysis results:', error);
            // Continue even if saving fails
          }
        }
        
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
                  <div className={`space-y-6 ${activeTab !== 'clonability' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Originality Analysis</h3>
                    
                    {/* Main Score and Risk Level */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResults.clonability.originality_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Originality Score</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          analysisResults.clonability.risk_level === 'high' ? 'text-red-600 dark:text-red-400' :
                          analysisResults.clonability.risk_level === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {analysisResults.clonability.risk_level.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Risk Level</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {Math.round(analysisResults.clonability.overall_similarity * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Similarity</div>
                      </div>
                    </div>
                    
                    {/* Risk Description */}
                    <div className={`p-4 rounded-lg ${
                      analysisResults.clonability.risk_level === 'high' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                      analysisResults.clonability.risk_level === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                      'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    }`}>
                      <p className="font-medium">{analysisResults.clonability.risk_description}</p>
                    </div>
                    
                    {/* Text Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium mb-3">Text Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sentences:</span>
                            <span className="font-mono">{analysisResults.clonability.text_analysis.sentenceCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Words:</span>
                            <span className="font-mono">{analysisResults.clonability.text_analysis.wordCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unique Words:</span>
                            <span className="font-mono">{analysisResults.clonability.text_analysis.uniqueWordCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg. Sentence Length:</span>
                            <span className="font-mono">{analysisResults.clonability.text_analysis.averageSentenceLength.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vocabulary Diversity:</span>
                            <span className="font-mono">{(analysisResults.clonability.text_analysis.vocabularyDiversity * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="font-medium mb-3">Plagiarism Patterns</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Exact Phrases:</span>
                            <span className="font-mono">{analysisResults.clonability.plagiarism_patterns.exactPhrases}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Repeated Structures:</span>
                            <span className="font-mono">{analysisResults.clonability.plagiarism_patterns.repeatedStructures}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unusual Formatting:</span>
                            <span className="font-mono">{analysisResults.clonability.plagiarism_patterns.unusualFormatting}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Most Similar Document */}
                    {analysisResults.clonability.most_similar_document && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h4 className="font-medium mb-3">Most Similar Document</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Title:</span>
                            <span>{analysisResults.clonability.most_similar_document.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Category:</span>
                            <span>{analysisResults.clonability.most_similar_document.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Similarity:</span>
                            <span>{(analysisResults.clonability.most_similar_document.similarity * 100).toFixed(1)}%</span>
                          </div>
                          
                          {/* Similarity Breakdown */}
                          <div className="mt-3">
                            <h5 className="text-sm font-medium mb-2">Similarity Breakdown:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <div className="font-mono">{(analysisResults.clonability.most_similar_document.breakdown.jaccard * 100).toFixed(1)}%</div>
                                <div className="text-gray-500">Jaccard</div>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <div className="font-mono">{(analysisResults.clonability.most_similar_document.breakdown.cosine * 100).toFixed(1)}%</div>
                                <div className="text-gray-500">Cosine</div>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <div className="font-mono">{(analysisResults.clonability.most_similar_document.breakdown.lcs * 100).toFixed(1)}%</div>
                                <div className="text-gray-500">LCS</div>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <div className="font-mono">{(analysisResults.clonability.most_similar_document.breakdown.trigram * 100).toFixed(1)}%</div>
                                <div className="text-gray-500">Trigram</div>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                    )}
                    
                    {/* Recommendations */}
                    {analysisResults.clonability.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium mb-3">Recommendations</h4>
                        <ul className="space-y-2">
                          {analysisResults.clonability.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span className="text-sm">{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Top Similar Documents */}
                    {analysisResults.clonability.all_similarities.length > 1 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium mb-3">Top Similar Documents</h4>
                        <div className="space-y-2">
                          {analysisResults.clonability.all_similarities.slice(1, 4).map((doc, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                              <div>
                                <div className="font-medium text-sm">{doc.title}</div>
                                <div className="text-xs text-gray-500">{doc.category}</div>
                              </div>
                              <div className="text-sm font-mono">{(doc.similarity * 100).toFixed(1)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Integrity Results */}
                {(activeTab === 'integrity' || activeTab === 'all') && analysisResults.integrity && (
                  <div className={`space-y-6 ${activeTab !== 'integrity' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Clinical Integrity Analysis</h3>
                    
                    {/* Main Score and Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResults.integrity.integrity_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Integrity Score</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {analysisResults.integrity.detailed_analysis?.soap?.score || 0}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">SOAP Framework</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {analysisResults.integrity.detailed_analysis?.safety?.score || 0}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Safety Standards</div>
                      </div>
                    </div>
                    
                    {/* Feedback */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="font-medium">{analysisResults.integrity.feedback}</p>
                    </div>
                    
                    {/* Detailed Analysis Breakdown */}
                    {analysisResults.integrity.detailed_analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SOAP Analysis */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">SOAP Framework Analysis</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Subjective:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.soap.breakdown?.subjective?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Objective:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.soap.breakdown?.objective?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Assessment:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.soap.breakdown?.assessment?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Plan:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.soap.breakdown?.plan?.score || 0}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Safety Analysis */}
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-red-800 dark:text-red-200">Safety Standards Analysis</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Allergies:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.allergies?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medications:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.medications?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vital Signs:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.vital_signs?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk Assessment:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.risk_assessment?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Emergency Contacts:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.emergency_contacts?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Infection Control:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.infection_control?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Patient Safety:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.safety.breakdown?.patient_safety?.score || 0}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Documentation Standards */}
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-yellow-800 dark:text-yellow-200">Documentation Standards</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Patient ID:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.documentation.breakdown?.patient_identification?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date/Time:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.documentation.breakdown?.date_time?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provider ID:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.documentation.breakdown?.provider_identification?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Consent:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.documentation.breakdown?.informed_consent?.score || 0}%</span>
                      </div>
                            <div className="flex justify-between">
                              <span>Legal Requirements:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.documentation.breakdown?.legal_requirements?.score || 0}%</span>
                        </div>
                      </div>
                    </div>
                    
                        {/* Quality Indicators */}
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-indigo-800 dark:text-indigo-200">Quality Indicators</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Evidence-Based:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.quality.breakdown?.evidence_based?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Patient-Centered:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.quality.breakdown?.patient_centered?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Interdisciplinary:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.quality.breakdown?.interdisciplinary?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Continuity:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.quality.breakdown?.continuity?.score || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quality Improvement:</span>
                              <span className="font-mono">{analysisResults.integrity.detailed_analysis.quality.breakdown?.quality_improvement?.score || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Medical Entities */}
                    {analysisResults.integrity.entities && Object.keys(analysisResults.integrity.entities).length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium mb-3">Medical Entities Detected</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {Object.entries(analysisResults.integrity.entities).map(([category, entities]) => (
                            <div key={category}>
                              <div className="font-medium text-gray-700 dark:text-gray-300 capitalize">{category}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {Array.isArray(entities) ? entities.length : 0} entities
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Key Phrases */}
                    {analysisResults.integrity.key_phrases && analysisResults.integrity.key_phrases.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium mb-3">Key Clinical Phrases</h4>
                        <div className="space-y-2">
                          {analysisResults.integrity.key_phrases.slice(0, 5).map((phrase, index) => (
                            <div key={index} className="text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                              "{phrase}"
                            </div>
                          ))}
                                </div>
                              </div>
                    )}
                    
                    {/* Missing Elements */}
                    {analysisResults.integrity.missing_elements && analysisResults.integrity.missing_elements.length > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h4 className="font-medium mb-3 text-yellow-800 dark:text-yellow-200">Missing Elements</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {analysisResults.integrity.missing_elements.map((item, idx) => (
                            <div key={idx} className="flex items-center">
                              <span className="text-yellow-600 mr-2">•</span>
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {analysisResults.integrity.recommendations && analysisResults.integrity.recommendations.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">Recommendations</h4>
                        <ul className="space-y-2">
                          {analysisResults.integrity.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-600 mr-2">•</span>
                              <span className="text-sm">{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Golden Thread Results */}
                {(activeTab === 'goldenThread' || activeTab === 'all') && analysisResults.goldenThread && (
                  <div className={`space-y-6 ${activeTab !== 'goldenThread' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Golden Thread Compliance Analysis</h3>
                    
                    {/* Main Score and Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {analysisResults.goldenThread.compliance_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Compliance</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResults.goldenThread.detailed_analysis?.section_coverage?.overallScore || 0}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Section Coverage</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {analysisResults.goldenThread.detailed_analysis?.golden_thread_connections?.connectionScore || 0}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Connection Strength</div>
                      </div>
                    </div>
                    
                    {/* Compliance Status */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          analysisResults.goldenThread.golden_thread_compliance === 'Compliant' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                        }`}>
                          {analysisResults.goldenThread.golden_thread_compliance}
                        </span>
                        </div>
                      </div>
                    
                    {/* Feedback */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="font-medium">{analysisResults.goldenThread.feedback}</p>
                    </div>
                    
                    {/* Detailed Analysis */}
                    {analysisResults.goldenThread.detailed_analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section Coverage */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Documentation Sections</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.goldenThread.detailed_analysis.section_coverage.coverage).map(([section, data]) => (
                              <div key={section} className="flex justify-between items-center">
                                <span className="capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${data.score > 70 ? 'bg-green-500' : data.score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${data.score}%` }}
                          ></div>
                        </div>
                                  <span className="text-xs font-mono w-8">{data.score}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Patient Care Actions */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">Patient Care Actions</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.goldenThread.detailed_analysis.patient_care_actions.actions).map(([action, data]) => (
                              <div key={action} className="flex justify-between items-center">
                                <span className="capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {data.count} found
                                  </span>
                                  <span className="text-xs font-mono w-8">{data.score}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Clinical Interventions */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Clinical Interventions</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.goldenThread.detailed_analysis.clinical_interventions.interventions).map(([intervention, data]) => (
                              <div key={intervention} className="flex justify-between items-center">
                                <span className="capitalize">{intervention.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {data.count} found
                                  </span>
                                  <span className="text-xs font-mono w-8">{data.score}%</span>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                    
                        {/* Golden Thread Connections */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-purple-800 dark:text-purple-200">Clinical Connections</h4>
                          <div className="space-y-2 text-sm">
                            {analysisResults.goldenThread.detailed_analysis.golden_thread_connections.connections.map((connection, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-xs">
                                  {connection.from.replace(/([A-Z])/g, ' $1').trim()} → {connection.to.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    connection.present && connection.strength > 0.5 
                                      ? 'bg-green-100 text-green-800' 
                                      : connection.present 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {Math.round(connection.strength * 100)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action-Intervention Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">Patient Care Actions Found</h4>
                        <div className="space-y-1">
                          {analysisResults.goldenThread.actions_found.slice(0, 8).map((action, index) => (
                            <div key={index} className="text-sm flex items-center">
                              <span className="text-green-600 mr-2">•</span>
                              <span>{action}</span>
                            </div>
                          ))}
                          {analysisResults.goldenThread.actions_found.length > 8 && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              +{analysisResults.goldenThread.actions_found.length - 8} more actions
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Clinical Interventions Found</h4>
                        <div className="space-y-1">
                          {analysisResults.goldenThread.interventions_found.slice(0, 8).map((intervention, index) => (
                            <div key={index} className="text-sm flex items-center">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>{intervention}</span>
                            </div>
                          ))}
                          {analysisResults.goldenThread.interventions_found.length > 8 && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              +{analysisResults.goldenThread.interventions_found.length - 8} more interventions
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                      
                    {/* Missing Connections */}
                      {analysisResults.goldenThread.missing_connections.length > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h4 className="font-medium mb-3 text-yellow-800 dark:text-yellow-200">Missing Clinical Connections</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {analysisResults.goldenThread.missing_connections.map((connection, index) => (
                            <div key={index} className="flex items-center">
                              <span className="text-yellow-600 mr-2">•</span>
                              <span className="text-sm">{connection.replace(/-/g, ' → ')}</span>
                            </div>
                          ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                
                {/* Audit Results */}
                {(activeTab === 'audit' || activeTab === 'all') && analysisResults.audit && (
                  <div className={`space-y-6 ${activeTab !== 'audit' && activeTab !== 'all' ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold">Clinical Audit Results</h3>
                    
                    {/* Main Score */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResults.audit.audit_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Audit Score</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {analysisResults.audit.detailed_analysis?.total_score || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Points Earned</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {analysisResults.audit.detailed_analysis?.max_possible_score || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Maximum Possible Points</div>
                      </div>
                    </div>
                    
                    {/* Feedback */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Audit Feedback</h4>
                      <div className="space-y-2">
                        {analysisResults.audit.feedback.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Detailed Analysis */}
                    {analysisResults.audit.detailed_analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Documentation Completeness */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">Documentation Completeness</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.audit.detailed_analysis.categories.documentationCompleteness?.breakdown || {}).map(([criterion, data]) => (
                              <div key={criterion} className="flex justify-between items-center">
                                <span className="capitalize">{data.name}:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${data.percentage > 70 ? 'bg-green-500' : data.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                                  <span className="text-xs font-mono w-8">{data.percentage}%</span>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                    
                        {/* Clinical Accuracy */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Clinical Accuracy</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.audit.detailed_analysis.categories.clinicalAccuracy?.breakdown || {}).map(([criterion, data]) => (
                              <div key={criterion} className="flex justify-between items-center">
                                <span className="capitalize">{data.name}:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${data.percentage > 70 ? 'bg-green-500' : data.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${data.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-mono w-8">{data.percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                    </div>
                    
                        {/* Documentation Quality */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-purple-800 dark:text-purple-200">Documentation Quality</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.audit.detailed_analysis.categories.documentationQuality?.breakdown || {}).map(([criterion, data]) => (
                              <div key={criterion} className="flex justify-between items-center">
                                <span className="capitalize">{data.name}:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${data.percentage > 70 ? 'bg-green-500' : data.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${data.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-mono w-8">{data.percentage}%</span>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                    
                        {/* Compliance Standards */}
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-yellow-800 dark:text-yellow-200">Compliance Standards</h4>
                          <div className="space-y-2 text-sm">
                            {Object.entries(analysisResults.audit.detailed_analysis.categories.complianceStandards?.breakdown || {}).map(([criterion, data]) => (
                              <div key={criterion} className="flex justify-between items-center">
                                <span className="capitalize">{data.name}:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${data.percentage > 70 ? 'bg-green-500' : data.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${data.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-mono w-8">{data.percentage}%</span>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                      </div>
                    )}
                    
                    {/* Improvement Suggestions */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">Improvement Suggestions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysisResults.audit.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Training Recommendations */}
                    {analysisResults.audit.training_recommendations && analysisResults.audit.training_recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Training Recommendations</h4>
                        <div className="space-y-4">
                          {analysisResults.audit.training_recommendations.map((recommendation, index) => (
                            <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-blue-800 dark:text-blue-200">{recommendation.category}</h5>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  recommendation.performance > 70 ? 'bg-green-100 text-green-800' : 
                                  recommendation.performance > 40 ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {recommendation.performance}% performance
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Area needing improvement: {recommendation.area}
                              </p>
                              <div className="space-y-2">
                                {recommendation.resources.map((resource, resourceIndex) => (
                                  <div key={resourceIndex} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h6 className="font-medium text-sm">{resource.name}</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{resource.description}</p>
                                        <div className="flex items-center space-x-4 mt-1">
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{resource.type}</span>
                                          <span className="text-xs text-gray-500">{resource.duration}</span>
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            resource.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                                            resource.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {resource.level}
                                          </span>
                                        </div>
                                      </div>
                                      <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                      >
                                        View
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
