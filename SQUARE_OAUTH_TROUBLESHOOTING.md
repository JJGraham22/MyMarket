# Square OAuth Troubleshooting Guide

## Issue: OAuth redirect URL not loading

If the Square OAuth page isn't loading when you click "Connect Square", follow these steps:

### Step 1: Check Server Logs

When you click "Connect Square", check your terminal/console where your Next.js dev server is running. You should see a log entry like:

```
Square OAuth redirect URL: {
  baseUrl: 'https://connect.squareupsandbox.com',
  redirectUri: 'http://localhost:3000/api/auth/square/callback',
  applicationId: 'sandbox-sq0idb-...',
  environment: 'sandbox',
  fullUrl: 'https://connect.squareupsandbox.com/oauth2/authorize?...'
}
```

**If you don't see this log:**
- The route might not be getting called
- Check browser console for JavaScript errors
- Verify you're logged in (OAuth requires authentication)

**If you see the log but the page doesn't load:**
- Copy the `fullUrl` from the log
- Try opening it directly in your browser
- Check if Square's sandbox is accessible

### Step 2: Verify Redirect URI in Square Developer Console

**CRITICAL:** The redirect URI must be **exactly** registered in Square Developer Console.

1. Go to https://developer.squareup.com/apps
2. Select your application
3. Make sure you're in **Sandbox** mode (top right)
4. Go to **OAuth** page (left sidebar)
5. Check **Redirect URLs** section
6. The redirect URL must be **exactly**:
   ```
   http://localhost:3000/api/auth/square/callback
   ```

**Common mistakes:**
- ❌ `https://localhost:3000/...` (should be `http://`)
- ❌ `http://localhost:3000/api/auth/square/callback/` (trailing slash)
- ❌ `http://127.0.0.1:3000/...` (must use `localhost`, not IP)
- ❌ Missing `/api/auth/square/callback` path

**To add/update the redirect URI:**
1. In Square Developer Console → OAuth → Redirect URLs
2. Click **Update** or **Add**
3. Enter: `http://localhost:3000/api/auth/square/callback`
4. Click **Save** or **Confirm**

### Step 3: Verify Environment Variables

Check that your `.env.local` file has:

```env
SQUARE_APPLICATION_ID=<your-application-id>
SQUARE_CLIENT_SECRET=<your-application-secret>
SQUARE_ENVIRONMENT=sandbox
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important:**
- No leading/trailing spaces
- No quotes around values
- Restart dev server after changing `.env.local`

### Step 4: Test the OAuth URL Manually

1. Get the OAuth URL from server logs (see Step 1)
2. Copy the `fullUrl` value
3. Open it directly in your browser
4. You should see Square's authorization page

**If the URL doesn't work:**
- Check if Square sandbox is accessible: https://connect.squareupsandbox.com
- Verify your Application ID matches what's in Square Developer Console
- Make sure you're using Sandbox credentials (not Production)

### Step 5: Check Browser Console

Open browser DevTools (F12) → Console tab, then click "Connect Square". Look for:

- **Network errors:** Check Network tab for failed requests
- **CORS errors:** Shouldn't happen for OAuth redirects, but check anyway
- **JavaScript errors:** Any errors might prevent the redirect

### Step 6: Verify Square Sandbox Status

Sometimes Square's sandbox environment has issues. Check:

1. Try accessing: https://connect.squareupsandbox.com
2. If it doesn't load, Square sandbox might be down
3. Check Square Developer status page

### Step 7: Common Error Messages

**"Invalid redirect_uri"**
- The redirect URI in your code doesn't match what's registered in Square
- Fix: Update Square Developer Console → OAuth → Redirect URLs

**"Invalid client_id"**
- Your `SQUARE_APPLICATION_ID` doesn't match Square Developer Console
- Fix: Copy the correct Application ID from Square → OAuth page

**"Invalid client_secret"**
- Your `SQUARE_CLIENT_SECRET` is wrong or missing
- Fix: Copy Application Secret from Square → OAuth page → Show

**Page just doesn't load / blank page**
- Check browser console for errors
- Verify Square sandbox is accessible
- Try the URL manually (from server logs)

### Step 8: Test with a Simple Redirect

To verify the route is working, temporarily modify `/api/auth/square/route.ts`:

```typescript
// Temporary test - remove after debugging
return NextResponse.json({
  message: "OAuth route is working",
  redirectUri: `${siteUrl}/api/auth/square/callback`,
  baseUrl,
  applicationId: squareApplicationId,
});
```

If this returns JSON, the route is working. If not, there's a routing issue.

### Step 9: Verify Next.js Configuration

Make sure your `next.config.js` (if you have one) isn't blocking the route:

```javascript
// Should not have anything blocking /api/auth/square
```

### Step 10: Check Network/Firewall

- Make sure `localhost:3000` is accessible
- Check if any firewall is blocking connections
- Verify you can access other API routes (e.g., `/api/stripe/webhook`)

## Still Not Working?

If none of the above works:

1. **Share the server log output** when clicking "Connect Square"
2. **Share any browser console errors**
3. **Verify Square Developer Console settings:**
   - Application ID matches `.env.local`
   - Redirect URI is exactly `http://localhost:3000/api/auth/square/callback`
   - You're in Sandbox mode (not Production)

## Quick Checklist

- [ ] `.env.local` has `SQUARE_CLIENT_SECRET` (no leading spaces)
- [ ] `.env.local` has `SQUARE_APPLICATION_ID`
- [ ] `.env.local` has `SQUARE_ENVIRONMENT=sandbox`
- [ ] `.env.local` has `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- [ ] Dev server restarted after changing `.env.local`
- [ ] Redirect URI registered in Square Developer Console → OAuth
- [ ] Redirect URI matches exactly: `http://localhost:3000/api/auth/square/callback`
- [ ] Using Sandbox mode in Square Developer Console
- [ ] Application ID in Square matches `SQUARE_APPLICATION_ID` in `.env.local`
- [ ] Can access Square sandbox: https://connect.squareupsandbox.com
