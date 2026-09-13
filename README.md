# FA RENT CAR — Sistem Rental Mobil

Sistem rental mobil CV FA RENT CAR (Cirebon), dikembangkan bertahap sesuai
[PRD](docs/prd.md), [aturan](docs/rules.md), [desain](docs/design.md),
[blueprint UI/UX](docs/desainuiux.md), dan [task](docs/task.md).

## Status lapisan fondasi

Lapisan ini menyediakan pnpm/Turborepo, TypeScript strict, lint/format/CI, bootstrap layanan
lokal yang aman, dan `packages/shared`: kontrak Zod, client API tervalidasi, formatter
Rupiah/WIB, serta optimizer paket harga eksplisit. Schema database, API admin, dan kedua web
dikirim pada PR lanjutan dalam stack yang sama. **Belum ada aplikasi login atau booking
pada revisi ini.** Lihat [ADR 0001](docs/adr/0001-foundation-slice.md) untuk batas lingkup.

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
Perintah setup aplikasi lengkap, migrasi, seed, dan `pnpm dev` baru digunakan setelah lapisan
DB/API/web tersedia. Bootstrap tidak mereset data.

## Batas kontrak harga

Optimizer menerima hari tertagih, ukuran paket, surcharge, sopir, dan promo secara eksplisit.
Semua uang integer rupiah; input tidak lengkap dan overflow ditolak. Ini bukan keputusan
bisnis bahwa satu bulan selalu 30 hari. Kebijakan durasi/pembulatan/prioritas harga harus
disepakati sebelum kalkulator dihubungkan ke booking dan snapshot invoice.
