# Bablo Hub Premium Library — rollout status

## Price rule
- Notes pack: ₦500 one-time per course.
- Flashcards deck: ₦500 one-time per course.
- No recurring subscription.
- Programme total = sum of published Notes and Flashcards packs available to that programme.
- Packs not yet published are not charged.

## Current published premium inventory
| Course | Notes | Flashcards |
|---|---:|---:|
| BIO 101 | Yes | No |
| CHM 101 | Yes | Yes |
| AGR 101 | Yes | Yes |
| PHY 101 | Yes | Yes |
| MTH 101 | Yes | Yes |
| MLS 101 | Yes | Yes |

Each resource pack costs ₦500.

## Current programme totals
- MBBS: 9 packs = ₦4,500 (BIO 1; CHM 2; PHY 2; MTH 2; AGR 2).
- Medical Laboratory Science: 9 packs = ₦4,500 (BIO 1; CHM 2; PHY 2; MTH 2; MLS 2).
- Nursing, Nutrition and Dietetics, Physiology, Anatomy, Biochemistry, and Other CoHES programme: 7 packs = ₦3,500 (BIO 1; CHM 2; PHY 2; MTH 2).
- Doctor of Physiotherapy (DPT) and Public Health: 5 packs = ₦2,500 (BIO 1; CHM 2; PHY 2).

These are based on the currently published resource inventory and the existing programme-course map. The app calculates the displayed totals from its loaded content.

## Backend foundation now installed
- Server-owned catalogue with fixed ₦500 (50,000 kobo) pack prices.
- Pending order and order-item tables.
- Entitlements table with unique ownership per account/course/resource type.
- Session-validated order creation RPC; guest accounts are rejected.
- Session-validated entitlement lookup RPC.
- Paid-order trigger grants entitlements only when a trusted server process changes an order to `paid`.
- Direct client table access is revoked and RLS is enabled.
- Duplicate items, unavailable products, wrong-programme packs, already-owned packs and excessive order creation are rejected.

## Deliberately not activated yet
The Notes and Flashcards content is still included in public app assets. Anyone technically able to inspect downloaded JavaScript can retrieve it, so a front-end premium badge or hidden button is not real access control. Do not collect money for these packs until the learning content is moved out of public assets and served only after a server-verified entitlement check.

Payment checkout is also not active. No payment provider secret is configured in Vercel or Supabase. Before enabling checkout:
1. Choose and configure a supported payment provider.
2. Store the secret key only in Supabase Edge Function secrets; never expose it in browser code or paste it into chat.
3. Create checkout sessions server-side using the pending order reference and amount from the database.
4. Verify webhook signatures server-side; never trust a browser redirect or client-supplied "paid" flag.
5. Make webhook handling idempotent and update only the matching pending order after provider-side transaction verification.
6. Test successful, failed, cancelled, duplicate-webhook and refund flows in provider test mode.
7. Move Notes and Flashcards content behind entitlement-checked server delivery before charging users.

No payment credentials have been added, and no real payment has been collected.
