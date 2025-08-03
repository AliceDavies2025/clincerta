'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSupabase } from '@/lib/supabase-provider';

export function AuthForm() {
  const { supabase, setIsGuest } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const handleGuest = () => {
    setIsGuest(true);
    router.push('/analyze');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter your email"
          title="Email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          title="Password"
          placeholder="Enter your password"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
        <button
          onClick={handleSignUp}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Sign Up
        </button>
      </div>
      <div className="pt-4 border-t">
        <button
          onClick={handleGuest}
          className="text-blue-600 hover:underline"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}