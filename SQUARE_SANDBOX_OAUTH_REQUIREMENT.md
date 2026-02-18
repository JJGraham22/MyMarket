# Square Sandbox OAuth Critical Requirement

## ⚠️ IMPORTANT: Sandbox Seller Dashboard Must Be Open

According to [Square Developer Forums](https://developer.squareup.com/forums/t/sandbox-authorization-url/22330), **for Sandbox OAuth testing, the Sandbox Seller Dashboard must be open in another browser tab** while performing OAuth authorization.

This is a **specific requirement for sandbox testing** that doesn't apply to production environments.

## Steps to Complete Sandbox OAuth

### Step 1: Open Sandbox Seller Dashboard

1. Go to https://developer.squareup.com/apps
2. Make sure you're in **Sandbox** mode (top right)
3. Go to **Sandbox test accounts** (left sidebar)
4. If you don't have a test account, create one:
   - Click **"New sandbox test account"**
   - Enter account name
   - Select country
   - **Clear** the "Automatically create authorizations" checkbox
   - Click **Create**
5. Click **"Open in Square Dashboard"** for your test account
6. **Keep this tab open** - don't close it!

### Step 2: Initiate OAuth Flow

1. In a **different browser tab**, go to your app
2. Click "Connect Square" or paste the OAuth URL
3. Square should now show the authorization page (not a white screen)

## Why This Is Required

In Sandbox, Square requires the Seller Dashboard to be open because:
- Sandbox doesn't support direct login to the authorization page
- The authorization page needs to communicate with the open Dashboard session
- This simulates what happens in production where sellers are already logged in

## Troubleshooting

If you still see a white screen or error:

1. **Verify Seller Dashboard is open** - Check that the Square Dashboard tab is still open and active
2. **Check you're using the correct test account** - Make sure the Dashboard you opened matches your Sandbox application
3. **Try refreshing** - Refresh both tabs and try again
4. **Check redirect URI** - Still verify it matches exactly: `http://localhost:3000/api/auth/square/callback`

## Production vs Sandbox

- **Sandbox:** Requires Seller Dashboard to be open ✅
- **Production:** Does NOT require this - sellers log in directly ❌

## Reference

- [Square Developer Forums - Sandbox Authorization URL](https://developer.squareup.com/forums/t/sandbox-authorization-url/22330)
