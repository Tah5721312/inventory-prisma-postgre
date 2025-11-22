import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { defineAbilityFromDB } from '@/lib/ability.server';

export async function GET(request: NextRequest) {
  try {
    // ✅ استخدام NextAuth JWT للحصول على معلومات المستخدم
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      console.log('❌ No valid session token found');
      return NextResponse.json({ 
        success: false, 
        canRead: false,
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    // ✅ الـ token.id هو اللي محفوظ في JWT (من auth.ts)
    const userId = parseInt(String(token.id), 10);
    
    if (isNaN(userId)) {
      console.log('❌ Invalid user ID in token');
      return NextResponse.json({ 
        success: false, 
        canRead: false,
        error: 'Invalid user ID' 
      }, { status: 400 });
    }

    console.log(`\n🔍 ========== Checking Report Permissions for User ${userId} ==========`);
    
    // جلب الصلاحيات من قاعدة البيانات
    const ability = await defineAbilityFromDB(userId);
    
    // ✅ فحص الصلاحيات بالترتيب
    const canManageAll = ability.can('manage', 'all');
    const canReadReports = ability.can('read', 'Reports');
    const canManageReports = ability.can('manage', 'Reports');
    
    // ✅ أي صلاحية من هذه تكفي
    const hasPermission = canManageAll || canReadReports || canManageReports;
    
    console.log(`📊 User ${userId} Report Permissions:`, {
      canManageAll,
      canReadReports,
      canManageReports,
      finalDecision: hasPermission,
      totalRules: ability.rules.length,
    });
    
    // طباعة جميع القواعد للتشخيص
    console.log('📋 All rules:', JSON.stringify(ability.rules, null, 2));
    
    console.log(`========== Result: ${hasPermission ? '✅ ALLOWED' : '❌ DENIED'} ==========\n`);
    
    return NextResponse.json({ 
      success: true, 
      canRead: hasPermission,
      debug: {
        userId,
        canManageAll,
        canReadReports,
        canManageReports,
        rulesCount: ability.rules.length
      }
    });

  } catch (error) {
    console.error('❌ Error checking report permissions:', error);
    return NextResponse.json({ 
      success: false, 
      canRead: false,
      error: 'Failed to check permissions' 
    }, { status: 500 });
  }
}