export default function Regulamento() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 prose prose-invert prose-sm">
      <h1 className="text-2xl font-bold mb-4">Regulamento do bolão</h1>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>1. A aposta só é considerada válida após a confirmação do pagamento pelo administrador do bolão.</p>
        <p>2. Cada participante pode escolher de 6 a 15 números entre 1 e 60, conforme as regras oficiais da Mega Sena.</p>
        <p>3. Apostas realizadas após o horário de fechamento (60 minutos antes do sorteio) não serão aceitas.</p>
        <p>4. O prêmio, quando houver, será dividido proporcionalmente entre os participantes com apostas pagas e confirmadas no concurso premiado.</p>
        <p>5. É responsabilidade do participante manter o WhatsApp informado atualizado para receber avisos e confirmações.</p>
        <p>6. O organizador do bolão não se responsabiliza por erros de digitação no WhatsApp informado pelo participante.</p>
        <p className="text-gray-500 text-xs pt-4">
          Edite este texto em <code>src/pages/Regulamento.tsx</code> com as regras específicas do seu bolão.
        </p>
      </div>
    </div>
  );
}
