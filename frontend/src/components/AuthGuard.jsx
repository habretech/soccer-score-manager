import { useAuth } from '../context/AuthContext.jsx';

/**
 * Renders children only when logged in. Shows nothing to guests.
 */
export function AuthAction({ children }) {
  const { user } = useAuth();
  if (!user) return null;
  return children;
}

/**
 * No longer used — kept as empty stub so existing imports don't break.
 */
export function ReadOnlyBanner() {
  return null;
}
