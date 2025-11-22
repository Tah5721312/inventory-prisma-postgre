import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { sanitizeInput, isValidText, isValidEmail } from '@/lib/security';

// Interface for user with role and permissions
interface UserWithRolePermissions {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME: string;
  EMAIL: string;
  PHONE?: string;
  IS_ACTIVE?: number;
  ROLE_ID?: number;
  ROLE_NAME?: string;
  DEPT_ID?: number;
  DEPT_NAME?: string;
  RANK_ID?: number;
  RANK_NAME?: string;
  FLOOR_ID?: number;
  FLOOR_NAME?: string;
  PERMISSIONS: {
    SUBJECT: string;
    ACTION: string;
    FIELD_NAME: string | null;
    CAN_ACCESS: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const usernameFilter = searchParams.get('username') || '';
    const roleFilter = searchParams.get('role') || '';

    // Build Prisma query conditions
    const where: any = {};

    if (usernameFilter) {
      where.username = {
        contains: usernameFilter,
        mode: 'insensitive',
      };
    }

    if (roleFilter) {
      where.role = {
        name: roleFilter,
      };
    }

    // Fetch users with relations
    const usersData = await prisma.user.findMany({
      where,
      include: {
        role: {
          include: {
            permissions: {
              orderBy: [
                { subject: 'asc' },
                { action: 'asc' },
              ],
            },
          },
        },
        department: true,
        rank: true,
        floor: true,
      },
      orderBy: {
        userId: 'asc',
      },
    });

    console.log('Query executed successfully, rows:', usersData.length);

    // Transform the result to include permissions as an array
    const users: UserWithRolePermissions[] = usersData.map(user => {
      const permissions = user.role.permissions.map(perm => ({
        SUBJECT: perm.subject,
        ACTION: perm.action,
        FIELD_NAME: perm.fieldName,
        CAN_ACCESS: perm.canAccess ? 1 : 0,
      }));

      return {
        USER_ID: user.userId,
        USERNAME: user.username,
        FULL_NAME: user.fullName || user.username,
        EMAIL: user.email,
        PHONE: user.phone || undefined,
        IS_ACTIVE: user.isActive ? 1 : 0,
        ROLE_ID: user.roleId,
        ROLE_NAME: user.role.name,
        DEPT_ID: user.deptId || undefined,
        DEPT_NAME: user.department?.deptName || undefined,
        RANK_ID: user.rankId || undefined,
        RANK_NAME: user.rank?.rankName || undefined,
        FLOOR_ID: user.floorId || undefined,
        FLOOR_NAME: user.floor?.floorName || undefined,
        PERMISSIONS: permissions,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching users:', errorMessage);
    // ❌ لا نرسل تفاصيل الخطأ للعميل (Information Disclosure)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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
    let { username, email, fullName, phone, deptId, rankId, floorId, isActive } = body;
    const { password, roleId } = body;

    // Validate required fields
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'اسم المستخدم مطلوب' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json(
        { error: 'الاسم الكامل مطلوب' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'كلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    if (!roleId || (typeof roleId !== 'number' && typeof roleId !== 'string')) {
      return NextResponse.json(
        { error: 'الدور مطلوب' },
        { status: 400 }
      );
    }

    // Sanitize و validate input
    username = sanitizeInput(username.trim());
    if (username === '') {
      return NextResponse.json(
        { error: 'اسم المستخدم مطلوب' },
        { status: 400 }
      );
    }

    if (username.length > 100) {
      return NextResponse.json(
        { error: 'اسم المستخدم طويل جداً (الحد الأقصى 100 حرف)' },
        { status: 400 }
      );
    }

    if (!isValidText(username)) {
      return NextResponse.json(
        { error: 'اسم المستخدم يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    email = sanitizeInput(email.trim().toLowerCase());
    if (email === '') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صحيح' },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني طويل جداً (الحد الأقصى 255 حرف)' },
        { status: 400 }
      );
    }

    fullName = sanitizeInput(fullName.trim());
    if (fullName === '') {
      return NextResponse.json(
        { error: 'الاسم الكامل مطلوب' },
        { status: 400 }
      );
    }

    if (fullName.length > 200) {
      return NextResponse.json(
        { error: 'الاسم الكامل طويل جداً (الحد الأقصى 200 حرف)' },
        { status: 400 }
      );
    }

    if (!isValidText(fullName)) {
      return NextResponse.json(
        { error: 'الاسم الكامل يحتوي على أحرف غير مسموح بها' },
        { status: 400 }
      );
    }

    // التحقق من كلمة المرور (طول مناسب)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (password.length > 255) {
      return NextResponse.json(
        { error: 'كلمة المرور طويلة جداً (الحد الأقصى 255 حرف)' },
        { status: 400 }
      );
    }

    // التحقق من roleId
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId) : Number(roleId);
    if (isNaN(roleIdNum) || roleIdNum <= 0) {
      return NextResponse.json(
        { error: 'الدور غير صحيح' },
        { status: 400 }
      );
    }

    // Sanitize phone (optional)
    if (phone && typeof phone === 'string') {
      phone = sanitizeInput(phone.trim());
      if (phone.length > 50) {
        return NextResponse.json(
          { error: 'رقم الهاتف طويل جداً (الحد الأقصى 50 حرف)' },
          { status: 400 }
        );
      }
    } else {
      phone = null;
    }

    // Validate optional IDs
    if (deptId !== undefined && deptId !== null) {
      const deptIdNum = typeof deptId === 'string' ? parseInt(deptId) : Number(deptId);
      if (isNaN(deptIdNum) || deptIdNum <= 0) {
        return NextResponse.json(
          { error: 'معرف القسم غير صحيح' },
          { status: 400 }
        );
      }
      deptId = deptIdNum;
    } else {
      deptId = null;
    }

    if (rankId !== undefined && rankId !== null) {
      const rankIdNum = typeof rankId === 'string' ? parseInt(rankId) : Number(rankId);
      if (isNaN(rankIdNum) || rankIdNum <= 0) {
        return NextResponse.json(
          { error: 'معرف الرتبة غير صحيح' },
          { status: 400 }
        );
      }
      rankId = rankIdNum;
    } else {
      rankId = null;
    }

    if (floorId !== undefined && floorId !== null) {
      const floorIdNum = typeof floorId === 'string' ? parseInt(floorId) : Number(floorId);
      if (isNaN(floorIdNum) || floorIdNum <= 0) {
        return NextResponse.json(
          { error: 'معرف الطابق غير صحيح' },
          { status: 400 }
        );
      }
      floorId = floorIdNum;
    } else {
      floorId = null;
    }

    // Validate isActive
    if (isActive !== undefined && isActive !== null) {
      if (typeof isActive !== 'number' && typeof isActive !== 'string') {
        return NextResponse.json(
          { error: 'الحالة غير صحيحة' },
          { status: 400 }
        );
      }
      isActive = Number(isActive);
      if (isActive !== 0 && isActive !== 1) {
        return NextResponse.json(
          { error: 'الحالة يجب أن تكون 0 أو 1' },
          { status: 400 }
        );
      }
    } else {
      isActive = 1;
    }

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'اسم المستخدم موجود بالفعل' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
    
    if (existingEmail) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني موجود بالفعل' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        password: hashedPassword,
        roleId: roleIdNum,
        isActive: isActive === 1,
        phone: phone || null,
        deptId: deptId || null,
        rankId: rankId || null,
        floorId: floorId || null,
      },
    });

    return NextResponse.json({ 
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
