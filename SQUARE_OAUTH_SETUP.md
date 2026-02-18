# Square OAuth Setup Guide

## Issue Fixed
The OAuth callback was using `SQUARE_ACCESS_TOKEN` as the `clientSecret`, but Square OAuth requires a separate **Application Secret** (client secret).

## Steps to Fix

### 1. Get Your Application Secret from Square Developer Console

1. Go to https://developer.squareup.com/apps
2. Select your application (or create one if needed)
3. Navigate to the **OAuth** page/tab
4. Find **"Application Secret"** (this is different from your Access Token)
5. Copy this secret value

### 2. Add to .env.local

Add this line to your `.env.local` file:

```env
SQUARE_CLIENT_SECRET=your_application_secret_here
```

**Important:** Replace `your_application_secret_here` with the actual Application Secret you copied from Square Developer Console.

### 3. Configure Redirect URI in Square Developer Console

1. In Square Developer Console → OAuth page
2. Find **"Redirect URLs"** section
3. Add your redirect URI:
   - **For local development:** `http://localhost:3000/api/auth/square/callback`
   - **For production:** `https://yourdomain.com/api/auth/square/callback`

### 4. Restart Your Development Server

After adding `SQUARE_CLIENT_SECRET` to `.env.local`, restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### 5. Test OAuth Flow

1. Go to `/settings/payments` in your app
2. Click **"Connect Square"** on the Square card
3. You should be redirected to Square's authorization page
4. After authorizing, you should be redirected back to your app

## Current .env.local Configuration

Your `.env.local` should now include:

```env
SQUARE_APPLICATION_ID=sandbox-sq0idb-n1UXGSj9h2yHVRSbY4FQnA
SQUARE_ACCESS_TOKEN=EAAAl1dbq4d6tk9TSItyWaOrhaA0E4yHsEpXhozS4w2yvTats9q1tM0zhu69DWKT
SQUARE_CLIENT_SECRET=your_application_secret_here  # ← ADD THIS
SQUARE_ENVIRONMENT=sandbox
```

## Troubleshooting

### "SQUARE_CLIENT_SECRET is not configured"
- Make sure you added `SQUARE_CLIENT_SECRET` to `.env.local`
- Restart your dev server after adding it
- Check that there are no typos in the variable name

### "Invalid redirect_uri"
- Make sure you added the redirect URI in Square Developer Console → OAuth → Redirect URLs
- The URI must match exactly (including `http://` vs `https://` and port number)

### OAuth page not loading
- Check your browser console for errors
- Verify `SQUARE_APPLICATION_ID` is correct
- Make sure you're using the correct Square environment (sandbox vs production)
- Check that the redirect URI is configured in Square Developer Console

### Still having issues?
- Check server logs for detailed error messages
- Verify all Square environment variables are set correctly
- Make sure you're using Sandbox credentials if `SQUARE_ENVIRONMENT=sandbox`
