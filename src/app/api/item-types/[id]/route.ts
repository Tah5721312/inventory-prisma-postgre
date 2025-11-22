// app/api/item-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getItemTypeById, updateItemType, deleteItemType } from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const idNum = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'معرف نوع الصنف غير صحيح' },
        { status: 400 }
      );
    }
    
    const itemType = await getItemTypeById(idNum);
    
    if (!itemType) {
      return NextResponse.json(
        { success: false, error: 'نوع الصنف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: itemType });
  } catch (error) {
    console.error('Error fetching item type:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب نوع الصنف' },
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

    const { id } = await params;
    const idNum = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'معرف نوع الصنف غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { ITEM_TYPE_NAME } = body;
    const { SUB_CAT_ID } = body;

    const updateData: { ITEM_TYPE_NAME?: string; SUB_CAT_ID?: number } = {};
    
    // التحقق من ITEM_TYPE_NAME إذا تم إرساله
    if (ITEM_TYPE_NAME !== undefined) {
      if (typeof ITEM_TYPE_NAME !== 'string') {
        return NextResponse.json(
          { success: false, error: 'اسم نوع الصنف يجب أن يكون نص' },
          { status: 400 }
        );
      }

      // Sanitize و validate input
      ITEM_TYPE_NAME = sanitizeInput(ITEM_TYPE_NAME.trim());
      
      if (ITEM_TYPE_NAME === '') {
        return NextResponse.json(
          { success: false, error: 'اسم نوع الصنف لا يمكن أن يكون فارغاً' },
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

      // التحقق من محتوى الاسم
      if (!isValidText(ITEM_TYPE_NAME)) {
        return NextResponse.json(
          { success: false, error: 'اسم نوع الصنف يحتوي على أحرف غير مسموح بها' },
          { status: 400 }
        );
      }

      updateData.ITEM_TYPE_NAME = ITEM_TYPE_NAME;
    }
    
    // التحقق من SUB_CAT_ID إذا تم إرساله
    if (SUB_CAT_ID !== undefined) {
      const subCatIdNum = typeof SUB_CAT_ID === 'string' ? parseInt(SUB_CAT_ID) : Number(SUB_CAT_ID);
      if (isNaN(subCatIdNum) || subCatIdNum <= 0) {
        return NextResponse.json(
          { success: false, error: 'التصنيف الفرعي غير صحيح' },
          { status: 400 }
        );
      }
      updateData.SUB_CAT_ID = subCatIdNum;
    }

    // التحقق من وجود بيانات للتحديث
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتحديث' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateItemType(idNum, updateData);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'نوع الصنف غير موجود أو لم يتم التعديل' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث نوع الصنف بنجاح',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating item type:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد نوع صنف آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد نوع صنف آخر بنفس الاسم في هذا التصنيف الفرعي بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث نوع الصنف' },
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

    const { id } = await params;
    const idNum = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'معرف نوع الصنف غير صحيح' },
        { status: 400 }
      );
    }
    
    const rowsAffected = await deleteItemType(idNum);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'نوع الصنف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف نوع الصنف بنجاح',
    });
  } catch (error) {
    console.error('Error deleting item type:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف نوع الصنف' },
      { status: 500 }
    );
  }
}
