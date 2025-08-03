import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types for document data
export type Document = {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  file_type: string;
  file_url: string;
  analysis_results?: AnalysisResults;
};

export type AnalysisResults = {
  originality_score: number;
  integrity_score: number;
  compliance_score: number;
  issues: string[];
  suggestions: string[];
  training_recommendations: string[];
};