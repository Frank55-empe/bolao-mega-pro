import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

export default function AdminLogin() {
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { setAdminToken } = useApp();
  const { notificar } = useToast();
  const navigate = useNavigate();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const resp = await api.admin.login(senha);
    setCarregando(false);

    if (!resp.ok || !resp.data) {
      notificar('Senha incorreta.', 'erro');
      return;
    }
    const token = (resp.data as { token: string }).token;
    setAdminToken(token);
    navigate('/admin/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <div className="text-center mb-6">
        <span className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
          <Lock className="text-primary" size={22} />
        </span>
        <h1 className="text-xl font-bold">Painel administrativo</h1>
      </div>
      <form onSubmit={entrar} className="space-y-4">
        <input
          type="password"
          className="input"
          placeholder="Senha de administrador"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus
        />
        <button disabled={carregando} className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold rounded-xl py-3 focus-ring">
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
