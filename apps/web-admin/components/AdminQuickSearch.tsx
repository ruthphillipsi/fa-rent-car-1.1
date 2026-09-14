'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@fa/ui';

export function AdminQuickSearch() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k' &&
        pathname !== '/armada'
      ) {
        event.preventDefault();
        router.push('/armada#fleet-search');
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, [pathname, router]);

  return (
    <a
      className="hidden min-h-11 items-center gap-3 rounded-xl bg-surface-low px-4 text-body-md text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary lg:flex"
      href="/armada#fleet-search"
    >
      <Icon name="search" />
      <span>Cari nama atau plat armada…</span>
      <kbd className="rounded bg-surface px-1.5 py-0.5 text-caption">⌘/Ctrl K</kbd>
    </a>
  );
}
