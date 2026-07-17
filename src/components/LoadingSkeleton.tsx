export function SkeletonLinha({ largura = 'w-full' }: { largura?: string }) {
  return <div className={`h-4 rounded bg-bg-card animate-pulse ${largura}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-card rounded-2xl p-5 space-y-3 border border-white/5">
      <SkeletonLinha largura="w-1/2" />
      <SkeletonLinha largura="w-3/4" />
      <SkeletonLinha largura="w-1/3" />
    </div>
  );
}

export function SkeletonGrade({ itens = 12 }: { itens?: number }) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
      {Array.from({ length: itens }).map((_, i) => (
        <div key={i} className="numero-bola bg-bg-card animate-pulse border-transparent" />
      ))}
    </div>
  );
}
