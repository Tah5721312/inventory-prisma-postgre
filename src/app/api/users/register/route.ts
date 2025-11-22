import { registerSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from "@/lib/database";
import { signIn } from '@/auth';

/**
 *  @method  POST
 *  @route   ~/api/users/register
 *  @desc    Create New User [(Register) (Sign Up) (انشاء حساب)]
 *  @access  public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() ;

    // ✅ Validate
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
      { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // ✅ Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: body.email, mode: 'insensitive' } },
          { username: { equals: body.username, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'This user already registered' },
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ Get default role (USER role, typically roleId = 6 based on seed data)
    // You may need to adjust this based on your role setup
    const defaultRole = await prisma.role.findFirst({
      where: { name: 'USER' }
    });

    if (!defaultRole) {
      return NextResponse.json(
        { message: 'Default role not found' },
        { status: 500 }
      );
    }

    // ✅ Insert user
    const newUser = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        roleId: defaultRole.roleId,
        fullName: body.fullName || body.username,
        phone: body.phone || null,
        isActive: true,
      },
      select: {
        userId: true,
        username: true,
        roleId: true,
      }
    });

    const userResponse = {
      id: newUser.userId,
      username: newUser.username,
      roleId: newUser.roleId
    };

    // ✅ Create session using NextAuth
    await signIn('credentials', { redirect: false, email: body.email, password: body.password });

    return NextResponse.json(
      { ...userResponse, message: "Registered & Authenticated" },
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: 'internal server error' },
      { status: 500 }
    );
  }
}
