import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// GET /api/matches?league_id=...&status=...&date=YYYY-MM-DD
router.get('/', async (req, res) => {
  let query = supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name),
      away_team:away_team_id(id, name),
      league:league_id(id, name, season)
    `)
    .order('match_date', { ascending: false });

  if (req.query.league_id) query = query.eq('league_id', req.query.league_id);
  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.date) {
    const start = `${req.query.date}T00:00:00.000Z`;
    const end = `${req.query.date}T23:59:59.999Z`;
    query = query.gte('match_date', start).lte('match_date', end);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name),
      away_team:away_team_id(id, name),
      league:league_id(id, name, season),
      goals(id, minute, team_id, created_by, player:player_id(id, name))
    `)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Match not found' });
  res.json(data);
});

// POST /api/matches
router.post('/', async (req, res) => {
  const { league_id, home_team_id, away_team_id, match_date } = req.body;
  if (!league_id || !home_team_id || !away_team_id || !match_date) {
    return res.status(400).json({ error: 'league_id, home_team_id, away_team_id, and match_date are required' });
  }
  if (home_team_id === away_team_id) {
    return res.status(400).json({ error: 'home and away teams must be different' });
  }
  const { data, error } = await supabase
    .from('matches')
    .insert({
      league_id, home_team_id, away_team_id, match_date,
      home_score: 0, away_score: 0, status: 'scheduled',
      created_by: req.user.email,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/matches/:id — update score and/or status
router.put('/:id', async (req, res) => {
  const { home_score, away_score, status, match_date } = req.body;
  const updates = { updated_by: req.user.email };
  if (home_score !== undefined) updates.home_score = home_score;
  if (away_score !== undefined) updates.away_score = away_score;
  if (status !== undefined) updates.status = status;
  if (match_date !== undefined) updates.match_date = match_date;

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/matches/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('matches').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
