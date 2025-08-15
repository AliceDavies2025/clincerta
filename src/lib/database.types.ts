export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          title: string;
          file_type: string;
          file_url: string;
          file_size?: number;
          analysis_results?: any;
          is_guest_upload?: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          title: string;
          file_type: string;
          file_url: string;
          file_size?: number;
          analysis_results?: any;
          is_guest_upload?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          title?: string;
          file_type?: string;
          file_url?: string;
          file_size?: number;
          analysis_results?: any;
          is_guest_upload?: boolean;
        };
      };
      audit_history: {
        Row: {
          id: string;
          document_id?: string;
          user_id: string;
          created_at: string;
          originality_score?: number;
          integrity_score?: number;
          compliance_score?: number;
          issues?: string[];
          suggestions?: string[];
          training_recommendations?: any[];
          is_guest_session?: boolean;
        };
        Insert: {
          id?: string;
          document_id?: string;
          user_id: string;
          created_at?: string;
          originality_score?: number;
          integrity_score?: number;
          compliance_score?: number;
          issues?: string[];
          suggestions?: string[];
          training_recommendations?: any[];
          is_guest_session?: boolean;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          created_at?: string;
          originality_score?: number;
          integrity_score?: number;
          compliance_score?: number;
          issues?: string[];
          suggestions?: string[];
          training_recommendations?: any[];
          is_guest_session?: boolean;
        };
      };
    };
  };
};