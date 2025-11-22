import UsersPageContent from './content';
import { requireAuthServer } from '@/lib/auth-helper';

export default async function UsersPage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <UsersPageContent />;
}
