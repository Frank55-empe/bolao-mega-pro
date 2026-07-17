// Funções utilitárias puras, sem dependência de React.

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function validarWhatsApp(numero: string): boolean {
  const limpo = numero.replace(/\D/g, '');
  return /^(?:55)?\d{2}9?\d{8}$/.test(limpo);
}

export function normalizarWhatsApp(numero: string): string {
  let limpo = numero.replace(/\D/g, '');
  if (!limpo.startsWith('55')) limpo = '55' + limpo;
  return limpo;
}

/** Gera um protocolo único e legível para a aposta. Ex: MEGA-7F3K9A */
export function gerarProtocolo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MEGA-${codigo}`;
}

/** Sorteia N números únicos entre 1 e 60 (função "Surpresa"). */
export function sortearNumeros(qtd: number): number[] {
  const disponiveis = Array.from({ length: 60 }, (_, i) => i + 1);
  const escolhidos: number[] = [];
  for (let i = 0; i < qtd; i++) {
    const idx = Math.floor(Math.random() * disponiveis.length);
    escolhidos.push(disponiveis.splice(idx, 1)[0]);
  }
  return escolhidos.sort((a, b) => a - b);
}

export function montarMensagemWhatsApp(params: {
  nome: string;
  protocolo: string;
  numeros: number[];
  valor: number;
  concurso: string;
}): string {
  const { nome, protocolo, numeros, valor, concurso } = params;
  const linhas = [
    `🍀 *Bolão da Mega PRO*`,
    ``,
    `Olá, ${nome}!`,
    `Seu jogo no *${concurso}* foi registrado.`,
    ``,
    `🔢 Números: ${numeros.join(' - ')}`,
    `💰 Valor: ${formatarMoeda(valor)}`,
    `📋 Protocolo: ${protocolo}`,
    ``,
    `Assim que o pagamento for confirmado você recebe um aviso por aqui. Boa sorte! 🎉`,
  ];
  return encodeURIComponent(linhas.join('\n'));
}

export function linkWhatsApp(numero: string, mensagemCodificada: string): string {
  return `https://wa.me/${normalizarWhatsApp(numero)}?text=${mensagemCodificada}`;
}

export function apostaBloqueada(dataLimiteIso: string): boolean {
  return new Date() >= new Date(dataLimiteIso);
}

export function formatarContagem(msRestante: number): string {
  if (msRestante <= 0) return 'Encerrado';
  const dias = Math.floor(msRestante / (1000 * 60 * 60 * 24));
  const horas = Math.floor((msRestante / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((msRestante / (1000 * 60)) % 60);
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}m`;
  return `${minutos}m`;
}
