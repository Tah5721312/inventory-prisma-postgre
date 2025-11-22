import MainCategoriesPage from '@/components/maincategories';
import { requireAuthServer } from '@/lib/auth-helper';

export default async function MainCategoriesPageWrapper() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <MainCategoriesPage />;
}