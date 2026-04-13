import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './db/supabase.js';

import leaguesRouter from './routes/leagues.js';
import teamsRouter from './routes/teams.js';
import matchesRouter from './routes/matches.js';
import playersRouter from './routes/players.js';
import goalsRouter from './routes/goals.js';
import standingsRouter from './routes/standings.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Comma-separated list of allowed emails, e.g. "alice@gmail.com,bob@gmail.com"
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

// Verify the Supabase JWT from the Authorization header.
// Allows GET requests through freely; rejects writes without a valid session.
async function requireAuth(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Login required to make changes' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Your account is not authorised to make changes.' });
  }
  req.user = user;
  next();
}

app.use(cors());
app.use(express.json());
app.use(requireAuth);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// POST /api/auth/check — frontend calls this after Google sign-in to verify the account is allowed.
// requireAuth middleware already handles the 401/403 logic, so a 200 here means "you're in".
app.post('/api/auth/check', (_req, res) => res.json({ allowed: true }));

app.use('/api/leagues', leaguesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/players', playersRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/standings', standingsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Soccer Score Manager API running on port ${PORT}`);
});
