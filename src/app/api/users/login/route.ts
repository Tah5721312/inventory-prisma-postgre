import { loginSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import { signIn, auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() ;

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await signIn('credentials', {
      redirect: false,
      email: body.email,
      password: body.password,
    });

    if ((result as any)?.error) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
    }

    // احصل على السيشن بعد نجاح تسجيل الدخول
    const session = await auth();

    const response = NextResponse.json({ message: 'Authenticated' }, { status: 200 });

    // ضع userId في الكوكيز ليتم استخدامه لاحقًا في تحميل الصلاحيات من الداتابيز
    const userId = session?.user && (session.user as any).id ? String((session.user as any).id) : '';
    if (userId) {
      response.cookies.set('userId', userId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}