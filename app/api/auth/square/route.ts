import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { squareApplicationId } from "@/lib/square";
import { randomUUID } from "crypto";
import { appendFileSync } from "fs";
import { join } from "path";

/**
 * GET /api/auth/square
 * 
 * Initiates Square OAuth authorization flow.
 * Redirects user to Square's authorization page.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate configuration
    if (!squareApplicationId) {
      return NextResponse.json(
        { error: "SQUARE_APPLICATION_ID not configured" },
        { status: 500 }
      );
    }

    // Verify Application ID format matches environment
    const isSandbox = process.env.SQUARE_ENVIRONMENT?.toLowerCase().trim() === "sandbox";
    const appIdStartsWithSandbox = squareApplicationId.startsWith("sandbox-");
    
    if (isSandbox && !appIdStartsWithSandbox) {
      console.error("MISMATCH: SQUARE_ENVIRONMENT=sandbox but Application ID doesn't start with 'sandbox-'");
      console.error("Application ID:", squareApplicationId);
      return NextResponse.json(
        { 
          error: "Application ID mismatch",
          message: "SQUARE_ENVIRONMENT is 'sandbox' but Application ID doesn't start with 'sandbox-'. Make sure you're using Sandbox credentials.",
          applicationId: squareApplicationId.substring(0, 30) + "..."
        },
        { status: 500 }
      );
    }

    if (!isSandbox && appIdStartsWithSandbox) {
      console.error("MISMATCH: SQUARE_ENVIRONMENT=production but Application ID starts with 'sandbox-'");
      console.error("Application ID:", squareApplicationId);
      return NextResponse.json(
        { 
          error: "Application ID mismatch",
          message: "SQUARE_ENVIRONMENT is 'production' but Application ID starts with 'sandbox-'. Make sure you're using Production credentials.",
          applicationId: squareApplicationId.substring(0, 30) + "..."
        },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_SITE_URL is not configured",
          message: "Set NEXT_PUBLIC_SITE_URL in .env.local (e.g., http://localhost:3000 for local development)"
        },
        { status: 500 }
      );
    }
    
    // Square allows HTTP for localhost in development, HTTPS for production
    const isLocalhost = siteUrl.startsWith("http://localhost") || siteUrl.startsWith("http://127.0.0.1");
    if (!isLocalhost && !siteUrl.startsWith("https://")) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_SITE_URL must use HTTPS for non-localhost URLs",
          message: "Use http://localhost:3000 for local development, or HTTPS for production"
        },
        { status: 500 }
      );
    }

    // Build OAuth parameters
    const redirectUri = `${siteUrl}/api/auth/square/callback`;
    const state = `${user.id}:${randomUUID()}`;
    
    // CRITICAL: Hardcode the correct URLs to prevent any issues
    // Sandbox MUST use: https://connect.squareupsandbox.com/oauth2/authorize
    // Production MUST use: https://connect.squareup.com/oauth2/authorize
    const squareEnv = process.env.SQUARE_ENVIRONMENT?.toLowerCase().trim();
    const isProduction = squareEnv === "production";
    
    // Hardcode the correct authorize URLs
    const SANDBOX_AUTHORIZE_URL = "https://connect.squareupsandbox.com/oauth2/authorize";
    const PRODUCTION_AUTHORIZE_URL = "https://connect.squareup.com/oauth2/authorize";
    
    const authorizeUrl = isProduction ? PRODUCTION_AUTHORIZE_URL : SANDBOX_AUTHORIZE_URL;
    
    // Double-check the URL is correct
    if (!authorizeUrl.includes("connect.")) {
      console.error("FATAL: Authorize URL missing 'connect.' prefix:", authorizeUrl);
      throw new Error(`Invalid authorize URL: ${authorizeUrl} - must include "connect." prefix`);
    }
    
    console.log("Square OAuth URL validation:", {
      SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT,
      squareEnv,
      isProduction,
      authorizeUrl,
      isValid: authorizeUrl.includes("connect."),
    });

    // Square OAuth: space-separated list of valid permission names.
    // DEVICES_READ/DEVICES_WRITE are invalid; use DEVICE_CREDENTIAL_MANAGEMENT for Terminal pairing.
    const scopes = [
      "PAYMENTS_READ",
      "PAYMENTS_WRITE",
      "MERCHANT_PROFILE_READ",
      "ITEMS_READ",
      "ORDERS_READ",
      "ORDERS_WRITE",
      "DEVICE_CREDENTIAL_MANAGEMENT",
    ].join(" ");

    // Build URL parameters using URLSearchParams
    const params = new URLSearchParams({
      client_id: squareApplicationId,
      scope: scopes,
      state: state,
      redirect_uri: redirectUri,
    });
    
    // Add session=false for production (ignored in sandbox but harmless)
    if (isProduction) {
      params.set("session", "false");
    }
    
    // URLSearchParams encodes spaces as %20, but Square expects + signs
    // Replace %20 with + in the scope parameter only
    let queryString = params.toString();
    const queryStringBeforeReplace = queryString;
    queryString = queryString.replace(/scope=([^&]+)/, (match, scopeValue) => {
      return `scope=${scopeValue.replace(/%20/g, '+')}`;
    });
    
    const fullUrl = `${authorizeUrl}?${queryString}`;

    // FINAL SAFEGUARD: Ensure the full URL includes "connect." prefix
    if (!fullUrl.includes("connect.")) {
      console.error("FATAL: Full OAuth URL missing 'connect.' prefix:", fullUrl);
      throw new Error(`Invalid OAuth URL: ${fullUrl} - must include "connect." prefix`);
    }

    // #region agent log
    try {
      const logData = JSON.stringify({location:'app/api/auth/square/route.ts:121',message:'Full URL built - final validation',data:{fullUrl,authorizeUrl,redirectUri,scope:scopes,hasConnectPrefix:fullUrl.includes('connect.'),queryStringBeforeReplace,queryStringAfterReplace:queryString},timestamp:Date.now(),runId:'run4',hypothesisId:'final-url-validation'})+'\n';
      appendFileSync(join(process.cwd(),'.cursor','debug.log'),logData);
    } catch(e){}
    // #endregion

    // Detailed logging for debugging
    console.log("═══════════════════════════════════════════════════════");
    console.log("Square OAuth - Complete Configuration Check:");
    console.log("Application ID:", squareApplicationId);
    console.log("Application ID starts with 'sandbox-':", squareApplicationId.startsWith("sandbox-"));
    console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
    console.log("siteUrl (used):", siteUrl);
    console.log("redirectUri:", redirectUri);
    console.log("redirectUri length:", redirectUri.length);
    console.log("SQUARE_ENVIRONMENT:", process.env.SQUARE_ENVIRONMENT);
    console.log("isProduction:", isProduction);
    console.log("authorizeUrl:", authorizeUrl);
    console.log("Full OAuth URL:", fullUrl);
    console.log("URL includes 'connect.':", fullUrl.includes("connect."));
    console.log("Scope parameter:", scopes);
    console.log("State parameter:", state.substring(0, 50) + "...");
    console.log("═══════════════════════════════════════════════════════");

    const redirectResponse = NextResponse.redirect(fullUrl, { status: 302 });
    
    // #region agent log
    const locationHeader = redirectResponse.headers.get('location');
    try {
      const logData = JSON.stringify({
        location:'app/api/auth/square/route.ts:147',
        message:'Redirect response - Location header verification',
        data:{
          fullUrlBuilt:fullUrl,
          locationHeader,
          locationHeaderHasConnect:locationHeader?.includes('connect.'),
          status:redirectResponse.status,
          allHeaders:Object.fromEntries(redirectResponse.headers.entries()),
          redirectUri,
          redirectUriMatches:redirectUri === 'http://localhost:3000/api/auth/square/callback'
        },
        timestamp:Date.now(),
        runId:'run5',
        hypothesisId:'location-header-check'
      })+'\n';
      appendFileSync(join(process.cwd(),'.cursor','debug.log'),logData);
    } catch(e){}
    // #endregion

    // CRITICAL: Double-check Location header before sending
    if (locationHeader && !locationHeader.includes('connect.')) {
      console.error('FATAL: Location header missing connect. prefix:', locationHeader);
      console.error('Expected URL:', fullUrl);
      throw new Error(`Location header is incorrect: ${locationHeader} - missing "connect." prefix`);
    }

    return redirectResponse;
  } catch (error) {
    console.error("Square OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Square OAuth" },
      { status: 500 }
    );
  }
}
