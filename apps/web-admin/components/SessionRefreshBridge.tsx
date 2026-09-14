'use client';

import { useEffect, useState } from 'react';

import { getBrowserSession, isAuthFailure } from '../lib/browser-api';

export function SessionRefreshBridge() {
  const [warning, setWarning] = useState<string>();
  useEffect(() => {
    let active = true;
    let checking = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      if (!active || checking) return;
      checking = true;
      clearTimeout(timer);
      try {
        const session = await getBrowserSession();
        if (!active) return;
        setWarning(undefined);
        timer = setTimeout(
          () => void check(),
          Math.max(1000, new Date(session.expiresAt).getTime() - Date.now() + 500),
        );
      } catch (error) {
        if (!active) return;
        if (isAuthFailure(error)) {
          window.location.assign('/login');
          return;
        }
        setWarning('Koneksi terputus. Sesi akan diperiksa kembali saat layanan tersedia.');
        timer = setTimeout(() => void check(), 30_000);
      } finally {
        checking = false;
      }
    }
    const onFocus = () => {
      void check();
    };
    void check();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, []);

  return warning ? (
    <p
      role="status"
      className="rounded-lg bg-warning-container p-3 text-body-md text-on-warning-container"
    >
      {warning}
    </p>
  ) : null;
}
