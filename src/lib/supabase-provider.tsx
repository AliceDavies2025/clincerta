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

  return (
    <Context.Provider value={{ supabase, session, isGuest, setIsGuest }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
};