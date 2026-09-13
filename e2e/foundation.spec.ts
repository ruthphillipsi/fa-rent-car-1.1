import { expect, test, type Page } from '@playwright/test';
import { foundationResponseSchema } from '../packages/shared/src';

test.beforeAll(() => {
  const databaseUrl = process.env.DATABASE_URL;
  if (
    !databaseUrl ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(databaseUrl).hostname) ||
    process.env.SEED_DEMO_DATA !== 'true'
  ) {
    throw new Error('Browser tests require explicitly enabled, local synthetic seed data.');
  }
});

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
}

test('admin: guard, validation, real login, fleet search, refresh, services and logout', async ({
  page,
  context,
}, testInfo) => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error('Run the local setup before browser tests; seed credentials are missing.');
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/armada');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Masuk ke Operations Hub' })).toBeVisible();
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByText('Email wajib diisi.')).toBeVisible();
  await expect(page.getByText('Kata sandi wajib diisi.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeFocused();
  if (process.env.CAPTURE_UI_PROOF === 'true' && testInfo.project.name === 'desktop') {
    await page.screenshot({ path: '.hoplite/artifacts/admin-login.png', fullPage: true });
  }

  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Kata sandi').fill('not-the-correct-password');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Email atau kata sandi' })).toBeVisible();
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await expect(page.getByRole('heading', { name: 'Pusat Kendali Operasional' })).toBeVisible();
  await expectNoPageOverflow(page);
  const foundationResponse = await page.request.get('/api/v1/admin/foundation');
  expect(foundationResponse.ok()).toBe(true);
  const foundation = foundationResponseSchema.parse(await foundationResponse.json());
  expect(foundation.vehicles).toHaveLength(5);
  expect(
    foundation.vehicles.every((vehicle) => vehicle.isDemo && vehicle.plate.startsWith('DEMO-FA-')),
  ).toBe(true);
  if (process.env.CAPTURE_UI_PROOF === 'true') {
    if (testInfo.project.name === 'desktop')
      await page.setViewportSize({ width: 1280, height: 1000 });
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: `.hoplite/artifacts/admin-${testInfo.project.name}.png`,
      fullPage: testInfo.project.name === 'desktop',
    });
  }

  await page.getByRole('link', { name: /^(Manajemen Armada|Armada)$/ }).click();
  await expect(page).toHaveURL(/\/armada$/);
  await expect(page.getByText('Data contoh', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tambah mobil · Fase 1' })).toBeDisabled();
  await page.getByLabel('Cari armada', { exact: true }).fill('NO-MATCH-SYNTHETIC-TEST');
  await expect(page.getByRole('heading', { name: 'Armada tidak ditemukan' })).toBeVisible();
  await page.getByLabel('Cari armada', { exact: true }).fill('MPV Satu');
  await expect(page.getByText('1 dari 5 armada ditampilkan.')).toBeVisible();
  await page.getByLabel('Cari armada', { exact: true }).fill('');
  await expect(page.getByText('5 dari 5 armada ditampilkan.')).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(page.getByLabel('Cari armada', { exact: true })).toBeFocused();
  await expectNoPageOverflow(page);
  if (process.env.CAPTURE_UI_PROOF === 'true' && testInfo.project.name === 'desktop') {
    await page.screenshot({ path: '.hoplite/artifacts/admin-fleet.png', fullPage: true });
  }

  await page.getByRole('spinbutton', { name: 'Armada per halaman', exact: true }).fill('2');
  await page.getByRole('button', { name: 'Terapkan', exact: true }).click();
  await expect(page.getByText('Halaman 1 dari 3')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sebelumnya', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Berikutnya', exact: true }).click();
  await expect(page.getByText('Halaman 2 dari 3')).toBeVisible();
  await expect(page.getByText('Armada 3–4 dari 5 unit terdaftar.')).toBeVisible();
  await page.getByRole('link', { name: 'Berikutnya', exact: true }).click();
  await expect(page.getByText('Halaman 3 dari 3')).toBeVisible();
  await expect(page.getByText('1 dari 1 armada ditampilkan.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Berikutnya', exact: true })).toBeDisabled();
  await expectNoPageOverflow(page);

  // Unmount focus recovery before expiring cookies so it cannot race the two-tab barrier.
  await page.goto('about:blank');
  const secondTab = await context.newPage();
  secondTab.on('pageerror', (error) => pageErrors.push(error.message));
  const lockTab = await context.newPage();
  await lockTab.goto('/api/v1/health');
  // Hold the real browser lock until both tabs have received an actual API 401.
  await lockTab.evaluate(
    () =>
      new Promise<void>((ready, reject) => {
        void navigator.locks
          .request(
            'fa-admin-session-refresh',
            () =>
              new Promise<void>((release) => {
                window.addEventListener('release-session-refresh', () => release(), { once: true });
                ready();
              }),
          )
          .catch(reject);
      }),
  );
  let refreshRequests = 0;
  context.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/v1/admin/auth/refresh'
    )
      refreshRequests++;
  });
  await context.clearCookies({ name: 'fa_access' });
  expect((await context.cookies()).some((cookie) => cookie.name === 'fa_access')).toBe(false);
  await Promise.all(
    [page, secondTab].map(async (tab) => {
      const expiredSession = tab.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/api/v1/admin/auth/me' && response.status() === 401,
      );
      await tab.goto('/login');
      await expiredSession;
      await expect(tab.getByRole('status')).toContainText('Memulihkan sesi Anda…');
    }),
  );
  await expect
    .poll(() =>
      lockTab.evaluate(async () => {
        const { pending } = await navigator.locks.query();
        return pending?.filter((lock) => lock.name === 'fa-admin-session-refresh').length;
      }),
    )
    .toBe(2);
  expect(refreshRequests).toBe(0);
  await lockTab.evaluate(() => window.dispatchEvent(new Event('release-session-refresh')));
  await expect(page.getByRole('heading', { name: 'Pusat Kendali Operasional' })).toBeVisible();
  await expect(secondTab.getByRole('heading', { name: 'Pusat Kendali Operasional' })).toBeVisible();
  expect(refreshRequests).toBe(1);
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await secondTab.close();
  await lockTab.close();

  await page.keyboard.press('Control+k');
  await expect(page).toHaveURL(/\/armada#fleet-search$/);
  await expect(page.getByLabel('Cari armada', { exact: true })).toBeFocused();

  if (testInfo.project.name !== 'desktop') {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tutup menu' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
  }

  await page.goto('/sistem');
  await expect(page.getByRole('heading', { name: 'Status Sistem', exact: true })).toBeVisible();
  await expect(page.getByText('Terhubung', { exact: true })).toHaveCount(3);
  await expectNoPageOverflow(page);

  await page.goto('/profil');
  await page.getByRole('button', { name: 'Keluar', exact: true }).last().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Masuk ke Operations Hub' })).toBeVisible();
  const protectedResponse = await page.request.get('/api/v1/admin/foundation');
  expect(protectedResponse.status()).toBe(401);
  expect(pageErrors).toEqual([]);
});

test('customer: truthful foundation page, navigation and official contact', async ({
  page,
}, testInfo) => {
  await page.goto('http://127.0.0.1:3001');
  await expect(
    page.getByRole('heading', { name: 'Sewa Mobil Lepas Kunci & Dengan Sopir di Cirebon' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Katalog dan pemesanan online belum tersedia' }),
  ).toBeVisible();
  const whatsapp = page.getByRole('link', { name: /WhatsApp/ }).first();
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/6285224484488\?text=/);
  await expect(page.getByText(/Jl\. Pilang Raya No\.10/).first()).toBeVisible();
  await expectNoPageOverflow(page);
  if (process.env.CAPTURE_UI_PROOF === 'true') {
    if (testInfo.project.name === 'desktop')
      await page.setViewportSize({ width: 1280, height: 1000 });
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: `.hoplite/artifacts/customer-${testInfo.project.name}.png`,
      fullPage: testInfo.project.name === 'desktop',
    });
  }
});
