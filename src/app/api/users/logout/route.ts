import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST(_request: NextRequest) {
  try {
    await signOut({ redirect: false });
    return NextResponse.json({ message: 'Logged out' }, { status: 200 });
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
