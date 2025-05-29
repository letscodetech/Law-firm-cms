import { cookies } from "next/headers";
import { db } from '@/lib/db';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

interface VerifyEmailRequestBody {
  name: string;
  email: string;
  password: string;
  verificationCode: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { name, email, password, verificationCode }: VerifyEmailRequestBody = await request.json();

    // Validate required fields
    if (!email || !name || !password || !verificationCode) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Validate verification code format (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return NextResponse.json({ message: "Verification code must be 6 digits" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    }

    // Find and validate verification code
    const storedCode = await db.verificationCode.findFirst({
      where: {
        email: email.toLowerCase(),
        code: verificationCode,
        expiresAt: {
          gt: new Date(), // Check if code hasn't expired
        },
      },
    });

    if (!storedCode) {
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and delete verification code in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          emailVerified: true, // Mark as verified since they used the code
        },
      });

      // Delete the verification code (one-time use)
      await tx.verificationCode.delete({
        where: { id: storedCode.id },
      });

      return user;
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.id,
        email: result.email,
        name: result.name 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Set auth token cookie
    (await cookies()).set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // Return created user (without password)
    return NextResponse.json({
      message: "Account created and verified successfully",
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        emailVerified: result.emailVerified,
      },
    });

  } catch (error) {
    console.error("Verify email error:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ message: "Email already in use" }, { status: 409 });
      }
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}