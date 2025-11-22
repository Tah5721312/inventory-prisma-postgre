import HomeContent from '@/components/home-content';
import { requireAuthServer } from "@/lib/auth-helper";
import { auth } from "@/auth";
import { fetchAbilityRulesFromDB } from "@/lib/ability.server";
import { AbilityProvider } from "@/contexts/AbilityContext";
import { AbilityRule } from "@/lib/ability";

export default async function HomePage() {
  
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();
  // ✅ جلب معلومات المستخدم والصلاحيات
  const session = await auth();
  const userId = (session?.user as any)?.userId || (session?.user?.id ? parseInt(String(session.user.id), 10) : null);
  
  let rules: AbilityRule[] = [];
  if (userId && !isNaN(userId) && userId > 0) {
    try {
      rules = await fetchAbilityRulesFromDB(userId);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      rules = [];
    }
  }

  return  (
    <AbilityProvider rules={rules}>
      <HomeContent />
    </AbilityProvider>
  );
}
