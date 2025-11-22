import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserSchema } from "@/lib/validationSchemas";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database";

/**
 *  @method  DELETE
 *  @route   ~/api/users/profile/:id
 *  @desc    Delete Profile
 *  @access  private (only user himself can delete his account)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ✅ تحقق هل المستخدم موجود
    const user = await prisma.user.findUnique({
      where: { userId: Number(id) },
      select: {
        userId: true,
        username: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من الجلسة
    const session = await auth();
    if (session?.user && (Number((session.user as any).id) === user.userId || (session.user as any).isAdmin)) {
      await prisma.user.delete({
        where: { userId: Number(id) }
      });
      return NextResponse.json({ message: "your profile has been deleted" }, { status: 200 });
    }

    return NextResponse.json(
      { message: "only user himself can delete his profile" },
      { status: 403 }
    );
  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  }
}

/**
 *  @method  GET
 *  @route   ~/api/users/profile/:id
 *  @desc    Get Profile By Id
 *  @access  private
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ✅ جلب معلومات المستخدم الكاملة مع الـ JOINs
    const user = await prisma.user.findUnique({
      where: { userId: Number(id) },
      include: {
        role: {
          select: { name: true }
        },
        department: {
          select: { deptName: true }
        },
        rank: {
          select: { rankName: true }
        },
        floor: {
          select: { floorName: true }
        },
        _count: {
          select: { items: true }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user || (Number((session.user as any).id) !== user.userId && !(session.user as any).isAdmin)) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    const userResponse = {
      ID: user.userId,
      USERNAME: user.username,
      EMAIL: user.email,
      FULL_NAME: user.fullName,
      PHONE: user.phone,
      IS_ACTIVE: user.isActive ? 1 : 0,
      ROLE_ID: user.roleId,
      DEPT_ID: user.deptId,
      RANK_ID: user.rankId,
      FLOOR_ID: user.floorId,
      CREATED_AT: user.createdAt.toISOString(),
      ROLE_NAME: user.role.name,
      DEPT_NAME: user.department?.deptName,
      RANK_NAME: user.rank?.rankName,
      FLOOR_NAME: user.floor?.floorName,
      ITEMS_COUNT: user._count.items,
    };

    return NextResponse.json(userResponse, { status: 200 });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  }
}

/**
 *  @method  PUT
 *  @route   ~/api/users/profile/:id
 *  @desc    Update Profile
 *  @access  private
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ✅ تحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { userId: Number(id) },
      select: {
        userId: true,
        username: true,
        email: true,
        password: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من الجلسة
    const session = await auth();
    if (!session?.user || Number(session.user.id) !== user.userId) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    // ✅ تحقق من البيانات
    const body = (await request.json()) ;
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }

    // ✅ تحديث البيانات
    const updateData: {
      username?: string;
      email?: string;
      password?: string;
    } = {};

    if (body.username) updateData.username = body.username;
    if (body.email) updateData.email = body.email;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { userId: Number(id) },
      data: updateData,
      select: {
        userId: true,
        username: true,
        email: true,
      }
    });

    return NextResponse.json(
      { id: updatedUser.userId, username: updatedUser.username, email: updatedUser.email },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  }
}
