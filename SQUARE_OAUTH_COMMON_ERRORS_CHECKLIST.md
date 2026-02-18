# Square OAuth Common Errors Checklist

Based on [Square's Common Errors Documentation](https://developer.squareup.com/docs/oauth-api/overview#common-errors), here's what to verify:

## Common Error Causes

According to Square: **"Authorization errors are typically caused by typos or mismatched credentials (Sandbox versus Production credentials)."**

## ✅ 1. Verify Credential Types Match Environment

### Sandbox Environment (Current Setup)
- ✅ `SQUARE_APPLICATION_ID` must start with `sandbox-sq0idb-`
- ✅ `SQUARE_CLIENT_SECRET` must start with `sandbox-sq0csb-`
- ✅ `SQUARE_ENVIRONMENT=sandbox` (lowercase)
- ✅ Authorization URL: `https://connect.squareupsandbox.com/oauth2/authorize`

### Production Environment
- ❌ Application ID starts with `sq0idp-` (NOT `sandbox-sq0idb-`)
- ❌ Client Secret starts with `sq0csp-` (NOT `sandbox-sq0csb-`)
- ❌ Authorization URL: `https://connect.squareup.com/oauth2/authorize`

**Your Current Setup:**
- `SQUARE_APPLICATION_ID=sandbox-sq0idb-n1UXGSj9h2yHVRSbY4FQnA` ✅ Correct format
- `SQUARE_CLIENT_SECRET=sandbox-sq0csb-...` ✅ Correct format
- `SQUARE_ENVIRONMENT=sandbox` ✅ Correct

## ✅ 2. Verify Redirect URI Matches EXACTLY

**Critical:** The redirect URI in Square Developer Console must match EXACTLY what's sent in the OAuth request.

### What Your Code Sends:
```
http://localhost:3000/api/auth/square/callback
```

### What Must Be in Square Console:
```
http://localhost:3000/api/auth/square/callback
```

**Common Mistakes:**
- ❌ `http://localhost:3000/api/auth/square/callback/` (trailing slash)
- ❌ `https://localhost:3000/api/auth/square/callback` (https instead of http)
- ❌ `http://127.0.0.1:3000/api/auth/square/callback` (IP instead of localhost)
- ❌ Extra spaces or characters

## ✅ 3. Verify Application ID Matches

**Check:** Does your `SQUARE_APPLICATION_ID` in `.env.local` match the Application ID shown in Square Developer Console?

1. Go to https://developer.squareup.com/apps
2. Select your application
3. Make sure you're in **Sandbox** mode (top right)
4. Go to **OAuth** page
5. Copy the **Application ID**
6. Compare with `SQUARE_APPLICATION_ID` in `.env.local`

They must match EXACTLY.

## ✅ 4. Verify Application Secret Matches

**Check:** Does your `SQUARE_CLIENT_SECRET` in `.env.local` match the Application Secret in Square Developer Console?

1. In Square Developer Console → OAuth page
2. Click "Show" next to **Application Secret**
3. Copy the secret (should start with `sandbox-sq0csb-`)
4. Compare with `SQUARE_CLIENT_SECRET` in `.env.local`

**Common Issue:** Leading spaces in `.env.local`
```env
# ❌ Wrong (has leading space)
SQUARE_CLIENT_SECRET= sandbox-sq0csb-...

# ✅ Correct (no leading space)
SQUARE_CLIENT_SECRET=sandbox-sq0csb-...
```

## ✅ 5. Verify Authorization URL Format

According to Square docs, the Sandbox authorization URL should be:
```
https://connect.squareupsandbox.com/oauth2/authorize?client_id=sandbox-sq0idb-...&scope=...&state=...&redirect_uri=...
```

**Your server logs show:**
```
authorizeUrl: https://connect.squareupsandbox.com/oauth2/authorize ✅
URL includes 'connect.': true ✅
```

**But browser shows:**
```
https://squareupsandbox.com/oauth2/authorize ❌ (missing "connect.")
```

This suggests Square is **rejecting the request** and redirecting to an error page.

## 🔍 6. Debug Steps

### Step 1: Verify Redirect URI in Square Console
1. Go to https://developer.squareup.com/apps
2. Select your application
3. **Sandbox** mode (top right)
4. **OAuth** → **Redirect URLs**
5. Must be exactly: `http://localhost:3000/api/auth/square/callback`
6. If it's different, update it to match exactly

### Step 2: Check Debug Endpoint
Visit: `http://localhost:3000/api/auth/square/debug`

This shows:
- Current redirect URI being used
- Whether it matches expected value
- All environment variables

### Step 3: Check Browser Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click "Connect Square"
4. Look for the request to `/api/auth/square`
5. Check the **Response Headers** → `Location` header
6. It should show: `https://connect.squareupsandbox.com/oauth2/authorize?...`

### Step 4: Try Direct URL
Copy the `testOAuthUrl` from `/api/auth/square/debug` and paste it directly into your browser. This bypasses any client-side issues.

## 🎯 Most Likely Issue

Based on Square's documentation and your symptoms, the most likely issue is:

**Redirect URI mismatch** - The redirect URI registered in Square Console doesn't match exactly what's being sent in the OAuth request.

**Solution:**
1. Verify redirect URI in Square Console is exactly: `http://localhost:3000/api/auth/square/callback`
2. Make sure there are no extra characters, spaces, or trailing slashes
3. Save the changes in Square Console
4. Try the OAuth flow again

## 📚 Reference

- [Square OAuth Common Errors](https://developer.squareup.com/docs/oauth-api/overview#common-errors)
- [Square OAuth Authorization URL Guide](https://developer.squareup.com/docs/oauth-api/create-urls-for-square-authorization)
