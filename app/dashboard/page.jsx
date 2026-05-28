// app/dashboard/page.jsx — Server Component protegido
import { redirect }    from 'next/navigation';
import { AuthService } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  const session = await AuthService.getSession();
  if (!session) redirect('/');
  return <DashboardClient user={session} />;
}
