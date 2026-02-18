# .env.local Verification Guide

## Required Square Environment Variables

Your `.env.local` file should contain these exact variables for Square OAuth:

```env
# Site URL - Used to build redirect URI
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Square Configuration (use your own values from Square Developer Console)
SQUARE_APPLICATION_ID=<your-application-id>
SQUARE_ACCESS_TOKEN=<your-access-token>
SQUARE_ENVIRONMENT=sandbox
SQUARE_CLIENT_SECRET=<your-application-secret>
```

## Verification Checklist

### ✅ NEXT_PUBLIC_SITE_URL
- **Value:** `http://localhost:3000`
- **Must NOT have:** Trailing slash (`/`)
- **Must NOT have:** Extra spaces
- **Must use:** `http://` (not `https://`) for localhost in sandbox
- **Must use:** `localhost` (not `127.0.0.1`)

### ✅ SQUARE_ENVIRONMENT
- **Value:** `sandbox` (lowercase)
- **Must NOT have:** Extra spaces
- **Must NOT have:** Quotes around the value
- **Case:** Lowercase preferred (code does `.toLowerCase().trim()`)

### ✅ SQUARE_APPLICATION_ID
- **Format:** `sandbox-sq0idb-...` (starts with `sandbox-sq0idb-`)
- **Must NOT have:** Leading or trailing spaces
- **Source:** Square Developer Console → OAuth → Application ID

### ✅ SQUARE_CLIENT_SECRET
- **Format:** `sandbox-sq0csb-...` (starts with `sandbox-sq0csb-`)
- **Must NOT have:** Leading spaces (common issue!)
- **Must NOT have:** Trailing spaces
- **Source:** Square Developer Console → OAuth → Application Secret (click "Show")

## How to Verify

### Method 1: Use Debug Endpoint
Visit: `http://localhost:3000/api/auth/square/debug`

This will show:
- All environment variables and their values
- Whether they match expected values
- Detailed verification of each variable
- Any formatting issues detected

### Method 2: Check Server Logs
When you click "Connect Square", check your Next.js server console. You should see:
```
Square OAuth - Configuration Check:
NEXT_PUBLIC_SITE_URL: http://localhost:3000
SQUARE_ENVIRONMENT: sandbox
authorizeUrl: https://connect.squareupsandbox.com/oauth2/authorize
URL includes 'connect.': true
```

## Common Issues

### Issue: Environment variable not being read
**Solution:** 
1. Restart your Next.js dev server after changing `.env.local`
2. Make sure there are no spaces around the `=` sign
3. Make sure there are no quotes around values (unless the value itself needs quotes)

### Issue: Leading spaces in SQUARE_CLIENT_SECRET
**Symptom:** OAuth fails with "invalid client secret"
**Solution:** Remove any leading spaces before the value:
```env
# ❌ Wrong (has leading space)
SQUARE_CLIENT_SECRET= sandbox-sq0csb-...

# ✅ Correct (no leading space)
SQUARE_CLIENT_SECRET=sandbox-sq0csb-...
```

### Issue: Trailing slash in NEXT_PUBLIC_SITE_URL
**Symptom:** Redirect URI mismatch
**Solution:** Remove trailing slash:
```env
# ❌ Wrong
NEXT_PUBLIC_SITE_URL=http://localhost:3000/

# ✅ Correct
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Current .env.local Status

Based on your current file, all values appear correct:
- ✅ `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (no trailing slash)
- ✅ `SQUARE_ENVIRONMENT=sandbox` (lowercase)
- ✅ `SQUARE_APPLICATION_ID` starts with `sandbox-sq0idb-`
- ✅ `SQUARE_CLIENT_SECRET` starts with `sandbox-sq0csb-`

## Next Steps

1. **Visit the debug endpoint:** `http://localhost:3000/api/auth/square/debug`
2. **Check the `detailedEnvCheck` section** - it will show if any values have formatting issues
3. **Restart your dev server** if you made any changes to `.env.local`
4. **Try OAuth flow again** after verification
