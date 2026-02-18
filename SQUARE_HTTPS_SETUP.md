# Setting Up HTTPS for Square OAuth (Local Development)

Square requires **HTTPS** for OAuth redirect URIs, even in sandbox mode. For local development, you need to use an HTTPS tunnel service.

## Option 1: ngrok (Recommended)

### Step 1: Install ngrok

**Windows:**
1. Download from https://ngrok.com/download
2. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
3. Add to PATH or use full path

**Or use Chocolatey:**
```powershell
choco install ngrok
```

**Or use npm:**
```bash
npm install -g ngrok
```

### Step 2: Start Your Next.js Dev Server

```bash
npm run dev
```

Your app should be running on `http://localhost:3000`

### Step 3: Start ngrok Tunnel

In a **new terminal**, run:

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123-def456.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123-def456.ngrok-free.app`)

### Step 4: Update .env.local

Add or update `NEXT_PUBLIC_SITE_URL` in your `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://abc123-def456.ngrok-free.app
```

**Important:** Replace `abc123-def456.ngrok-free.app` with your actual ngrok URL.

### Step 5: Register Redirect URI in Square

1. Go to https://developer.squareup.com/apps
2. Select your application
3. Make sure you're in **Sandbox** mode
4. Go to **OAuth** page
5. In **Redirect URLs**, add:
   ```
   https://abc123-def456.ngrok-free.app/api/auth/square/callback
   ```
   (Replace with your actual ngrok URL)

### Step 6: Restart Dev Server

After updating `.env.local`, restart your Next.js dev server:

```bash
# Stop (Ctrl+C) and restart
npm run dev
```

### Step 7: Test OAuth

1. Make sure ngrok is still running (keep that terminal open)
2. Go to `/settings/payments` in your app
3. Click "Connect Square"
4. You should be redirected to Square's authorization page

## Option 2: Cloudflare Tunnel (cloudflared)

### Step 1: Install cloudflared

Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Step 2: Start Tunnel

```bash
cloudflared tunnel --url http://localhost:3000
```

### Step 3: Use the HTTPS URL

Copy the HTTPS URL provided and follow steps 4-7 from ngrok above.

## Option 3: localtunnel

### Step 1: Install

```bash
npm install -g localtunnel
```

### Step 2: Start Tunnel

```bash
lt --port 3000
```

### Step 3: Use the HTTPS URL

Copy the HTTPS URL provided and follow steps 4-7 from ngrok above.

## Important Notes

### ngrok Free Tier Limitations

- **URL changes each time** you restart ngrok (unless you have a paid account)
- You'll need to update `NEXT_PUBLIC_SITE_URL` and Square redirect URI each time
- Consider using a **static domain** with ngrok paid plan for development

### Keeping ngrok Running

- Keep the ngrok terminal window open while developing
- If ngrok stops, restart it and update your URLs

### Production

In production, you'll use your actual domain with HTTPS:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Troubleshooting

### "Invalid redirect_uri" Error

- Make sure the redirect URI in Square Developer Console **exactly matches** your ngrok URL
- Check that `NEXT_PUBLIC_SITE_URL` in `.env.local` matches your ngrok URL
- Restart your dev server after changing `.env.local`

### ngrok URL Changed

If you restart ngrok and get a new URL:
1. Update `NEXT_PUBLIC_SITE_URL` in `.env.local`
2. Update redirect URI in Square Developer Console
3. Restart your dev server

### Still Not Working?

1. Check server logs for the OAuth URL being generated
2. Verify the redirect URI in Square matches exactly (including `https://` and `/api/auth/square/callback`)
3. Make sure ngrok is still running
4. Try accessing your app via the ngrok URL directly: `https://your-ngrok-url.ngrok-free.app`

## Quick Setup Script (Optional)

Create a `start-dev.sh` (or `start-dev.ps1` for Windows) to automate:

**start-dev.ps1 (Windows PowerShell):**
```powershell
# Start Next.js dev server in background
Start-Process npm -ArgumentList "run dev" -WindowStyle Minimized

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Start ngrok
ngrok http 3000
```

Then run:
```powershell
.\start-dev.ps1
```

**Note:** You'll still need to manually update `.env.local` and Square redirect URI when ngrok URL changes.
