# FA RENT CAR — Sistem Rental Mobil

Sistem rental mobil CV FA RENT CAR (Cirebon), dikembangkan bertahap sesuai
[PRD](docs/prd.md), [aturan](docs/rules.md), [desain](docs/design.md),
[blueprint UI/UX](docs/desainuiux.md), dan [task](docs/task.md).

## Status lapisan fondasi

Lapisan ini menyediakan pnpm/Turborepo, TypeScript strict, lint/format/CI, bootstrap layanan
lokal yang aman, dan `packages/shared`: kontrak Zod, client API tervalidasi, formatter
Rupiah/WIB, serta optimizer paket harga eksplisit. `packages/db` menyediakan schema admin,
sesi, audit append-only, armada/foto/tarif, dan pengaturan; migrasi dan seed idempotent tersedia.
API admin NestJS kini menyediakan autentikasi, RBAC, inspeksi fondasi, storage privat, dan queue
dasar. Kedua web dikirim pada PR lanjutan dalam stack yang sama. **Belum ada UI login atau
booking pada revisi ini.** Lihat [ADR 0001](docs/adr/0001-foundation-slice.md).

## Menjalankan dan memverifikasi lapisan ini

Prasyarat: Node.js 24 dan pnpm 10.26.0.

1. Clone repository dan masuk ke direktori proyek.
2. Jalankan `pnpm install --frozen-lockfile`.
3. Jalankan `pnpm lint && pnpm format:check && pnpm typecheck`.
4. Jalankan `pnpm test && pnpm build`.
5. Bila perlu layanan lokal, jalankan `node scripts/init-env.mjs`, lalu `pnpm services:up`.
6. Hentikan layanan tanpa menghapus data dengan `pnpm services:stop`.

Mode layanan default adalah native untuk sandbox Linux x86-64. PostgreSQL 16 dan Redis harus
tersedia; instalasi paket memerlukan root/apt Ubuntu 24.04. MinIO dikunci versi dan checksum.
Docker Compose v2 dapat dipilih lewat `FA_SERVICES_MODE=compose`. Compose memakai identitas
project unik per canonical path checkout; port lokal tetap sama dan tidak bisa dipakai dua
stack sekaligus. Native memverifikasi PID/binary/data directory sebelum memakai ulang layanan.

`.env` dibuat dengan secret acak dan tidak ditimpa. Jangan membagikan atau commit `.env`.
Setup/dev dan shortcut mutasi database root menolak database non-loopback serta mode produksi.
`pnpm run setup` menyiapkan database/seed serta bucket privat. `pnpm dev` untuk ketiga aplikasi
digunakan setelah lapisan web tersedia. Bootstrap tidak mereset data.

## Database lokal

Sesudah `.env` dan layanan lokal siap, jalankan `pnpm db:generate`, `pnpm db:migrate`, lalu
`pnpm db:seed`. Seed membuat admin dari environment dan lima kendaraan sintetis bila
`SEED_DEMO_DATA=true`. Data contoh bukan ketersediaan atau tarif bisnis terverifikasi; seed
ulang tidak menimpa password/peran admin maupun mobil yang telah diedit.

Model booking, invoice, pembayaran, dan operasional ditambahkan melalui migrasi fase berikutnya.
Relasi sesi/audit menggunakan waktu UTC `timestamptz`; nominal tarif integer rupiah. Trigger
database menolak update/delete/truncate audit. Jalur `pnpm --filter @fa/db migrate:deploy`
tetap tersedia secara eksplisit untuk operator deployment dengan environment terkelola.

## API fondasi

Setelah setup, jalankan `pnpm build`, lalu
`pnpm exec dotenv -e .env -- pnpm --filter @fa/api start`. Health check berada di
`http://localhost:4000/api/v1/health`; dokumentasi OpenAPI di `http://localhost:4000/api/docs`.
`pnpm test:integration` memakai schema PostgreSQL, queue Redis, dan bucket S3 acak per eksekusi;
endpoint layanan nonlokal ditolak dan resource test dibersihkan setelah eksekusi.

JWT access 15 menit serta refresh terotasi memakai cookie HttpOnly, CSRF, dan verifikasi sesi
database per request. Replay refresh mencabut seluruh keluarga sesi; logout dan penonaktifan
user langsung mencabut akses. Audit autentikasi ditulis dalam transaksi yang sama dengan sesi.
Detail batas keamanan tersedia pada [ADR 0002](docs/adr/0002-admin-session-security.md).

Belum ada endpoint booking, invoice, pembayaran, portal, atau upload identitas. Signed URL
storage hanya fondasi staging privat; validasi isi file dan otorisasi booking harus selesai
sebelum upload domain diaktifkan. Produksi memerlukan HTTPS serta limiter bersama sebelum
scaling multi-instance; revisi ini bukan deployment produksi.

## Batas kontrak harga

Optimizer menerima hari tertagih, ukuran paket, surcharge, sopir, dan promo secara eksplisit.
Semua uang integer rupiah; input tidak lengkap dan overflow ditolak. Ini bukan keputusan
bisnis bahwa satu bulan selalu 30 hari. Kebijakan durasi/pembulatan/prioritas harga harus
disepakati sebelum kalkulator dihubungkan ke booking dan snapshot invoice.
