// app/api/floors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getFloorById, updateFloor, deleteFloor } from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id: idString } = await params;
    const id = parseInt(idString);
    
    // ✅ التحقق من صحة ID
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'معرف الطابق غير صحيح' },
        { status: 400 }
      );
    }
    
    const floor = await getFloorById(id);
    
    if (!floor) {
      return NextResponse.json(
        { error: 'الطابق غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(floor, { status: 200 });
  } catch (error) {
    console.error('Error fetching floor:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الطابق' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id: idString } = await params;
    const id = parseInt(idString);
    
    // ✅ التحقق من صحة ID
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'معرف الطابق غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { FLOOR_NAME } = body;

    // التحقق من وجود الاسم
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

    // التحقق من محتوى الاسم
    if (!isValidText(FLOOR_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم الطابق يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateFloor(id, { FLOOR_NAME });
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { success: true, message: 'تم تحديث الطابق بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'الطابق غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating floor:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد طابق آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد طابق آخر بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الطابق' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id: idString } = await params;
    const id = parseInt(idString);
    
    // ✅ التحقق من صحة ID
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'معرف الطابق غير صحيح' },
        { status: 400 }
      );
    }
    
    const rowsAffected = await deleteFloor(id);
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { message: 'تم حذف الطابق بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'الطابق غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الطابق' },
      { status: 500 }
    );
  }
}