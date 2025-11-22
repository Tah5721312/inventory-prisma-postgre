// app/api/main-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import {
  getAllMainCategories,
  createMainCategory,
} from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

// GET: جلب جميع التصنيفات الرئيسية
export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const categories = await getAllMainCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching main categories:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات' },
      { status: 500 }
    );
  }
}

// POST: إضافة تصنيف رئيسي جديد
export async function POST(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    let { CAT_NAME, DESCRIPTION } = body;

    // التحقق من وجود البيانات
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

    // التحقق من محتوى الاسم (منع HTML/Script tags)
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
      DESCRIPTION = '';
    }

    const newCatId = await createMainCategory({ 
      CAT_NAME,
      DESCRIPTION
    });
    return NextResponse.json(
      { success: true, data: { CAT_ID: newCatId, CAT_NAME } },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating main category:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد تصنيف رئيسي بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد تصنيف رئيسي بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التصنيف' },
      { status: 500 }
    );
  }
}
