
// app/api/main-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import {
  getMainCategoryById,
  updateMainCategory,
  deleteMainCategory,
} from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

// GET: جلب تصنيف واحد
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
        { success: false, error: 'معرف التصنيف غير صحيح' },
        { status: 400 }
      );
    }
    
    const category = await getMainCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error fetching main category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيف' },
      { status: 500 }
    );
  }
}
// PUT: تحديث تصنيف
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
    
    // التحقق من صحة ID
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'معرف التصنيف غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { CAT_NAME, DESCRIPTION } = body;

    // التحقق من وجود الاسم
    if (!CAT_NAME || typeof CAT_NAME !== 'string') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    CAT_NAME = sanitizeInput(CAT_NAME.trim());
    
    if (CAT_NAME === '') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول الاسم
    if (CAT_NAME.length > 200) {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من محتوى الاسم
    if (!isValidText(CAT_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    // Sanitize الوصف (اختياري)
    if (DESCRIPTION && typeof DESCRIPTION === 'string') {
      DESCRIPTION = sanitizeInput(DESCRIPTION.trim());
      if (DESCRIPTION.length > 1000) {
        return NextResponse.json(
          { success: false, error: 'الوصف طويل جداً (الحد الأقصى 1000 حرف)' },
          { status: 400 }
        );
      }
    } else {
      DESCRIPTION = null;
    }

    const rowsAffected = await updateMainCategory(id, {
      CAT_NAME,
      DESCRIPTION,
    });

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        CAT_ID: id,
        CAT_NAME,
        DESCRIPTION: DESCRIPTION || null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating main category:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد تصنيف رئيسي آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد تصنيف رئيسي آخر بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التصنيف' },
      { status: 500 }
    );
  }
}


// DELETE: حذف تصنيف
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
        { success: false, error: 'معرف التصنيف غير صحيح' },
        { status: 400 }
      );
    }
    
    const rowsAffected = await deleteMainCategory(id);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التصنيف بنجاح',
    });
  } catch (error) {
    console.error('Error deleting main category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التصنيف' },
      { status: 500 }
    );
  }
}