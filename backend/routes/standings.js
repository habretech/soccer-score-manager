import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// GET /api/standings/:leagueId
// Computes standings from finished matches in the league
router.get('/:leagueId', async (req, res) => {
  const { leagueId } = req.params;

  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', leagueId)
    .order('name');
  if (teamsErr) return res.status(500).json({ error: teamsErr.message });

  const { data: matches, error: matchesErr } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score, status')
    .eq('league_id', leagueId)
    .eq('status', 'finished');
  if (matchesErr) return res.status(500).json({ error: matchesErr.message });

  const table = {};
  for (const team of teams) {
    table[team.id] = {
      id: team.id,
      name: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    };
  }

  for (const match of matches) {
    const home = table[match.home_team_id];
    const away = table[match.away_team_id];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.home_score < match.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Object.values(table).map(t => ({
    ...t,
    goal_difference: t.goals_for - t.goals_against,
  }));

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.name.localeCompare(b.name);
  });

  res.json(standings);
});

export default router;
