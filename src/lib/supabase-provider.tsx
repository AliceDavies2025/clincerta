// NOTE: Any component using useSupabase must be wrapped in <SupabaseProvider> higher up in the tree.
// Example usage in your layout or _app file:
// <SupabaseProvider>
//   <YourApp />
// </SupabaseProvider>

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

export type SupabaseContext = {
  supabase: SupabaseClient<Database> | null;
  session: any;
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  isLoading: boolean;
};

export const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only create Supabase client on the client side
    if (typeof window !== 'undefined') {
      const client = createClientComponentClient<Database>();
      setSupabase(client);
      
      // Get initial session immediately
      const getInitialSession = async () => {
        try {
          const { data: { session: initialSession } } = await client.auth.getSession();
          setSession(initialSession);
        } catch (error) {
          console.error('Error getting initial session:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      getInitialSession();
    }
  }, []);

  useEffect(() => {
    if (!supabase) return; // Don't proceed if Supabase client is not ready
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        setIsGuest(false);
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Don't render children until Supabase client is ready and initial session is loaded
  if (!supabase || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Initializing...</span>
      </div>
    );
  }

  return (
    <Context.Provider value={{ supabase, session, isGuest, setIsGuest, isLoading }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  if (!context.supabase) {
    throw new Error('Supabase client is not ready yet');
  }
  return context;
};