export const runtime = 'nodejs';

import { db } from '@/lib/db';
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

interface ResetPasswordBody {
  token: string;
  password: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let rawBody;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const { token, password }: ResetPasswordBody = parsedBody;

    if (!token) {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    try {
      const resetToken = await db.accountResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        });

        await tx.accountResetToken.delete({ 
          where: { token } 
        });
      });

      return NextResponse.json({ 
        message: 'Password has been reset successfully.' 
      });

    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return NextResponse.json({ 
        error: 'Database error occurred' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}