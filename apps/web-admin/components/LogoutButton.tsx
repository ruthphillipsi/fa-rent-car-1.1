'use client';

import { useState } from 'react';

import { Button } from '@fa/ui';

import { isAuthFailure, logout } from '../lib/browser-api';
import { useHydrated } from '../lib/use-hydrated';

export function LogoutButton() {
  const hydrated = useHydrated();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleLogout() {
    setError(undefined);
    setIsSubmitting(true);

    try {
      await logout();
      window.location.assign('/login');
    } catch (requestError) {
      if (isAuthFailure(requestError)) {
        window.location.assign('/login');
        return;
      }

      setError('Tidak dapat keluar saat ini. Coba lagi.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-caption font-medium text-on-error-container" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={!hydrated}
        icon="logout"
        loading={isSubmitting}
        onClick={handleLogout}
        size="sm"
        variant="outline"
      >
        Keluar
      </Button>
    </div>
  );
}
