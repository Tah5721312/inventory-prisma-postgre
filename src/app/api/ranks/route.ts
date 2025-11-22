// app/api/ranks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllRanks, createRank } from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const ranks = await getAllRanks();
    return NextResponse.json({ success: true, data: ranks }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching ranks:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الرتب' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    let { RANK_NAME } = body;

    // التحقق من وجود البيانات
    if (!RANK_NAME || typeof RANK_NAME !== 'string') {
      return NextResponse.json(
        { success: false, error: 'اسم الرتبة مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    RANK_NAME = sanitizeInput(RANK_NAME.trim());
    
    if (RANK_NAME === '') {
      return NextResponse.json(
        { success: false, error: 'اسم الرتبة مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول الاسم
    if (RANK_NAME.length > 200) {
      return NextResponse.json(
        { success: false, error: 'اسم الرتبة طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من محتوى الاسم (منع HTML/Script tags)
    if (!isValidText(RANK_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم الرتبة يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    const newId = await createRank({ RANK_NAME });
    return NextResponse.json(
      { success: true, message: 'تم إنشاء الرتبة بنجاح', id: newId },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating rank:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد رتبة بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد رتبة بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الرتبة' },
      { status: 500 }
    );
  }
}
