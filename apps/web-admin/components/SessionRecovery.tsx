'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@fa/ui';
import { getBrowserSession, isAuthFailure } from '../lib/browser-api';
import { LoginForm } from './LoginForm';

export function SessionRecovery({ hasRefreshCookie }: { hasRefreshCookie: boolean }) {
  const [recovering, setRecovering] = useState(hasRefreshCookie);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (!hasRefreshCookie) return;
    let active = true;
    void getBrowserSession()
      .then(() => {
        if (active) window.location.replace('/');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          isAuthFailure(error)
            ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
            : 'Sesi belum dapat dipulihkan. Periksa koneksi atau masuk kembali.',
        );
        setRecovering(false);
      });
    return () => {
      active = false;
    };
  }, [hasRefreshCookie]);

  if (recovering)
    return (
      <p role="status" className="flex items-center gap-3 text-body-md text-on-surface-variant">
        <Icon name="sync" />
        Memulihkan sesi Anda…
      </p>
    );
  return (
    <>
      {message ? (
        <p
          role="status"
          className="mb-5 rounded-lg bg-surface-low p-3 text-body-md text-on-surface-variant"
        >
          {message}
        </p>
      ) : null}
      <LoginForm />
    </>
  );
}
