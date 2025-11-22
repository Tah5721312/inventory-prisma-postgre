import { requireAuthServer } from '@/lib/auth-helper';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  // ✅ جلب معلومات المستخدم
  const session = await auth();
  const userId = (session?.user as any)?.userId || (session?.user?.id ? parseInt(String(session.user.id), 10) : null);

  if (!userId || isNaN(userId) || userId <= 0) {
    redirect('/login');
  }

  // ✅ إعادة التوجيه إلى صفحة الملف الشخصي للمستخدم الحالي
  redirect(`/profile/${userId}`);
}
