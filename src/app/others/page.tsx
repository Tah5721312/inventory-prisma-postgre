import UnifiedManagementPage from "@/components/Others";
import { requireAuthServer } from "@/lib/auth-helper";

export default async function OthersPage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <UnifiedManagementPage />;
}