// app/api/items/route.ts - نسخة نهائية ومُختبرة

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllItems, getItemById, createItem, updateItem, deleteItem } from '@/lib/db_utils';

// GET - جلب جميع الأصناف أو صنف معين
export async function GET(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // جلب صنف واحد بالـ ID
    if (id) {
      const item = await getItemById(Number(id));
      if (!item) {
        return NextResponse.json(
          { success: false, error: 'الصنف غير موجود' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: item });
    }

    // جلب جميع الأصناف مع الفلاتر
    const userIdParam = searchParams.get('userId');
    const filters = {
      catId: searchParams.get('catId') ? Number(searchParams.get('catId')) : undefined,
      subCatId: searchParams.get('subCatId') ? Number(searchParams.get('subCatId')) : undefined,
      itemTypeId: searchParams.get('itemTypeId') ? Number(searchParams.get('itemTypeId')) : undefined,
      userId: userIdParam === 'warehouse' ? null : (userIdParam ? Number(userIdParam) : undefined),
      deptId: searchParams.get('deptId') ? Number(searchParams.get('deptId')) : undefined,
      serial: searchParams.get('serial') || undefined,
      itemName: searchParams.get('itemName') || undefined,
      ip: searchParams.get('ip') || undefined,
      compName: searchParams.get('compName') || undefined,
    };

    const items = await getAllItems(filters);
    
    return NextResponse.json({ 
      success: true, 
      data: items,
      count: items.length 
    });
    
  } catch (error: any) {
    console.error('❌ Error in GET /api/items:', error);
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في جلب البيانات'
      },
      { status: 500 }
    );
  }
}

// POST - إضافة صنف جديد
export async function POST(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.ITEM_NAME || !body.ITEM_NAME.trim()) {
      return NextResponse.json(
        { success: false, error: 'اسم الصنف مطلوب' },
        { status: 400 }
      );
    }

    if (!body.SUB_CAT_ID) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي مطلوب' },
        { status: 400 }
      );
    }

    const newItemId = await createItem(body);
    const newItem = await getItemById(newItemId);

    return NextResponse.json(
      { success: true, data: newItem },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('❌ Error in POST /api/items:', error);
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في إضافة الصنف'
      },
      { status: 500 }
    );
  }
}

// PUT - تحديث صنف
export async function PUT(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    const { ITEM_ID, ...updateData } = body;

    if (!ITEM_ID) {
      return NextResponse.json(
        { success: false, error: 'معرف الصنف مطلوب' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateItem(ITEM_ID, updateData);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'الصنف غير موجود' },
        { status: 404 }
      );
    }

    const updatedItem = await getItemById(ITEM_ID);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedItem 
    });
    
  } catch (error: any) {
    console.error('❌ Error in PUT /api/items:', error);
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في تحديث الصنف'
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف صنف
export async function DELETE(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الصنف مطلوب' },
        { status: 400 }
      );
    }

    const rowsAffected = await deleteItem(Number(id));

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'الصنف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم الحذف بنجاح' 
    });
    
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/items:', error);
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في حذف الصنف'
      },
      { status: 500 }
    );
  }
}