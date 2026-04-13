import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';

const STATUS_COLORS = {
  scheduled: 'badge-scheduled',
  in_progress: 'badge-in_progress',
  finished: 'badge-finished',
};
const STATUS_LABELS = { scheduled: 'Scheduled', in_progress: 'Live', finished: 'Finished' };

function StandingsTable({ league }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/standings/${league.id}`)
      .then(r => setStandings(r.data))
      .catch(() => setStandings([]))
      .finally(() => setLoading(false));
  }, [league.id]);

  return (
    <div className="card overflow-x-auto p-0">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="font-semibold text-gray-800">
          {league.name}
          <span className="text-gray-400 font-normal text-sm ml-2">· {league.season}</span>
        </p>
        <Link to="/standings" className="text-xs text-green-700 hover:underline">Full table →</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : standings.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No finished matches yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-6">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Team</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-500">P</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-500">W</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-500">D</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-500">L</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-500">GD</th>
              <th className="text-center px-4 py-2.5 font-bold text-gray-700">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {standings.map((row, i) => (
              <tr key={row.id} className={i === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{row.played}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{row.won}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{row.drawn}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{row.lost}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">
                  {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RecentMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/matches')
      .then(r => setMatches(r.data.slice(0, 5)))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;
  if (matches.length === 0) return null;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="font-semibold text-gray-800">Recent Matches</p>
        <Link to="/matches" className="text-xs text-green-700 hover:underline">All matches →</Link>
      </div>
      <ul className="divide-y divide-gray-50">
        {matches.map(match => (
          <li key={match.id}>
            <Link
              to={`/matches/${match.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className={STATUS_COLORS[match.status]}>{STATUS_LABELS[match.status]}</span>
              <span className="text-sm font-medium text-gray-900 flex-1 text-right">{match.home_team?.name}</span>
              <span className="text-base font-bold text-green-700 tabular-nums w-16 text-center">
                {match.status !== 'scheduled' ? `${match.home_score} – ${match.away_score}` : 'vs'}
              </span>
              <span className="text-sm font-medium text-gray-900 flex-1">{match.away_team?.name}</span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/leagues')
      .then(r => setLeagues(r.data))
      .catch(() => setLeagues([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚽ Soccer Score Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Live scores, standings and match history</p>
      </div>

      {/* Recent matches strip */}
      <RecentMatches />

      {/* Standings — one table per league */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Standings</h2>
          <Link to="/standings" className="text-xs text-green-700 hover:underline">View all →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : leagues.length === 0 ? (
          <div className="card text-center py-12 text-gray-400 text-sm">
            No leagues yet. <Link to="/leagues" className="text-green-700 hover:underline">Create one →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {leagues.map(league => (
              <StandingsTable key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
