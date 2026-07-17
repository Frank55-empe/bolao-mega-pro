import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { validarWhatsApp } from '../utils/helpers';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Cadastro() {
  const navigate = useNavigate();
  const { setParticipante } = useApp();
  const { notificar } = useToast();

  const [form, setForm] = useState({
    nome: '',
    nomeExibicao: '',
    whatsapp: '',
    cidade: '',
    estado: '',
    cpf: '',
    aceitouRegulamento: false,
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (!form.nome.trim()) novosErros.nome = 'Informe seu nome completo.';
    if (!form.nomeExibicao.trim()) novosErros.nomeExibicao = 'Informe um nome para exibição.';
    if (!validarWhatsApp(form.whatsapp)) novosErros.whatsapp = 'WhatsApp inválido. Use DDD + número.';
    if (!form.cidade.trim()) novosErros.cidade = 'Informe sua cidade.';
    if (!form.estado) novosErros.estado = 'Selecione o estado.';
    if (!form.aceitouRegulamento) novosErros.aceitouRegulamento = 'É preciso aceitar o regulamento para continuar.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleContinuar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) {
      notificar('Confira os campos destacados.', 'erro');
      return;
    }
    setParticipante(form);
    navigate('/numeros');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Seus dados</h1>
      <p className="text-gray-400 text-sm mb-6">Usamos isso só para identificar sua aposta e avisar no WhatsApp.</p>

      <form onSubmit={handleContinuar} className="space-y-4 bg-bg-card rounded-2xl p-5 border border-white/5">
        <Campo label="Nome completo" erro={erros.nome}>
          <input
            className="input"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: Maria da Silva"
          />
        </Campo>

        <Campo label="Nome para exibição" erro={erros.nomeExibicao}>
          <input
            className="input"
            value={form.nomeExibicao}
            onChange={(e) => setForm({ ...form, nomeExibicao: e.target.value })}
            placeholder="Como quer aparecer no ranking"
          />
        </Campo>

        <Campo label="WhatsApp" erro={erros.whatsapp}>
          <input
            className="input"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="(35) 99999-9999"
            inputMode="tel"
          />
        </Campo>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Campo label="Cidade" erro={erros.cidade}>
              <input className="input" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </Campo>
          </div>
          <Campo label="UF" erro={erros.estado}>
            <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="">--</option>
              {ESTADOS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo label="CPF (opcional)">
          <input className="input" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
        </Campo>

        <label className="flex items-start gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 accent-primary"
            checked={form.aceitouRegulamento}
            onChange={(e) => setForm({ ...form, aceitouRegulamento: e.target.checked })}
          />
          Li e aceito o <a href="/regulamento" className="text-primary underline">regulamento do bolão</a>.
        </label>
        {erros.aceitouRegulamento && <p className="text-red-400 text-xs -mt-2">{erros.aceitouRegulamento}</p>}

        <button type="submit" className="w-full bg-primary hover:bg-primary-dark transition-colors text-white font-semibold rounded-xl py-3 focus-ring">
          Continuar
        </button>
      </form>
    </div>
  );
}

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      {children}
      {erro && <p className="text-red-400 text-xs mt-1">{erro}</p>}
    </div>
  );
}
