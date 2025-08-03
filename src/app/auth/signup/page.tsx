'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '../../../lib/supabase-provider';
import SupabaseProvider from '../../../lib/supabase-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  return (
    <SupabaseProvider>
      <SignUpContent />
    </SupabaseProvider>
  );
}

function SignUpContent() {
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          view="sign_up"
        />
      </div>
    </div>
  );
}
