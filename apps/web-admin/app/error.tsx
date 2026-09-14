'use client';

import { Button, Card, Icon } from '@fa/ui';

export default function RootError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-xl" padding="lg">
        <span className="flex size-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
          <Icon name="error" size="lg" />
        </span>
        <h1 className="mt-5 text-headline-md">Halaman belum dapat dimuat</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Coba lagi beberapa saat lagi. Jika masalah berlanjut, hubungi pengelola sistem.
        </p>
        <Button className="mt-5" icon="refresh" onClick={reset} variant="outline">
          Coba lagi
        </Button>
      </Card>
    </main>
  );
}
