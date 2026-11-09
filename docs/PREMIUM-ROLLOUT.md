# Bablo Hub Premium Library — rollout status

## Price rule
- Notes pack: ₦500 one-time per course.
- Flashcards deck: ₦500 one-time per course.
- No recurring subscription.
- Programme total = sum of published Notes and Flashcards packs available to that programme.
- Packs not yet published are not charged.

## Current published inventory
| Course | Notes | Flashcards |
|---|---:|---:|
| BIO 101 | Yes | No |
| CHM 101 | Yes | Yes |
| PHY 101 | Yes | Yes |
| AGR 101 | Yes | Yes |
| MTH 101 | Yes | Yes |
| MLS 101 | Yes | Yes |

## Current programme totals
- MBBS: 9 packs = ₦4,500.
- Nursing: 7 packs = ₦3,500.
- Nutrition and Dietetics: 7 packs = ₦3,500.
- Doctor of Physiotherapy (DPT): 5 packs = ₦2,500.
- Physiology: 7 packs = ₦3,500.
- Anatomy: 7 packs = ₦3,500.
- Biochemistry: 7 packs = ₦3,500.
- Medical Laboratory Science: 9 packs = ₦4,500.
- Public Health: 5 packs = ₦2,500.
- Other CoHES programme: 7 packs = ₦3,500.

These are one-time programme-pass estimates based on the currently published resources. The in-app pricing page recalculates from the live course inventory; packs not available to a programme are excluded.

## Backend foundation installed
- Server-owned catalogue with fixed ₦500 (50,000 kobo) pack prices.
- Pending order and order-item tables.
- Entitlements table with unique ownership per account/course/resource type.
- Session-validated order creation RPC; guest accounts are rejected.
- Server-side entitlement lookup RPC.
- Paid-order trigger grants entitlements only when a trusted server process changes an order to `paid`.
- Direct client table access is revoked and RLS is enabled.
- Duplicate items, unavailable products, wrong-programme packs, already-owned packs and excessive order creation are rejected.
- Server catalogue now includes the published BIO, CHM, PHY, AGR, MTH 101 and MLS 101 packs.

## Deliberately not activated yet
The current Notes and Flashcards data is embedded in the public app bundle. Anyone technically able to inspect the downloaded app can retrieve it, so a front-end premium badge or hidden button is not real access control. Do not collect money for these packs until the actual learning content is moved out of the public bundle and served only after a server-verified entitlement check.

Payment checkout is also not active. Before enabling it:
1. Choose and configure a supported payment provider (for Nigeria, a provider such as Paystack or Flutterwave can be evaluated).
2. Store the secret key only in Supabase Edge Function secrets.
3. Create checkout sessions server-side using the pending order reference and amount from the database.
4. Verify webhook signatures server-side; never trust a browser redirect or client-supplied "paid" flag.
5. Make webhook handling idempotent and update only the matching pending order after provider-side transaction verification.
6. Test successful, failed, cancelled, duplicate-webhook and refund flows with provider test mode.
7. Move Notes and Flashcards content behind entitlement-checked server delivery before charging users.

No payment credentials have been added, and no real payment has been collected. Payment-account setup and any live financial activity must be handled by an appropriately authorised adult/account holder.
