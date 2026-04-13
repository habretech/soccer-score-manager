import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// GET /api/players?team_id=...
router.get('/', async (req, res) => {
  let query = supabase
    .from('players')
    .select('*, team:team_id(id, name)')
    .order('name');
  if (req.query.team_id) query = query.eq('team_id', req.query.team_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/players/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('players')
    .select('*, team:team_id(id, name, league_id)')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Player not found' });
  res.json(data);
});

// POST /api/players
router.post('/', async (req, res) => {
  const { name, team_id, position } = req.body;
  if (!name || !team_id) return res.status(400).json({ error: 'name and team_id are required' });
  const { data, error } = await supabase
    .from('players')
    .insert({ name, team_id, position, created_by: req.user.email })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/players/:id
router.put('/:id', async (req, res) => {
  const { name, team_id, position } = req.body;
  const { data, error } = await supabase
    .from('players')
    .update({ name, team_id, position, updated_by: req.user.email })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/players/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('players').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
