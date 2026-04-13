import { useState, useEffect } from 'react';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function StandingsPage() {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leagueLoading, setLeagueLoading] = useState(true);

  useEffect(() => {
    api.get('/api/leagues').then(r => {
      setLeagues(r.data);
      if (r.data.length > 0) setSelectedLeague(r.data[0].id);
    }).finally(() => setLeagueLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    api.get(`/api/standings/${selectedLeague}`)
      .then(r => setStandings(r.data))
      .catch(() => setStandings([]))
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  const leagueInfo = leagues.find(l => l.id === selectedLeague);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Standings</h1>
          <p className="text-sm text-gray-500 mt-0.5">League table computed from finished matches</p>
        </div>
      </div>

      <div className="mb-5">
        <select
          className="input max-w-xs"
          value={selectedLeague}
          onChange={e => setSelectedLeague(e.target.value)}
          disabled={leagueLoading}
        >
          <option value="">Select a league…</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : standings.length === 0 ? (
        <EmptyState
          icon="📊"
          message={selectedLeague ? "No finished matches yet — complete some matches to see standings." : "Select a league to view standings."}
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          {leagueInfo && (
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800">{leagueInfo.name} <span className="text-gray-400 font-normal text-sm">· {leagueInfo.season}</span></p>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Team</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">P</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">W</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">D</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">L</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">GF</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">GA</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">GD</th>
                <th className="text-center px-4 py-3 font-bold text-gray-700">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {standings.map((row, i) => (
                <tr key={row.id} className={i === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.played}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.won}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.drawn}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.lost}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.goals_for}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.goals_against}</td>
                  <td className="px-3 py-3 text-center text-gray-600">
                    {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-green-700">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
