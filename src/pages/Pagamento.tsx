import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, CheckCheck, PartyPopper } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { formatarMoeda, gerarProtocolo, montarMensagemWhatsApp, linkWhatsApp } from '../utils/helpers';
import { gerarPayloadPix } from '../utils/pix';

// Chave PIX do responsável pelo bolão. Troque pela sua chave real
// (pode ser e-mail, CPF/CNPJ, telefone ou chave aleatória).
const CHAVE_PIX = 'seuemail@exemplo.com';
const NOME_RECEBEDOR = 'PROF FRANK BORGES';
const CIDADE_RECEBEDOR = 'IJACI';

export default function Pagamento() {
  const navigate = useNavigate();
  const { fluxo, setProtocolo, limparFluxo } = useApp();
  const { notificar } = useToast();
  const [enviando, setEnviando] = useState(false);
  const [pago, setPago] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [protocoloLocal, setProtocoloLocal] = useState('');

  const { participante, numerosEscolhidos, concurso } = fluxo;
  const valorAposta = concurso?.valorAposta ?? 5;

  useEffect(() => {
    if (!participante || numerosEscolhidos.length === 0) {
      navigate('/cadastro');
      return;
    }
    setProtocoloLocal(gerarProtocolo());
  }, []);

  const pixPayload = gerarPayloadPix({
    chave: CHAVE_PIX,
    nomeRecebedor: NOME_RECEBEDOR,
    cidade: CIDADE_RECEBEDOR,
    valor: valorAposta,
    txid: protocoloLocal || undefined,
  });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixPayload)}`;

  function copiarChave() {
    navigator.clipboard.writeText(pixPayload);
    setCopiado(true);
    notificar('Chave PIX copiada!', 'sucesso');
    setTimeout(() => setCopiado(false), 2500);
  }

  async function jaPaguei() {
    if (!participante || !concurso) return;
    setEnviando(true);

    const respParticipante = await api.participantes.criar({
      nome: participante.nome,
      nomeExibicao: participante.nomeExibicao,
      whatsapp: participante.whatsapp,
      cidade: participante.cidade,
      estado: participante.estado,
      cpf: participante.cpf ?? '',
    });

    if (!respParticipante.ok) {
      notificar(respParticipante.error || 'Não foi possível registrar seus dados. Tente novamente.', 'erro');
      setEnviando(false);
      return;
    }

    const participanteId = (respParticipante.data as { id: string })?.id;

    const respAposta = await api.apostas.criar({
      idParticipante: participanteId,
      concursoId: concurso.id,
      numeros: numerosEscolhidos,
      quantidade: numerosEscolhidos.length,
      valor: valorAposta,
      protocolo: protocoloLocal,
      status: 'AGUARDANDO CONFERENCIA',
    });

    setEnviando(false);

    if (!respAposta.ok) {
      notificar(respAposta.error || 'Não foi possível registrar sua aposta. Tente novamente.', 'erro');
      return;
    }

    setProtocolo(protocoloLocal);
    setPago(true);
    notificar('Aposta registrada! Aguarde a confirmação do pagamento.', 'sucesso');
  }

  function abrirWhatsApp() {
    if (!participante || !concurso) return;
    const msg = montarMensagemWhatsApp({
      nome: participante.nomeExibicao,
      protocolo: protocoloLocal,
      numeros: numerosEscolhidos,
      valor: valorAposta,
      concurso: concurso.nome,
    });
    window.open(linkWhatsApp(participante.whatsapp, msg), '_blank');
  }

  if (pago) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4 animate-popIn">
          <PartyPopper className="text-primary" size={28} />
        </span>
        <h1 className="text-2xl font-bold mb-2">Jogo registrado!</h1>
        <p className="text-gray-400 text-sm mb-1">Protocolo</p>
        <p className="text-xl font-mono font-bold text-gold mb-6">{protocoloLocal}</p>
        <p className="text-gray-300 text-sm mb-6">
          Assim que confirmarmos o pagamento, seu status muda para <strong>PAGO</strong>. Você pode acompanhar tudo em "Meus Jogos".
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={abrirWhatsApp} className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl py-3 focus-ring">
            Enviar comprovante pelo WhatsApp
          </button>
          <button
            onClick={() => {
              limparFluxo();
              navigate('/consulta');
            }}
            className="border border-white/10 rounded-xl py-3 focus-ring"
          >
            Ver meus jogos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Pagamento</h1>
      <p className="text-gray-400 text-sm mb-6">Confira o resumo e pague com PIX.</p>

      <div className="bg-bg-card rounded-2xl p-5 border border-white/5 mb-5 space-y-2 text-sm">
        <Linha label="Nome" valor={participante?.nomeExibicao ?? '—'} />
        <Linha label="Cidade" valor={`${participante?.cidade ?? ''}/${participante?.estado ?? ''}`} />
        <Linha label="Números" valor={numerosEscolhidos.join(' - ')} />
        <Linha label="Valor" valor={formatarMoeda(valorAposta)} destaque />
      </div>

      <div className="bg-bg-card rounded-2xl p-5 border border-white/5 mb-5 flex flex-col items-center">
        <img src={qrCodeUrl} alt="QR Code PIX" className="rounded-xl mb-4 bg-white p-2" width={180} height={180} />
        <button
          onClick={copiarChave}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl py-3 text-sm focus-ring"
        >
          {copiado ? <CheckCheck size={16} className="text-primary" /> : <Copy size={16} />}
          {copiado ? 'Copiado!' : 'Copiar chave PIX'}
        </button>
      </div>

      <button
        onClick={jaPaguei}
        disabled={enviando}
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold rounded-xl py-3 focus-ring"
      >
        {enviando ? 'Registrando...' : 'Já paguei'}
      </button>
    </div>
  );
}

function Linha({ label, valor, destaque = false }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={destaque ? 'font-bold text-primary-light' : 'font-medium'}>{valor}</span>
    </div>
  );
}
