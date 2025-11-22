
// app/api/departments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getDepartmentById, updateDepartment, deleteDepartment } from '@/lib/db_utils';
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
        { error: 'معرف القسم غير صحيح' },
        { status: 400 }
      );
    }
    
    const department = await getDepartmentById(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'القسم غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'فشل في جلب القسم' },
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
        { success: false, error: 'معرف القسم غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { DEPT_NAME } = body;

    // التحقق من وجود الاسم
    if (!DEPT_NAME || typeof DEPT_NAME !== 'string') {
      return NextResponse.json(
        { success: false, error: 'اسم القسم مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    DEPT_NAME = sanitizeInput(DEPT_NAME.trim());
    
    if (DEPT_NAME === '') {
      return NextResponse.json(
        { success: false, error: 'اسم القسم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من طول الاسم
    if (DEPT_NAME.length > 200) {
      return NextResponse.json(
        { success: false, error: 'اسم القسم طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من محتوى الاسم
    if (!isValidText(DEPT_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم القسم يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateDepartment(id, { DEPT_NAME });
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { success: true, message: 'تم تحديث القسم بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'القسم غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating department:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد قسم آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد قسم آخر بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث القسم' },
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
        { error: 'معرف القسم غير صحيح' },
        { status: 400 }
      );
    }
    
    const rowsAffected = await deleteDepartment(id);
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { message: 'تم حذف القسم بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'القسم غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'فشل في حذف القسم' },
      { status: 500 }
    );
  }
}