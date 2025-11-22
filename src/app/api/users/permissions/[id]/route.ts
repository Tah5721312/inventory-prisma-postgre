import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/database';

type PermissionRow = {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME?: string | null;
  ROLE_NAME: string;
  SUBJECT: string;
  ACTION: string;
  FIELD_NAME?: string | null;
  CAN_ACCESS?: number | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    
    // ✅ جلب المستخدم مع الصلاحيات
    const user = await prisma.user.findUnique({
      where: { userId: Number(id) },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ تحويل الصلاحيات إلى التنسيق المطلوب
    const rows: PermissionRow[] = user.role.permissions.map(perm => ({
      USER_ID: user.userId,
      USERNAME: user.username,
      FULL_NAME: user.fullName,
      ROLE_NAME: user.role.name,
      SUBJECT: perm.subject,
      ACTION: perm.action,
      FIELD_NAME: perm.fieldName,
      CAN_ACCESS: perm.canAccess ? 1 : 0,
    }));

    const roleName = user.role.name;
    return NextResponse.json({
      status: 'success',
      data: {
        roleName,
        permissions: rows,
      },
    });
  } catch (error) {
    console.error('Permissions fetch error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch user permissions' },
      { status: 500 }
    );
  }
}


