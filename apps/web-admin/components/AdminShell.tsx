import type { ReactNode } from 'react';

import type { AdminUser } from '@fa/shared';
import { Brand, Icon, Topbar } from '@fa/ui';

import { AdminNavigation } from './AdminNavigation';
import { AdminQuickSearch } from './AdminQuickSearch';
import { SessionRefreshBridge } from './SessionRefreshBridge';

interface AdminShellProps {
  user: AdminUser;
  children: ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <AdminNavigation user={user} />
      <div className="min-h-dvh lg:pl-64">
        <Topbar
          actions={
            <a
              aria-label="Buka profil"
              className="flex size-10 items-center justify-center rounded-full bg-primary text-surface-lowest transition hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              href="/profil"
              title={user.name}
            >
              <Icon name="person" size="md" />
            </a>
          }
          mobileBrand={<Brand subtitle="Operations Hub" />}
        >
          <AdminQuickSearch />
        </Topbar>
        <main className="mx-auto w-full max-w-container-max px-5 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </main>
      </div>
      <SessionRefreshBridge />
    </div>
  );
}
