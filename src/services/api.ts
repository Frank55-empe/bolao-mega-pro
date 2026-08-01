// Comunicação com o backend via JSONP (não fetch) — o Apps Script não manda
// CORS de forma confiável pra sites externos, então usamos uma tag <script>
// pra contornar isso. Tudo viaja como GET com os dados dentro de "payload".
import type { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL as string;

if (!BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('[api] VITE_API_URL não configurado.');
}

let contadorJsonp = 0;
const TIMEOUT_MS = 15000;

function requisitarJSONP<T>(query: Record<string, string>): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    const callbackName = `bolaoCallback_${Date.now()}_${contadorJsonp++}`;
    let finalizado = false;
    const limpar = () => {
      if (finalizado) return;
      finalizado = true;
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
      clearTimeout(timeoutId);
    };
    (window as unknown as Record<string, (data: ApiResponse<T>) => void>)[callbackName] = (data) => {
      limpar();
      resolve(data);
    };
    const params = new URLSearchParams({ ...query, callback: callbackName });
    const script = document.createElement('script');
    script.src = `${BASE_URL}?${params.toString()}`;
    script.onerror = () => {
      limpar();
      resolve({ ok: false, error: 'Não foi possível conectar ao servidor (verifique a URL do Apps Script).' });
    };
    const timeoutId = setTimeout(() => {
      limpar();
      resolve({ ok: false, error: 'Tempo de conexão esgotado. Tente novamente.' });
    }, TIMEOUT_MS);
    document.body.appendChild(script);
  });
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface RequisicaoParams { endpoint: string; metodo?: Metodo; dados?: Record<string, unknown>; adminToken?: string; }

export async function requisitar<T = unknown>({ endpoint, metodo = 'GET', dados = {}, adminToken }: RequisicaoParams): Promise<ApiResponse<T>> {
  try {
    return await requisitarJSONP<T>({
      endpoint, _metodo: metodo, adminToken: adminToken || '', payload: JSON.stringify(dados),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Falha de conexão com o servidor.' };
  }
}

export const api = {
  concursos: {
    listar: () => requisitar({ endpoint: 'concursos', metodo: 'GET' }),
    ativo: () => requisitar({ endpoint: 'concursos/ativo', metodo: 'GET' }),
    criar: (dados: Record<string, unknown>, adminToken: string) => requisitar({ endpoint: 'concursos', metodo: 'POST', dados, adminToken }),
    editar: (id: string, dados: Record<string, unknown>, adminToken: string) => requisitar({ endpoint: 'concursos', metodo: 'PUT', dados: { id, ...dados }, adminToken }),
    excluir: (id: string, adminToken: string) => requisitar({ endpoint: 'concursos', metodo: 'DELETE', dados: { id }, adminToken }),
  },
  participantes: {
    criar: (dados: Record<string, unknown>) => requisitar({ endpoint: 'participantes', metodo: 'POST', dados }),
    buscarPorWhatsapp: (whatsapp: string) => requisitar({ endpoint: 'participantes/buscar', metodo: 'GET', dados: { whatsapp } }),
    listar: (adminToken: string) => requisitar({ endpoint: 'participantes', metodo: 'GET', adminToken }),
  },
  apostas: {
    criar: (dados: Record<string, unknown>) => requisitar({ endpoint: 'apostas', metodo: 'POST', dados }),
    porWhatsapp: (whatsapp: string) => requisitar({ endpoint: 'apostas/consulta', metodo: 'GET', dados: { whatsapp } }),
    alterarStatus: (id: string, status: string, adminToken: string) => requisitar({ endpoint: 'apostas', metodo: 'PUT', dados: { id, status }, adminToken }),
  },
  pagamentos: { confirmar: (idAposta: string) => requisitar({ endpoint: 'pagamentos', metodo: 'POST', dados: { idAposta } }) },
  admin: {
    login: (senha: string) => requisitar({ endpoint: 'login', metodo: 'POST', dados: { senha } }),
    dashboard: (adminToken: string) => requisitar({ endpoint: 'dashboard', metodo: 'GET', adminToken }),
  },
  config: { obter: () => requisitar({ endpoint: 'config', metodo: 'GET' }) },
};
