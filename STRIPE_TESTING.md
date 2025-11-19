# Stripe Integration Testing Guide

This document outlines how to test the Stripe billing and payments integration.

## Prerequisites

1. **Stripe Account Setup**
   - Create a Stripe account at https://dashboard.stripe.com/register
   - Enable Payments (cards + wallets)
   - Enable Connect (Express accounts)

2. **Environment Variables**
   Add the following to your `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET_CORE=whsec_...
   STRIPE_WEBHOOK_SECRET_CONNECT=whsec_... (optional)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Database Migration**
   Run Prisma migrations to update the schema:
   ```bash
   npm run db:push
   ```

## Local Webhook Testing

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI if not already installed
# macOS: brew install stripe/stripe-cli/stripe
# Other platforms: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will display a webhook signing secret. Use this as `STRIPE_WEBHOOK_SECRET_CORE` in your `.env` file.

## Test Cards

Use Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0025 0000 3155`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Testing Flow A: Coach Onboarding

1. **Seed Coach Plans**
   First, create coach plans in your database with Stripe price IDs:
   ```sql
   -- Example: Create a plan with a Stripe recurring price ID
   INSERT INTO "CoachPlan" (id, name, description, "stripePriceId", "isActive")
   VALUES ('plan_1', 'Starter Plan', 'Basic coaching plan', 'price_xxxxx', true);
   ```

2. **Coach Signup Flow**
   - Coach signs up and creates a CoachProfile
   - Coach navigates to billing page
   - Coach selects a plan and clicks "Subscribe"
   - Should redirect to Stripe Checkout
   - Complete payment with test card
   - Should redirect back to success page
   - Verify `CoachSubscription` record is created with status `ACTIVE`

3. **Webhook Events to Test**
   - `checkout.session.completed` - Creates subscription record
   - `invoice.payment_succeeded` - Updates subscription status
   - `customer.subscription.updated` - Updates subscription details
   - `customer.subscription.deleted` - Cancels subscription

## Testing Flow B: Client Purchases

1. **Coach Setup**
   - Coach must have an active subscription (Flow A)
   - Coach must complete Connect onboarding:
     - Call `trpc.stripe.createConnectOnboardingLink.mutate()`
     - Complete Stripe Express onboarding
     - Verify `CoachProfile.stripeAccountId` is set

2. **Product/Program Creation**
   - Coach creates a product or program
   - Verify Stripe Product and Price are created
   - Check `Product.stripeProductId` and `Product.stripePriceId` are set

3. **Client Purchase Flow**
   - Client (or lead) views product/program
   - Client clicks "Purchase"
   - Should redirect to Stripe Checkout
   - Complete payment with test card
   - Should redirect back to success page
   - Verify:
     - `Order` record is created with status `PAID`
     - `platformFeeCents` and `coachAmountCents` are calculated correctly
     - For programs: `Enrollment` is created
     - For 1:1 products: `CoachingRelationship` is created

4. **Revenue Split Verification**
   - Check Stripe Dashboard → Connect → Accounts
   - Verify coach's connected account received the correct amount
   - Verify platform fee was deducted correctly
   - Example: $100 purchase with 20% platform fee
     - Platform receives: $20
     - Coach receives: $80

5. **Webhook Events to Test**
   - `checkout.session.completed` - Marks order as paid, creates enrollments/relationships
   - `payment_intent.payment_failed` - Marks order as canceled
   - `account.updated` - Updates coach account status

## Testing Recurring Products

For recurring products (subscriptions):

1. Create a product with `type: "RECURRING"`
2. Client purchases the product
3. Verify subscription is created in Stripe
4. Test subscription renewal:
   - Wait for next billing cycle (or use Stripe test clock)
   - Verify `invoice.payment_succeeded` webhook creates new order
   - Verify enrollment/relationship remains active

## Common Issues

1. **Webhook signature verification fails**
   - Ensure `STRIPE_WEBHOOK_SECRET_CORE` matches the secret from `stripe listen`
   - Verify webhook endpoint is receiving raw body (not parsed JSON)

2. **Connect account not ready**
   - Coach must complete Express onboarding
   - Check `charges_enabled` and `payouts_enabled` in Stripe Dashboard

3. **Price sync issues**
   - Stripe prices are immutable
   - When price changes, a new Stripe Price is created
   - Old prices remain valid for existing subscriptions

4. **Subscription status not updating**
   - Check webhook handlers are processing events correctly
   - Verify database updates are happening in webhook handlers

## Production Checklist

Before going live:

- [ ] Switch to live Stripe keys (`sk_live_...` and `pk_live_...`)
- [ ] Update webhook endpoints in Stripe Dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Test end-to-end with real (small) transactions
- [ ] Monitor webhook logs for errors
- [ ] Set up Stripe webhook monitoring/alerts
- [ ] Verify revenue splits are correct
- [ ] Test refund flow if applicable

## Monitoring

- **Stripe Dashboard**: Monitor payments, Connect accounts, webhooks
- **Application Logs**: Check webhook processing logs
- **Database**: Query `Order`, `CoachSubscription` tables for reconciliation

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Stripe Testing Guide](https://stripe.com/docs/testing)


