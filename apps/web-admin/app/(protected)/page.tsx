import { Dashboard } from '../../components/Dashboard';
import { getFoundation } from '../../lib/server-api';

export default async function DashboardPage() {
  const foundation = await getFoundation({ page: 1, limit: 1 });

  return <Dashboard foundation={foundation} />;
}
