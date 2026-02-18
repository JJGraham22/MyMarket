# Complete Square Console Verification Guide

Since redirect URIs match but Square is still rejecting the request, verify these items:

## ✅ 1. Application Status in Square Console

1. Go to https://developer.squareup.com/apps
2. Select your application
3. **Check the application status** - Is it active/enabled?
4. **Make sure you're viewing the Sandbox version** (toggle at top right should say "Sandbox")

## ✅ 2. Application ID Verification

**In Square Console:**
1. Go to **OAuth** page
2. Copy the **Application ID** shown there
3. It should start with: `sandbox-sq0idb-`
4. Compare with your `.env.local`:
   ```env
   SQUARE_APPLICATION_ID=<your-application-id-from-console>
   ```

**They must match EXACTLY** - character for character.

## ✅ 3. Application Secret Verification

**In Square Console:**
1. Go to **OAuth** page
2. Click **"Show"** next to Application Secret
3. Copy the secret (should start with `sandbox-sq0csb-`)
4. Compare with your `.env.local`:
   ```env
   SQUARE_CLIENT_SECRET=<your-application-secret-from-console>
   ```

**They must match EXACTLY** - no leading/trailing spaces.

## ✅ 4. Redirect URI Verification (Double-Check)

**In Square Console:**
1. Go to **OAuth** → **Redirect URLs**
2. The redirect URL should be exactly:
   ```
   http://localhost:3000/api/auth/square/callback
   ```
3. **Check for:**
   - No trailing slash
   - No spaces before or after
   - Uses `http://` (not `https://`)
   - Uses `localhost` (not `127.0.0.1` or IP address)
   - Port is `3000`
   - Full path: `/api/auth/square/callback`

## ✅ 5. Environment Verification

**Critical:** Make sure you're checking the **Sandbox** environment in Square Console:

1. Look at the **top right** of Square Developer Console
2. There should be a toggle/selector showing **"Sandbox"** or **"Production"**
3. **It must be set to "Sandbox"**
4. All credentials (Application ID, Secret, Redirect URI) must be configured in the **Sandbox** section

## ✅ 6. Application Permissions/Scopes

Verify your application has the necessary permissions enabled:

1. In Square Console → **OAuth** page
2. Check if there are any permission/scope settings
3. Make sure the application is configured to request the scopes you're using:
   - `PAYMENTS_READ`
   - `PAYMENTS_WRITE`
   - `MERCHANT_PROFILE_READ`
   - `ITEMS_READ`
   - `ORDERS_READ`
   - `ORDERS_WRITE`
   - `DEVICES_READ`
   - `DEVICES_WRITE`

## ✅ 7. Test with Server Logs

When you click "Connect Square" or paste the OAuth URL, check your **Next.js server console** for:

```
Square OAuth - Complete Configuration Check:
Application ID: sandbox-sq0idb-n1UXGSj9h2yHVRSbY4FQnA
Application ID starts with 'sandbox-': true
redirectUri: http://localhost:3000/api/auth/square/callback
SQUARE_ENVIRONMENT: sandbox
authorizeUrl: https://connect.squareupsandbox.com/oauth2/authorize
URL includes 'connect.': true
```

**Verify:**
- Application ID matches what's in Square Console
- `redirectUri` matches what's in Square Console
- `authorizeUrl` includes `connect.`

## 🔍 8. If Everything Matches But Still Fails

If all the above match perfectly but Square still rejects:

1. **Try creating a new Sandbox application** in Square Console
2. **Copy fresh credentials** (Application ID and Secret)
3. **Update `.env.local`** with new credentials
4. **Add the redirect URI** to the new application
5. **Restart your Next.js server**
6. **Try again**

## 📝 Quick Checklist

- [ ] Application is active/enabled in Square Console
- [ ] Viewing **Sandbox** environment (not Production)
- [ ] Application ID in Square Console matches `.env.local` exactly
- [ ] Application Secret in Square Console matches `.env.local` exactly (no spaces)
- [ ] Redirect URI in Square Console is exactly: `http://localhost:3000/api/auth/square/callback`
- [ ] No trailing slash on redirect URI
- [ ] Server logs show correct Application ID and redirect URI
- [ ] Server logs show `authorizeUrl` includes `connect.`

## 🎯 Next Steps

After verifying everything above:

1. **Save any changes** in Square Console
2. **Wait 10-30 seconds** for Square to update
3. **Restart your Next.js dev server**
4. **Clear browser cache** or use incognito mode
5. **Try the OAuth flow again**

If it still fails after all this, the issue might be on Square's side (temporary service issue) or there might be a very specific configuration requirement we're missing.
