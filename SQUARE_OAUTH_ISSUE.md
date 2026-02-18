# Square Payment Confirmation Issue - Root Cause & Solutions

## Root Cause

The issue is that **Square OAuth setup is incomplete**. Here's what happens:

### The Problem Flow

1. **Seller Profile**: Has `payment_provider = 'platform'` (default, not 'square')
2. **Order Creation**: When creating checkout, `getProviderForSeller()` checks seller's `payment_provider`
3. **Provider Selection**: Since `payment_provider = 'platform'`, it returns `StripeProvider` (not `SquareProvider`)
4. **Order Payment Provider**: Order gets `payment_provider = 'stripe'` or `NULL` (not 'square')
5. **Webhook Handler**: Looks for orders with `payment_provider = 'square'` → **Can't find them!**

### Why This Breaks Payment Confirmation

- Square sends webhook → Payment completed ✅
- Webhook handler tries to find order → Looks for `payment_provider = 'square'` ❌
- Order has `payment_provider = 'stripe'` or `NULL` → Not found ❌
- Order stays `PENDING_PAYMENT` ❌

## Solutions

### Solution 1: Complete Square OAuth (Recommended)

**For sellers who want to use their own Square account:**

1. Go to `/settings/payments`
2. Click "Connect Square"
3. Complete the OAuth flow
4. This sets `payment_provider = 'square'` in your profile
5. Future orders will correctly use Square

**Benefits:**
- Payments go through seller's own Square account
- Seller gets paid directly
- Full Square features available

### Solution 2: Use Platform Square Account (Quick Fix)

**For sellers who want to use the platform's Square account (no OAuth needed):**

Run this SQL in Supabase SQL Editor:

```sql
-- Replace YOUR_USER_ID with your actual user ID
UPDATE profiles
SET payment_provider = 'square'
WHERE id = 'YOUR_USER_ID';
```

**Benefits:**
- Quick fix, no OAuth needed
- Uses platform's Square account (from `SQUARE_ACCESS_TOKEN` in `.env.local`)
- Payments go to platform account (you handle distribution)

**Note:** After this, create new orders. Old orders may have wrong `payment_provider`.

## What I Fixed

I've updated the webhook handler to be more flexible:

1. **Removed strict `payment_provider = 'square'` filter** - Now tries to find orders even if `payment_provider` is wrong
2. **Added fallback lookups** - Tries multiple methods to find orders
3. **Auto-fixes payment_provider** - When webhook processes payment, it sets `payment_provider = 'square'` if missing

This means:
- ✅ Webhooks will work even if `payment_provider` wasn't set correctly initially
- ✅ Future webhooks will work better (payment_provider gets fixed automatically)
- ⚠️ But you still need to fix your profile to create Square checkout sessions going forward

## Check Your Current Setup

Run this query to see your payment provider status:

```sql
SELECT 
  id,
  payment_provider,
  square_access_token IS NOT NULL as has_square_token,
  square_merchant_id IS NOT NULL as has_square_merchant
FROM profiles
WHERE id = 'YOUR_USER_ID';
```

**What to look for:**
- `payment_provider = 'square'` → ✅ Correct
- `payment_provider = 'platform'` → ❌ Will use Stripe, not Square
- `has_square_token = true` → ✅ OAuth completed
- `has_square_token = false` → ❌ OAuth not completed

## Next Steps

1. **Choose a solution** (OAuth or platform account)
2. **Fix your profile** (complete OAuth or run SQL update)
3. **Create a new test order** (old orders may have wrong payment_provider)
4. **Complete payment** and check webhook logs
5. **Verify order status** changes to `PAID`

## Testing

After fixing, test with:

1. Create new order
2. Complete Square payment
3. Check server logs for webhook processing
4. Verify order status in database:

```sql
SELECT id, status, payment_provider, square_payment_id, paid_at
FROM orders
WHERE id = 'your-order-id';
```

Should show:
- `status = 'PAID'` ✅
- `payment_provider = 'square'` ✅
- `square_payment_id` is set ✅
- `paid_at` timestamp is set ✅
