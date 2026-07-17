import { useEffect, useMemo, useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { SkeletonCard } from '../../components/LoadingSkeleton';
import type { Aposta } from '../../types';
import AdminNav from './AdminNav';

const STATUS_FILTROS = ['TODOS', 'PENDENTE', 'AGUARDANDO CONFERENCIA', 'PAGO', 'CANCELADO', 'PREMIADO'];
const POR_PAGINA = 10;

export default function AdminParticipantes() {
  const adminToken = useRequireAdmin();
  const { notificar } = useToast();
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    if (!adminToken) return;
    api.participantes.listar(adminToken).then((resp) => {
      // O endpoint "participantes" no modo admin devolve as apostas já
      // combinadas com dados do participante (join feito no Apps Script).
      if (resp.ok) setApostas((resp.data as Aposta[]) ?? []);
      setCarregando(false);
    });
  }, [adminToken]);

  const filtradas = useMemo(() => {
    return apostas.filter((a) => {
      const passaStatus = filtroStatus === 'TODOS' || a.status === filtroStatus;
      const passaBusca = busca.trim() === '' || JSON.stringify(a).toLowerCase().includes(busca.toLowerCase());
      return passaStatus && passaBusca;
    });
  }, [apostas, filtroStatus, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pagina_atual = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  async function alterarStatus(id: string, novoStatus: string) {
    if (!adminToken) return;
    const resp = await api.apostas.alterarStatus(id, novoStatus, adminToken);
    if (resp.ok) {
      setApostas((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus as Aposta['status'] } : a)));
      notificar('Status atualizado.', 'sucesso');
    } else {
      notificar(resp.error || 'Não foi possível atualizar.', 'erro');
    }
  }

  function exportarCsv() {
    const cabecalho = ['ID', 'Protocolo', 'Números', 'Valor', 'Status', 'Data'];
    const linhas = filtradas.map((a) => [a.id, a.protocolo, a.numeros.join(' '), a.valor, a.status, a.data]);
    const csv = [cabecalho, ...linhas].map((l) => l.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apostas.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!adminToken) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Participantes e apostas</h1>
        <button onClick={exportarCsv} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2 text-sm focus-ring">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, protocolo, cidade..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <select
          className="input sm:w-56"
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value);
            setPagina(1);
          }}
        >
          {STATUS_FILTROS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {carregando ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead className="bg-bg-card text-gray-400 text-left">
                <tr>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Números</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {pagina_atual.map((a) => (
                  <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-xs text-gray-400">{a.protocolo}</td>
                    <td className="p-3">{a.numeros.join(' - ')}</td>
                    <td className="p-3">R$ {a.valor.toFixed(2)}</td>
                    <td className="p-3">
                      <select
                        className="bg-bg-soft border border-white/10 rounded-lg text-xs px-2 py-1 focus-ring"
                        value={a.status}
                        onChange={(e) => alterarStatus(a.id, e.target.value)}
                      >
                        {STATUS_FILTROS.filter((s) => s !== 'TODOS').map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-gray-400">{a.data}</td>
                  </tr>
                ))}
                {pagina_atual.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nada encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4 text-sm">
              <button disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 focus-ring">
                <ChevronLeft size={16} />
              </button>
              <span className="text-gray-400">Página {pagina} de {totalPaginas}</span>
              <button disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 focus-ring">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
