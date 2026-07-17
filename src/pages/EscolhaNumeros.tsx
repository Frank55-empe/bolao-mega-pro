import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Eraser, Check } from 'lucide-react';
import NumberGrid from '../components/NumberGrid';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { sortearNumeros, formatarMoeda } from '../utils/helpers';

const OPCOES_QTD = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Tabela de combinações da Mega Sena (múltiplos do valor da aposta simples).
// Mantida aqui para simplicidade; o valor definitivo é sempre recalculado no backend.
const MULTIPLICADOR: Record<number, number> = {
  6: 1, 7: 7, 8: 28, 9: 84, 10: 210, 11: 462, 12: 924, 13: 1716, 14: 3003, 15: 5005,
};

export default function EscolhaNumeros() {
  const navigate = useNavigate();
  const { fluxo, setNumeros } = useApp();
  const { notificar } = useToast();

  const [qtd, setQtd] = useState(6);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const valorAposta = fluxo.concurso?.valorAposta ?? 5;
  const valorTotal = useMemo(() => valorAposta * MULTIPLICADOR[qtd], [valorAposta, qtd]);

  function toggle(numero: number) {
    setSelecionados((prev) => {
      if (prev.includes(numero)) return prev.filter((n) => n !== numero);
      if (prev.length >= qtd) {
        notificar(`Você já escolheu ${qtd} números. Desmarque algum para trocar.`, 'info');
        return prev;
      }
      return [...prev, numero].sort((a, b) => a - b);
    });
  }

  function limpar() {
    setSelecionados([]);
  }

  function surpresa() {
    setSelecionados(sortearNumeros(qtd));
  }

  function confirmar() {
    if (selecionados.length !== qtd) {
      notificar(`Selecione exatamente ${qtd} números.`, 'erro');
      return;
    }
    setNumeros(selecionados);
    navigate('/pagamento');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Escolha seus números</h1>
      <p className="text-gray-400 text-sm mb-5">Mega Sena · escolha de 6 a 15 números.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {OPCOES_QTD.map((n) => (
          <button
            key={n}
            onClick={() => {
              setQtd(n);
              setSelecionados([]);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus-ring ${
              qtd === n ? 'bg-primary border-primary text-white' : 'border-white/10 text-gray-300 hover:border-primary'
            }`}
          >
            {n} números
          </button>
        ))}
      </div>

      <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-white/5 mb-5">
        <NumberGrid selecionados={selecionados} onToggle={toggle} />
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-sm text-gray-300">
          Selecionados <span className="font-bold text-gold">{selecionados.length}</span> de {qtd}
        </p>
        <p className="text-sm text-gray-300">
          Valor da aposta: <span className="font-bold text-primary-light">{formatarMoeda(valorTotal)}</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={limpar} className="flex items-center justify-center gap-2 border border-white/10 hover:border-red-400 rounded-xl px-5 py-3 text-sm focus-ring">
          <Eraser size={16} /> Limpar
        </button>
        <button onClick={surpresa} className="flex items-center justify-center gap-2 border border-gold/40 text-gold hover:bg-gold/10 rounded-xl px-5 py-3 text-sm focus-ring">
          <Shuffle size={16} /> Surpresinha
        </button>
        <button
          onClick={confirmar}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl px-5 py-3 focus-ring"
        >
          <Check size={16} /> Confirmar
        </button>
      </div>
    </div>
  );
}
