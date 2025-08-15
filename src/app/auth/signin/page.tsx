'use client';

import dynamic from 'next/dynamic';
import { useSupabase } from '../../../lib/supabase-provider';
import SupabaseProvider from '../../../lib/supabase-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Dynamically import Auth component to avoid SSR issues
const Auth = dynamic(() => import('@supabase/auth-ui-react').then(mod => ({ default: mod.Auth })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
});

const ThemeSupa = dynamic(() => import('@supabase/auth-ui-shared').then(mod => ({ default: mod.ThemeSupa })), {
  ssr: false
});

export default function SignInPage() {
  return (
    <SupabaseProvider>
      <SignInContent />
    </SupabaseProvider>
  );
}

function SignInContent() {
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('User already signed in, redirecting to dashboard');
        router.push('/dashboard');
      }
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to dashboard');
        router.push('/dashboard');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo="/dashboard"
        />
      </div>
    </div>
  );
}
