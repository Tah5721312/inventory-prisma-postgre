// app/api/floors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllFloors, createFloor } from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const floors = await getAllFloors();
    console.log('🏢 Fetched floors from DB:', floors);
    console.log('🏢 Number of floors:', floors?.length || 0);
    return NextResponse.json({ success: true, data: floors }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fetching floors:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الطوابق' },
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
    let { FLOOR_NAME } = body;

    // التحقق من وجود البيانات
    if (!FLOOR_NAME || typeof FLOOR_NAME !== 'string') {
      return NextResponse.json(
        { success: false, error: 'اسم الطابق مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    FLOOR_NAME = sanitizeInput(FLOOR_NAME.trim());
    
    if (FLOOR_NAME === '') {
      return NextResponse.json(
        { success: false, error: 'اسم الطابق مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول الاسم
    if (FLOOR_NAME.length > 200) {
      return NextResponse.json(
        { success: false, error: 'اسم الطابق طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من محتوى الاسم (منع HTML/Script tags)
    if (!isValidText(FLOOR_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم الطابق يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    const newId = await createFloor({ FLOOR_NAME });
    return NextResponse.json(
      { success: true, message: 'تم إنشاء الطابق بنجاح', id: newId },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating floor:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد طابق بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد طابق بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الطابق' },
      { status: 500 }
    );
  }
}