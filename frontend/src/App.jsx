import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LeaguesPage from './pages/LeaguesPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import MatchDetailPage from './pages/MatchDetailPage.jsx';
import StandingsPage from './pages/StandingsPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';

const navItems = [
  { to: '/leagues', label: 'Leagues' },
  { to: '/matches', label: 'Matches' },
  { to: '/standings', label: 'Standings' },
  { to: '/teams', label: 'Teams' },
  { to: '/players', label: 'Players' },
];

function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-green-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-lg mr-4">
          <img src="https://rkamal.com.np/images/icons/flag.gif" alt="flag" className="h-6 w-auto" />
          Soccer Score Manager
        </NavLink>
        <nav className="flex gap-1 flex-wrap flex-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-green-800'
                    : 'text-green-100 hover:bg-green-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {user ? (
            <>
              <span className="text-green-200 text-xs hidden sm:block truncate max-w-[160px]">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="btn bg-green-700 border border-green-600 text-white hover:bg-green-600 text-xs px-3 py-1.5"
              >
                Sign Out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-white text-green-800' : 'bg-green-700 text-white hover:bg-green-600'
                }`
              }
            >
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/players" element={<PlayersPage />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        Soccer Score Manager — Let the fun begin
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
