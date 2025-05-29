export const runtime = 'nodejs';

import { db } from '@/lib/db';
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

interface ResetRequestBody {
  email: string;
}

function generateResetToken(): string {
  return randomBytes(32).toString('hex');
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

    const { email }: ResetRequestBody = parsedBody;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!existingUser) {
      return NextResponse.json({ 
        message: "If the email exists, a reset link has been sent." 
      });
    }

    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    try {
      // Clean up old reset tokens for this user
      await db.$transaction(async (tx) => {
        await tx.accountResetToken.deleteMany({
          where: { userId: existingUser.id },
        });

        await tx.accountResetToken.create({
          data: {
            token: resetToken,
            userId: existingUser.id,
            expiresAt,
          },
        });
      });
    } catch {
      return NextResponse.json({ message: "Database error occurred" }, { status: 500 });
    }

    try {
      const transporter = createEmailTransporter();
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Firm Ease',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER!,
        },
        to: email,
        subject: 'Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
              <h2 style="color: #333; margin-top: 0;">Hello!</h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, please ignore this email.
              </p>
              
              <p style="font-size: 12px; color: #999; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                ${resetUrl}
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
        message: "If the email exists, a reset link has been sent."
      });

    } catch (error) {
      console.error('Email sending error:', error);
      
      // Clean up the token if email fails
      await db.accountResetToken.deleteMany({
        where: { userId: existingUser.id },
      });

      return NextResponse.json(
        { message: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}