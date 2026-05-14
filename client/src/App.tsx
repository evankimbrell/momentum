import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PersonProfile from './pages/PersonProfile';
import Followups from './pages/Followups';
import { LayoutGrid, Calendar, Users } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const isProfile = location.pathname.startsWith('/people/');
  if (isProfile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-white/8 flex z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {[
        { to: '/', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
        { to: '/followups', icon: <Calendar size={20} />, label: 'Follow-ups' },
        { to: '/people', icon: <Users size={20} />, label: 'All People' },
      ].map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
              isActive ? 'text-white' : 'text-zinc-600'
            }`
          }
        >
          {icon}
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col bg-[#0a0a0a] overflow-hidden"
        style={{
          height: '100dvh',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/people" element={<AllPeopleRedirect />} />
            <Route path="/people/:id" element={<PersonProfile />} />
            <Route path="/followups" element={<Followups />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

function AllPeopleRedirect() {
  return <Dashboard />;
}
