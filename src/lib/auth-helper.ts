import 'server-only';

import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/**
 * Helper function للتحقق من تسجيل الدخول في API routes
 * @returns {Promise<NextResponse | null>} 
 *   - إذا لم يكن المستخدم مسجل دخول: يرجع NextResponse مع 401
 *   - إذا كان مسجل دخول: يرجع null (يعني يمكن المتابعة)
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
      { status: 401 }
    );
  }
  
  return null; // المستخدم مسجل دخول، يمكن المتابعة
}

/**
 * Helper function للتحقق من تسجيل الدخول في Server Components (pages)
 * @returns {Promise<void>} 
 *   - يوجه المستخدم إلى /login إذا لم يكن مسجل دخول
 */
export async function requireAuthServer(): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
}

