import { createClient } from '@supabase/supabase-js';

// Uses the SERVICE ROLE key — has full DB access, bypasses RLS
// This is fine because this runs server-side only, never exposed to the browser
const getSupabase = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const supabase = getSupabase();

  if (!supabase) {
    return res.status(500).json({
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables'
    });
  }

  // ── GET: load dashboard data ─────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('campaign_data')
        .select('rows')
        .eq('user_id', 'dashboard')
        .single();

      if (error) {
        // Row doesn't exist yet — return empty
        if (error.code === 'PGRST116') return res.status(200).json({ rows: [] });
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ rows: data?.rows || [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: save dashboard data ────────────────────────────
  if (req.method === 'POST') {
    const { rows } = req.body || {};

    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'rows must be an array' });
    }

    try {
      const { error } = await supabase
        .from('campaign_data')
        .upsert(
          { user_id: 'dashboard', rows, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, saved: rows.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
