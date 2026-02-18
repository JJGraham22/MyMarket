# Square Integration Reset

## What Was Removed

- `/app/api/auth/square/route.ts` - OAuth authorization route
- `/app/api/auth/square/callback/route.ts` - OAuth callback route

## What Remains (Core Infrastructure)

- `/lib/square.ts` - Square client utilities
- `/lib/payments/square-provider.ts` - Payment provider implementation
- `/app/api/square/webhook/route.ts` - Webhook handler
- Database schema - Square-related fields in profiles table

## Next Steps

To rebuild Square OAuth integration:

1. **Verify Environment Variables** in `.env.local`:
   - `SQUARE_APPLICATION_ID`
   - `SQUARE_ACCESS_TOKEN`
   - `SQUARE_CLIENT_SECRET`
   - `SQUARE_ENVIRONMENT=sandbox`
   - `NEXT_PUBLIC_SITE_URL=https://your-tunnel-url`

2. **Create OAuth Routes**:
   - `/app/api/auth/square/route.ts` - Initiate OAuth flow
   - `/app/api/auth/square/callback/route.ts` - Handle callback

3. **Register Redirect URI** in Square Developer Console:
   - Go to https://developer.squareup.com/apps
   - Select your app → OAuth page
   - Add redirect URI: `${NEXT_PUBLIC_SITE_URL}/api/auth/square/callback`

4. **Test the Flow**:
   - Navigate to `/settings/payments`
   - Click "Connect Square"
   - Complete authorization

## Current Status

Square OAuth routes have been removed. Ready for fresh implementation.
