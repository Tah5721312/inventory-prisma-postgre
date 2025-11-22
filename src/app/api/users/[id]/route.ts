import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/database';
import { sanitizeInput, isValidText, isValidEmail } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const userId = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { userId },
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
        department: {
          select: {
            deptId: true,
            deptName: true,
          },
        },
        rank: {
          select: {
            rankId: true,
            rankName: true,
          },
        },
        floor: {
          select: {
            floorId: true,
            floorName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const permissions = user.role?.permissions.map((perm) => ({
      SUBJECT: perm.subject,
      ACTION: perm.action,
      FIELD_NAME: perm.fieldName || null,
      CAN_ACCESS: perm.canAccess ? 1 : 0,
    })) || [];

    const userResponse = {
      USER_ID: user.userId,
      USERNAME: user.username,
      FULL_NAME: user.fullName || user.username,
      EMAIL: user.email,
      PHONE: user.phone || undefined,
      IS_ACTIVE: user.isActive ? 1 : 0,
      ROLE_ID: user.roleId || undefined,
      ROLE_NAME: user.role?.name || undefined,
      DEPT_ID: user.deptId || undefined,
      DEPT_NAME: user.department?.deptName || undefined,
      RANK_ID: user.rankId || undefined,
      RANK_NAME: user.rank?.rankName || undefined,
      FLOOR_ID: user.floorId || undefined,
      FLOOR_NAME: user.floor?.floorName || undefined,
      PERMISSIONS: permissions,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// ***************
// update user roles
// ***************

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const userId = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { username, email, fullName, phone } = body;
    const { roleId, newUserId, deptId, rankId, floorId, isActive } = body;

    // If the client requests changing the USER_ID, validate uniqueness first
    let effectiveUserId = userId;
    
    // Validate newUserId if provided
    if (typeof newUserId === 'number' && newUserId !== userId) {
      if (isNaN(newUserId) || newUserId <= 0) {
        return NextResponse.json(
          { error: 'معرف المستخدم الجديد غير صحيح' },
          { status: 400 }
        );
      }
      
      // Check if newUserId already exists
      const existingUser = await prisma.user.findUnique({
        where: { userId: newUserId },
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'معرف المستخدم موجود بالفعل' },
          { status: 409 }
        );
      }

      // Update the primary key - Prisma doesn't support updating primary keys directly
      // We need to create a new user with the new ID, copy data, then delete old one
      // But this is complex, so we'll use a transaction
      const currentUser = await prisma.user.findUnique({
        where: { userId },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود' },
          { status: 404 }
        );
      }

      // Create new user with new ID
      await prisma.user.create({
        data: {
          userId: newUserId,
          username: currentUser.username,
          email: currentUser.email,
          password: currentUser.password,
          fullName: currentUser.fullName,
          phone: currentUser.phone,
          roleId: currentUser.roleId,
          deptId: currentUser.deptId,
          rankId: currentUser.rankId,
          floorId: currentUser.floorId,
          isActive: currentUser.isActive,
        },
      });

      // Delete old user
      await prisma.user.delete({
        where: { userId },
      });

      effectiveUserId = newUserId;
    }

    // Build update data object
    // Use Prisma's UserUncheckedUpdateInput type for direct field updates
    const updateData: {
      username?: string;
      email?: string;
      fullName?: string;
      phone?: string | null;
      roleId?: number;
      deptId?: number | null;
      rankId?: number | null;
      floorId?: number | null;
      isActive?: boolean;
    } = {};

    if (username !== undefined) {
      if (typeof username !== 'string') {
        return NextResponse.json(
          { error: 'اسم المستخدم يجب أن يكون نص' },
          { status: 400 }
        );
      }
      
      username = sanitizeInput(username.trim());
      if (username === '') {
        return NextResponse.json(
          { error: 'اسم المستخدم لا يمكن أن يكون فارغاً' },
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

      updateData.username = username;
    }
    
    if (email !== undefined) {
      if (typeof email !== 'string') {
        return NextResponse.json(
          { error: 'البريد الإلكتروني يجب أن يكون نص' },
          { status: 400 }
        );
      }
      
      email = sanitizeInput(email.trim().toLowerCase());
      if (email === '') {
        return NextResponse.json(
          { error: 'البريد الإلكتروني لا يمكن أن يكون فارغاً' },
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

      updateData.email = email;
    }
    
    if (fullName !== undefined) {
      if (typeof fullName !== 'string') {
        return NextResponse.json(
          { error: 'الاسم الكامل يجب أن يكون نص' },
          { status: 400 }
        );
      }
      
      fullName = sanitizeInput(fullName.trim());
      if (fullName === '') {
        return NextResponse.json(
          { error: 'الاسم الكامل لا يمكن أن يكون فارغاً' },
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

      updateData.fullName = fullName;
    }
    
    if (roleId !== undefined) {
      const roleIdNum = typeof roleId === 'string' ? parseInt(roleId) : Number(roleId);
      if (isNaN(roleIdNum) || roleIdNum <= 0) {
        return NextResponse.json(
          { error: 'الدور غير صحيح' },
          { status: 400 }
        );
      }
      updateData.roleId = roleIdNum;
    }
    
    if (phone !== undefined) {
      if (phone === null || phone === '') {
        updateData.phone = null;
      } else if (typeof phone === 'string') {
        phone = sanitizeInput(phone.trim());
        if (phone.length > 50) {
          return NextResponse.json(
            { error: 'رقم الهاتف طويل جداً (الحد الأقصى 50 حرف)' },
            { status: 400 }
          );
        }
        updateData.phone = phone;
      } else {
        return NextResponse.json(
          { error: 'رقم الهاتف يجب أن يكون نص' },
          { status: 400 }
        );
      }
    }
    
    if (deptId !== undefined) {
      if (deptId === null || deptId === '') {
        updateData.deptId = null;
      } else {
        const deptIdNum = typeof deptId === 'string' ? parseInt(deptId) : Number(deptId);
        if (isNaN(deptIdNum) || deptIdNum <= 0) {
          return NextResponse.json(
            { error: 'معرف القسم غير صحيح' },
            { status: 400 }
          );
        }
        updateData.deptId = deptIdNum;
      }
    }
    
    if (rankId !== undefined) {
      if (rankId === null || rankId === '') {
        updateData.rankId = null;
      } else {
        const rankIdNum = typeof rankId === 'string' ? parseInt(rankId) : Number(rankId);
        if (isNaN(rankIdNum) || rankIdNum <= 0) {
          return NextResponse.json(
            { error: 'معرف الرتبة غير صحيح' },
            { status: 400 }
          );
        }
        updateData.rankId = rankIdNum;
      }
    }
    
    if (floorId !== undefined) {
      if (floorId === null || floorId === '') {
        updateData.floorId = null;
      } else {
        const floorIdNum = typeof floorId === 'string' ? parseInt(floorId) : Number(floorId);
        if (isNaN(floorIdNum) || floorIdNum <= 0) {
          return NextResponse.json(
            { error: 'معرف الطابق غير صحيح' },
            { status: 400 }
          );
        }
        updateData.floorId = floorIdNum;
      }
    }
    
    if (isActive !== undefined) {
      if (typeof isActive !== 'number' && typeof isActive !== 'string') {
        return NextResponse.json(
          { error: 'الحالة غير صحيحة' },
          { status: 400 }
        );
      }
      const isActiveNum = Number(isActive);
      if (isActiveNum !== 0 && isActiveNum !== 1) {
        return NextResponse.json(
          { error: 'الحالة يجب أن تكون 0 أو 1' },
          { status: 400 }
        );
      }
      updateData.isActive = isActiveNum === 1;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update user using unchecked input (allows direct foreign key updates)
    await prisma.user.update({
      where: { userId: effectiveUserId },
      data: updateData as {
        username?: string;
        email?: string;
        fullName?: string;
        phone?: string | null;
        roleId?: number;
        deptId?: number | null;
        rankId?: number | null;
        floorId?: number | null;
        isActive?: boolean;
      },
    });

    // Fetch updated user data with permissions
    const updatedUser = await prisma.user.findUnique({
      where: { userId: effectiveUserId },
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
        department: {
          select: {
            deptId: true,
            deptName: true,
          },
        },
        rank: {
          select: {
            rankId: true,
            rankName: true,
          },
        },
        floor: {
          select: {
            floorId: true,
            floorName: true,
          },
        },
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found after update' },
        { status: 404 }
      );
    }

    const permissions = updatedUser.role?.permissions.map((perm) => ({
      SUBJECT: perm.subject,
      ACTION: perm.action,
      FIELD_NAME: perm.fieldName || null,
      CAN_ACCESS: perm.canAccess ? 1 : 0,
    })) || [];

    const userResponse = {
      USER_ID: updatedUser.userId,
      USERNAME: updatedUser.username,
      FULL_NAME: updatedUser.fullName || updatedUser.username,
      EMAIL: updatedUser.email,
      PHONE: updatedUser.phone || undefined,
      IS_ACTIVE: updatedUser.isActive ? 1 : 0,
      ROLE_ID: updatedUser.roleId || undefined,
      ROLE_NAME: updatedUser.role?.name || undefined,
      DEPT_ID: updatedUser.deptId || undefined,
      DEPT_NAME: updatedUser.department?.deptName || undefined,
      RANK_ID: updatedUser.rankId || undefined,
      RANK_NAME: updatedUser.rank?.rankName || undefined,
      FLOOR_ID: updatedUser.floorId || undefined,
      FLOOR_NAME: updatedUser.floor?.floorName || undefined,
      PERMISSIONS: permissions,
    };

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ***************
// DELETE user roles
// ***************
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const userId = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
