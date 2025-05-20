// src/app/backend/api/auth/login/route.ts
import { cookies } from "next/headers";
import { db } from '@/lib/db';
import bcrypt from "bcryptjs"; // For password hashing
import jwt from "jsonwebtoken"; // For JWT token generation
import { NextResponse } from 'next/server';

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { email, password }: LoginRequestBody = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Check if user exists and verify password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Set authentication cookie
    (await
          // Set authentication cookie
          cookies()).set({
      name: "authToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // Return user info (exclude sensitive data)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}