# Task / To-do — FA RENT CAR

Penanda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` diblokir

Urutan fase mengikuti `docs/prd.md` §13. Setiap task selesai harus punya: kode, test (jika logika), dan update dokumen jika perilaku berubah.

---

## Fase 0 — Fondasi

### 0.1 Monorepo & tooling
- [ ] Inisialisasi pnpm workspace + Turborepo (`apps/*`, `packages/*`)
- [ ] Konfigurasi TypeScript strict, ESLint, Prettier bersama
- [ ] `.editorconfig`, `.gitignore`, `.env.example`
- [ ] Docker Compose dev: PostgreSQL 16, Redis, MinIO
- [ ] Script: `dev`, `build`, `lint`, `test`, `db:migrate`, `db:seed`
- [ ] `.hoplite/settings.json` (setup & run script) agar preview berjalan
- [ ] GitHub Actions: lint + test + build pada PR

### 0.2 Database (`packages/db`)
- [ ] Prisma schema lengkap sesuai PRD §12
- [ ] Enum: status booking, dokumen, pembayaran, peran, status mobil
- [ ] Constraint: unik plat, unik nomor invoice, index tanggal booking
- [ ] Migrasi awal
- [ ] Seed: superadmin, 5 mobil contoh, tarif, pengaturan default

### 0.3 Shared (`packages/shared`)
- [ ] Zod schema untuk semua DTO API
- [ ] Util harga: kombinasi harian/mingguan/bulanan, weekend, sopir, promo (pure function + unit test)
- [ ] Util tanggal WIB, format Rupiah
- [ ] Konstanta: durasi hold default, batas ukuran file, dsb

### 0.4 API skeleton (`apps/api`)
- [ ] NestJS bootstrap, config module, validasi global (Zod pipe)
- [ ] Prisma service, health check
- [ ] Auth admin: login, refresh, logout, hash bcrypt
- [ ] RBAC guard: `staff`, `superadmin`
- [ ] Modul storage: upload signed URL, akses privat
- [ ] Modul audit log (interceptor untuk aksi sensitif)
- [ ] BullMQ + Redis: queue dasar, scheduler
- [ ] Error format seragam, logging, rate limit

### 0.5 Web skeleton
- [ ] `apps/web-admin`: Next.js, layout, login page, guard route
- [ ] `apps/web-customer`: Next.js, layout dasar
- [ ] Client API bertipe (fetch wrapper + Zod)

---

## Fase 1 — Admin MVP

### 1.1 Armada
- [ ] API CRUD vehicle + foto (multi upload, urutan)
- [ ] API tarif per mobil (harian/mingguan/bulanan/sopir/overtime/keterlambatan)
- [ ] API pricing rules (weekend/musim liburan)
- [ ] API ketersediaan: `GET /availability?from&to` (anti double-booking, buffer)
- [ ] UI daftar mobil, form tambah/ubah, galeri foto, status
- [ ] UI tarif per mobil
- [ ] Kalender ketersediaan (per mobil & gabungan)

### 1.2 Booking manual
- [ ] API create booking (multi item, sopir per item) dengan transaksi & lock ketersediaan
- [ ] Generate nomor invoice, snapshot harga
- [ ] Hold expiry job (2 jam, dapat diatur), perpanjang hold
- [ ] API daftar & detail booking, filter
- [ ] UI booking manual (pilih mobil, tanggal, customer)
- [ ] UI daftar booking + detail + timeline

### 1.3 Verifikasi & pembayaran
- [ ] API dokumen: lihat (signed URL), setujui/tolak + alasan
- [ ] API pembayaran: input nominal, tanggal, bank, upload bukti; validasi vs total invoice
- [ ] Transisi status otomatis → `Aktif` bila dokumen OK + lunas
- [ ] UI layar verifikasi + pembayaran satu halaman
- [ ] Pembatalan booking (tanpa refund dulu)

### 1.4 Invoice
- [ ] Template PDF invoice (kop, rincian, total, rekening, syarat)
- [ ] Revisi invoice (versi baru saat booking diubah), simpan semua versi
- [ ] Perubahan booking: perpanjangan, ganti mobil, tambah/kurang mobil
- [ ] UI riwayat invoice & unduh

### 1.5 Pengaturan & staff
- [ ] Pengaturan usaha, rekening, durasi hold, buffer, template WA
- [ ] Manajemen staff (superadmin)
- [ ] UI audit log

---

## Fase 2 — Customer MVP

> Diblokir sampai referensi UI/UX diterima (PRD §15 #1)

### 2.1 Publik
- [!] Landing page
- [ ] API publik: daftar mobil tersedia + filter + urut
- [ ] Halaman pencarian & katalog + filter
- [ ] Detail mobil (galeri, spesifikasi, tarif, kalender)
- [ ] Estimasi harga realtime (pakai util shared)

### 2.2 Booking guest
- [ ] Keranjang multi-mobil (state client, persist localStorage)
- [ ] Form data penyewa + validasi
- [ ] Upload KTP/SIM langsung ke storage via signed URL
- [ ] Kode promo (validasi API)
- [ ] Submit booking → invoice → token portal
- [ ] Halaman sukses: countdown, rekening, salin, tombol WhatsApp berisi pesan otomatis

### 2.3 Portal status
- [ ] API portal berbasis token (read-only + aksi terbatas)
- [ ] Halaman status: timeline, dokumen, pembayaran, unduh invoice
- [ ] Unggah ulang dokumen
- [ ] Ajukan perpanjangan/perubahan → masuk antrean admin
- [ ] Info pengambilan & peta
- [ ] Rating & ulasan setelah selesai

### 2.4 Kualitas
- [ ] E2E Playwright: alur booking penuh (mobile & desktop)
- [ ] Uji konkuren anti double-booking
- [ ] SEO dasar (meta, OG, sitemap)

---

## Fase 3 — Operasional

### 3.1 Sopir
- [ ] CRUD sopir + dokumen + tarif
- [ ] Penugasan ke booking item, cek bentrok
- [ ] Jadwal sopir, riwayat, penilaian

### 3.2 Serah-terima digital
- [ ] Form checkout/checkin: checklist, odometer, BBM, foto multi, diagram kerusakan
- [ ] Tanda tangan customer di layar
- [ ] Berita acara PDF → portal customer
- [ ] Hitung biaya tambahan otomatis → invoice revisi
- [ ] Status booking → `Selesai`

### 3.3 Keuangan
- [ ] Refund: pengajuan → approval superadmin → bukti
- [ ] Pengeluaran operasional (kategori, bukti)
- [ ] Kas & shift staff
- [ ] Laporan: pendapatan, pengeluaran, laba, per mobil, per periode; ekspor PDF/Excel

### 3.4 CRM & promo
- [ ] Profil customer otomatis, label (baru/langganan/VIP/blacklist), catatan
- [ ] Promo: kode, jenis, kuota, masa berlaku, batasan
- [ ] Aturan harga dinamis (tanggal khusus)

### 3.5 Dashboard lengkap
- [ ] Kartu statistik + growth indicator
- [ ] Grafik booking & pendapatan
- [ ] Monitoring operasional hari ini
- [ ] Analitik armada, heatmap
- [ ] Alert (keterlambatan, servis, dokumen)
- [ ] Filter tanggal, susun widget, ekspor

### 3.6 Armada lanjutan
- [ ] Riwayat servis, pengingat servis/pajak/STNK/asuransi
- [ ] Dokumen kendaraan
- [ ] Import/export Excel armada & booking

### 3.7 Sistem
- [ ] Notifikasi internal (in-app)
- [ ] Multi-level approval umum (hapus mobil/booking, ubah tarif)
- [ ] PWA admin (manifest, service worker, ikon)
- [ ] Retensi & penghapusan otomatis dokumen KTP/SIM

---

## Fase 4 — GPS

> Diblokir sampai vendor/perangkat ditentukan (PRD §15 #2)

- [!] Riset protokol perangkat & API vendor
- [ ] Ingest posisi (webhook/polling)
- [ ] Peta realtime per mobil
- [ ] Histori perjalanan per booking
- [ ] Geofence & alert

---

## Deploy & operasi

- [ ] Dockerfile per app, Compose produksi
- [ ] Backup DB harian otomatis
- [ ] Monitoring & log
- [ ] Domain, HTTPS
- [ ] Panduan penggunaan admin (singkat)

---

## Catatan keputusan

| Tanggal | Keputusan |
|---|---|
| 2026-09-13 | Deposit/jaminan dihapus; bayar 100% di muka |
| 2026-09-13 | Ambil/kembali hanya di kantor |
| 2026-09-13 | Customer tanpa akun; portal via token |
| 2026-09-13 | Stack: NestJS + Next.js + Prisma + PostgreSQL |
| 2026-09-13 | Contoh desain iOS-style putih/biru ditolak; menunggu referensi UI dari user |
