import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Log the received email for debugging
    console.log('Looking for user with email:', email);

    // Check if user exists (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        }
      },
      select: {
        userId: true,
        email: true,
      }
    });

    console.log('Database result:', user ? 'User found' : 'No user found');
    
    if (!user) {
      // Log available emails for debugging in development
      if (process.env.NODE_ENV === 'development') {
        const allUsers = await prisma.user.findMany({
          select: { email: true }
        });
        console.log('Available emails in database:', allUsers.map(u => u.email));
      }
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update password
    await prisma.user.update({
      where: {
        email: user.email, // Use the exact email case from the database
      },
      data: {
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}