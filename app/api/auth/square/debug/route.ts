import { NextRequest, NextResponse } from "next/server";
import { squareApplicationId } from "@/lib/square";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/**
 * GET /api/auth/square/debug
 * 
 * Debug endpoint to check Square OAuth configuration and generate test URL
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectUri = siteUrl ? `${siteUrl}/api/auth/square/callback` : null;
    
    const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
    const authorizeUrl = isProduction
      ? "https://connect.squareup.com/oauth2/authorize"
      : "https://connect.squareupsandbox.com/oauth2/authorize";

    // Build a test OAuth URL
    let testOAuthUrl = null;
    if (user && squareApplicationId && redirectUri) {
      const scopes = [
        "PAYMENTS_READ",
        "PAYMENTS_WRITE",
        "MERCHANT_PROFILE_READ",
        "ITEMS_READ",
        "ORDERS_READ",
        "ORDERS_WRITE",
        "DEVICE_CREDENTIAL_MANAGEMENT",
      ].join(" ");
      
      const state = `${user.id}:${randomUUID()}`;
      const params = new URLSearchParams({
        client_id: squareApplicationId,
        scope: scopes,
        state: state,
        redirect_uri: redirectUri,
      });
      
      let queryString = params.toString();
      queryString = queryString.replace(/scope=([^&]+)/, (match, scopeValue) => {
        return `scope=${scopeValue.replace(/%20/g, '+')}`;
      });
      
      testOAuthUrl = `${authorizeUrl}?${queryString}`;
    }

    // Detailed environment variable verification
    const envCheck = {
      NEXT_PUBLIC_SITE_URL: {
        value: process.env.NEXT_PUBLIC_SITE_URL,
        status: process.env.NEXT_PUBLIC_SITE_URL ? "✓ Set" : "✗ Missing",
        expected: "http://localhost:3000",
        matches: process.env.NEXT_PUBLIC_SITE_URL === "http://localhost:3000",
        hasTrailingSlash: process.env.NEXT_PUBLIC_SITE_URL?.endsWith("/"),
        length: process.env.NEXT_PUBLIC_SITE_URL?.length || 0,
      },
      SQUARE_ENVIRONMENT: {
        value: process.env.SQUARE_ENVIRONMENT,
        status: process.env.SQUARE_ENVIRONMENT ? "✓ Set" : "✗ Missing",
        expected: "sandbox",
        matches: process.env.SQUARE_ENVIRONMENT?.toLowerCase().trim() === "sandbox",
        trimmed: process.env.SQUARE_ENVIRONMENT?.toLowerCase().trim(),
      },
      SQUARE_APPLICATION_ID: {
        value: process.env.SQUARE_APPLICATION_ID ? `${process.env.SQUARE_APPLICATION_ID.substring(0, 20)}...` : null,
        status: process.env.SQUARE_APPLICATION_ID ? "✓ Set" : "✗ Missing",
        startsWithSandbox: process.env.SQUARE_APPLICATION_ID?.startsWith("sandbox-sq0idb-"),
        length: process.env.SQUARE_APPLICATION_ID?.length || 0,
      },
      SQUARE_CLIENT_SECRET: {
        value: process.env.SQUARE_CLIENT_SECRET ? `${process.env.SQUARE_CLIENT_SECRET.substring(0, 20)}...` : null,
        status: process.env.SQUARE_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
        startsWithSandbox: process.env.SQUARE_CLIENT_SECRET?.startsWith("sandbox-sq0csb-"),
        length: process.env.SQUARE_CLIENT_SECRET?.length || 0,
        hasLeadingSpace: process.env.SQUARE_CLIENT_SECRET?.startsWith(" "),
      },
    };

    return NextResponse.json({
      configuration: {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT,
        SQUARE_APPLICATION_ID: process.env.SQUARE_APPLICATION_ID ? "✓ Set" : "✗ Missing",
        userAuthenticated: !!user,
      },
      detailedEnvCheck: envCheck,
      redirectUri: redirectUri,
      authorizeUrl: authorizeUrl,
      expectedRedirectUri: "http://localhost:3000/api/auth/square/callback",
      redirectUriMatches: redirectUri === "http://localhost:3000/api/auth/square/callback",
      testOAuthUrl: testOAuthUrl,
      verification: {
        allEnvVarsSet: Object.values(envCheck).every(v => v.status === "✓ Set"),
        redirectUriCorrect: redirectUri === "http://localhost:3000/api/auth/square/callback",
        authorizeUrlHasConnect: authorizeUrl.includes("connect."),
        readyForOAuth: !!testOAuthUrl,
      },
      instructions: {
        critical: "⚠️ FOR SANDBOX OAUTH: You MUST have the Sandbox Seller Dashboard open in another tab!",
        step1: "Open Sandbox Seller Dashboard: https://developer.squareup.com/apps → Sandbox test accounts → Open in Square Dashboard",
        step2: "Keep the Dashboard tab open, then copy the testOAuthUrl above and paste it in a NEW tab",
        step3: "Verify redirect URI in Square Console matches exactly: http://localhost:3000/api/auth/square/callback",
        step4: "Square Console: https://developer.squareup.com/apps → Your App → OAuth → Redirect URLs",
        note: "Square allows HTTP for localhost in sandbox mode",
        troubleshooting: "If any envCheck values show issues, check .env.local for typos, extra spaces, or missing values",
        sandboxRequirement: "Sandbox OAuth requires the Seller Dashboard to be open - this is a Square requirement for testing",
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to generate debug info",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
