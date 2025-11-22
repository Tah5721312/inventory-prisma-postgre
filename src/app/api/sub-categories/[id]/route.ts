// =============================================================
// app/api/sub-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import {
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
} from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

// GET: جلب تصنيف فرعي واحد
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
        { success: false, error: 'معرف التصنيف الفرعي غير صحيح' },
        { status: 400 }
      );
    }
    
    const subCategory = await getSubCategoryById(id);

    if (!subCategory) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subCategory });
  } catch (error) {
    console.error('Error fetching sub category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيف الفرعي' },
      { status: 500 }
    );
  }
}

// PUT: تحديث تصنيف فرعي
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
        { success: false, error: 'معرف التصنيف الفرعي غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { SUB_CAT_NAME, DESCRIPTION } = body;
    const { CAT_ID } = body;

    // التحقق من وجود الاسم
    if (!SUB_CAT_NAME || typeof SUB_CAT_NAME !== 'string') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف الفرعي مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    SUB_CAT_NAME = sanitizeInput(SUB_CAT_NAME.trim());
    
    if (SUB_CAT_NAME === '') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف الفرعي مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول الاسم
    if (SUB_CAT_NAME.length > 200) {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف الفرعي طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من محتوى الاسم
    if (!isValidText(SUB_CAT_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف الفرعي يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    // التحقق من CAT_ID
    const catIdNum = typeof CAT_ID === 'string' ? parseInt(CAT_ID) : Number(CAT_ID);
    if (!CAT_ID || isNaN(catIdNum) || catIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الرئيسي مطلوب وصحيح' },
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
      DESCRIPTION = undefined;
    }

    const rowsAffected = await updateSubCategory(id, {
      SUB_CAT_NAME,
      CAT_ID: catIdNum,
      DESCRIPTION,
    });

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        SUB_CAT_ID: id,
        SUB_CAT_NAME,
        CAT_ID: catIdNum,
        DESCRIPTION: DESCRIPTION || null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating sub category:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد تصنيف فرعي آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد تصنيف فرعي آخر بنفس الاسم في هذا التصنيف الرئيسي بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التصنيف الفرعي' },
      { status: 500 }
    );
  }
}

// DELETE: حذف تصنيف فرعي
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
        { success: false, error: 'معرف التصنيف الفرعي غير صحيح' },
        { status: 400 }
      );
    }
    
    const rowsAffected = await deleteSubCategory(id);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التصنيف الفرعي بنجاح',
    });
  } catch (error) {
    console.error('Error deleting sub category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التصنيف الفرعي' },
      { status: 500 }
    );
  }
}
