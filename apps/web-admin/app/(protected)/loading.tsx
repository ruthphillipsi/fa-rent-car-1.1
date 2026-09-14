import { Card } from '@fa/ui';

export default function ProtectedLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat data fondasi" className="space-y-6">
      <div className="animate-pulse space-y-3 motion-reduce:animate-none">
        <div className="h-6 w-28 rounded-full bg-surface" />
        <div className="h-10 w-80 max-w-full rounded-xl bg-surface" />
        <div className="h-5 w-full max-w-xl rounded-lg bg-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Card
            className="h-40 animate-pulse bg-surface-low motion-reduce:animate-none"
            key={index}
            padding="none"
          />
        ))}
      </div>
      <Card
        className="h-56 animate-pulse bg-surface-low motion-reduce:animate-none"
        padding="none"
      />
    </div>
  );
}
