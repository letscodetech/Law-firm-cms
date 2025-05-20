// src/app/backend/api/auth/google/route.ts
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  // Generate a random state string for CSRF protection
  const state = randomBytes(16).toString("hex");

  // Set state in cookie to validate later
  const cookieStore = cookies();
  (await cookieStore).set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/backend/api/auth/google/callback`;

  if (!clientId || !process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.redirect(`/?error=${encodeURIComponent("Google authentication is not properly configured. Missing API credentials.")}`);
  }

  // Construct Google OAuth2 URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "email profile");
  googleAuthUrl.searchParams.set("state", state);

  // Redirect to Google consent screen
  return NextResponse.redirect(googleAuthUrl.toString());
}