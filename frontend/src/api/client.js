import axios from 'axios';
import { supabase } from '../lib/supabase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the Supabase JWT to every request.
// getSession() auto-refreshes an expired JWT (using the refresh token) before
// returning, so this always provides a valid token as long as the refresh token
// itself has not expired (Supabase default: 7 days).
api.interceptors.request.use(async (config) => {
  // Prefer the already-set header (e.g. from verifyWithBackend passing the token
  // directly) so we never overwrite a known-fresh token with a potentially stale one.
  if (config.headers['Authorization']) return config;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
