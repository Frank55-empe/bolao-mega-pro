import React, { createContext, useContext, useState } from 'react';
import type { CadastroForm, Concurso } from '../types';

// Guarda o estado do fluxo de aposta em andamento (cadastro -> números -> pagamento)
// enquanto o usuário navega entre as páginas. Não é autenticação, é só o
// "carrinho" da aposta atual.

interface FluxoApostaState {
  participante: CadastroForm | null;
  numerosEscolhidos: number[];
  concurso: Concurso | null;
  protocolo: string | null;
}

interface AppContextValue {
  fluxo: FluxoApostaState;
  setParticipante: (p: CadastroForm) => void;
  setNumeros: (n: number[]) => void;
  setConcursoAtivo: (c: Concurso) => void;
  setProtocolo: (p: string) => void;
  limparFluxo: () => void;
  adminToken: string | null;
  setAdminToken: (t: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const FLUXO_VAZIO: FluxoApostaState = {
  participante: null,
  numerosEscolhidos: [],
  concurso: null,
  protocolo: null,
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [fluxo, setFluxo] = useState<FluxoApostaState>(FLUXO_VAZIO);
  const [adminToken, setAdminTokenState] = useState<string | null>(
    () => sessionStorage.getItem('adminToken')
  );

  const setParticipante = (p: CadastroForm) => setFluxo((f) => ({ ...f, participante: p }));
  const setNumeros = (n: number[]) => setFluxo((f) => ({ ...f, numerosEscolhidos: n }));
  const setConcursoAtivo = (c: Concurso) => setFluxo((f) => ({ ...f, concurso: c }));
  const setProtocolo = (p: string) => setFluxo((f) => ({ ...f, protocolo: p }));
  const limparFluxo = () => setFluxo(FLUXO_VAZIO);

  const setAdminToken = (t: string | null) => {
    setAdminTokenState(t);
    if (t) sessionStorage.setItem('adminToken', t);
    else sessionStorage.removeItem('adminToken');
  };

  return (
    <AppContext.Provider
      value={{ fluxo, setParticipante, setNumeros, setConcursoAtivo, setProtocolo, limparFluxo, adminToken, setAdminToken }}
    >
      {children}
    </AppContext.Provider>
  );
}
