import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Users, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAdminToken } = useApp();

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icone: <LayoutDashboard size={16} /> },
    { to: '/admin/concursos', label: 'Concursos', icone: <Trophy size={16} /> },
    { to: '/admin/participantes', label: 'Participantes', icone: <Users size={16} /> },
  ];

  function sair() {
    setAdminToken(null);
    navigate('/admin');
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 mb-6">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border focus-ring ${
            location.pathname === l.to ? 'bg-primary/15 border-primary/40 text-primary-light' : 'border-white/10 text-gray-300 hover:border-white/20'
          }`}
        >
          {l.icone} {l.label}
        </Link>
      ))}
      <button onClick={sair} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 focus-ring">
        <LogOut size={16} /> Sair
      </button>
    </nav>
  );
}
