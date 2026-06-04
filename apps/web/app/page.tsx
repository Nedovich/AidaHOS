import { redirect } from 'next/navigation';
import { resolveLandingPath } from '@/lib/auth';

// Role-aware entry: super_admin → /dashboard, admin/user → their hotel, else → /login.
export default async function Home() {
  redirect(await resolveLandingPath());
}
