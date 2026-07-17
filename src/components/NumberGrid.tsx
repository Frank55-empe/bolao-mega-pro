interface Props {
  selecionados: number[];
  onToggle: (numero: number) => void;
  desabilitado?: boolean;
}

// Elemento de assinatura da tela de escolha: 60 bolinhas numeradas.
export default function NumberGrid({ selecionados, onToggle, desabilitado = false }: Props) {
  const numeros = Array.from({ length: 60 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
      {numeros.map((n) => {
        const ativo = selecionados.includes(n);
        return (
          <button
            key={n}
            type="button"
            disabled={desabilitado}
            onClick={() => onToggle(n)}
            className={`numero-bola focus-ring disabled:opacity-40 disabled:cursor-not-allowed ${ativo ? 'selecionado' : ''}`}
            aria-pressed={ativo}
          >
            {String(n).padStart(2, '0')}
          </button>
        );
      })}
    </div>
  );
}
