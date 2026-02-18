# ngrok + Square Webhook Setup

Use this when testing Square webhooks locally. ngrok exposes your `localhost:3000` as an HTTPS URL that Square can reach.

## 0. One-time: ngrok account and authtoken

ngrok requires a (free) account and authtoken. If you see **"authentication failed"** or **"Usage of ngrok requires a verified account and authtoken"**:

1. Sign up (or log in): https://dashboard.ngrok.com/signup  
2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken  
3. In a terminal, run (replace `YOUR_AUTHTOKEN` with the token from the dashboard):
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
4. Then run `ngrok http 3000` again.

## 1. Start your app and ngrok

**Terminal 1 – dev server:**
```bash
npm run dev
```

**Terminal 2 – ngrok:**
```bash
ngrok http 3000
```

Leave both running.

**Where to see your ngrok URL:**

1. **In the same terminal** – ngrok prints a line like:
   ```
   Forwarding   https://abc123-def456.ngrok-free.app -> http://localhost:3000
   ```
   Copy the **https://** URL.

2. **In your browser** – Open **http://localhost:4040** (ngrok’s local inspector). The public HTTPS URL is shown at the top (e.g. `https://abc123-def456.ngrok-free.app`). Use that as your base URL.

Copy the **HTTPS** URL (e.g. `https://abc123-def456.ngrok-free.app`). Free ngrok URLs change each time you restart ngrok unless you have a reserved domain.

---

## 2. Add webhook subscription in Square

1. Go to [Square Developer Console](https://developer.squareup.com/apps) → your app → **Webhooks** → **Subscriptions**.
2. Click **Add subscription**.
3. **Notification URL:**  
   `https://YOUR-NGROK-URL/api/square/webhook`  
   Example: `https://abc123-def456.ngrok-free.app/api/square/webhook`
4. **Events:** `payment.completed`, `payment.updated`, `terminal.checkout.updated` (if you use Terminal).
5. Save. Copy the **Signature key** Square shows for this subscription.

---

## 3. Set env vars and restart dev server

In `.env.local` add or update:

```env
# Square webhook (required for signature verification when using ngrok)
# Must match the Notification URL you registered in Square exactly.
SQUARE_WEBHOOK_NOTIFICATION_URL=https://YOUR-NGROK-URL/api/square/webhook
SQUARE_WEBHOOK_SIGNATURE_KEY=your-signature-key-from-square
```

Replace `YOUR-NGROK-URL` with your actual ngrok host (e.g. `abc123-def456.ngrok-free.app`).  
Replace `your-signature-key-from-square` with the key from the subscription.

Restart the dev server (`Ctrl+C` then `npm run dev`) so it picks up the new env vars.

---

## 4. Test the full payment flow

1. Create an order (seller with Square connected).
2. Go to the pay page and complete payment with the Square sandbox test card (`4111 1111 1111 1111`).
3. Square will send a webhook to `https://YOUR-NGROK-URL/api/square/webhook`; your app should mark the order PAID.
4. Check dev server logs for: `Square webhook: marking order ... as PAID`.

---

## Notes

- **Free ngrok:** The HTTPS URL changes every time you run `ngrok http 3000`. Update the Square subscription and `SQUARE_WEBHOOK_NOTIFICATION_URL` if you restart ngrok and get a new URL.
- **Payments still work without webhook:** The success page confirms payment with Square’s API when the customer lands on it, so orders can be marked PAID even if the webhook fails or isn’t set up. The webhook is for immediate, server-side updates and for production.
