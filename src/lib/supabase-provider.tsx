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
  supabase: SupabaseClient<Database>;
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
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
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