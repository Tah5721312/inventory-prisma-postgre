// app/api/sub-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import {
  getAllSubCategories,
  createSubCategory,
} from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

// GET: جلب جميع التصنيفات الفرعية
export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const subCategories = await getAllSubCategories();
    return NextResponse.json({ success: true, data: subCategories });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching sub categories:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات الفرعية' },
      { status: 500 }
    );
  }
}

// POST: إضافة تصنيف فرعي جديد
export async function POST(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    let { SUB_CAT_NAME, DESCRIPTION } = body;
    const { CAT_ID } = body;

    // التحقق من وجود البيانات
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

    // التحقق من محتوى الاسم (منع HTML/Script tags)
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

    const newSubCatId = await createSubCategory({
      SUB_CAT_NAME,
      CAT_ID: catIdNum,
      DESCRIPTION,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          SUB_CAT_ID: newSubCatId,
          SUB_CAT_NAME,
          CAT_ID: catIdNum,
          DESCRIPTION: DESCRIPTION || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating sub category:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد تصنيف فرعي بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد تصنيف فرعي بنفس الاسم في هذا التصنيف الرئيسي بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التصنيف الفرعي' },
      { status: 500 }
    );
  }
}
