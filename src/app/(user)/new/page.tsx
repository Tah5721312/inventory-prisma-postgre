import NewUserPageContent from "./content";
import { requireAuthServer } from '@/lib/auth-helper';

export default async function NewUserPage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <NewUserPageContent />;
}

