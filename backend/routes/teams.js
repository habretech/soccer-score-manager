import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// GET /api/teams?league_id=...
router.get('/', async (req, res) => {
  let query = supabase.from('teams').select('*').order('name');
  if (req.query.league_id) query = query.eq('league_id', req.query.league_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*, leagues(*)')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Team not found' });
  res.json(data);
});

// POST /api/teams
router.post('/', async (req, res) => {
  const { name, league_id } = req.body;
  if (!name || !league_id) return res.status(400).json({ error: 'name and league_id are required' });
  const { data, error } = await supabase
    .from('teams')
    .insert({ name, league_id, created_by: req.user.email })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/teams/:id
router.put('/:id', async (req, res) => {
  const { name, league_id } = req.body;
  const { data, error } = await supabase
    .from('teams')
    .update({ name, league_id, updated_by: req.user.email })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/teams/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('teams').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
