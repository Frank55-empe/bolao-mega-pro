import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ListChecks, ScrollText, Users, Wallet, CalendarClock } from 'lucide-react';
import { api } from '../services/api';
import { formatarMoeda, formatarContagem } from '../utils/helpers';
import { SkeletonCard } from '../components/LoadingSkeleton';
import type { Concurso } from '../types';
import { useApp } from '../context/AppContext';

export default function Home() {
  const [concurso, setConcurso] = useState<Concurso | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [contagem, setContagem] = useState('');
  const { setConcursoAtivo } = useApp();

  useEffect(() => {
    api.concursos.ativo().then((resp) => {
      if (resp.ok && resp.data) {
        const c = resp.data as Concurso;
        setConcurso(c);
        setConcursoAtivo(c);
      }
      setCarregando(false);
    });
  }, []);

  useEffect(() => {
    if (!concurso) return;
    const tick = () => setContagem(formatarContagem(new Date(concurso.dataLimite).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [concurso]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero: a própria situação do concurso é o "gancho" da página */}
      <section className="bg-gradient-to-br from-bg-card to-bg-soft rounded-3xl p-6 sm:p-10 border border-white/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />

        {carregando ? (
          <div className="space-y-4 relative">
            <SkeletonCard />
          </div>
        ) : concurso ? (
          <div className="relative">
            <p className="text-gold font-semibold text-sm tracking-wide uppercase mb-1">
              {concurso.nome} · Concurso {concurso.numero}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Prêmio estimado de {formatarMoeda(concurso.premioEstimado)}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <InfoStat icone={<Wallet size={16} />} label="Valor da aposta" valor={formatarMoeda(concurso.valorAposta)} />
              <InfoStat icone={<Users size={16} />} label="Participantes" valor={String(concurso.qtdParticipantes ?? 0)} />
              <InfoStat icone={<CalendarClock size={16} />} label="Fecha em" valor={contagem || '—'} />
              <InfoStat icone={<Ticket size={16} />} label="Status" valor={concurso.status === 'ABERTO' ? 'Aberto' : 'Encerrado'} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/cadastro"
                className="bg-primary hover:bg-primary-dark transition-colors text-white font-semibold rounded-xl px-6 py-3 text-center focus-ring"
              >
                Quero participar
              </Link>
              <Link
                to="/consulta"
                className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-6 py-3 text-center flex items-center justify-center gap-2 focus-ring"
              >
                <ListChecks size={18} /> Ver meus jogos
              </Link>
              <Link
                to="/regulamento"
                className="text-gray-400 hover:text-gray-200 rounded-xl px-6 py-3 text-center flex items-center justify-center gap-2 focus-ring"
              >
                <ScrollText size={18} /> Regulamento
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Nenhum concurso aberto no momento. Volte em breve!</p>
        )}
      </section>
    </div>
  );
}

function InfoStat({ icone, label, valor }: { icone: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="bg-black/20 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
        {icone}
        {label}
      </div>
      <p className="font-bold text-sm sm:text-base">{valor}</p>
    </div>
  );
}
