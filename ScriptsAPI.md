# Scripts Payment Gateway Integration Guide

**Version:** 1.0  
**Last Updated:** March 11, 2026  
**Status:** Production Ready  

> PlayHub note: Canonical API base path is `https://scripts-api.selfservice.io.vn/api/v1`. For checkout only, compatibility aliases are also available at root path: `/checkout/create`, `/checkout/{checkoutId}`, `/checkout/{checkoutId}/status`.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Core API Endpoints](#core-api-endpoints)
5. [Payment Flow](#payment-flow)
6. [Webhook Integration](#webhook-integration)
7. [Sandbox & Testing](#sandbox--testing)
8. [Code Examples](#code-examples)
9. [Error Handling](#error-handling)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Scripts?

Scripts is an enterprise-grade payment gateway sandbox designed for the Vietnamese market. It provides a comprehensive solution for:

- **VietQR Payments** - Vietnamese QR code payments
- **E-wallet Integration** - Integration with major e-wallets
- **Payment Processing** - Full payment lifecycle management
- **Webhook Notifications** - Real-time payment status updates
- **Merchant Dashboard** - Complete transaction visibility
- **API-First Design** - Stripe-like developer experience

### Key Features

✓ **Deterministic Testing** - Magic test amounts for different scenarios  
✓ **Webhook Retries** - Exponential backoff with HMAC signatures  
✓ **Multi-Currency** - VND with extensibility for other currencies  
✓ **Rate Limiting** - Built-in throttling and fair usage policies  
✓ **Real-time Updates** - WebSocket and REST support  
✓ **AI Debugging** - Merchant logs explainable by AI  
✓ **Production Ready** - Deployed on Railway with custom domain  

### Technology Stack

- **Backend API:** NestJS + Prisma ORM
- **Authentication:** Supabase Auth + JWT
- **Database:** PostgreSQL (Supabase)
- **Queue System:** BullMQ + Redis
- **Frontend:** Next.js + React
- **Deployment:** Railway
- **Custom Domain:** `scripts-api.selfservice.io.vn`

---

## Getting Started

### Prerequisites

- A merchant account on Scripts platform
- API keys (Public & Secret)
- HTTPS endpoint for webhook handling
- Basic understanding of REST APIs
- Knowledge of HMAC signature verification (for webhooks)

### Obtain API Keys

1. **Log in to Scripts Dashboard**
   - Visit: `https://scripts-api.selfservice.io.vn/dashboard`
   - Sign in with your merchant credentials

2. **Navigate to Developers**
   - Click "Developers" in the sidebar
   - Select "API Keys" tab

3. **Copy Your Keys**
   - **Public Key:** Safe for client-side code (payment intents only)
   - **Secret Key:** Keep in backend environment variables ONLY
   - Never commit secret keys to version control

### Environment Setup

```bash
# .env.local (Keep this file private!)
NEXT_PUBLIC_SCRIPTS_API_URL=https://scripts-api.selfservice.io.vn
NEXT_PUBLIC_SCRIPTS_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxx

# Backend only (.env or .env.server)
SCRIPTS_API_URL=https://scripts-api.selfservice.io.vn
SCRIPTS_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
SCRIPTS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
```

---

## Authentication

### JWT Token-Based Authentication

All protected API endpoints require a valid Supabase JWT token in the `Authorization` header.

#### How to Obtain JWT Token

```javascript
// Client-side (using Supabase client)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'merchant@example.com',
  password: 'password123'
});

// Get JWT token
const token = data.session?.access_token;
```

#### Using JWT in Requests

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const response = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  { headers }
);
```

### Token Refresh

JWT tokens expire after a period. Refresh tokens automatically:

```javascript
// Supabase handles this automatically
const { data, error } = await supabase.auth.refreshSession();
const newToken = data.session?.access_token;
```

---

## Core API Endpoints

### Base URL
```
https://scripts-api.selfservice.io.vn/api/v1
```

### Checkout Compatibility URLs

For legacy integrations or proxies that strip `/api/v1`, checkout endpoints are also exposed at:

```
https://scripts-api.selfservice.io.vn/checkout/create
https://scripts-api.selfservice.io.vn/checkout/{checkoutId}
https://scripts-api.selfservice.io.vn/checkout/{checkoutId}/status
```

Use canonical `/api/v1` routes when possible. Use compatibility URLs only if your gateway/proxy rewrites path prefixes.

### PlayHub Quick Integration (Recommended)

Use this sequence for the PlayHub checkout flow:

1. `POST https://scripts-api.selfservice.io.vn/api/v1/checkout/create` to create session
2. Redirect customer to `checkoutUrl`
3. Poll `GET https://scripts-api.selfservice.io.vn/api/v1/checkout/{checkoutId}/status` every 2-3 seconds
4. Stop polling when `isFinal=true`
5. Render result:
  - `status=completed`: payment success
  - `status=failed`: payment failed
  - `status=refunded`: payment refunded

Fallback URLs (only if upstream rewrites `/api/v1`):

- `POST https://scripts-api.selfservice.io.vn/checkout/create`
- `GET https://scripts-api.selfservice.io.vn/checkout/{checkoutId}/status`

Required headers for API calls:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Merchant Endpoints

#### 1. Get Merchant Profile

**Endpoint:** `GET /merchants/profile`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "id": "merchant_12345",
  "name": "My Store",
  "email": "contact@mystore.com",
  "registeredAt": "2024-01-15T10:30:00Z",
  "status": "active",
  "tier": "premium"
}
```

**Example:**
```javascript
const response = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  }
);
const merchant = await response.json();
console.log('Merchant:', merchant);
```

---

#### 2. Get Account Balance

**Endpoint:** `GET /merchants/balance`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "availableBalance": 5000000,
  "pendingBalance": 250000,
  "totalProcessed": 50000000,
  "currency": "VND",
  "lastUpdated": "2024-03-11T14:22:00Z"
}
```

**Description:** Returns current available balance, pending settlements, and total processed amount.

---

#### 3. Get Transaction History

**Endpoint:** `GET /merchants/transactions`

**Authentication:** Required (Bearer Token)

**Query Parameters:** None (current version returns latest 25 transactions)

**Response:**
```json
[
  {
    "id": "txn_abc123",
    "amount": 500000,
    "status": "SUCCEEDED",
    "method": "QR",
    "createdAt": "2024-03-11T10:15:00Z"
  }
]
```

---

#### 4. Get API Keys

**Endpoint:** `GET /merchants/keys`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "publicKey": "pk_live_abcd1234...",
  "secretKey": "sk_live_efgh5678...",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastRotated": "2024-02-20T08:15:00Z"
}
```

**Note:** Secret key only shown upon request and verified with current password.

---

#### 5. Roll API Keys

**Endpoint:** `POST /merchants/keys/roll`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "confirmPassword": "current_merchant_password"
}
```

**Response:**
```json
{
  "publicKey": "pk_live_new1234...",
  "secretKey": "sk_live_new5678...",
  "previousKeyExpiration": "2024-04-10T23:59:59Z"
}
```

**⚠️ Warning:** This immediately invalidates current keys. Update all integrations within 30 days or old keys will be disabled.

---

### Payment Endpoints

#### 6. Create Checkout Session

**Endpoint:** `POST /checkout/create`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "amount": 500000,
  "currency": "VND",
  "merchantOrderId": "order_12345",
  "description": "Payment for 2 items",
  "items": [
    {
      "name": "Item 1",
      "quantity": 1,
      "price": 250000
    },
    {
      "name": "Item 2",
      "quantity": 1,
      "price": 250000
    }
  ],
  "customer": {
    "email": "customer@example.com",
    "phone": "0912345678",
    "name": "John Doe"
  },
  "redirectUrl": "https://mystore.com/order-success",
  "webhookUrl": "https://mystore.com/webhooks/scripts"
}
```

**Response:**
```json
{
  "checkoutId": "chk_xyz789",
  "checkoutUrl": "https://scripts-api.selfservice.io.vn/checkout/chk_xyz789",
  "merchantOrderId": "order_12345",
  "amount": 500000,
  "currency": "VND",
  "status": "pending",
  "expiresAt": "2024-03-11T12:00:00Z",
  "createdAt": "2024-03-11T10:00:00Z"
}
```

**Flow:**
1. Server creates checkout session with `POST /checkout/create`
2. Server returns `checkoutUrl` to frontend
3. Frontend redirects user to checkout URL
4. User completes payment at checkout page
5. User redirected to `redirectUrl` after payment
6. Webhook sent to `webhookUrl` with payment status

---

#### 7. Get Checkout Status

**Endpoint:** `GET /checkout/{checkoutId}`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "checkoutId": "chk_xyz789",
  "merchantOrderId": "order_12345",
  "status": "completed",
  "transactionId": "chk_xyz789",
  "amount": 500000,
  "currency": "VND",
  "paymentMethod": "QR",
  "completedAt": "2024-03-11T10:05:30Z"
}
```

#### 7.1 Poll Checkout Status (Playhub-friendly)

**Endpoint:** `GET /checkout/{checkoutId}/status`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "checkoutId": "chk_xyz789",
  "merchantOrderId": "order_12345",
  "status": "pending",
  "isFinal": false,
  "updatedAt": "2024-03-11T10:02:00Z"
}
```

**Status semantics:**
- `pending`: payment is still processing
- `completed`: payment succeeded
- `failed`: payment failed
- `refunded`: payment was refunded

**Playhub recommendation:**
- Poll every 2-3 seconds after redirect
- Stop polling when `isFinal=true`
- Show success UI on `completed`, failure UI on `failed`

---

### Health Check

#### 8. Health Check Endpoint

**Endpoint:** `GET /health`

**Authentication:** Not Required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-11T14:30:00Z"
}
```

**Usage:** Use this to verify API connectivity without authentication.

---

## Payment Flow

### Complete Payment Journey

```
┌─────────────────────────────────────────────────────────┐
│ 1. Customer initiates checkout on your website           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Your Backend: POST /checkout/create                  │
│    Returns: checkoutUrl                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Frontend redirects to Scripts checkout page           │
│    URL: https://scripts-api.../checkout/{id}           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Customer selects payment method & completes payment  │
│    - VietQR scanning                                     │
│    - E-wallet payment                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼ (Parallel)
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────────┐    ┌──────────────────────┐
│ 5a. Redirect Success │    │ 5b. Webhook Sent     │
│ to redirectUrl       │    │ Payment Status       │
└──────────────────────┘    └─────────┬────────────┘
                                      │
                                      ▼
                            ┌──────────────────────┐
                            │ 6. Your Webhook      │
                            │ Handler Processing   │
                            │ Updates database     │
                            └──────────────────────┘
```

### Step-by-Step Integration

#### Step 1: Create Checkout Session (Backend)

```javascript
// backend/routes/checkout.js
app.post('/api/checkout', authenticateUser, async (req, res) => {
  const { amount, description, items } = req.body;
  const user = req.user;

  try {
    const response = await fetch(
      'https://scripts-api.selfservice.io.vn/api/v1/checkout/create',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'VND',
          merchantOrderId: `order_${Date.now()}`,
          description,
          items,
          customer: {
            email: user.email,
            name: user.name,
            phone: user.phone,
          },
          redirectUrl: `${process.env.FRONTEND_URL}/order-success`,
          webhookUrl: `${process.env.BACKEND_URL}/webhooks/scripts`,
        }),
      }
    );

    const checkout = await response.json();
    
    if (!response.ok) {
      throw new Error(checkout.error || 'Failed to create checkout');
    }

    // Save checkout reference in database
    await Order.create({
      merchantOrderId: checkout.merchantOrderId,
      checkoutId: checkout.checkoutId,
      userId: user.id,
      amount,
      status: 'pending_payment',
    });

    res.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    console.error('Checkout creation failed:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});
```

#### Step 2: Redirect to Checkout (Frontend)

```javascript
// frontend/pages/checkout.jsx
export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 500000,
          description: 'Payment for order',
          items: [{ name: 'Product', quantity: 1, price: 500000 }],
        }),
      });

      const { checkoutUrl } = await response.json();
      
      // Redirect to Scripts checkout page
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Processing...' : 'Proceed to Payment'}
    </button>
  );
}
```

#### Step 3: Handle Redirect Success (Frontend)

```javascript
// frontend/pages/order-success.jsx
export default function OrderSuccessPage() {
  const router = useRouter();
  const { checkoutId } = router.query;
  const merchantJwtToken = 'your_supabase_access_token';

  useEffect(() => {
    if (!checkoutId) return;

    // Poll Scripts checkout status until final
    let timer;
    const pollCheckoutStatus = async () => {
      const response = await fetch(
        `https://scripts-api.selfservice.io.vn/api/v1/checkout/${checkoutId}/status`,
        {
          headers: {
            Authorization: `Bearer ${merchantJwtToken}`,
          },
        }
      );
      const status = await response.json();

      if (status.isFinal) {
        if (status.status === 'completed') {
          toast.success('Payment successful!');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          toast.error('Payment failed or canceled.');
        }
        return;
      }

      timer = setTimeout(pollCheckoutStatus, 2500);
    };

    pollCheckoutStatus();
    return () => clearTimeout(timer);
  }, [checkoutId]);

  return (
    <div>
      <h1>Processing Your Payment...</h1>
      <p>Please wait while we confirm your payment.</p>
    </div>
  );
}
```

---

## Webhook Integration

### What are Webhooks?

Webhooks are HTTP POST requests sent by Scripts to your backend when payment events occur. They're the most reliable way to track payment status.

### Webhook Events

| Event Type | Trigger | Data |
|-----------|---------|------|
| `payment_intent.succeeded` | Payment completed successfully | Payment intent payload |
| `payment_intent.failed` | Payment failed or timed out | Payment intent payload + failure reason |

### Register Webhook Endpoint

1. **In Scripts Dashboard:**
   - Go to Developers → Webhooks
   - Click "Add Endpoint"
   - Enter your webhook URL: `https://mystore.com/webhooks/scripts`
   - Note the webhook secret (keep it secure!)

2. **Webhook Secret in Environment:**
   ```bash
   SCRIPTS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
   ```

### Webhook Payload Format

```json
{
  "event": "payment_intent.succeeded",
  "data": {
    "id": "txn_xyz789",
    "object": "payment_intent",
    "amount": "500000",
    "currency": "VND",
    "status": "SUCCEEDED",
    "method": "QR",
    "metadata": {
      "merchantOrderId": "order_12345"
    },
    "merchant_id": "merchant_uuid",
    "customer_id": "customer_uuid",
    "created_at": "2024-03-11T10:15:30Z"
  }
}
```

Header used for signature verification:

```text
Scripts-Signature: t=<unix_ms>,v1=<hmac_sha256_hex>
```

### Verify Webhook Signature (CRITICAL)

**Never trust webhooks without signature verification!**

```javascript
// backend/webhooks/scripts.js
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  // Signature format: t=<timestamp>,v1=<hex>
  const parts = Object.fromEntries(
    String(signature || '')
      .split(',')
      .map((part) => part.split('=').map((v) => v.trim()))
      .filter(([k, v]) => k && v)
  );

  if (!parts.t || !parts.v1) {
    return false;
  }

  const signedPayload = `${parts.t}.${payload}`;
  const digest = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const expected = Buffer.from(digest, 'hex');
  const provided = Buffer.from(parts.v1, 'hex');

  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

app.post('/webhooks/scripts', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['scripts-signature'];
  const rawBody = req.body.toString(); // Keep raw body string

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature, process.env.SCRIPTS_WEBHOOK_SECRET)) {
    console.warn('❌ Invalid webhook signature - rejecting');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse after verification
  const event = JSON.parse(rawBody);

  try {
    // Log webhook receipt
    console.log(`✓ Received webhook: ${event.event}`);

    switch (event.event) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data);
        break;

      case 'payment_intent.failed':
        await handlePaymentFailed(event.data);
        break;

      default:
        console.warn(`Unknown webhook type: ${event.event}`);
    }

    // Always respond with 200 to prevent retries
    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return 500 to trigger retry (Scripts will retry with exponential backoff)
    res.status(500).json({ error: 'Processing failed' });
  }
});

async function handlePaymentSuccess(data) {
  // Update order status
  const order = await Order.findOne({ 
    merchantOrderId: data.merchantOrderId 
  });

  if (order) {
    order.status = 'paid';
    order.transactionId = data.id;
    order.paidAt = new Date();
    await order.save();

    // Send confirmation email to customer
    await sendConfirmationEmail(order.customerId, order);

    // Trigger fulfillment process
    await triggerFulfillment(order.id);

    console.log(`✓ Order ${data.merchantOrderId} marked as paid`);
  }
}

async function handlePaymentFailed(data) {
  const order = await Order.findOne({ 
    merchantOrderId: data.merchantOrderId 
  });

  if (order) {
    order.status = 'payment_failed';
    order.failureReason = data.failure_reason || 'payment_intent_failed';
    await order.save();

    // Notify customer of failure
    await sendPaymentFailureEmail(order.customerId, order);

    console.log(`✗ Order ${data.merchantOrderId} payment failed`);
  }
}
```

### Webhook Retry Logic

Scripts automatically retries failed webhooks:
- **Attempt 1:** immediate
- **Attempt 2:** ~2 seconds later
- **Attempt 3:** ~4 seconds later
- **Attempt 4:** ~8 seconds later
- **Attempt 5:** ~16 seconds later

Current queue configuration uses exponential backoff with base delay 2 seconds and 5 total attempts.

**Your endpoint should:**
- ✓ Return HTTP 200 on success
- ✓ Return HTTP 5xx to trigger retry
- ✓ Be idempotent (safe to process same webhook twice)

### Testing Webhooks Locally

```bash
# Use ngrok to expose local server
ngrok http 3000

# Then register this URL in Scripts Webhooks:
# https://xxxxx.ngrok.io/webhooks/scripts

# Monitor webhook requests:
ngrok web 4040
```

---

## Sandbox & Testing

### Magic Test Amounts

Use these specific amounts in sandbox to trigger different outcomes:

| Amount | Result | Event Type | Use Case |
|--------|--------|-----------|----------|
| **10000 VND** | ✅ Success | `payment_intent.succeeded` | Happy path testing |
| **40000 VND** | ⚠️ Insufficient funds | `payment_intent.failed` | Error handling test |
| **50408 VND** | ⏳ Pending then resolved (70% success / 30% fail) | `payment_intent.succeeded` or `payment_intent.failed` | Polling + webhook resilience test |

#### Example Test Flow

```javascript
async function runSandboxTests() {
  const testAmounts = [
    { amount: 10000, expected: 'completed' },
    { amount: 40000, expected: 'failed' },
    { amount: 50408, expected: 'pending_then_final' },
  ];

  for (const test of testAmounts) {
    console.log(`Testing ${test.amount} VND...`);

    const checkout = await createCheckout({
      amount: test.amount,
      description: `Sandbox test: ${test.amount}`,
    });

    // In sandbox, payment auto-processes based on amount
    // Wait a moment for webhook
    await new Promise(r => setTimeout(r, 2000));

    const order = await Order.findOne({ 
      checkoutId: checkout.checkoutId 
    });

    console.log(`Result: ${order.status} (expected: ${test.expected})`);
    assert(order.status === test.expected);
  }

  console.log('✅ All sandbox tests passed!');
}
```

### Test Mode Indicators

In development, disable certain features:

```javascript
// Only require HTTPS in production
const requireHTTPS = process.env.NODE_ENV === 'production';

// Mock email sending in sandbox
const sendEmail = process.env.NODE_ENV === 'production' 
  ? realEmailService 
  : consoleEmailMock;

// Log all transactions in development
if (process.env.NODE_ENV !== 'production') {
  logWebhookPayload(event);
}
```

---

## Code Examples

### Complete Backend Example (Node.js + Express)

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const SCRIPTS_API = 'https://scripts-api.selfservice.io.vn/api/v1';

// ============ HELPER FUNCTIONS ============

async function getJWTToken(merchantId, merchantSecret) {
  // In real implementation, get JWT from Supabase
  // This is simplified - implement proper Supabase auth
  return 'jwt_token_here';
}

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === hash;
}

// ============ CHECKOUT ENDPOINTS ============

app.post('/api/checkout', async (req, res) => {
  const { amount, items, description } = req.body;

  try {
    const jwtToken = await getJWTToken(
      process.env.MERCHANT_ID,
      process.env.MERCHANT_SECRET
    );

    const response = await axios.post(
      `${SCRIPTS_API}/checkout/create`,
      {
        amount,
        currency: 'VND',
        merchantOrderId: `order_${Date.now()}`,
        description,
        items,
        customer: {
          email: 'customer@example.com',
          name: 'Customer Name',
          phone: '0912345678',
        },
        redirectUrl: `${process.env.FRONTEND_URL}/success`,
        webhookUrl: `${process.env.BACKEND_URL}/webhooks/scripts`,
      },
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Save order to database
    const order = {
      id: `order_${Date.now()}`,
      checkoutId: response.data.checkoutId,
      amount,
      status: 'pending',
      createdAt: new Date(),
    };
    // await Order.create(order);

    res.json({
      checkoutUrl: response.data.checkoutUrl,
      orderId: order.id,
    });

  } catch (error) {
    console.error('Checkout error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// ============ WEBHOOK ENDPOINT ============

app.post('/webhooks/scripts', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['scripts-signature'];
  const rawBody = req.body.toString();

  // Verify signature
  if (!verifyWebhookSignature(
    rawBody,
    signature,
    process.env.SCRIPTS_WEBHOOK_SECRET
  )) {
    console.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      case 'payment_intent.succeeded':
        console.log('✅ Payment success:', event.data.merchantOrderId);
        // Update order status to 'paid'
        // Send confirmation email
        // Trigger fulfillment
        break;

      case 'payment_intent.failed':
        console.log('❌ Payment failed:', event.data.merchantOrderId);
        // Update order status to 'failed'
        // Send failure notification
        break;

      default:
        console.log('Unknown event:', event.event);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// ============ MERCHANT ENDPOINTS ============

app.get('/api/merchant/balance', async (req, res) => {
  try {
    const jwtToken = await getJWTToken(
      process.env.MERCHANT_ID,
      process.env.MERCHANT_SECRET
    );

    const response = await axios.get(
      `${SCRIPTS_API}/merchants/balance`,
      {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.get('/api/merchant/transactions', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const jwtToken = await getJWTToken(
      process.env.MERCHANT_ID,
      process.env.MERCHANT_SECRET
    );

    const response = await axios.get(
      `${SCRIPTS_API}/merchants/transactions`,
      {
        params: { page, limit },
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ============ SERVER START ============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: ${process.env.BACKEND_URL}/webhooks/scripts`);
});
```

### Complete Frontend Example (React)

```javascript
// hooks/useScriptsCheckout.js
import { useState } from 'react';

export function useScriptsCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCheckout = async (items, total) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          items,
          description: `Order for ${items.length} items`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Scripts checkout
      window.location.href = checkoutUrl;

    } catch (err) {
      setError(err.message);
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { createCheckout, loading, error };
}

// components/PaymentButton.jsx
import { useScriptsCheckout } from '../hooks/useScriptsCheckout';

export function PaymentButton({ cartItems, total }) {
  const { createCheckout, loading, error } = useScriptsCheckout();

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button
        onClick={() => createCheckout(cartItems, total)}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Processing...' : `Pay ${total.toLocaleString()} VND`}
      </button>
    </div>
  );
}

// pages/checkout-success.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const checkOrderStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const orderData = await response.json();
        setOrder(orderData);

        if (orderData.status === 'paid') {
          // Payment confirmed
          setTimeout(() => router.push('/dashboard'), 3000);
        }
      } catch (err) {
        console.error('Failed to check order status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkOrderStatus();
  }, [orderId]);

  if (loading) return <p>Verifying payment...</p>;

  if (order?.status === 'paid') {
    return (
      <div className="success-message">
        <h1>✅ Payment Successful!</h1>
        <p>Your order has been confirmed.</p>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pending-message">
      <h1>Processing Payment...</h1>
      <p>Your payment is being processed. Please wait.</p>
    </div>
  );
}
```

### Python Integration Example

```python
# payment_service.py
import requests
import hmac
import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class ScriptsPaymentGateway:
    """Scripts Payment Gateway Integration"""

    def __init__(self, api_url: str, jwt_token: str, webhook_secret: str):
        self.api_url = api_url
        self.jwt_token = jwt_token
        self.webhook_secret = webhook_secret
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }

    def create_checkout(self, amount: int, merchant_order_id: str,
                       description: str, items: list, customer: dict) -> Dict[str, Any]:
        """Create a new checkout session"""

        payload = {
            'amount': amount,
            'currency': 'VND',
            'merchantOrderId': merchant_order_id,
            'description': description,
            'items': items,
            'customer': customer,
            'redirectUrl': 'https://mystore.com/success',
            'webhookUrl': 'https://mystore.com/webhooks/scripts',
        }

        response = requests.post(
            f'{self.api_url}/checkout/create',
            json=payload,
            headers=self.headers
        )

        response.raise_for_status()
        return response.json()

    def get_merchant_balance(self) -> Dict[str, Any]:
        """Get current merchant balance"""

        response = requests.get(
            f'{self.api_url}/merchants/balance',
            headers=self.headers
        )

        response.raise_for_status()
        return response.json()

    def get_transactions(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get transaction history"""

        response = requests.get(
            f'{self.api_url}/merchants/transactions',
            params={'page': page, 'limit': limit},
            headers=self.headers
        )

        response.raise_for_status()
        return response.json()

    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """Verify webhook HMAC signature"""
      # Signature format: "t=<timestamp>,v1=<hex>"
      parts = dict(part.split('=') for part in signature.split(','))
      timestamp = parts.get('t')
      provided = parts.get('v1')
      if not timestamp or not provided:
        return False

      signed_payload = f"{timestamp}.{payload}"
      expected = hmac.new(
        self.webhook_secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
      ).hexdigest()

      return hmac.compare_digest(expected, provided)

    def handle_webhook(self, payload: str, signature: str) -> Dict[str, Any]:
        """Process webhook safely"""

        # Verify signature
        if not self.verify_webhook_signature(payload, signature):
            raise ValueError('Invalid webhook signature')

        event = json.loads(payload)

        if event['event'] == 'payment_intent.succeeded':
            return self._handle_payment_success(event['data'])
        elif event['event'] == 'payment_intent.failed':
            return self._handle_payment_failed(event['data'])
        else:
            return {'status': 'unknown_event'}

    def _handle_payment_success(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment"""

        print(f"✅ Payment success: {data['merchantOrderId']}")
        # Update database, send email, etc.
        return {'status': 'processed'}

    def _handle_payment_failed(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment"""

        print(f"❌ Payment failed: {data['merchantOrderId']}")
        # Update database, notify customer, etc.
        return {'status': 'processed'}


# Flask webhook handler
from flask import Flask, request, jsonify

app = Flask(__name__)
gateway = ScriptsPaymentGateway(
    api_url='https://scripts-api.selfservice.io.vn/api/v1',
    jwt_token=os.getenv('SCRIPTS_JWT_TOKEN'),
    webhook_secret=os.getenv('SCRIPTS_WEBHOOK_SECRET')
)

@app.route('/webhooks/scripts', methods=['POST'])
def handle_webhook():
  signature = request.headers.get('Scripts-Signature')
    payload = request.get_data(as_text=True)

    try:
        result = gateway.handle_webhook(payload, signature)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"Error processing webhook: {e}")
        return jsonify({'error': 'Processing failed'}), 500
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Code | Meaning | Action |
|--------|------|---------|--------|
| 200 | OK | Request succeeded | Use returned data |
| 201 | Created | Resource created | Use new resource ID |
| 400 | Bad Request | Invalid input | Check request format |
| 401 | Unauthorized | Invalid/missing JWT | Refresh token, login again |
| 403 | Forbidden | Insufficient permissions | Check merchant account |
| 404 | Not Found | Resource doesn't exist | Verify resource ID |
| 422 | Unprocessable | Validation failed | Check field values |
| 429 | Too Many Requests | Rate limit exceeded | Wait before retrying |
| 500 | Server Error | Internal error | Retry after delay |
| 503 | Service Unavailable | Maintenance | Check status page |

### Error Response Format

```json
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "Insufficient balance for this transaction",
  "details": {
    "available": 100000,
    "required": 500000
  },
  "requestId": "req_abc123",
  "timestamp": "2024-03-11T10:15:30Z"
}
```

### Error Handling in Code

```javascript
async function safeCheckoutCreation(orderData) {
  try {
    const response = await fetch(`${SCRIPTS_API}/checkout/create`, {
      method: 'POST',
      body: JSON.stringify(orderData),
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();

      // Handle specific errors
      switch (error.error) {
        case 'INVALID_AMOUNT':
          console.error('Amount must be positive');
          break;

        case 'DUPLICATE_ORDER_ID':
          console.error('Order already exists, use different ID');
          break;

        case 'INSUFFICIENT_BALANCE':
          console.error('Merchant balance too low');
          break;

        case 'RATE_LIMIT_EXCEEDED':
          // Exponential backoff
          await delay(5000);
          return safeCheckoutCreation(orderData);

        case 'INVALID_REDIRECT_URL':
          console.error('Redirect URL must be HTTPS');
          break;

        default:
          console.error('Checkout failed:', error.message);
      }

      throw new Error(error.message);
    }

    return await response.json();

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Security Best Practices

### 1. Never Expose Secret Keys

❌ **WRONG:**
```javascript
// DON'T do this
const response = await fetch(`${SCRIPTS_API}/checkout/create`, {
  headers: {
    'Authorization': `Bearer ${sk_live_secret_key}`  // ❌ EXPOSED!
  }
});
```

✅ **CORRECT:**
```javascript
// DO this
const response = await fetch('/api/checkout', {  // Your backend endpoint
  method: 'POST',
  body: JSON.stringify(checkoutData)
  // Backend handles secret key securely
});
```

### 2. Use HTTPS Only

- All traffic must be HTTPS
- Enable HSTS headers
- Use security headers:

```javascript
// Express middleware
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 3. Verify Webhook Signatures ALWAYS

```javascript
// ✅ Always verify - never skip this
function processWebhook(req) {
  const signature = req.headers['scripts-signature'];
  const payload = req.rawBody;

  const valid = verifyWebhookSignature(payload, signature, SECRET);
  if (!valid) {
    throw new Error('Invalid webhook signature - REJECT');
  }

  // Safe to process
  processPaymentEvent(JSON.parse(payload));
}
```

### 4. Implement Rate Limiting

```javascript
// Rate limiter middleware
const rateLimit = require('express-rate-limit');

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 100, // aligns with Scripts default global throttling
  message: 'Too many checkout requests from this IP'
});

app.post('/api/checkout', checkoutLimiter, (req, res) => {
  // Handle checkout
});
```

### 5. Sanitize Input

```javascript
const validator = require('validator');

function validateCheckoutInput(data) {
  const errors = [];

  if (!validator.isInt(data.amount, { min: 1000, max: 100000000 })) {
    errors.push('Invalid amount');
  }

  if (!validator.isLength(data.description, { min: 5, max: 200 })) {
    errors.push('Description must be 5-200 characters');
  }

  if (!validator.isURL(data.redirectUrl)) {
    errors.push('Invalid redirect URL');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return true;
}
```

### 6. Implement CORS Properly

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL, // Only allow your frontend
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 7. Log Security Events

```javascript
function securityLog(event, severity = 'INFO') {
  const log = {
    timestamp: new Date().toISOString(),
    severity,
    event,
    ip: req.ip,
    userId: req.user?.id
  };

  // Store in secure logging service
  console.log(JSON.stringify(log));
  // Could also send to logging service like Sentry, LogRocket, etc.
}

// Usage
securityLog({
  type: 'INVALID_WEBHOOK_SIGNATURE',
  ip: req.ip,
  signature: signature.substring(0, 10) + '...'
}, 'WARNING');
```

---

## Troubleshooting

### Issue: "401 Unauthorized"

**Cause:** Invalid or expired JWT token

**Solution:**
```javascript
// Refresh the JWT token
const { data } = await supabase.auth.refreshSession();
const newToken = data.session?.access_token;

// Retry with new token
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${newToken}` }
});
```

---

### Issue: "422 Validation Error"

**Cause:** Invalid input data

**Example error:**
```json
{
  "error": "INVALID_AMOUNT",
  "message": "Amount must be between 1000 and 100000000"
}
```

**Solution:**
- Check request body format
- Validate all required fields
- Ensure correct data types (amount as number, not string)
- Check field lengths and value ranges

---

### Issue: Webhook Not Received

**Causes & Solutions:**

1. **Webhook URL inaccessible**
   ```bash
   # Test with curl
   curl -X POST https://your-domain.com/webhooks/scripts \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Endpoint not accepting POST**
   ```javascript
   // Ensure endpoint accepts POST only
   app.post('/webhooks/scripts', (req, res) => {
     res.json({ received: true });
   });
   ```

3. **Firewall blocking requests**
   - Allow IP: `103.x.x.x - 103.x.x.x` (Scripts API servers)
   - Check firewall/WAF rules

4. **Endpoint returns non-200 status**
   - Must return HTTP 200, 201, or 202
   - Scripts will retry if status 5xx

---

### Issue: Duplicate Webhook Processing

**Cause:** Network issues cause duplicate delivery

**Solution:** Make webhook handler idempotent

```javascript
async function handlePaymentSuccess(data) {
  // Check if already processed
  const existingEvent = await WebhookEvent.findOne({
    eventId: data.id,
    type: 'payment_intent.succeeded'
  });

  if (existingEvent) {
    console.log('Event already processed, skipping');
    return;
  }

  // Process payment
  await Order.updateOne(
    { merchantOrderId: data.merchantOrderId },
    { status: 'paid', transactionId: data.id }
  );

  // Record event as processed
  await WebhookEvent.create({
    eventId: data.id,
    type: 'payment_intent.succeeded',
    processedAt: new Date()
  });
}
```

---

### Issue: "RATE_LIMIT_EXCEEDED"

**Cause:** Too many requests to API

**Solution:**

```javascript
const BASE_DELAY = 1000; // 1 second
let retryCount = 0;

async function exponentialBackoffRetry(fn, maxRetries = 5) {
  try {
    return await fn();
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED' && retryCount < maxRetries) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, delay));
      return exponentialBackoffRetry(fn, maxRetries);
    }
    throw error;
  }
}

// Usage
await exponentialBackoffRetry(() => createCheckout(orderData));
```

---

### Issue: "INVALID_REDIRECT_URL"

**Cause:** Redirect URL not HTTPS or malformed

**Solution:**
```javascript
// ✅ Valid URLs
'https://mystore.com/success'
'https://mystore.com/success?orderId=123'

// ❌ Invalid URLs
'http://mystore.com/success'  // Not HTTPS
'mystore.com/success'  // Missing protocol
'https://192.168.1.1/success'  // Not public domain
```

---

### Issue: Webhook Signature Verification Always Fails

**Cause:** Using wrong payload string for hashing

**Solution:** Use the RAW body + `t` value from `Scripts-Signature`

```javascript
// ❌ WRONG - signs only raw body
const rawBody = req.body.toString();
const wrongHash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

// ✅ CORRECT - signs `${t}.${rawBody}`
const signatureHeader = req.headers['scripts-signature'];
const parts = Object.fromEntries(signatureHeader.split(',').map(v => v.split('=')));
const signedPayload = `${parts.t}.${rawBody}`;
const hash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
const valid = hash === parts.v1;
```

Express middleware:
```javascript
app.use('/webhooks', express.raw({ type: 'application/json' }));
```

---

### Issue: "Checkout session expired"

**Cause:** Customer took too long to complete payment

**Default expiry:** 30 minutes

**Solution:**
- Notify customer early
- Don't make checkout URLs valid for extended periods
- Implement timeout countdown in UI

```javascript
// Show warning when expiring soon
useEffect(() => {
  const now = Date.now();
  const expiresAt = new Date(checkout.expiresAt).getTime();
  const timeLeft = expiresAt - now;

  if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
    setWarning('Checkout expires soon. Please complete payment.');
  }
}, [checkout]);
```

---

## Monitoring & Logging

### Best Practices

1. **Log all critical operations:**
   ```javascript
   logger.info('Checkout created', {
     checkoutId,
     amount,
     merchantId,
     timestamp: new Date()
   });
   ```

2. **Monitor error rates:**
   ```javascript
   // Track failed webhooks
   if (webhookProcessingFailed) {
     errorMetrics.record('webhook_failure', {
      eventType: event.event,
       error: error.message
     });
   }
   ```

3. **Set up alerts for:**
   - Webhook delivery failures
   - High error rates (>5%)
   - Rate limiting triggers
   - Authentication failures

---

## API Rate Limits

| Scope | Rate | Period |
|-------|------|--------|
| Global API (all routes, per client) | 100 | Per 60 seconds |

Hitting rate limits returns **HTTP 429** with retry-after header.

---

## Support & Additional Resources

### Debug Merchant Logs with AI
1. Dashboard → Developers → AI Debugger
2. Paste recent logs or error messages
3. Get AI-powered explanations and solutions

### API Documentation Dashboard
- Full endpoint reference: `https://scripts-api.selfservice.io.vn/docs`
- Interactive API explorer
- Live API testing

### Contact Support
- Email: `support@scripts.vn`
- Response time: 24 hours (business days)
- Include: merchant ID, order ID, webhook event ID

---

## Changelog

### Version 1.0 (March 11, 2026)
- ✅ Initial release
- ✅ Merchant endpoints
- ✅ Payment checkout flow
- ✅ Webhook integration
- ✅ Sandbox testing
- ✅ Documentation

---

## License & Usage

**For Internal Use Only**
- This document is confidential
- Use for integrating Scripts into your systems
- Do not distribute to external parties
- Update as Scripts platform evolves

---

**Document prepared for:** Integration Partner  
**Created:** March 11, 2026  
**Version:** 1.0 Production  
