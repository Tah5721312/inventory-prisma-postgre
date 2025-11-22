
// app/api/ranks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getRankById, updateRank, deleteRank } from '@/lib/db_utils';
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
        { error: 'معرف الرتبة غير صحيح' },
        { status: 400 }
      );
    }
    
    const rank = await getRankById(id);
    
    if (!rank) {
      return NextResponse.json(
        { error: 'الرتبة غير موجودة' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rank, { status: 200 });
  } catch (error) {
    console.error('Error fetching rank:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الرتبة' },
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
        { success: false, error: 'معرف الرتبة غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { RANK_NAME } = body;

    // التحقق من وجود الاسم
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

    // التحقق من محتوى الاسم
    if (!isValidText(RANK_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم الرتبة يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateRank(id, { RANK_NAME });
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { success: true, message: 'تم تحديث الرتبة بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'الرتبة غير موجودة' },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating rank:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد رتبة أخرى بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد رتبة أخرى بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الرتبة' },
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
        { error: 'معرف الرتبة غير صحيح' },
        { status: 400 }
      );
    }
    
    const rowsAffected = await deleteRank(id);
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { message: 'تم حذف الرتبة بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'الرتبة غير موجودة' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting rank:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الرتبة' },
      { status: 500 }
    );
  }
}