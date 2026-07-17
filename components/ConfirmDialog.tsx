import { AlertTriangle } from 'lucide-react';

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  confirmarLabel?: string;
  perigo?: boolean;
}

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  confirmarLabel = 'Confirmar',
  perigo = false,
}: Props) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full animate-popIn border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center ${perigo ? 'bg-red-500/15' : 'bg-primary/15'}`}>
            <AlertTriangle className={perigo ? 'text-red-500' : 'text-primary'} size={20} />
          </span>
          <h3 className="font-semibold text-lg">{titulo}</h3>
        </div>
        <p className="text-gray-300 text-sm mb-6">{mensagem}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancelar} className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 focus-ring">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className={`px-4 py-2 rounded-xl text-sm font-semibold focus-ring ${
              perigo ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary-dark text-white'
            }`}
          >
            {confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
