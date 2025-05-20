import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  
  // Clear all authentication-related cookies
  cookieStore.delete("auth_token");
  cookieStore.delete("user_data");
  // Add any other auth cookies you might be using
  
  return NextResponse.json({ success: true });
}