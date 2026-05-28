// app/page.jsx — Login page (Server Component)
import { redirect }    from 'next/navigation';
import { AuthService } from '@/lib/auth';
import LoginForm       from '@/components/LoginForm';

export default async function LoginPage() {
  const session = await AuthService.getSession();
  if (session) redirect('/dashboard');

  return (
    <main style={{
      background:     '#0f1117',
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      fontFamily:     "'JetBrains Mono','Fira Code',monospace",
    }}>
      <LoginForm />
    </main>
  );
}
