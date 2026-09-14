# FA RENT CAR — Sistem Rental Mobil

Sistem rental mobil CV FA RENT CAR (Cirebon): Web Customer, Web Admin, satu backend API, PostgreSQL.

## Dokumen

- [docs/prd.md](docs/prd.md) — Product Requirements Document
- [docs/design.md](docs/design.md) — Sistem desain (token, komponen)
- [docs/desainuiux.md](docs/desainuiux.md) — Blueprint UI/UX per layar (wajib diikuti agar hasil sama dengan referensi)
- [docs/task.md](docs/task.md) — Daftar task per fase
- [docs/rules.md](docs/rules.md) — Aturan pengembangan (wajib dibaca sebelum coding)

## Status implementasi

Irisan pertama **Fase 0 — Fondasi** menyediakan monorepo, migrasi dan seed, kontrak API bertipe,
autentikasi admin nyata, RBAC, audit append-only, storage privat, serta queue/scheduler dasar.
Web admin memiliki login, dashboard fondasi, daftar armada baca-saja dengan pencarian, status
layanan khusus superadmin, profil, dan logout. Web customer menampilkan informasi usaha dan
kontak resmi; **katalog, booking, invoice, pembayaran, upload identitas, dan portal tamu belum
diaktifkan**. Tombol fase berikutnya dinonaktifkan, bukan simulasi transaksi.

Lihat [task](docs/task.md) untuk status parsial yang masih terbuka dan
[ADR fondasi](docs/adr/0001-foundation-slice.md) untuk batas lingkup.

## Menjalankan lokal (6 langkah)

Prasyarat: **Node.js 24**, **pnpm 10.26.0**, Git, dan Docker Compose v2 untuk layanan pendukung.
Tidak diperlukan akun cloud. Gunakan database lokal kosong, bukan database produksi/shared.

1. Clone repository dan masuk ke direktori proyek.
2. Pilih layanan Compose: `export FA_SERVICES_MODE=compose`.
3. Jalankan `pnpm run setup`. Script membuat `.env` privat dengan secret acak bila belum ada,
   menjalankan PostgreSQL 16/Redis 7/MinIO, menginstal lockfile, menghasilkan Prisma Client,
   menerapkan migrasi, melakukan seed idempotent, dan menyiapkan bucket privat.
4. Jalankan `pnpm dev`; biarkan proses ini berjalan.
5. Buka admin di `http://localhost:3000`, customer di `http://localhost:3001`, dan dokumentasi API
   di `http://localhost:4000/api/docs`.
6. Masuk memakai `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` dari `.env` lokal Anda. Password
   dibuat acak saat setup; jangan membagikan `.env`, password, cookie, atau token ke chat/PR.

`Ctrl+C` menghentikan aplikasi; `pnpm services:stop` menghentikan layanan tanpa menghapus data.
`pnpm services:status` memeriksa layanan. Setup ulang tidak mengganti secret, password/peran admin
yang sudah ada, atau kendaraan yang telah diedit. `SEED_DEMO_DATA=true` hanya menambahkan lima
kendaraan sintetis berlabel **FA Demo** dan **tarif contoh** tanpa foto/transaksi pelanggan.
Gunakan `false` untuk lingkungan baru tanpa data contoh; perubahan flag tidak menghapus data lama.

Image MinIO Compose memakai registry resmi `quay.io/minio/minio` dengan rilis yang sama
seperti mode native, dikunci ke digest multi-arsitektur. Tidak diperlukan login Docker Hub;
health check, volume persisten, dan bucket privat tetap digunakan.

Setup, `dev`, `db:migrate`, dan `db:seed` di root ditujukan untuk pengembangan: guard menolak database
non-loopback dan `NODE_ENV=production` sebelum mutasi. Migrasi deployment eksplisit tetap tersedia
melalui `pnpm --filter @fa/db migrate:deploy` dengan environment yang dikelola operator; jangan
menjalankan seed demo atau setup development pada produksi. Compose memakai identitas project
unik dari path checkout, sehingga perintah stop/volume tidak berbagi namespace antar-checkout.
Port lokal tetap sama; hentikan stack lama terlebih dahulu sebelum menjalankan checkout lain.

### Sandbox tanpa Docker

Jalankan `FA_SERVICES_MODE=native pnpm run setup`, lalu `FA_SERVICES_MODE=native pnpm dev`.
Mode native merupakan default script dan ditujukan untuk sandbox Linux x86-64. PostgreSQL 16
dan Redis harus sudah terpasang, atau installer memerlukan root serta apt Ubuntu 24.04. MinIO
diunduh dari rilis upstream yang dikunci versi/checksum. Data, PID, log, dan binary lokal berada
di `.hoplite/native` yang diabaikan Git; layanan hanya mendengarkan loopback. Script menolak
mengambil alih port yang dipakai layanan lain, membuktikan PID/binary/data directory milik checkout
sebelum memakai ulang layanan, dan tidak menjalankan reset data.

Konfigurasi Preview tersimpan di `.hoplite/settings.json`: admin 3000, customer 3001, API 4000.
Setup/run memakai script yang sama dengan pengembangan lokal; mode native tidak mengganti
PostgreSQL/Redis/storage dengan mock.

## Perintah utama

| Perintah                          | Kegunaan                                                              |
| --------------------------------- | --------------------------------------------------------------------- |
| `pnpm lint` / `pnpm format:check` | ESLint tanpa warning / konsistensi Prettier                           |
| `pnpm typecheck`                  | TypeScript strict seluruh workspace                                   |
| `pnpm test`                       | Unit test kontrak, harga, formatter, konfigurasi, seed, dan helper UI |
| `pnpm build`                      | Build produksi API dan kedua aplikasi Next.js                         |
| `pnpm db:generate`                | Generate Prisma Client                                                |
| `pnpm db:migrate`                 | Terapkan migrasi versioned yang belum berjalan                        |
| `pnpm db:seed`                    | Seed lokal idempotent dari `.env`                                     |
| `pnpm test:integration`           | API/security dengan PostgreSQL, Redis, dan S3 nyata yang terisolasi   |
| `pnpm test:e2e`                   | Interaksi browser Chromium pada 1440, 390, dan 360 px                 |

Sebelum integration/E2E, jalankan setup dan pastikan layanan pendukung aktif. Instal browser
sekali dengan `pnpm exec playwright install --with-deps chromium`.

Integration test membuat schema PostgreSQL, queue Redis, dan bucket S3 acak per eksekusi, lalu
membersihkannya dalam `finally`; URL layanan nonlokal ditolak. Browser test memakai akun dan
armada seed lokal secara eksplisit, memulai API terkompilasi serta kedua web jika belum berjalan,
dan menutup server miliknya setelah selesai. Jangan arahkan pengujian ke data operasional nyata.

`CAPTURE_UI_PROOF=true pnpm test:e2e` menghasilkan screenshot desktop 1280 px dan mobile
di `.hoplite/artifacts` setelah memastikan seluruh armada merupakan data sintetis. Artefak
meliputi dashboard, login, armada, status sistem, profil (email disamarkan), dan halaman customer;
viewport tes dipulihkan setelah capture. Artefak browser, credential, dan build tidak masuk Git.
GitHub Actions menjalankan formatting, lint,
typecheck, unit test, build, integration, dan E2E pada PR.

## Struktur dan keamanan

- `apps/api`: NestJS, prefix `/api/v1`, validasi Zod dan respons error seragam.
- `apps/web-admin`, `apps/web-customer`: Next.js App Router; browser mengakses API melalui
  rewrite same-origin. `API_INTERNAL_URL` hanya digunakan server.
- `packages/db`: Prisma schema/migration, seed, dan client server-only.
- `packages/shared`: schema DTO, client API tervalidasi, formatter WIB/Rupiah, optimizer harga
  pure. Ukuran paket bulanan, pembulatan sebagian hari, dan prioritas aturan harga masih perlu
  keputusan bisnis sebelum dihubungkan ke booking.
- `packages/ui`: token Tailwind, font Inter/Material Symbols self-hosted, komponen bersama.

Detail cookie HttpOnly, CSRF, rotasi/replay refresh, pencabutan sesi, batas signed URL, dan audit
transaksional tercatat dalam [ADR keamanan](docs/adr/0002-admin-session-security.md). Produksi
memerlukan HTTPS, secret terkelola, role database minimal, backup, serta limiter bersama sebelum
scaling multi-instance. Fondasi ini **belum merupakan deployment produksi atau PWA lengkap**.
