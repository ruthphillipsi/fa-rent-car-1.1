import type { ReactNode } from 'react';

import { AdminShell } from '../../components/AdminShell';
import { requireAdminSession } from '../../lib/server-api';

export default async function ProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await requireAdminSession();

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
