function normalizarTexto(txt: string, max: number): string {
  return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, max);
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
interface DadosPix { chave: string; nomeRecebedor: string; cidade: string; valor?: number; txid?: string; }
export function gerarPayloadPix({ chave, nomeRecebedor, cidade, valor, txid = '***' }: DadosPix): string {
  const merchantAccountInfo = campo('00', 'BR.GOV.BCB.PIX') + campo('01', chave);
  const partes = [
    campo('00', '01'),
    campo('26', merchantAccountInfo),
    campo('52', '0000'),
    campo('53', '986'),
    ...(valor ? [campo('54', valor.toFixed(2))] : []),
    campo('58', 'BR'),
    campo('59', normalizarTexto(nomeRecebedor, 25)),
    campo('60', normalizarTexto(cidade, 15)),
    campo('62', campo('05', normalizarTexto(txid, 25) || '***')),
  ];
  const semCrc = partes.join('') + '6304';
  return semCrc + crc16(semCrc);
}
