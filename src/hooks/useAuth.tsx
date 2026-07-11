import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getCredentials() {
  return {
    email: (process.env.EXPO_PUBLIC_SINGLE_USER_EMAIL ?? '').trim(),
    password: (process.env.EXPO_PUBLIC_SINGLE_USER_PASSWORD ?? '').trim(),
  };
}

function formatAuthError(signInError: string | undefined, signUpError: string | undefined): string {
  if (signUpError?.toLowerCase().includes('already registered')) {
    return [
      'An account with this email already exists, but the password in .env does not match.',
      'Fix: update EXPO_PUBLIC_SINGLE_USER_PASSWORD in .env to the correct password,',
      'or delete the user in Supabase → Authentication → Users and restart the app.',
    ].join(' ');
  }

  if (
    signInError?.toLowerCase().includes('invalid login credentials') ||
    signInError?.toLowerCase().includes('invalid credentials')
  ) {
    return [
      'Could not sign in with the email/password in your .env file.',
      'If this is a new setup, disable "Confirm email" in Supabase → Authentication → Settings,',
      'then restart Expo. If you already created a user, make sure the password matches.',
    ].join(' ');
  }

  if (signUpError?.toLowerCase().includes('password')) {
    return `Sign up failed: ${signUpError}. Use a password with at least 6 characters.`;
  }

  return signUpError ?? signInError ?? 'Failed to connect to Supabase.';
}

async function ensureSingleUserSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const { email, password } = getCredentials();

  if (!email || !password) {
    throw new Error(
      'Add EXPO_PUBLIC_SINGLE_USER_EMAIL and EXPO_PUBLIC_SINGLE_USER_PASSWORD to your .env file, then restart Expo.'
    );
  }

  if (password.length < 6) {
    throw new Error('EXPO_PUBLIC_SINGLE_USER_PASSWORD must be at least 6 characters.');
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData.session) return signInData.session;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpData.session) return signUpData.session;

  if (signUpData.user && !signUpData.session) {
    throw new Error(
      [
        'Account was created but Supabase requires email confirmation before sign-in.',
        'Go to Supabase → Authentication → Settings → disable "Confirm email",',
        'then restart the app.',
      ].join(' ')
    );
  }

  if (signUpError || signInError) {
    throw new Error(formatAuthError(signInError?.message, signUpError?.message));
  }

  const { data: { session: retrySession } } = await supabase.auth.getSession();
  return retrySession;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const connect = useCallback(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError(null);

    ensureSingleUserSession()
      .then((currentSession) => {
        setSession(currentSession);
        setAuthError(null);
      })
      .catch((error) => {
        setAuthError(error instanceof Error ? error.message : 'Failed to connect');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    connect();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [connect, attempt]);

  if (loading) {
    return <LoadingState message="Starting UCM Tracker..." />;
  }

  if (authError) {
    return <ErrorState message={authError} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        authError,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
