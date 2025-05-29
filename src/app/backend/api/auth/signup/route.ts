import { NextResponse } from "next/server";

interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { name, email, password }: SignupRequestBody = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    // Instead of creating user directly, redirect to email verification flow
    // The frontend should call /api/auth/send-verification after this
    return NextResponse.json({
      message: "Please verify your email to complete signup",
      nextStep: "email-verification",
      email: email.toLowerCase(),
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}