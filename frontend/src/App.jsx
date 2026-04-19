import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
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

const navLinkClass = ({ isActive }) =>
  `block w-full md:w-auto text-left md:text-center px-3 py-2.5 md:py-1.5 rounded-md text-sm font-medium transition-colors min-h-[44px] md:min-h-0 flex items-center md:inline-flex justify-center ${
    isActive ? 'bg-white text-green-800' : 'text-green-100 hover:bg-green-700'
  }`;

function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-green-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4 py-2.5 sm:py-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial font-bold text-base sm:text-lg"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="https://rkamal.com.np/images/icons/flag.gif"
              alt=""
              className="h-6 w-auto shrink-0"
            />
            <span className="truncate">Soccer Score Manager</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center flex-wrap" aria-label="Main">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {user ? (
              <>
                <span
                  className="text-green-200 text-xs hidden lg:inline truncate max-w-[180px]"
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn bg-green-700 border border-green-600 text-white hover:bg-green-600 text-xs px-3 py-2 min-h-[44px] md:min-h-0 md:py-1.5"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] md:min-h-0 md:py-1.5 ${
                    isActive ? 'bg-white text-green-800' : 'bg-green-700 text-white hover:bg-green-600'
                  }`
                }
              >
                Sign In
              </NavLink>
            )}

            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-green-100 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          aria-hidden={!menuOpen}
          className={`md:hidden overflow-hidden transition-[max-height] duration-200 ease-out border-t ${
            menuOpen ? 'max-h-[28rem] border-green-700/60' : 'max-h-0 border-transparent'
          }`}
        >
          <nav
            className={`py-2 pb-3 flex flex-col gap-0.5 ${!menuOpen ? 'hidden' : ''}`}
            aria-label="Mobile"
          >
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8">
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
