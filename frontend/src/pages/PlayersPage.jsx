import { useState, useEffect } from 'react';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { AuthAction, ReadOnlyBanner } from '../components/AuthGuard.jsx';
import AuditInfo from '../components/AuditInfo.jsx';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

function PlayerForm({ initial, teams, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [teamId, setTeamId] = useState(initial?.team_id || teams[0]?.id || '');
  const [position, setPosition] = useState(initial?.position || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initial) {
        await api.put(`/api/players/${initial.id}`, { name, team_id: teamId, position });
      } else {
        await api.post('/api/players', { name, team_id: teamId, position });
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
        <label className="label">Player Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Lionel Messi" required />
      </div>
      <div>
        <label className="label">Team</label>
        <select className="input" value={teamId} onChange={e => setTeamId(e.target.value)} required>
          <option value="">Select a team…</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Position</label>
        <select className="input" value={position} onChange={e => setPosition(e.target.value)}>
          <option value="">Unknown</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Player'}
        </button>
      </div>
    </form>
  );
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterLeague, setFilterLeague] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [goalCounts, setGoalCounts] = useState({});

  const loadTeams = async (leagueId) => {
    const params = leagueId ? { league_id: leagueId } : {};
    const { data } = await api.get('/api/teams', { params });
    return data;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [leaguesRes] = await Promise.all([api.get('/api/leagues')]);
      setLeagues(leaguesRes.data);
      const teamsData = await loadTeams(filterLeague);
      setTeams(teamsData);

      const params = {};
      if (filterTeam) params.team_id = filterTeam;
      const playersRes = await api.get('/api/players', { params });
      setPlayers(playersRes.data);

      // Load goal counts per player
      const goalsRes = await api.get('/api/goals');
      const counts = {};
      for (const goal of goalsRes.data) {
        if (goal.player_id) counts[goal.player_id] = (counts[goal.player_id] || 0) + 1;
      }
      setGoalCounts(counts);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterTeam, filterLeague]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this player?')) return;
    await api.delete(`/api/players/${id}`);
    load();
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (player) => { setEditing(player); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const saved = () => { closeModal(); load(); };

  const teamName = (p) => teams.find(t => t.id === p.team_id)?.name || p.team?.name || '—';

  // Sort by goals descending
  const sorted = [...players].sort((a, b) => (goalCounts[b.id] || 0) - (goalCounts[a.id] || 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage players and view goal tallies</p>
        </div>
        <AuthAction><button className="btn-primary" onClick={openCreate}>+ Add Player</button></AuthAction>
      </div>
      <ReadOnlyBanner />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="input max-w-[200px]"
          value={filterLeague}
          onChange={e => { setFilterLeague(e.target.value); setFilterTeam(''); }}
        >
          <option value="">All Leagues</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
        </select>
        <select className="input max-w-[200px]" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="👤"
          message="No players yet. Add players to teams."
          action={<AuthAction><button className="btn-primary" onClick={openCreate}>Add Player</button></AuthAction>}
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Player</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Team</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Position</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Goals</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(player => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <AuditInfo {...player} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{teamName(player)}</td>
                  <td className="px-4 py-3 text-gray-500">{player.position || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-green-700">{goalCounts[player.id] || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <AuthAction inline><button className="btn-secondary btn-sm" onClick={() => openEdit(player)}>Edit</button></AuthAction>
                      <AuthAction inline><button className="btn-danger btn-sm" onClick={() => handleDelete(player.id)}>Delete</button></AuthAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Player' : 'Add Player'} onClose={closeModal}>
          <PlayerForm initial={editing} teams={teams} onSave={saved} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}
