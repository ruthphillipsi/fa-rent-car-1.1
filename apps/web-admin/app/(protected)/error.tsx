'use client';

import { Button, Card, Icon } from '@fa/ui';

export default function ProtectedError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-xl" padding="lg">
      <span className="flex size-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
        <Icon name="error" size="lg" />
      </span>
      <h2 className="mt-5 text-headline-md">Halaman belum dapat dimuat</h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Coba muat ulang halaman. Jika masalah berlanjut, hubungi pengelola sistem.
      </p>
      <Button className="mt-5" icon="refresh" onClick={reset} variant="outline">
        Coba lagi
      </Button>
    </Card>
  );
}
