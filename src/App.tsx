import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Debts from './pages/Debts';
import Goals from './pages/Goals';
import Settings from './pages/Settings';

function Navigation() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: '📊' },
    { path: '/add', label: t('nav.addTransaction'), icon: '➕' },
    { path: '/debts', label: t('nav.debts'), icon: '💰' },
    { path: '/goals', label: t('nav.goals'), icon: '🎯' },
    { path: '/settings', label: t('nav.settings'), icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-3 px-4 transition-colors ${
              isActive(item.path) ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-primary-600 text-white py-4 px-6 shadow-md">
          <h1 className="text-xl font-bold">Finance Tracker</h1>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
