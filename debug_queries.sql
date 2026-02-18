-- Square Payment Webhook Debugging Queries
-- Run these in Supabase SQL Editor

-- 1. Check recent orders and their payment status
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  customer_id,
  total_cents,
  created_at,
  paid_at,
  updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 2. Find orders stuck in PENDING_PAYMENT with Square
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  created_at,
  updated_at
FROM orders
WHERE payment_provider = 'square'
  AND status = 'PENDING_PAYMENT'
ORDER BY created_at DESC;

-- 3. Check orders that should have been paid (have square_payment_id but still pending)
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  created_at,
  paid_at
FROM orders
WHERE payment_provider = 'square'
  AND square_payment_id IS NOT NULL
  AND status != 'PAID'
ORDER BY created_at DESC;

-- 4. Find orders by payment_session_id (Payment Link ID)
-- Replace 'YOUR_PAYMENT_LINK_ID' with actual ID
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  created_at
FROM orders
WHERE payment_session_id = 'YOUR_PAYMENT_LINK_ID';

-- 5. Check seller Square configuration
SELECT 
  id,
  payment_provider,
  square_merchant_id,
  square_access_token IS NOT NULL as has_access_token,
  square_location_id
FROM profiles
WHERE payment_provider = 'square';

-- 6. Count orders by status and payment provider
SELECT 
  payment_provider,
  status,
  COUNT(*) as count
FROM orders
GROUP BY payment_provider, status
ORDER BY payment_provider, status;

-- 7. Find orders created in last 24 hours
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  square_payment_id,
  customer_id,
  created_at,
  paid_at
FROM orders
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 8. Check for orders with missing payment_session_id (shouldn't happen for Square)
SELECT 
  id,
  status,
  payment_provider,
  payment_session_id,
  created_at
FROM orders
WHERE payment_provider = 'square'
  AND payment_session_id IS NULL
ORDER BY created_at DESC;
