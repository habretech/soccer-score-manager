import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Ask the backend whether this account is on the allowed list.
  // We pass the token directly from the session object — never rely on the Axios
  // interceptor's getSession() call here, which can race against localStorage writes
  // and return a stale/expired token right after a fresh login.
  const verifyWithBackend = async (currentSession) => {
    if (!currentSession?.user) return true;
    try {
      await api.post('/api/auth/check', {}, {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });
      return true;
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setAuthError(`"${currentSession.user.email}" is not authorised to access this app.`);
      } else if (status === 401) {
        setAuthError('Session expired. Please sign in again.');
      } else {
        // Network/server error — let them stay logged in; writes will fail gracefully
        return true;
      }
      setSession(null);
      setUser(null);
      supabase.auth.signOut({ scope: 'local' });
      return false;
    }
  };

  useEffect(() => {
    // Safety net: if Supabase never fires INITIAL_SESSION (e.g. network issue),
    // stop showing a spinner after 5s.
    const timeout = setTimeout(() => setLoading(false), 5000);

    // onAuthStateChange is the single source of truth — no separate getSession() call.
    // Supabase always fires INITIAL_SESSION on mount with whatever session is in storage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        // First load — verify the stored session with the backend if one exists
        if (session?.user) {
          const allowed = await verifyWithBackend(session);
          if (allowed) {
            setSession(session);
            setUser(session.user);
            setAuthError('');
          }
        } else {
          // No stored session — public visitor
          setSession(null);
          setUser(null);
        }
        clearTimeout(timeout);
        setLoading(false);
      } else if (event === 'SIGNED_IN') {
        // Fresh Google OAuth login — verify with backend
        if (session?.user) {
          const allowed = await verifyWithBackend(session);
          if (allowed) {
            setSession(session);
            setUser(session.user);
            setAuthError('');
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Supabase silently refreshed the JWT — just update the session, no backend call needed
        if (session?.user) {
          setSession(session);
          setUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setAuthError('');
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
