import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export interface AnalysisResults {
  clonability?: {
    originality_score: number;
    risk_level: string;
    risk_description: string;
    overall_similarity: number;
    recommendations: string[];
  };
  integrity?: {
    integrity_score: number;
    feedback: string;
    missing_elements: string[];
    recommendations: string[];
  };
  goldenThread?: {
    compliance_score: number;
    feedback: string;
    missing_connections: string[];
  };
  audit?: {
    audit_score: number;
    feedback: string[];
    suggestions: string[];
    training_recommendations: any[];
  };
}

export async function saveAnalysisResults(
  supabase: SupabaseClient<Database>,
  userId: string,
  documentId: string | null,
  analysisResults: AnalysisResults,
  isGuestSession: boolean = false
) {
  try {
    // Extract scores and issues from analysis results
    const originalityScore = analysisResults.clonability?.originality_score || null;
    const integrityScore = analysisResults.integrity?.integrity_score || null;
    const complianceScore = analysisResults.goldenThread?.compliance_score || null;
    
    // Collect all issues from different analyses
    const issues: string[] = [];
    if (analysisResults.clonability?.risk_level === 'high') {
      issues.push(`High similarity detected: ${analysisResults.clonability.risk_description}`);
    }
    if (analysisResults.integrity?.missing_elements) {
      issues.push(...analysisResults.integrity.missing_elements);
    }
    if (analysisResults.goldenThread?.missing_connections) {
      issues.push(...analysisResults.goldenThread.missing_connections);
    }
    
    // Collect all suggestions
    const suggestions: string[] = [];
    if (analysisResults.clonability?.recommendations) {
      suggestions.push(...analysisResults.clonability.recommendations);
    }
    if (analysisResults.integrity?.recommendations) {
      suggestions.push(...analysisResults.integrity.recommendations);
    }
    if (analysisResults.audit?.suggestions) {
      suggestions.push(...analysisResults.audit.suggestions);
    }
    
    // Get training recommendations
    const trainingRecommendations = analysisResults.audit?.training_recommendations || [];
    
    // Save to audit_history table
    const { data, error } = await supabase
      .from('audit_history')
      .insert({
        document_id: documentId,
        user_id: userId,
        originality_score: originalityScore,
        integrity_score: integrityScore,
        compliance_score: complianceScore,
        issues: issues.length > 0 ? issues : null,
        suggestions: suggestions.length > 0 ? suggestions : null,
        training_recommendations: trainingRecommendations.length > 0 ? trainingRecommendations : null,
        is_guest_session: isGuestSession
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving analysis results:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to save analysis results:', error);
    throw error;
  }
}

export async function updateDocumentAnalysisResults(
  supabase: SupabaseClient<Database>,
  documentId: string,
  analysisResults: AnalysisResults
) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        analysis_results: {
          ...analysisResults,
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document analysis results:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to update document analysis results:', error);
    throw error;
  }
}
