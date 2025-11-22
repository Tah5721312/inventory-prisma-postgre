// app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllDepartments, createDepartment } from '@/lib/db_utils';
import { sanitizeInput, isValidText } from '@/lib/security';

export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const departments = await getAllDepartments();
    console.log('📦 Fetched departments from DB:', departments);
    console.log('📦 Number of departments:', departments?.length || 0);
    return NextResponse.json({ success: true, data: departments }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fetching departments:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الأقسام' },
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
    let { DEPT_NAME } = body;

    // التحقق من وجود البيانات
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

    // التحقق من محتوى الاسم (منع HTML/Script tags)
    if (!isValidText(DEPT_NAME)) {
      return NextResponse.json(
        { success: false, error: 'اسم القسم يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    const newDeptId = await createDepartment({ DEPT_NAME });
    
    return NextResponse.json(
      { success: true, message: 'تم إنشاء القسم بنجاح', id: newDeptId },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating department:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد قسم بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد قسم بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء القسم' },
      { status: 500 }
    );
  }
}