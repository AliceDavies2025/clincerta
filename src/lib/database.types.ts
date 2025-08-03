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
          text_content?: string;
          is_scanned_document?: boolean;
          ocr_applied?: boolean;
          analysis_results?: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          title: string;
          file_type: string;
          file_url: string;
          text_content?: string;
          is_scanned_document?: boolean;
          ocr_applied?: boolean;
          analysis_results?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          title?: string;
          file_type?: string;
          file_url?: string;
          text_content?: string;
          is_scanned_document?: boolean;
          ocr_applied?: boolean;
          analysis_results?: any;
        };
      };
    };
  };
};