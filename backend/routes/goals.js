import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// GET /api/goals?match_id=...
router.get('/', async (req, res) => {
  let query = supabase
    .from('goals')
    .select('*, player:player_id(id, name), team:team_id(id, name)')
    .order('minute');
  if (req.query.match_id) query = query.eq('match_id', req.query.match_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/goals
router.post('/', async (req, res) => {
  const { match_id, player_id, team_id, minute } = req.body;
  if (!match_id || !team_id || !minute) {
    return res.status(400).json({ error: 'match_id, team_id, and minute are required' });
  }
  if (minute < 1 || minute > 120) {
    return res.status(400).json({ error: 'minute must be between 1 and 120' });
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({ match_id, player_id: player_id || null, team_id, minute, created_by: req.user.email })
    .select('*, player:player_id(id, name), team:team_id(id, name)')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Recompute and update match scores based on all goals
  const { data: allGoals, error: goalsErr } = await supabase
    .from('goals')
    .select('team_id, matches!inner(home_team_id, away_team_id)')
    .eq('match_id', match_id);

  if (!goalsErr && allGoals) {
    const match = allGoals[0]?.matches;
    if (match) {
      const homeScore = allGoals.filter(g => g.team_id === match.home_team_id).length;
      const awayScore = allGoals.filter(g => g.team_id === match.away_team_id).length;
      await supabase
        .from('matches')
        .update({ home_score: homeScore, away_score: awayScore, updated_by: req.user.email })
        .eq('id', match_id);
    }
  }

  res.status(201).json(goal);
});

// DELETE /api/goals/:id — removing a goal also recomputes the score
router.delete('/:id', async (req, res) => {
  const { data: goal, error: fetchErr } = await supabase
    .from('goals')
    .select('match_id')
    .eq('id', req.params.id)
    .single();
  if (fetchErr) return res.status(404).json({ error: 'Goal not found' });

  const { error } = await supabase.from('goals').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  // Recompute match scores after deletion
  const { data: allGoals } = await supabase
    .from('goals')
    .select('team_id, matches!inner(home_team_id, away_team_id)')
    .eq('match_id', goal.match_id);

  if (allGoals && allGoals.length > 0) {
    const match = allGoals[0]?.matches;
    if (match) {
      const homeScore = allGoals.filter(g => g.team_id === match.home_team_id).length;
      const awayScore = allGoals.filter(g => g.team_id === match.away_team_id).length;
      await supabase
        .from('matches')
        .update({ home_score: homeScore, away_score: awayScore, updated_by: req.user.email })
        .eq('id', goal.match_id);
    }
  } else {
    await supabase
      .from('matches')
      .update({ home_score: 0, away_score: 0, updated_by: req.user.email })
      .eq('id', goal.match_id);
  }

  res.status(204).send();
});

export default router;
