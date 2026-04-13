import { useState, useEffect } from 'react';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { AuthAction, ReadOnlyBanner } from '../components/AuthGuard.jsx';
import AuditInfo from '../components/AuditInfo.jsx';

function TeamForm({ initial, leagues, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [leagueId, setLeagueId] = useState(initial?.league_id || leagues[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initial) {
        await api.put(`/api/teams/${initial.id}`, { name, league_id: leagueId });
      } else {
        await api.post('/api/teams', { name, league_id: leagueId });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="label">Team Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="FC Barcelona" required />
      </div>
      <div>
        <label className="label">League</label>
        <select className="input" value={leagueId} onChange={e => setLeagueId(e.target.value)} required>
          <option value="">Select a league…</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
        </select>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Team'}
        </button>
      </div>
    </form>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [filterLeague, setFilterLeague] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [teamsRes, leaguesRes] = await Promise.all([
        api.get('/api/teams', { params: filterLeague ? { league_id: filterLeague } : {} }),
        api.get('/api/leagues'),
      ]);
      setTeams(teamsRes.data);
      setLeagues(leaguesRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterLeague]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return;
    await api.delete(`/api/teams/${id}`);
    load();
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (team) => { setEditing(team); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const saved = () => { closeModal(); load(); };

  const leagueName = (team) => leagues.find(l => l.id === team.league_id)?.name || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage teams in your leagues</p>
        </div>
        <AuthAction><button className="btn-primary" onClick={openCreate}>+ Add Team</button></AuthAction>
      </div>
      <ReadOnlyBanner />

      <div className="mb-5">
        <select
          className="input max-w-xs"
          value={filterLeague}
          onChange={e => setFilterLeague(e.target.value)}
        >
          <option value="">All Leagues</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon="👕"
          message="No teams yet. Add a team to get started."
          action={<AuthAction><button className="btn-primary" onClick={openCreate}>Add Team</button></AuthAction>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <div key={team.id} className="card flex flex-col gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-base">{team.name}</h2>
                <p className="text-sm text-gray-500">{leagueName(team)}</p>
                <AuditInfo {...team} />
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                <AuthAction inline><button className="btn-secondary btn-sm" onClick={() => openEdit(team)}>Edit</button></AuthAction>
                <AuthAction inline><button className="btn-danger btn-sm" onClick={() => handleDelete(team.id)}>Delete</button></AuthAction>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Team' : 'Add Team'} onClose={closeModal}>
          <TeamForm initial={editing} leagues={leagues} onSave={saved} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}
