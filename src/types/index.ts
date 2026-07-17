// Tipos centrais do sistema. Mantidos em um único arquivo para facilitar
// import e evitar duplicidade entre páginas/componentes.

export type StatusAposta = 'PENDENTE' | 'AGUARDANDO CONFERENCIA' | 'PAGO' | 'CANCELADO' | 'PREMIADO';

export interface Participante {
  id: string;
  nome: string;
  nomeExibicao: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  cpf?: string;
  data: string;
  hora: string;
}

export interface Concurso {
  id: string;
  nome: string;
  numero: number;
  valorAposta: number;
  premioEstimado: number;
  dataLimite: string; // ISO
  status: 'ABERTO' | 'ENCERRADO';
  qtdParticipantes?: number;
  arrecadado?: number;
}

export interface Aposta {
  id: string;
  idParticipante: string;
  concursoId: string;
  numeros: number[];
  quantidade: number;
  valor: number;
  status: StatusAposta;
  data: string;
  hora: string;
  protocolo: string;
}

export interface Pagamento {
  id: string;
  idAposta: string;
  pixCopiaCola: string;
  status: StatusAposta;
  comprovanteUrl?: string;
  data: string;
  hora: string;
}

export interface DashboardData {
  totalParticipantes: number;
  valorArrecadado: number;
  valorLiquido: number;
  valorPremio: number;
  totalPago: number;
  totalPendente: number;
  porCidade: { cidade: string; total: number }[];
  porEstado: { estado: string; total: number }[];
  porDia: { dia: string; total: number }[];
}

export interface CadastroForm {
  nome: string;
  nomeExibicao: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  cpf?: string;
  aceitouRegulamento: boolean;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
