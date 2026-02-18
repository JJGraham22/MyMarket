# Square OAuth Setup Verification Checklist

Based on [Square's Official Documentation](https://developer.squareup.com/docs/oauth-api/create-urls-for-square-authorization), verify each item below:

## ✅ 1. Square Developer Console Configuration

**Go to:** https://developer.squareup.com/apps

- [ ] **Environment:** Make sure you're in **Sandbox** mode (top right toggle)
- [ ] **OAuth Page:** Navigate to OAuth in the left sidebar
- [ ] **Redirect URL:** Must be EXACTLY: `http://localhost:3000/api/auth/square/callback`
  - ✅ No trailing slash
  - ✅ No spaces
  - ✅ Must use `http://` (not `https://`) for localhost in sandbox
  - ✅ Must use `localhost` (not `127.0.0.1`)
- [ ] **Application ID:** Copy from OAuth page (should start with `sandbox-sq0idb-`)
- [ ] **Application Secret:** Click "Show" and copy (should start with `sandbox-sq0csb-`)

## ✅ 2. Environment Variables (.env.local)

Verify these are set correctly:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SQUARE_APPLICATION_ID=sandbox-sq0idb-...
SQUARE_CLIENT_SECRET=sandbox-sq0csb-...
SQUARE_ENVIRONMENT=sandbox
```

**Important:**
- `NEXT_PUBLIC_SITE_URL` must match the redirect URI registered in Square Console
- No trailing slashes
- No extra spaces

## ✅ 3. Code Verification

Our code should generate this URL format:

**Sandbox:**
```
https://connect.squareupsandbox.com/oauth2/authorize?client_id=sandbox-sq0idb-...&scope=PAYMENTS_READ+PAYMENTS_WRITE+...&state=...&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fsquare%2Fcallback
```

**Key Points:**
- ✅ Must include `connect.` in the domain
- ✅ Scope uses `+` separators (not spaces or commas)
- ✅ `redirect_uri` is URL-encoded
- ✅ No `session` parameter for sandbox (it's ignored anyway)

## ✅ 4. Common Issues

### Issue: URL shows `https://squareupsandbox.com` (missing "connect.")
**Cause:** Square is rejecting the request and redirecting to an error page
**Solution:** 
1. Verify redirect URI matches EXACTLY in Square Console
2. Check server logs to see what URL is actually being generated
3. Clear browser cache and try again

### Issue: "Invalid redirect_uri"
**Cause:** Redirect URI doesn't match what's registered in Square Console
**Solution:**
1. Copy the exact redirect URI from `.env.local`: `http://localhost:3000/api/auth/square/callback`
2. Paste it EXACTLY into Square Console → OAuth → Redirect URLs
3. Make sure there are no extra spaces or characters

### Issue: White screen
**Cause:** Square is rejecting the request silently
**Solution:**
1. Check browser console (F12) for errors
2. Check server logs for the actual URL being generated
3. Verify all environment variables are set correctly
4. Restart Next.js dev server after changing `.env.local`

## ✅ 5. Testing Steps

1. **Clear browser cache** or use incognito mode
2. **Restart Next.js dev server** (to pick up `.env.local` changes)
3. **Check server logs** when clicking "Connect Square" - you should see:
   ```
   Full OAuth URL: https://connect.squareupsandbox.com/oauth2/authorize?...
   URL includes 'connect.': true
   ```
4. **Click "Connect Square"** button
5. **Verify redirect** - you should be redirected to Square's authorization page
6. **Check browser address bar** - should show `https://connect.squareupsandbox.com/oauth2/authorize?...`

## ✅ 6. Debug Endpoint

Visit: `http://localhost:3000/api/auth/square/debug`

This will show:
- Current configuration
- Expected redirect URI
- Test OAuth URL you can copy and paste directly

## 📚 Reference

- [Square OAuth Documentation](https://developer.squareup.com/docs/oauth-api/create-urls-for-square-authorization)
- [Square OAuth Walkthrough](https://developer.squareup.com/docs/oauth-api/walkthrough)
