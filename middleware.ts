import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

// المسارات العامة التي لا تحتاج تسجيل دخول (فقط بالضبط)
const publicRoutes = ['/login', '/register', '/reset-password'];

// مسارات API العامة التي لا تحتاج تسجيل دخول
const publicApiRoutes = [
  '/api/auth', // NextAuth routes
  '/api/users/login',
  '/api/users/register',
  '/api/users/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بجميع المسارات الثابتة والملفات (Next.js internal)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/) // ملفات ثابتة
  ) {
    return NextResponse.next();
  }

  // السماح بالمسارات العامة فقط (تحقق دقيق)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // السماح بمسارات API العامة
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // التحقق من الجلسة لجميع المسارات الأخرى (المحمية)
  const session = await auth();

  // إذا لم يكن هناك جلسة، إعادة التوجيه إلى صفحة تسجيل الدخول
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    // حفظ URL الحالي لإعادة التوجيه بعد تسجيل الدخول
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // إذا كان هناك جلسة، السماح بالوصول
  return NextResponse.next();
}

// تحديد المسارات التي يجب تشغيل middleware عليها
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - ملفات ثابتة (CSS, JS, images, fonts)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};

