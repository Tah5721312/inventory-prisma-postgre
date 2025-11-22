import SubCategoriesPage from "@/components/SubCategories";
import { requireAuthServer } from "@/lib/auth-helper";

export default async function SubCategoriesPageServer() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <SubCategoriesPage />;
}