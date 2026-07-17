// Gerador de payload PIX "Copia e Cola" (BR Code / EMV), estático, sem valor
// fixo obrigatório embutido (permite reaproveitar a mesma chave para várias
// apostas com valores diferentes). Implementa o CRC16-CCITT exigido pelo
// padrão do Banco Central — sem isso, o QR Code aparece mas o app do banco
// recusa por checksum inválido.

function normalizarTexto(txt: string, max: number): string {
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .slice(0, max);
}

function campo(id: string, valor: string): string {
  const tamanho = String(valor.length).padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

interface DadosPix {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor?: number; // se omitido, o pagador digita o valor no app do banco
  txid?: string; // identificador da transação, ex: protocolo da aposta
}

export function gerarPayloadPix({ chave, nomeRecebedor, cidade, valor, txid = '***' }: DadosPix): string {
  const merchantAccountInfo =
    campo('00', 'BR.GOV.BCB.PIX') + campo('01', chave);

  const partes = [
    campo('00', '01'), // Payload Format Indicator
    campo('26', merchantAccountInfo), // Merchant Account Information (PIX)
    campo('52', '0000'), // Merchant Category Code
    campo('53', '986'), // Moeda: Real (BRL)
    ...(valor ? [campo('54', valor.toFixed(2))] : []),
    campo('58', 'BR'), // País
    campo('59', normalizarTexto(nomeRecebedor, 25)), // Nome do recebedor
    campo('60', normalizarTexto(cidade, 15)), // Cidade
    campo('62', campo('05', normalizarTexto(txid, 25) || '***')), // Additional Data (TXID)
  ];

  const semCrc = partes.join('') + '6304';
  return semCrc + crc16(semCrc);
}
