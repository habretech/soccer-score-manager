import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// GET /api/leagues
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/leagues/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'League not found' });
  res.json(data);
});

// POST /api/leagues
router.post('/', async (req, res) => {
  const { name, season } = req.body;
  if (!name || !season) return res.status(400).json({ error: 'name and season are required' });
  const { data, error } = await supabase
    .from('leagues')
    .insert({ name, season, created_by: req.user.email })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/leagues/:id
router.put('/:id', async (req, res) => {
  const { name, season } = req.body;
  const { data, error } = await supabase
    .from('leagues')
    .update({ name, season, updated_by: req.user.email })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/leagues/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('leagues').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
