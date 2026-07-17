// Camada de comunicação com o backend (Google Apps Script Web App).
//
// IMPORTANTE sobre CORS com Apps Script:
// O Apps Script não responde a "preflight" (requisição OPTIONS) do jeito que
// um servidor comum responde. Se você mandar um POST com Content-Type
// "application/json" o navegador dispara um preflight e o Apps Script derruba
// a conexão (erro de CORS no console, mesmo o backend estando 100% certo).
//
// A solução testada e estável: enviar o body como texto puro
// (Content-Type: text/plain;charset=utf-8) e fazer o parse do JSON dentro do
// Code.gs. Isso evita o preflight porque vira uma "requisição simples" aos
// olhos do navegador. O código do Code.gs já está preparado para isso.

import type { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL as string;

if (!BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[api] VITE_API_URL não configurado. Copie .env.example para .env e cole a URL do seu Web App do Apps Script.'
  );
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequisicaoParams {
  endpoint: string;
  metodo?: Metodo;
  dados?: Record<string, unknown>;
  adminToken?: string;
}

/**
 * Faz uma chamada à API do Apps Script.
 * GET: parâmetros vão na query string.
 * POST/PUT/DELETE: o "metodo" real e os dados vão dentro do body (o Apps
 * Script só aceita GET/POST nativamente, então simulamos PUT/DELETE com um
 * campo "_metodo" que o backend interpreta).
 */
export async function requisitar<T = unknown>({
  endpoint,
  metodo = 'GET',
  dados = {},
  adminToken,
}: RequisicaoParams): Promise<ApiResponse<T>> {
  try {
    if (metodo === 'GET') {
      const params = new URLSearchParams({ endpoint, ...(dados as Record<string, string>) });
      if (adminToken) params.set('adminToken', adminToken);
      const resp = await fetch(`${BASE_URL}?${params.toString()}`);
      return await resp.json();
    }

    const payload = {
      endpoint,
      _metodo: metodo,
      adminToken,
      ...dados,
    };

    const resp = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // evita preflight, ver nota acima
      },
      body: JSON.stringify(payload),
    });

    return await resp.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Falha de conexão com o servidor.' };
  }
}

// ---- Atalhos por recurso, para não espalhar strings de endpoint pelo app ----

export const api = {
  concursos: {
    listar: () => requisitar({ endpoint: 'concursos', metodo: 'GET' }),
    ativo: () => requisitar({ endpoint: 'concursos/ativo', metodo: 'GET' }),
    criar: (dados: Record<string, unknown>, adminToken: string) =>
      requisitar({ endpoint: 'concursos', metodo: 'POST', dados, adminToken }),
    editar: (id: string, dados: Record<string, unknown>, adminToken: string) =>
      requisitar({ endpoint: 'concursos', metodo: 'PUT', dados: { id, ...dados }, adminToken }),
    excluir: (id: string, adminToken: string) =>
      requisitar({ endpoint: 'concursos', metodo: 'DELETE', dados: { id }, adminToken }),
  },
  participantes: {
    criar: (dados: Record<string, unknown>) => requisitar({ endpoint: 'participantes', metodo: 'POST', dados }),
    buscarPorWhatsapp: (whatsapp: string) =>
      requisitar({ endpoint: 'participantes/buscar', metodo: 'GET', dados: { whatsapp } }),
    listar: (adminToken: string) => requisitar({ endpoint: 'participantes', metodo: 'GET', adminToken }),
  },
  apostas: {
    criar: (dados: Record<string, unknown>) => requisitar({ endpoint: 'apostas', metodo: 'POST', dados }),
    porWhatsapp: (whatsapp: string) => requisitar({ endpoint: 'apostas/consulta', metodo: 'GET', dados: { whatsapp } }),
    alterarStatus: (id: string, status: string, adminToken: string) =>
      requisitar({ endpoint: 'apostas', metodo: 'PUT', dados: { id, status }, adminToken }),
  },
  pagamentos: {
    confirmar: (idAposta: string) => requisitar({ endpoint: 'pagamentos', metodo: 'POST', dados: { idAposta } }),
  },
  admin: {
    login: (senha: string) => requisitar({ endpoint: 'login', metodo: 'POST', dados: { senha } }),
    dashboard: (adminToken: string) => requisitar({ endpoint: 'dashboard', metodo: 'GET', adminToken }),
  },
  config: {
    obter: () => requisitar({ endpoint: 'config', metodo: 'GET' }),
  },
};
