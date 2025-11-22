import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getStatistics } from '@/lib/db_utils';

export async function GET(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const statistics = await getStatistics();
    
    return NextResponse.json({ 
      success: true, 
      data: statistics
    });
    
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in GET /api/statistics:', errorMessage);
    
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في جلب الإحصائيات'
      },
      { status: 500 }
    );
  }
}

