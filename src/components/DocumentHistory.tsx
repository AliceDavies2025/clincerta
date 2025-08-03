'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import type { Database } from '@/lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

export const DocumentHistory = forwardRef(function DocumentHistory(_, ref) {
  const { supabase, session } = useSupabase();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    if (!session) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
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

  if (isLoading) return <div>Loading history...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Your Document History</h2>
      {documents.length === 0 ? (
        <p className="text-gray-500">No documents yet</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="border-b pb-2">
              <h3 className="font-medium">{doc.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
              <a 
                href={doc.file_url} 
                target="_blank"
                className="text-blue-600 hover:underline text-sm"
              >
                View Document
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});