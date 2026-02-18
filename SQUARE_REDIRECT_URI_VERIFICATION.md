# Square Redirect URI Verification Guide

## The Problem

When you paste the OAuth URL directly, Square redirects to `https://squareupsandbox.com/oauth2/authorize` (missing "connect."), which means Square is **rejecting your OAuth request** due to a redirect URI mismatch.

## How to Verify the Redirect URI

### Step 1: Decode the redirect_uri from the URL

The URL you pasted contains an encoded `redirect_uri` parameter. To see what it actually is:

1. Copy the full URL from your browser address bar
2. Look for `redirect_uri=` in the URL
3. The value after `redirect_uri=` is URL-encoded

**Example:**
```
redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fsquare%2Fcallback
```

When decoded, this becomes:
```
http://localhost:3000/api/auth/square/callback
```

### Step 2: Verify in Square Developer Console

1. Go to https://developer.squareup.com/apps
2. Select your application
3. **Make sure you're in Sandbox mode** (top right toggle)
4. Go to **OAuth** → **Redirect URLs**
5. The redirect URL must be **EXACTLY**:
   ```
   http://localhost:3000/api/auth/square/callback
   ```

### Step 3: Common Mismatches

Check for these common issues:

- ❌ **Trailing slash:** `http://localhost:3000/api/auth/square/callback/`
- ❌ **HTTPS instead of HTTP:** `https://localhost:3000/api/auth/square/callback`
- ❌ **IP instead of localhost:** `http://127.0.0.1:3000/api/auth/square/callback`
- ❌ **Different port:** `http://localhost:8000/api/auth/square/callback`
- ❌ **Extra spaces:** `http://localhost:3000/api/auth/square/callback ` (trailing space)
- ❌ **Missing path:** `http://localhost:3000/` (missing `/api/auth/square/callback`)

### Step 4: Use Browser DevTools to Check

1. Open DevTools (F12)
2. Go to **Network** tab
3. Paste the OAuth URL in your browser
4. Look at the **first request** (the one to `connect.squareupsandbox.com`)
5. Click on it
6. Go to **Headers** tab
7. Look at **Query String Parameters** or **Request URL**
8. Find `redirect_uri` and see its decoded value

## Quick Fix Checklist

- [ ] Square Console → OAuth → Redirect URLs contains exactly: `http://localhost:3000/api/auth/square/callback`
- [ ] No trailing slash
- [ ] Uses `http://` not `https://`
- [ ] Uses `localhost` not `127.0.0.1`
- [ ] Port is `3000`
- [ ] Full path is `/api/auth/square/callback`
- [ ] No extra spaces before or after
- [ ] Saved the changes in Square Console

## After Fixing

1. **Save** the redirect URI in Square Console
2. **Wait a few seconds** for Square to update
3. **Clear browser cache** or use incognito mode
4. **Try the OAuth URL again**

The URL should now work and show Square's authorization page instead of a white screen.
