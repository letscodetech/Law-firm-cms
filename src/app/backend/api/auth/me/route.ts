import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface JwtPayload {
  userId: string;
}

export async function GET() {
  try {
    const token = (await cookies()).get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
