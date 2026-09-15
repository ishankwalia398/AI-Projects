import { test, expect } from '@playwright/test';

// Requires the documented local fixture API; generated test is not executed automatically.
for (const offsetMs of [-1, 0, 1]) {
  test(`promotion expiry boundary ${offsetMs}ms`, async ({ request }) => {
    const seed = await request.post('/test-support/promotions', { data: { expiresAt: '2026-09-01T12:00:00.000Z' } });
    expect(seed.ok()).toBeTruthy();
    const { code } = await seed.json();
    const now = new Date(Date.parse('2026-09-01T12:00:00.000Z') + offsetMs).toISOString();
    const response = await request.post('/checkout/quote', { data: { code, subtotal: 10000, now } });
    expect(response.status()).toBe(offsetMs <= 0 ? 200 : 422);
    const body = await response.json();
    if (offsetMs <= 0) expect(body.total).toBe(8000);
    else expect(body.error).toBe('PROMO_EXPIRED');
  });
}
