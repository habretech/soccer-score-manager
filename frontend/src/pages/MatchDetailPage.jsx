import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuditInfo from '../components/AuditInfo.jsx';

const STATUS_LABELS = { scheduled: 'Scheduled', in_progress: 'Live', finished: 'Finished' };
const STATUS_COLORS = {
  scheduled: 'badge-scheduled',
  in_progress: 'badge-in_progress',
  finished: 'badge-finished',
};

function GoalForm({ match, onSave }) {
  const [teamId, setTeamId] = useState(match.home_team?.id || '');
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [players, setPlayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teamId) { setPlayers([]); return; }
    api.get('/api/players', { params: { team_id: teamId } }).then(r => setPlayers(r.data));
  }, [teamId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/goals', {
        match_id: match.id,
        team_id: teamId,
        player_id: playerId || null,
        minute: Number(minute),
      });
      setMinute('');
      setPlayerId('');
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-gray-50">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Record Goal</h3>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Team</label>
          <select className="input" value={teamId} onChange={e => { setTeamId(e.target.value); setPlayerId(''); }}>
            <option value={match.home_team?.id}>{match.home_team?.name}</option>
            <option value={match.away_team?.id}>{match.away_team?.name}</option>
          </select>
        </div>
        <div>
          <label className="label">Player (optional)</label>
          <select className="input" value={playerId} onChange={e => setPlayerId(e.target.value)}>
            <option value="">Unknown / own goal</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Minute</label>
          <input
            type="number"
            className="input"
            min="1" max="120"
            value={minute}
            onChange={e => setMinute(e.target.value)}
            placeholder="45"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button type="submit" className="btn-primary btn-sm" disabled={saving}>
          {saving ? 'Saving…' : '+ Add Goal'}
        </button>
      </div>
    </form>
  );
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/matches/${id}`);
      setMatch(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status) => {
    setStatusSaving(true);
    try {
      await api.put(`/api/matches/${id}`, { status });
      load();
    } finally {
      setStatusSaving(false);
    }
  };

  const deleteGoal = async (goalId) => {
    await api.delete(`/api/goals/${goalId}`);
    load();
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!match) return <div className="text-center py-16 text-gray-500">Match not found.</div>;

  const sortedGoals = [...(match.goals || [])].sort((a, b) => a.minute - b.minute);

  const nextStatuses = {
    scheduled: ['in_progress'],
    in_progress: ['finished'],
    finished: [],
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button className="btn-secondary btn-sm" onClick={() => navigate('/matches')}>← Back</button>
        <span className={STATUS_COLORS[match.status]}>{STATUS_LABELS[match.status]}</span>
        <span className="text-sm text-gray-400">{match.league?.name} · {match.league?.season}</span>
      </div>

      {/* Scoreboard */}
      <div className="card text-center py-8">
        <div className="flex items-center justify-center gap-6 sm:gap-12">
          <div className="flex-1">
            <div className="text-xl font-bold text-gray-900">{match.home_team?.name}</div>
            <div className="text-xs text-gray-400 mt-1">Home</div>
          </div>
          <div className="text-5xl font-black text-green-700 tabular-nums">
            {match.status !== 'scheduled'
              ? `${match.home_score} – ${match.away_score}`
              : 'vs'}
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-gray-900">{match.away_team?.name}</div>
            <div className="text-xs text-gray-400 mt-1">Away</div>
          </div>
        </div>

        {/* Status controls */}
        <div className="flex justify-center gap-3 mt-6">
          {user ? (
            <>
              {match.status === 'scheduled' && (
                <button className="btn-primary" disabled={statusSaving} onClick={() => changeStatus('in_progress')}>
                  ▶ Start Match
                </button>
              )}
              {match.status === 'in_progress' && (
                <button className="btn-primary" disabled={statusSaving} onClick={() => changeStatus('finished')}>
                  ✓ End Match
                </button>
              )}
              {match.status === 'finished' && (
                <span className="text-sm text-gray-500">Match is finished</span>
              )}
            </>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <a href="/login" className="underline font-medium">Sign in</a> to manage this match
            </p>
          )}
        </div>
      </div>

      {/* Goal entry form — only logged-in users during live match */}
      {user && match.status === 'in_progress' && (
        <GoalForm match={match} onSave={load} />
      )}

      {/* Goal log */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">
          Goal Log {sortedGoals.length > 0 && `(${sortedGoals.length})`}
        </h3>
        {sortedGoals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No goals recorded yet</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {sortedGoals.map(goal => {
              const isHome = goal.team_id === match.home_team?.id;
              return (
                <li key={goal.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-sm font-mono text-gray-500 w-8 shrink-0">{goal.minute}'</span>
                  <span className="text-base">⚽</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm">
                      {goal.player?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({isHome ? match.home_team?.name : match.away_team?.name})
                    </span>
                    {goal.created_by && (
                      <span className="text-xs text-gray-300 ml-2">· logged by {goal.created_by.split('@')[0]}</span>
                    )}
                  </div>
                  {user && match.status !== 'finished' && (
                    <button
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Match info + audit */}
      <div className="card text-sm text-gray-500 space-y-1">
        <p><span className="font-medium text-gray-700">Date:</span> {new Date(match.match_date).toLocaleString()}</p>
        <p><span className="font-medium text-gray-700">League:</span> {match.league?.name} ({match.league?.season})</p>
        {match.created_by && (
          <p><span className="font-medium text-gray-700">Scheduled by:</span> {match.created_by}</p>
        )}
        {match.updated_by && (
          <p>
            <span className="font-medium text-gray-700">Last updated by:</span> {match.updated_by}
            {match.updated_at && <span className="text-gray-400"> · {new Date(match.updated_at).toLocaleString()}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
