import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // After a session exists, ask the backend if this user is allowed.
  // The backend checks ALLOWED_EMAILS from its own .env — reliable and secure.
  const verifyWithBackend = async (currentSession) => {
    if (!currentSession?.user) return true;
    try {
      await api.post('/api/auth/check');
      return true;
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setAuthError(`"${currentSession.user.email}" is not authorised to access this app.`);
      } else if (status === 401) {
        setAuthError('Session expired. Please sign in again.');
      } else {
        // Network/server error — let them stay logged in and fail gracefully on writes
        return true;
      }
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session?.user) {
          // No session — resolve immediately, no backend call needed
          setSession(null);
          setUser(null);
          return;
        }
        const allowed = await verifyWithBackend(session);
        if (allowed) {
          setSession(session);
          setUser(session.user);
          setAuthError('');
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const allowed = await verifyWithBackend(session);
        if (!allowed) return;
        setSession(session);
        setUser(session.user);
        setAuthError('');
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, session, loading, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
