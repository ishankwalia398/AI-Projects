# QA Sherlock

Checkout rejects a valid 20% promotion at the inclusive expiry boundary.

## Probable cause
Probable off-by-one comparison in PromotionValidator: now >= expiresAt rejects equality, contrary to the inclusive requirement.

- The contract accepts a promotion when now equals expiresAt. [REQ-001]
- The failed checkout recorded equal timestamps and PROMO_EXPIRED. [LOG-001]
- Release 2.14 introduced the >= comparison; a previous coupon bug used the same boundary pattern. [SRC-001, REL-001, BUG-001]