# My Market — Seller Checkout

A Next.js App Router application for farmers market sellers to build carts, generate QR payment links, and accept Stripe payments.

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** project (for database)
- **Stripe** account (test mode for development)

## Getting started

```bash
# Install dependencies
npm install

# Copy env template and fill in your values (see below)
# Then start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file in the project root with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Dev helper — a user UUID from auth.users to act as the seller
NEXT_PUBLIC_DEV_SELLER_ID=

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe — get keys at https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# (Optional) Secret token to protect the release-expired endpoint
CRON_SECRET=some-random-secret
```

## Stripe webhook setup (local development)

Stripe sends webhook events (e.g. "payment succeeded") to your server. During local dev you need the **Stripe CLI** to forward these events to your localhost.

### 1. Install the Stripe CLI

- **Windows (scoop):** `scoop install stripe`
- **Windows (download):** https://docs.stripe.com/stripe-cli#install
- **macOS:** `brew install stripe/stripe-cli/stripe`
- **Linux:** see https://docs.stripe.com/stripe-cli#install

### 2. Log in

```bash
stripe login
```

Follow the browser prompt to authenticate with your Stripe account.

### 3. Forward events to your local server

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

The CLI will print a line like:

```
> Ready! Your webhook signing secret is whsec_abc123...
```

### 4. Copy the webhook secret

Take the `whsec_...` value printed above and paste it into `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

### 5. Restart the dev server

```bash
# Stop the dev server (Ctrl+C), then restart so it picks up the new env var
npm run dev
```

Now when a payment completes on Stripe, the CLI forwards the event to your local webhook endpoint, which updates the order status to `PAID`.

> **Tip:** Keep the `stripe listen` terminal running alongside `npm run dev`. You need both running at the same time.

## Key routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/seller/checkout` | Seller builds a cart and generates QR payment link |
| `/pay/[orderId]` | Buyer views order and clicks "Pay now" |
| `/pay/success` | Post-payment confirmation (polls for PAID status) |
| `POST /api/seller/checkout` | Creates order + reserves inventory |
| `POST /api/payments/create-checkout-session` | Creates Stripe Checkout Session |
| `POST /api/stripe/webhook` | Handles Stripe webhook events |
| `POST /api/orders/complete` | Marks a PAID order as COMPLETED |
| `POST /api/orders/release-expired` | Releases expired reservations (cron) |
