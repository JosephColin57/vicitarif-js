// app/azteca/page.jsx — Dashboard Azteca protegido
import { redirect }       from 'next/navigation';
import { getSession }     from '@/lib/auth';
import AztecaDashboard    from '@/components/AztecaDashboard';

export default async function AztecaPage() {
  const session = await getSession();
  if (!session) redirect('/');
  return <AztecaDashboard user={session} />;
}
