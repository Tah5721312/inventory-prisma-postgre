// app/api/item-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllItemTypes, createItemType } from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const itemTypes = await getAllItemTypes();
    return NextResponse.json({ success: true, data: itemTypes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching item types:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب أنواع الأصناف' },
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
    let { ITEM_TYPE_NAME } = body;
    const { SUB_CAT_ID } = body;

    // التحقق من وجود البيانات
    if (!ITEM_TYPE_NAME || typeof ITEM_TYPE_NAME !== 'string') {
      return NextResponse.json(
        { success: false, error: 'اسم نوع الصنف مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    ITEM_TYPE_NAME = sanitizeInput(ITEM_TYPE_NAME.trim());
    
    if (ITEM_TYPE_NAME === '') {
      return NextResponse.json(
        { success: false, error: 'اسم نوع الصنف مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول الاسم
    if (ITEM_TYPE_NAME.length > 200) {
      return NextResponse.json(
        { success: false, error: 'اسم نوع الصنف طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من محتوى الاسم (منع HTML/Script tags)
    if (!isValidText(ITEM_TYPE_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم نوع الصنف يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    // التحقق من SUB_CAT_ID
    const subCatIdNum = typeof SUB_CAT_ID === 'string' ? parseInt(SUB_CAT_ID) : Number(SUB_CAT_ID);
    if (!SUB_CAT_ID || isNaN(subCatIdNum) || subCatIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي مطلوب وصحيح' },
        { status: 400 }
      );
    }

    const newItemTypeId = await createItemType({
      ITEM_TYPE_NAME,
      SUB_CAT_ID: subCatIdNum,
    });

    return NextResponse.json({
      success: true,
      data: { ITEM_TYPE_ID: newItemTypeId },
      message: 'تم إضافة نوع الصنف بنجاح',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating item type:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد نوع صنف بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد نوع صنف بنفس الاسم في هذا التصنيف الفرعي بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة نوع الصنف' },
      { status: 500 }
    );
  }
}
