import { useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatarMoeda } from '../utils/helpers';
import { SkeletonCard } from '../components/LoadingSkeleton';
import type { Aposta } from '../types';

const CORES_STATUS: Record<string, string> = {
  PAGO: 'bg-primary/15 text-primary-light border-primary/30',
  'AGUARDANDO CONFERENCIA': 'bg-gold/15 text-gold border-gold/30',
  PENDENTE: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  CANCELADO: 'bg-red-500/15 text-red-400 border-red-500/30',
  PREMIADO: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export default function Consulta() {
  const [whatsapp, setWhatsapp] = useState('');
  const [apostas, setApostas] = useState<Aposta[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const { notificar } = useToast();

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsapp.trim()) {
      notificar('Digite o WhatsApp usado na aposta.', 'erro');
      return;
    }
    setCarregando(true);
    const resp = await api.apostas.porWhatsapp(whatsapp);
    setCarregando(false);
    if (!resp.ok) {
      notificar(resp.error || 'Não foi possível buscar seus jogos.', 'erro');
      return;
    }
    setApostas((resp.data as Aposta[]) ?? []);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Meus jogos</h1>
      <p className="text-gray-400 text-sm mb-6">Digite o WhatsApp usado no cadastro para ver suas apostas.</p>

      <form onSubmit={buscar} className="flex gap-2 mb-8">
        <input
          className="input"
          placeholder="(35) 99999-9999"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
        />
        <button className="bg-primary hover:bg-primary-dark text-white rounded-xl px-5 flex items-center gap-2 focus-ring">
          <Search size={16} /> Buscar
        </button>
      </form>

      {carregando && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!carregando && apostas && apostas.length === 0 && (
        <p className="text-gray-400 text-center py-10">Nenhuma aposta encontrada para esse WhatsApp.</p>
      )}

      {!carregando && apostas && apostas.length > 0 && (
        <div className="space-y-3">
          {apostas.map((a) => (
            <div key={a.id} className="bg-bg-card rounded-2xl p-4 border border-white/5 animate-slideUp">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm text-gray-400">{a.protocolo}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${CORES_STATUS[a.status] ?? ''}`}>
                  {a.status}
                </span>
              </div>
              <p className="font-semibold mb-1">{a.numeros.join(' - ')}</p>
              <p className="text-sm text-gray-400">
                {formatarMoeda(a.valor)} · {a.data} {a.hora}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
