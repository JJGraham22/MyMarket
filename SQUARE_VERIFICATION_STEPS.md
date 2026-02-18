# Square OAuth Verification Steps

Since everything matches but Square still rejects, let's verify each piece step-by-step:

## Step 1: Verify Application ID Character-for-Character

**In Square Console:**
1. Go to https://developer.squareup.com/apps
2. Select your application
3. **Sandbox mode** (top right toggle)
4. Go to **OAuth** page
5. Copy the **Application ID** shown there

**In your .env.local:**
```
SQUARE_APPLICATION_ID=sandbox-sq0idb-n1UXGSj9h2yHVRSbY4FQnA
```

**Compare them character-by-character:**
- Are they exactly the same?
- No extra spaces?
- No missing characters?
- Case matches exactly?

## Step 2: Verify Redirect URI Encoding

The redirect URI in the URL is URL-encoded. Let's verify what's actually being sent:

**What your code sends:**
```
http://localhost:3000/api/auth/square/callback
```

**What Square Console should have:**
```
http://localhost:3000/api/auth/square/callback
```

**In the OAuth URL, it appears as:**
```
redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fsquare%2Fcallback
```

When decoded, this becomes: `http://localhost:3000/api/auth/square/callback`

## Step 3: Check Square Console Redirect URI Settings

1. Go to Square Console → OAuth → Redirect URLs
2. **Look at the exact text** - copy it
3. Check for:
   - Hidden characters
   - Trailing spaces (select all and check)
   - Different encoding
   - Multiple entries (delete all and add fresh)

## Step 4: Try Removing and Re-adding Redirect URI

Sometimes Square caches the old value:

1. In Square Console → OAuth → Redirect URLs
2. **Delete** the existing redirect URI
3. **Save**
4. **Wait 30 seconds**
5. **Add it back** exactly: `http://localhost:3000/api/auth/square/callback`
6. **Save again**
7. **Wait another 30 seconds**
8. Try OAuth again

## Step 5: Verify Application is Active

1. In Square Console, check if your application shows as **"Active"** or **"Enabled"**
2. If there's a status indicator, make sure it's green/active
3. Check if there are any warnings or errors shown

## Step 6: Check Server Logs for Exact Values

When you click "Connect Square", check your Next.js server console. You should see:

```
Application ID: sandbox-sq0idb-n1UXGSj9h2yHVRSbY4FQnA
redirectUri: http://localhost:3000/api/auth/square/callback
```

**Verify:**
- Application ID matches Square Console exactly
- redirectUri matches Square Console exactly

## Step 7: Test with Minimal Scopes

Try requesting only one scope to see if that works:

Temporarily modify the scopes in `app/api/auth/square/route.ts` to just:
```typescript
const scopes = ["MERCHANT_PROFILE_READ"].join(" ");
```

This will help isolate if it's a scope issue.

## Step 8: Check Browser Network Tab Response

When you paste the OAuth URL:

1. Open DevTools (F12) → **Network** tab
2. Paste the OAuth URL
3. Click on the **first request** (to `connect.squareupsandbox.com`)
4. Go to **Response** tab
5. Look for any error messages or error codes
6. Check **Headers** → **Response Headers** for error information

Square might be returning an error message explaining why it's rejecting.

## Step 9: Verify You're Using the Right Square Account

Make sure:
- The Application ID in Square Console belongs to **your** Square developer account
- You're not accidentally using someone else's application
- The application wasn't deleted or deactivated

## Step 10: Contact Square Support

If everything matches perfectly but still fails, this might be a Square-side issue. Contact Square Developer Support with:
- Your Application ID
- The exact redirect URI
- Screenshot of the error
- The OAuth URL you're trying to use
