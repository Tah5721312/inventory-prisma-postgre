import ItemTypesPage from "@/components/ItemType";
import { requireAuthServer } from "@/lib/auth-helper";

export default async function ItemTypePage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <ItemTypesPage />;
}