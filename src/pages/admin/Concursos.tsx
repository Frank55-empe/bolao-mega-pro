import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Power } from 'lucide-react';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatarMoeda } from '../../utils/helpers';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonCard } from '../../components/LoadingSkeleton';
import type { Concurso } from '../../types';
import AdminNav from './AdminNav';

const CONCURSO_VAZIO = {
  nome: '',
  numero: 0,
  valorAposta: 5,
  premioEstimado: 0,
  dataLimite: '',
  status: 'ABERTO' as const,
};

export default function AdminConcursos() {
  const adminToken = useRequireAdmin();
  const { notificar } = useToast();
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<typeof CONCURSO_VAZIO>(CONCURSO_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const resp = await api.concursos.listar();
    if (resp.ok) setConcursos((resp.data as Concurso[]) ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    if (adminToken) carregar();
  }, [adminToken]);

  if (!adminToken) return null;

  function abrirNovo() {
    setForm(CONCURSO_VAZIO);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEdicao(c: Concurso) {
    setForm({
      nome: c.nome,
      numero: c.numero,
      valorAposta: c.valorAposta,
      premioEstimado: c.premioEstimado,
      dataLimite: c.dataLimite?.slice(0, 16) ?? '',
      status: c.status === 'ABERTO' ? 'ABERTO' : 'ABERTO',
    });
    setEditandoId(c.id);
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    const resp = editandoId
      ? await api.concursos.editar(editandoId, form, adminToken)
      : await api.concursos.criar(form, adminToken);

    if (!resp.ok) {
      notificar(resp.error || 'Não foi possível salvar o concurso.', 'erro');
      return;
    }
    notificar(editandoId ? 'Concurso atualizado.' : 'Concurso criado.', 'sucesso');
    setMostrarForm(false);
    carregar();
  }

  async function duplicar(c: Concurso) {
    if (!adminToken) return;
    const resp = await api.concursos.criar(
      { ...c, nome: `${c.nome} (cópia)`, numero: c.numero + 1 },
      adminToken
    );
    if (resp.ok) {
      notificar('Concurso duplicado.', 'sucesso');
      carregar();
    }
  }

  async function encerrar(c: Concurso) {
    if (!adminToken) return;
    const resp = await api.concursos.editar(c.id, { status: 'ENCERRADO' }, adminToken);
    if (resp.ok) {
      notificar('Concurso encerrado.', 'info');
      carregar();
    }
  }

  async function excluir() {
    if (!adminToken || !excluirId) return;
    const resp = await api.concursos.excluir(excluirId, adminToken);
    setExcluirId(null);
    if (resp.ok) {
      notificar('Concurso excluído.', 'sucesso');
      carregar();
    } else {
      notificar(resp.error || 'Não foi possível excluir.', 'erro');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Concursos</h1>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-xl px-4 py-2 text-sm focus-ring">
          <Plus size={16} /> Novo concurso
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-bg-card rounded-2xl p-5 border border-white/5 mb-6 grid sm:grid-cols-2 gap-4 animate-slideUp">
          <Campo label="Nome">
            <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </Campo>
          <Campo label="Número do concurso">
            <input type="number" className="input" value={form.numero} onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })} required />
          </Campo>
          <Campo label="Valor da aposta (R$)">
            <input type="number" step="0.01" className="input" value={form.valorAposta} onChange={(e) => setForm({ ...form, valorAposta: Number(e.target.value) })} required />
          </Campo>
          <Campo label="Prêmio estimado (R$)">
            <input type="number" step="0.01" className="input" value={form.premioEstimado} onChange={(e) => setForm({ ...form, premioEstimado: Number(e.target.value) })} required />
          </Campo>
          <Campo label="Data limite para apostas">
            <input type="datetime-local" className="input" value={form.dataLimite} onChange={(e) => setForm({ ...form, dataLimite: e.target.value })} required />
          </Campo>
          <div className="sm:col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setMostrarForm(false)} className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 focus-ring">
              Cancelar
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white focus-ring">
              Salvar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="space-y-3">
          {concursos.map((c) => (
            <div key={c.id} className="bg-bg-card rounded-2xl p-4 border border-white/5 flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-semibold">{c.nome} · #{c.numero}</p>
                <p className="text-sm text-gray-400">
                  {formatarMoeda(c.valorAposta)} por número · Prêmio {formatarMoeda(c.premioEstimado)} ·{' '}
                  <span className={c.status === 'ABERTO' ? 'text-primary-light' : 'text-gray-500'}>{c.status}</span>
                </p>
              </div>
              <div className="flex gap-1">
                <IconBtn onClick={() => abrirEdicao(c)} titulo="Editar"><Pencil size={15} /></IconBtn>
                <IconBtn onClick={() => duplicar(c)} titulo="Duplicar"><Copy size={15} /></IconBtn>
                {c.status === 'ABERTO' && (
                  <IconBtn onClick={() => encerrar(c)} titulo="Encerrar"><Power size={15} /></IconBtn>
                )}
                <IconBtn onClick={() => setExcluirId(c.id)} titulo="Excluir" perigo><Trash2 size={15} /></IconBtn>
              </div>
            </div>
          ))}
          {concursos.length === 0 && <p className="text-gray-400 text-center py-10">Nenhum concurso cadastrado ainda.</p>}
        </div>
      )}

      <ConfirmDialog
        aberto={!!excluirId}
        titulo="Excluir concurso"
        mensagem="Essa ação não pode ser desfeita. As apostas ligadas a esse concurso continuarão na planilha, mas o concurso some da lista."
        confirmarLabel="Excluir"
        perigo
        onConfirmar={excluir}
        onCancelar={() => setExcluirId(null)}
      />
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({ children, onClick, titulo, perigo = false }: { children: React.ReactNode; onClick: () => void; titulo: string; perigo?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={titulo}
      className={`p-2 rounded-lg hover:bg-white/5 focus-ring ${perigo ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300'}`}
    >
      {children}
    </button>
  );
}
