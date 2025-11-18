export const runtime = 'nodejs';

import { db } from '@/lib/db';
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

interface SignupRequestBody {
  name: string;
  email: string;
  password?: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let rawBody;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json({ message: "Failed to read request body" }, { status: 400 });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: "Invalid JSON format" }, { status: 400 });
    }

    const { name, email, password }: SignupRequestBody = parsedBody;

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    if (password && password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      await db.$transaction(async (tx) => {
        await tx.verificationCode.deleteMany({
          where: { email: email.toLowerCase() },
        });

        await tx.verificationCode.create({
          data: {
            email: email.toLowerCase(),
            code: verificationCode,
            expiresAt,
            userData: JSON.stringify({ name, password: password || null }),
          },
        });
      });
    } catch {
      return NextResponse.json({ message: "Database error occurred" }, { status: 500 });
    }

    try {
      const transporter = createEmailTransporter();

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Firm Ease',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER!,
        },
        to: email,
        subject: 'Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
              <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Thank you for signing up! To complete your registration, please use the verification code below:
              </p>
              
              <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; border: 2px solid #667eea; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                  ${verificationCode}
                </span>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                This code will expire in <strong>15 minutes</strong>. If you didn't request this verification, please ignore this email.
              </p>
              
              <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);

      return NextResponse.json({
        message: "Verification code sent to your email!",
        email: email.toLowerCase(),
        nextStep: "verify-email"
      });

    } catch {
      await db.verificationCode.deleteMany({
        where: { email: email.toLowerCase() },
      });

      return NextResponse.json(
        { message: "Failed to send verification email. Please login if you already has an account" },
        { status: 500 }
      );
    }

  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
