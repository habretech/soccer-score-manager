import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { AuthAction, ReadOnlyBanner } from '../components/AuthGuard.jsx';

const STATUS_LABELS = { scheduled: 'Scheduled', in_progress: 'Live', finished: 'Finished' };

function MatchForm({ leagues, onSave, onClose }) {
  const [leagueId, setLeagueId] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!leagueId) { setTeams([]); return; }
    api.get('/api/teams', { params: { league_id: leagueId } }).then(r => setTeams(r.data));
  }, [leagueId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/matches', {
        league_id: leagueId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: matchDate,
      });
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
        <label className="label">League</label>
        <select className="input" value={leagueId} onChange={e => { setLeagueId(e.target.value); setHomeTeamId(''); setAwayTeamId(''); }} required>
          <option value="">Select a league…</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
        </select>
      </div>
      <div>
        <label className="label">Home Team</label>
        <select className="input" value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} required disabled={!leagueId}>
          <option value="">Select home team…</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Away Team</label>
        <select className="input" value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} required disabled={!leagueId}>
          <option value="">Select away team…</option>
          {teams.filter(t => t.id !== homeTeamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Match Date &amp; Time</label>
        <input type="datetime-local" className="input" value={matchDate} onChange={e => setMatchDate(e.target.value)} required />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Schedule Match'}
        </button>
      </div>
    </form>
  );
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [filterLeague, setFilterLeague] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterLeague) params.league_id = filterLeague;
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      const [matchesRes, leaguesRes] = await Promise.all([
        api.get('/api/matches', { params }),
        api.get('/api/leagues'),
      ]);
      setMatches(matchesRes.data);
      setLeagues(leaguesRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterLeague, filterStatus, filterDate]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this match?')) return;
    await api.delete(`/api/matches/${id}`);
    load();
  };

  const fmt = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and track match results</p>
        </div>
        <AuthAction><button className="btn-primary" onClick={() => setShowModal(true)}>+ Schedule Match</button></AuthAction>
      </div>
      <ReadOnlyBanner />

      <div className="flex flex-wrap gap-3 mb-6">
        <select className="input max-w-[200px]" value={filterLeague} onChange={e => setFilterLeague(e.target.value)}>
          <option value="">All Leagues</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">Live</option>
          <option value="finished">Finished</option>
        </select>
        <input type="date" className="input max-w-[160px]" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        {(filterLeague || filterStatus || filterDate) && (
          <button className="btn-secondary btn-sm" onClick={() => { setFilterLeague(''); setFilterStatus(''); setFilterDate(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon="⚽"
          message="No matches found. Schedule a match to get started."
          action={<AuthAction><button className="btn-primary" onClick={() => setShowModal(true)}>Schedule Match</button></AuthAction>}
        />
      ) : (
        <div className="space-y-3">
          {matches.map(match => (
            <div
              key={match.id}
              className="card cursor-pointer hover:border-green-200 hover:shadow-md transition-all"
              onClick={() => navigate(`/matches/${match.id}`)}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`badge-${match.status}`}>{STATUS_LABELS[match.status]}</span>
                    <span className="text-xs text-gray-400">{match.league?.name} · {fmt(match.match_date)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-semibold text-gray-900 flex-1 text-right">{match.home_team?.name}</span>
                    <span className="text-2xl font-bold text-green-700 tabular-nums">
                      {match.status !== 'scheduled' ? `${match.home_score} – ${match.away_score}` : 'vs'}
                    </span>
                    <span className="font-semibold text-gray-900 flex-1">{match.away_team?.name}</span>
                  </div>
                </div>
                <AuthAction inline>
                  <button
                    className="btn-danger btn-sm shrink-0"
                    onClick={(e) => handleDelete(e, match.id)}
                  >
                    Delete
                  </button>
                </AuthAction>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Schedule Match" onClose={() => setShowModal(false)}>
          <MatchForm
            leagues={leagues}
            onSave={() => { setShowModal(false); load(); }}
            onClose={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
