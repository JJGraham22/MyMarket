# Square Sandbox OAuth - Correct Steps

## Square's Error Message

Square is telling us:
> "To start the OAuth flow for a sandbox account, first launch the seller test account from the Developer Console."

## Step-by-Step Instructions

### Step 1: Open Sandbox Seller Dashboard

1. Go to **https://developer.squareup.com/apps**
2. Make sure you're in **Sandbox** mode (top right toggle should say "Sandbox")
3. In the left sidebar, click **"Sandbox test accounts"**
4. You should see a list of test accounts

### Step 2: Create or Select Test Account

**If you don't have a test account:**
1. Click **"New sandbox test account"**
2. Enter an account name (e.g., "Test Seller")
3. Select a country
4. **IMPORTANT:** Clear/uncheck **"Automatically create authorizations for all my current apps"**
5. Click **"Create"**

**If you already have a test account:**
- Find it in the list

### Step 3: Launch the Seller Dashboard

1. Find your test account in the list
2. Click **"Open in Square Dashboard"** (or similar button)
3. **Keep this tab open** - don't close it!
4. The Square Dashboard should load showing the seller's dashboard

### Step 4: Initiate OAuth Flow

1. **In a NEW browser tab** (keep the Dashboard tab open)
2. Go to your app or paste the OAuth URL
3. Click "Connect Square" or paste the OAuth URL
4. Square should now show the authorization page (not a white screen)

## Critical Points

✅ **The Seller Dashboard tab MUST stay open** - Don't close it!
✅ **Use a NEW tab** for the OAuth flow - Don't navigate away from the Dashboard
✅ **Both tabs must be open simultaneously** - Dashboard + OAuth flow

## Troubleshooting

### If it still shows white screen:

1. **Verify Dashboard is actually open:**
   - Check that the Square Dashboard tab is loaded and showing content
   - Not just a blank tab or error page

2. **Check you're using the right test account:**
   - The test account should be associated with your Sandbox application
   - Try creating a fresh test account if unsure

3. **Try refreshing both tabs:**
   - Refresh the Dashboard tab
   - Then try the OAuth URL again in the other tab

4. **Check browser console:**
   - Open DevTools on the Dashboard tab
   - Make sure there are no errors preventing it from loading

## Why This Is Required

Square Sandbox requires the Seller Dashboard to be open because:
- Sandbox doesn't support direct login to the authorization page
- The OAuth flow needs an active seller session
- The Dashboard provides that session context

## Success Indicators

When it works, you should see:
- ✅ Square's authorization page (not white screen)
- ✅ A page asking you to authorize permissions
- ✅ An "Allow" or "Authorize" button
- ✅ No error messages
