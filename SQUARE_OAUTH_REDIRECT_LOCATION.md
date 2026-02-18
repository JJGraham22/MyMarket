# Square OAuth Redirect Location

## Where the Redirect Happens

The Square OAuth redirect is built and executed in:

**File:** `app/api/auth/square/route.ts`  
**Line:** ~95 (the `return NextResponse.redirect(authUrl);` statement)

## Code Flow

1. **Client-side trigger** (line 73 in `PaymentSettingsClient.tsx`):
   ```typescript
   window.location.href = "/api/auth/square";
   ```

2. **Server-side handler** (`app/api/auth/square/route.ts`):
   - Line 49-53: Determines base URL based on `SQUARE_ENVIRONMENT`
     - Sandbox: `https://connect.squareupsandbox.com`
     - Production: `https://connect.squareup.com`
   
   - Line 67-73: Builds the full OAuth authorize URL:
     ```typescript
     const authUrl =
       `${baseUrl}/oauth2/authorize` +
       `?client_id=${encodeURIComponent(squareApplicationId)}` +
       `&scope=${encodeURIComponent(scopes)}` +
       `&session=false` +
       `&state=${encodeURIComponent(state)}` +
       `&redirect_uri=${encodeURIComponent(redirectUri)}`;
     ```
   
   - Line ~95: **THE REDIRECT HAPPENS HERE:**
     ```typescript
     return NextResponse.redirect(authUrl);
     ```

## How to Debug

When you click "Connect Square", check your **server console** (terminal where `npm run dev` is running). You should see:

```
═══════════════════════════════════════════════════════
Square OAuth REDIRECT URL (line 85):
https://connect.squareupsandbox.com/oauth2/authorize?client_id=...
═══════════════════════════════════════════════════════
```

## Expected URL Format

For sandbox, the URL should be:
```
https://connect.squareupsandbox.com/oauth2/authorize?client_id=sandbox-sq0idb-...&scope=PAYMENTS_READ+PAYMENTS_WRITE+...&session=false&state=...&redirect_uri=https://eight-lines-fold.loca.lt/api/auth/square/callback
```

## If It's Not Redirecting Correctly

1. **Check server logs** - Look for the console.log output showing the exact URL
2. **Verify environment variable** - Make sure `SQUARE_ENVIRONMENT=sandbox` in `.env.local`
3. **Restart dev server** - After changing `.env.local`, restart `npm run dev`
4. **Check browser Network tab** - See what URL the browser is actually requesting
5. **Check browser console** - Look for any JavaScript errors that might prevent redirect

## Current Configuration

From `.env.local`:
- `SQUARE_ENVIRONMENT=sandbox` ✅
- `NEXT_PUBLIC_SITE_URL=https://eight-lines-fold.loca.lt` ✅
- `SQUARE_APPLICATION_ID=sandbox-sq0idb-n1UXGSj9h2yHVRSbY4FQnA` ✅

This should result in:
- `baseUrl = "https://connect.squareupsandbox.com"`
- `redirectUri = "https://eight-lines-fold.loca.lt/api/auth/square/callback"`
