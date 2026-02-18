# Debugging Square Payment Webhook - Step-by-Step Guide

## Step 1: Check Server Logs (Most Important)

### In Development (Local)
1. **Open your terminal** where `npm run dev` is running
2. **Look for console.log output** - The webhook handler logs detailed information:
   - `Square webhook payment.completed:` - Shows payment details received
   - `Square webhook: found order...` - Confirms order lookup
   - `Square webhook: marking order... as PAID` - Confirms payment processing
   - Any error messages

### In Production
- Check your hosting platform's logs (Vercel, Railway, etc.)
- Look for the same log messages mentioned above

**What to look for:**
- ✅ If you see "Square webhook payment.completed:" - webhook is being received
- ❌ If you see "order not found" - order lookup is failing
- ❌ If you see "failed to fetch Square order" - Square API call is failing

---

## Duplicate deliveries (same event, multiple 200s)

If the Square dashboard shows the same event type multiple times (e.g. two `payment.created` at the same time) with 200:

1. **Check for duplicate subscriptions**  
   In [Square Developer Console](https://developer.squareup.com/apps) → your app → **Webhooks** → **Subscriptions**, ensure you have **only one** subscription with your notification URL. If the same URL is listed twice (or in two subscriptions), delete the duplicate. Each subscription gets every event, so two subscriptions = double deliveries.

2. **Idempotency**  
   The app records each webhook `event_id` and skips processing if the same event is received again, so duplicate deliveries no longer cause duplicate work or logs. You still see multiple 200s in Square’s dashboard if Square sends duplicates (e.g. retries or multiple subscriptions).

---

## Step 2: Verify Webhook Configuration

### Yes, it’s a subscription

Square uses **webhook subscriptions**. You don’t “add a URL” by itself; you **add a subscription** that includes:

- A **notification URL** (your endpoint)
- The **events** you want

Per [Square Webhook Events](https://developer.squareup.com/reference/square/webhooks), payment events are:

- **payment.created** – when a Payment is created
- **payment.updated** – when a Payment is updated (e.g. status → COMPLETED)

There is no `payment.completed` event; we mark orders PAID when `payment.updated` (or `payment.created`) has status `COMPLETED`.

### How to add a webhook subscription (Developer Console)

1. Go to [Square Developer Console](https://developer.squareup.com/apps) and open your application.
2. In the left sidebar, go to **Webhooks** → **Subscriptions**.
3. Click **Add subscription** (or **Create subscription**).
4. Fill in:
   - **Name:** e.g. `MyMarket payments`
   - **Notification URL:** your public HTTPS URL, e.g.  
     `https://yourdomain.com/api/square/webhook`  
     (must be HTTPS and reachable from the internet; localhost will not work).
5. Choose the **events** to subscribe to. For payment confirmation, include:
   - **payment.created**
   - **payment.updated**
   - **terminal.checkout.updated** (only if you use Square Terminal)
   - Optionally **order.updated** / **order.created** (we acknowledge these with 200 but don’t use them for marking PAID).
6. Choose an **API version** (e.g. the default or latest).
7. Save. Square will show a **Signature key** for this subscription — copy it.
8. In your app, set in `.env` (or `.env.local`):  
   `SQUARE_WEBHOOK_SIGNATURE_KEY=<paste the signature key>`

### Why “looping” / repeated deliveries stop

Square **retries** if the endpoint doesn’t return **200 within a few seconds**. Our handler returns **200 immediately** and processes payment/terminal logic in the background, so Square does not retry. If you still see many deliveries for the same event, ensure you have **only one** subscription with this URL (no duplicate subscriptions).

### Check Square Webhook Setup
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select your application
3. Go to **Webhooks** → **Subscriptions**
4. Verify:
   - ✅ **One** subscription with notification URL: `https://yourdomain.com/api/square/webhook`
   - ✅ Events subscribed: **payment.created**, **payment.updated** (and **terminal.checkout.updated** if needed)
   - ✅ Webhook signature key from that subscription is in `.env` as `SQUARE_WEBHOOK_SIGNATURE_KEY`

### Check Environment Variables
Open `.env.local` and verify:
```env
SQUARE_ACCESS_TOKEN=your-token
SQUARE_APPLICATION_ID=your-app-id
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-secret
SQUARE_ENVIRONMENT=sandbox  # or production
```

---

## Step 3: Test Order Creation

### Create a Test Order
1. Go to your app and create an order (as buyer or guest)
2. **Before completing payment**, check the database:

```sql
-- Run this in Supabase SQL Editor
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  customer_id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

**What to verify:**
- ✅ Order exists with `status = 'PENDING_PAYMENT'`
- ✅ `payment_provider = 'square'`
- ✅ `payment_session_id` is set (this is the Payment Link ID)

---

## Step 4: Complete a Test Payment

### Simulate Payment Completion
1. **Complete a Square payment** using the Payment Link
2. **Immediately check server logs** for webhook processing
3. **Check database again**:

```sql
-- Check if order was updated
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  paid_at,
  updated_at
FROM orders
WHERE id = 'your-order-id';
```

**What to verify:**
- ✅ `status` changed from `PENDING_PAYMENT` to `PAID`
- ✅ `square_payment_id` is set
- ✅ `paid_at` timestamp is set

---

## Step 5: Check Webhook Delivery (If Not Working)

### Option A: Check Square Webhook Logs
1. Go to Square Developer Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check **Delivery Logs** or **Event History**
4. Look for:
   - ✅ Successful deliveries (200 status)
   - ❌ Failed deliveries (4xx/5xx status)
   - Error messages

### Option B: Test Webhook Manually
You can test the webhook endpoint directly:

```bash
# Using curl (replace with your actual values)
curl -X POST http://localhost:3000/api/square/webhook \
  -H "Content-Type: application/json" \
  -H "x-square-hmacsha256-signature: test-signature" \
  -d '{
    "type": "payment.completed",
    "data": {
      "object": {
        "id": "test-payment-id",
        "order_id": "test-order-id",
        "status": "COMPLETED"
      }
    }
  }'
```

**Note:** This will fail signature verification, but you can see if the endpoint is reachable.

---

## Step 6: Check Order History Display

### Verify Orders Query
1. **As Buyer**: Go to `/orders` or `/dashboard`
2. **As Seller**: Go to `/orders` (seller view)
3. Check if orders appear

### Check Database Query Logic
The orders page queries:
- **Buyer**: `WHERE customer_id = user.id`
- **Seller**: `WHERE seller_session_id IN (user's sessions)`

**If orders aren't showing:**
- Guest orders (`customer_id IS NULL`) won't show in buyer history
- Check if you're logged in as the correct user
- Verify `seller_session_id` matches seller's sessions

---

## Step 7: Debug Specific Issues

### Issue: "order not found" in logs

**Check:**
1. Is `squareOrderId` present in the webhook payload?
2. Try fetching the Square order manually:

```typescript
// Add this temporarily to test
const client = getSquareClient();
const orderResponse = await client.orders.retrieveOrder({
  orderId: "your-square-order-id"
});
console.log("Square order metadata:", orderResponse.order?.metadata);
```

### Issue: "failed to fetch Square order"

**Possible causes:**
- Wrong Square account (platform vs seller)
- Invalid Square access token
- Square order doesn't exist

**Solution:** The code now tries seller accounts automatically, but check logs to see which account succeeded.

### Issue: Orders not updating to PAID

**Check:**
1. Is `markOrderPaid` being called? (Look for log: "marking order... as PAID")
2. Check database update:

```sql
-- Check update was successful
SELECT 
  id,
  status,
  updated_at,
  paid_at
FROM orders
WHERE id = 'your-order-id';
```

---

## Step 8: Enable More Detailed Logging

If you need even more detail, temporarily add this to the webhook handler:

```typescript
// At the start of handlePaymentCompleted
console.log("Full payment object:", JSON.stringify(payment, null, 2));
```

This will show you exactly what Square is sending.

---

## Quick Checklist

- [ ] Server logs show "Square webhook payment.completed"
- [ ] Order exists in database with `payment_provider = 'square'`
- [ ] `payment_session_id` is set on order
- [ ] Webhook logs show order was found
- [ ] Webhook logs show order was marked as PAID
- [ ] Database shows `status = 'PAID'` after payment
- [ ] Orders appear in order history (if logged in)

---

## Common Issues & Solutions

### Webhook not being called
- **Check:** Square webhook URL is correct and accessible
- **Check:** Webhook events are subscribed in Square dashboard
- **Check:** Server is running and accessible

### Order not found
- **Check:** `payment_session_id` matches between order and webhook
- **Check:** Order was created before payment
- **Check:** Using correct Square account (platform vs seller)

### Payment confirmed but order still PENDING
- **Check:** Database update succeeded (look for error in logs)
- **Check:** `markOrderPaid` function is being called
- **Check:** No database constraints preventing update

---

## Need More Help?

If issues persist, collect:
1. Server logs showing webhook processing
2. Database state (order record before/after)
3. Square webhook delivery logs
4. Any error messages from logs
