// src/app/backend/api/auth/google/callback/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check if there was an error from Google
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Google authentication failed: " + error)}`, request.url)
    );
  }

  // Validate state to prevent CSRF attacks
  const cookieStore = cookies();
  const storedState = (await cookieStore).get("google_oauth_state")?.value;

  if (!storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Invalid authentication state, please try again")}`, request.url)
    );
  }

  // Clear the state cookie
  (await cookieStore).delete("google_oauth_state");

  // Missing authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Missing authorization code from Google")}`, request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = "http://localhost:3000/backend/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Missing OAuth configuration")}`, request.url)
    );
  }

  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange error:", tokenData);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent("Failed to authenticate with Google")}`, request.url)
      );
    }

    // Get user info with the access token
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error("User info error:", userData);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent("Failed to get user information from Google")}`, request.url)
      );
    }

    // Set temporary login cookie
    (await cookieStore).set("user_email", userData.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    console.log("Successfully authenticated user:", userData.email);

    // Redirect to the dashboard or home page
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Authentication process failed")}`, request.url)
    );
  }
}
