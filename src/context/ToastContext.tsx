import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastTipo = 'sucesso' | 'erro' | 'info';
interface ToastItem {
  id: number;
  mensagem: string;
  tipo: ToastTipo;
}

interface ToastContextValue {
  notificar: (mensagem: string, tipo?: ToastTipo) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}

const ICONES: Record<ToastTipo, React.ReactNode> = {
  sucesso: <CheckCircle2 className="text-primary" size={20} />,
  erro: <XCircle className="text-red-500" size={20} />,
  info: <Info className="text-gold" size={20} />,
};

const BORDAS: Record<ToastTipo, string> = {
  sucesso: 'border-primary/40',
  erro: 'border-red-500/40',
  info: 'border-gold/40',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notificar = useCallback((mensagem: string, tipo: ToastTipo = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const remover = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slideUp flex items-start gap-2 bg-bg-card border ${BORDAS[t.tipo]} rounded-xl px-4 py-3 shadow-lg shadow-black/30`}
          >
            {ICONES[t.tipo]}
            <p className="text-sm flex-1 leading-snug">{t.mensagem}</p>
            <button onClick={() => remover(t.id)} className="text-gray-500 hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
