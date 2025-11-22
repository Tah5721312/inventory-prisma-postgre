import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getMovementTypes } from '@/lib/db_utils';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const types = await getMovementTypes();
    return NextResponse.json({ success: true, data: types });
  } catch (error: any) {
    console.error('❌ Error in GET /api/movement-types:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب أنواع الحركات' },
      { status: 500 }
    );
  }
}

