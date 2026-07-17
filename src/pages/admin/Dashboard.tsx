import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Wallet, TrendingUp, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api';
import { formatarMoeda } from '../../utils/helpers';
import { SkeletonCard } from '../../components/LoadingSkeleton';
import type { DashboardData } from '../../types';
import AdminNav from './AdminNav';

export default function AdminDashboard() {
  const adminToken = useRequireAdmin();
  const { } = useApp();
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!adminToken) return;
    api.admin.dashboard(adminToken).then((resp) => {
      if (resp.ok) setDados(resp.data as DashboardData);
      setCarregando(false);
    });
  }, [adminToken]);

  if (!adminToken) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AdminNav />
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {carregando ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : dados ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Cartao icone={<Users size={18} />} label="Participantes" valor={String(dados.totalParticipantes)} />
            <Cartao icone={<Wallet size={18} />} label="Arrecadado" valor={formatarMoeda(dados.valorArrecadado)} />
            <Cartao icone={<TrendingUp size={18} />} label="Prêmio líquido" valor={formatarMoeda(dados.valorLiquido)} />
            <Cartao icone={<Clock size={18} />} label="Pendente" valor={formatarMoeda(dados.totalPendente)} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <h2 className="font-semibold mb-4 text-sm text-gray-300">Apostas por dia</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dados.porDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="dia" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
                  <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <h2 className="font-semibold mb-4 text-sm text-gray-300">Por cidade</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dados.porCidade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="cidade" stroke="#6b7280" fontSize={12} width={80} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
                  <Bar dataKey="total" fill="#facc15" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400">Não foi possível carregar os dados.</p>
      )}
    </div>
  );
}

function Cartao({ icone, label, valor }: { icone: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
        {icone} {label}
      </div>
      <p className="font-bold text-lg">{valor}</p>
    </div>
  );
}
