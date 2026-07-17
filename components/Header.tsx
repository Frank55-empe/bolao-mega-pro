import { Link, useLocation } from 'react-router-dom';
import { Trophy, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [aberto, setAberto] = useState(false);

  const links = [
    { to: '/', label: 'Início' },
    { to: '/consulta', label: 'Meus Jogos' },
    { to: '/regulamento', label: 'Regulamento' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-white/5">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <Trophy size={18} className="text-gold" />
          </span>
          Bolão da Mega <span className="text-gold">PRO</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`hover:text-primary transition-colors focus-ring rounded ${
                location.pathname === l.to ? 'text-primary font-semibold' : 'text-gray-300'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button className="sm:hidden focus-ring rounded" onClick={() => setAberto((v) => !v)} aria-label="Abrir menu">
          <Menu size={22} />
        </button>
      </div>

      {aberto && (
        <nav className="sm:hidden flex flex-col gap-1 px-4 pb-3 animate-slideUp">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setAberto(false)}
              className="py-2 px-3 rounded-lg hover:bg-bg-card text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
