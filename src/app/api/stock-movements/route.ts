import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { auth } from '@/auth';
import { getInventoryMovements, getMovementTypes, addInventoryMovement, deleteInventoryMovement } from '@/lib/db_utils';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const movementTypeId = searchParams.get('movementTypeId');
    const limit = searchParams.get('limit');
    const action = searchParams.get('action');

    // إذا كان الطلب للحصول على أنواع الحركات
    if (action === 'types') {
      const types = await getMovementTypes();
      return NextResponse.json({ success: true, data: types });
    }

    const movements = await getInventoryMovements({
      itemId: itemId ? Number(itemId) : undefined,
      movementTypeId: movementTypeId ? Number(movementTypeId) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({ success: true, data: movements });
  } catch (error: any) {
    console.error('❌ Error in GET /api/stock-movements:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حركات المخزون' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const session = await auth();
    const userId = (session?.user as any)?.userId || (session?.user?.id ? parseInt(String(session.user.id), 10) : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'تعذر تحديد المستخدم الحالي' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      itemId, 
      movementTypeId, 
      unit,
      quantity, 
      referenceNo, 
      notes,
      fromDeptId,
      toDeptId,
      fromFloorId,
      toFloorId
    } = body ?? {};

    if (!itemId || !movementTypeId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'معرف الصنف ونوع الحركة والكمية مطلوبة' },
        { status: 400 }
      );
    }

    const quantityNumber = Number(quantity);
    if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      return NextResponse.json(
        { success: false, error: 'الكمية يجب أن تكون رقمًا أكبر من صفر' },
        { status: 400 }
      );
    }

    const result = await addInventoryMovement({
      itemId: Number(itemId),
      movementTypeId: Number(movementTypeId),
      unit: unit ? String(unit).trim() : null,
      quantity: quantityNumber,
      userId: Number(userId),
      referenceNo: referenceNo ? String(referenceNo) : null,
      notes: notes ? String(notes) : null,
      fromDeptId: fromDeptId ? Number(fromDeptId) : null,
      toDeptId: toDeptId ? Number(toDeptId) : null,
      fromFloorId: fromFloorId ? Number(fromFloorId) : null,
      toFloorId: toFloorId ? Number(toFloorId) : null,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل حركة المخزون بنجاح',
      data: result.item,
      movementId: result.movementId,
    });
  } catch (error: any) {
    console.error('❌ Error in POST /api/stock-movements:', error);

    const oracleMessage =
      typeof error?.message === 'string' && error.message.includes('ORA-200')
        ? error.message.split(':').pop()?.trim() ?? 'فشل تنفيذ الحركة'
        : error?.message || 'فشل تنفيذ الحركة';

    return NextResponse.json(
      { success: false, error: oracleMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const movementId = searchParams.get('movementId');

    if (!movementId) {
      return NextResponse.json(
        { success: false, error: 'معرف الحركة مطلوب' },
        { status: 400 }
      );
    }

    const updatedItem = await deleteInventoryMovement(Number(movementId));

    return NextResponse.json({
      success: true,
      message: 'تم حذف الحركة بنجاح',
      data: updatedItem,
    });
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/stock-movements:', error);

    const errorMessage =
      typeof error?.message === 'string'
        ? error.message
        : 'فشل حذف الحركة';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
