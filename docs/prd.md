# PRD — Sistem Rental Mobil FA RENT CAR

Versi: 1.0 · Tanggal: 13 September 2026 · Status: Draft disetujui untuk pengembangan

---

## 1. Ringkasan

FA RENT CAR (CV FA RENT CAR, Cirebon) membutuhkan sistem rental mobil berbasis web yang terdiri dari **Web Customer** untuk mencari dan memesan mobil serta **Web Admin** untuk mengelola seluruh operasional. Keduanya memakai **satu backend API dan satu database PostgreSQL**.

Tujuan utama:

1. Customer dapat booking sendiri tanpa akun, cepat, dan jelas biayanya.
2. Admin memegang kendali penuh atas verifikasi dokumen, konfirmasi pembayaran manual, armada, sopir, dan keuangan.
3. Semua transaksi dan perubahan tercatat rapi (invoice, revisi, audit log) untuk mencegah sengketa.
4. Dashboard memberikan gambaran bisnis harian hingga tahunan.

## 2. Profil bisnis

| Item | Nilai |
|---|---|
| Nama usaha | CV FA RENT CAR |
| Alamat | Jl. Pilang Raya No.10, Pilangsari, Kedawung, Cirebon |
| Jam operasional | 24 jam |
| WhatsApp | 0852-2448-4488 |
| Reputasi | 4.4★ dari 98 ulasan (Google/Facebook) |
| Model layanan | Sewa lepas kunci dan dengan sopir; ambil & kembali di kantor |

## 3. Ruang lingkup

### Termasuk (in scope)

- Web Customer responsive (desktop & mobile) — tanpa akun.
- Web Admin responsive + PWA (dapat dipasang di layar utama HP).
- Backend API tunggal + PostgreSQL.
- Booking multi-mobil dalam satu invoice.
- Verifikasi KTP/SIM oleh admin.
- Pembayaran manual (transfer bank), dikonfirmasi admin dengan input nominal dan upload bukti.
- Hold booking 2 jam, auto-expire.
- Invoice otomatis, revisi invoice, PDF.
- Serah-terima digital (checklist, foto, odometer, BBM).
- Manajemen sopir, promo, pengeluaran, CRM, laporan.
- Audit log dan multi-level approval.
- GPS/geofence (fase terakhir, setelah perangkat ditentukan).

### Tidak termasuk (out of scope)

- Payment gateway / pembayaran otomatis.
- Deposit / uang jaminan.
- Antar-jemput mobil ke lokasi customer.
- Aplikasi native iOS/Android.
- Akun/login untuk customer.

## 4. Pengguna & peran

| Peran | Deskripsi | Akses |
|---|---|---|
| **Customer (guest)** | Penyewa; tidak punya akun | Katalog, booking, portal status via tautan aman (token) |
| **Staff** | Operator harian | Booking, verifikasi, pembayaran, serah-terima, armada, sopir, CRM |
| **Superadmin** | Pemilik/manajer | Semua akses staff + tarif, refund, hapus data, kelola staff, approval, pengaturan |

## 5. Aturan bisnis inti

1. **Pembayaran 100% di muka**, tanpa deposit. Booking hanya aktif setelah lunas dan dokumen disetujui.
2. **Hold 2 jam** sejak invoice terbit. Lewat 2 jam tanpa konfirmasi → status `Kedaluwarsa`, mobil tersedia kembali. Admin dapat memperpanjang hold atas permintaan.
3. **Pengambilan & pengembalian hanya di kantor**.
4. **Dokumen wajib**: KTP + SIM A yang masih berlaku, diunggah customer, diverifikasi admin. Jika ditolak, customer dapat unggah ulang lewat portal.
5. **Satu booking bisa berisi banyak mobil**, tiap mobil bisa punya durasi dan opsi sopir berbeda.
6. **Harga dihitung dari tarif harian/mingguan/bulanan** dengan kombinasi terbaik, ditambah sopir, weekend/musim liburan, promo.
7. **Invoice adalah snapshot**: perubahan tarif setelah invoice terbit tidak mengubah invoice yang sudah ada. Perubahan booking menghasilkan **invoice revisi** (versi baru, versi lama tetap tersimpan).
8. **Refund hanya untuk pembatalan** dan wajib **approval superadmin**.
9. **Semua aksi sensitif dicatat** di audit log (aktor, waktu, nilai sebelum/sesudah).
10. **Sopir tidak boleh bentrok jadwal**; sistem menolak penugasan ganda.
11. **Mobil tidak boleh double-booking**; pengecekan ketersediaan memperhitungkan buffer waktu yang dapat diatur admin (default 0 jam).

## 6. Status booking

```
Menunggu Konfirmasi ──(dokumen OK + lunas)──▶ Aktif ──(serah-terima kembali)──▶ Selesai
        │                                        │
        ├──(2 jam habis)──▶ Kedaluwarsa           └──(batal + refund)──▶ Dibatalkan
        └──(customer/admin batal)──▶ Dibatalkan
```

Status dokumen: `Menunggu` → `Disetujui` / `Ditolak` (dapat unggah ulang).
Status pembayaran: `Belum Bayar` → `Lunas` → `Refund Sebagian` / `Refund Penuh`.

## 7. Fitur Web Customer

| # | Fitur | Detail |
|---|---|---|
| C1 | Landing page | Profil FA RENT CAR, keunggulan, lokasi, kontak, ulasan |
| C2 | Pencarian | Tanggal & jam ambil/kembali, opsi sopir; hanya menampilkan mobil tersedia |
| C3 | Katalog & filter | Harga, transmisi, kapasitas, tipe, bahan bakar, fasilitas; urutkan |
| C4 | Detail mobil | Galeri foto, spesifikasi, fasilitas, tabel tarif, kalender ketersediaan, ulasan |
| C5 | Keranjang multi-mobil | Tambah/hapus mobil, durasi dan sopir per mobil, estimasi total realtime |
| C6 | Form booking guest | Nama, WhatsApp, email opsional, alamat, no. KTP, catatan |
| C7 | Upload dokumen | KTP + SIM (JPG/PNG/PDF ≤ 5 MB), tersimpan privat |
| C8 | Kode promo | Validasi dan penerapan diskon |
| C9 | Invoice otomatis | Nomor invoice, rincian, total, PDF unduh |
| C10 | Countdown 2 jam | Batas waktu jelas, notifikasi kedaluwarsa |
| C11 | Instruksi bayar | Rekening bank, tombol salin, tombol kirim bukti via WhatsApp (pesan terisi otomatis) |
| C12 | Portal status | Tautan aman berbasis token: status booking, dokumen, pembayaran, timeline, unduh invoice |
| C13 | Unggah ulang dokumen | Jika ditolak admin |
| C14 | Permintaan perubahan | Ajukan perpanjangan / perubahan tanggal; diproses admin |
| C15 | Info pengambilan | Alamat kantor, peta, jam, yang harus dibawa |
| C16 | Rating & ulasan | Setelah status `Selesai`, lewat tautan portal |

## 8. Fitur Web Admin

### 8.1 Dashboard

- Kartu statistik: pendapatan, pengeluaran, estimasi laba, jumlah booking per status, tingkat utilisasi armada, customer baru vs langganan, rata-rata nilai transaksi — semua dengan indikator pertumbuhan vs periode sebelumnya.
- Grafik time-series: booking & pendapatan (harian/mingguan/bulanan/tahunan).
- Monitoring operasional: mobil tersedia/disewa/ditahan/servis, pengambilan & pengembalian hari ini, booking menunggu verifikasi, keterlambatan.
- Analitik armada: mobil terlaris & kurang produktif, pendapatan dan biaya per mobil, heatmap jam/hari ramai.
- Alert: keterlambatan pengembalian, jatuh tempo servis/pajak/STNK, dokumen menunggu.
- Filter rentang tanggal, widget dapat disusun, ekspor PDF/Excel.

### 8.2 Armada

- CRUD mobil: merek, model, tahun, plat, warna, transmisi, kapasitas, bahan bakar, bagasi, fasilitas, foto (multi), deskripsi.
- Status: tersedia, disewa, ditahan, servis, nonaktif.
- Tarif per mobil: harian, mingguan, bulanan, sopir, overtime/jam, keterlambatan/hari; harga weekday/weekend/musim liburan.
- Kalender ketersediaan per mobil dan gabungan.
- Odometer, riwayat servis, pengingat servis/pajak/STNK/asuransi, dokumen kendaraan.

### 8.3 Booking

- Daftar booking dengan filter status, tanggal, mobil, customer.
- Detail booking: item mobil, penyewa, dokumen, invoice, pembayaran, timeline, catatan internal.
- Booking manual oleh admin (walk-in / telepon).
- Verifikasi dokumen: lihat KTP/SIM, setujui/tolak dengan alasan.
- Konfirmasi pembayaran: input nominal, tanggal, bank, upload bukti transfer; sistem cek kesesuaian nominal dengan invoice.
- Perpanjang hold, aktivasi, pembatalan.
- Perubahan booking: perpanjangan, ganti mobil, tambah/kurang mobil → invoice revisi otomatis.
- Riwayat perubahan lengkap.

### 8.4 Invoice & keuangan

- Invoice awal, invoice revisi (bernomor versi), PDF dengan kop FA RENT CAR.
- Biaya tambahan saat pengembalian: overtime, keterlambatan, BBM, kerusakan, kebersihan.
- Refund: pengajuan staff → approval superadmin → pencatatan bukti refund.
- Pengeluaran operasional: servis, BBM, gaji sopir, pajak, dll (kategori, nominal, bukti).
- Kas & shift staff: buka/tutup shift, saldo, serah kas.

### 8.5 Sopir

- Profil, kontak, dokumen (SIM, KTP), foto.
- Tarif per hari, status ketersediaan.
- Penugasan ke booking; cek bentrok jadwal otomatis.
- Riwayat perjalanan dan penilaian.

### 8.6 Serah-terima digital

- Saat keluar dan saat kembali: checklist kondisi (body, interior, ban, lampu, kelengkapan), odometer, level BBM, foto/video multi-sudut, diagram kerusakan.
- Tanda tangan/persetujuan customer di layar.
- Berita acara PDF dikirim ke customer via portal.
- Perhitungan otomatis biaya tambahan dari selisih odometer/BBM/kondisi.

### 8.7 CRM

- Profil customer otomatis dari nomor WhatsApp/KTP, riwayat booking, total belanja.
- Label: baru, langganan, VIP, blacklist (dengan alasan).
- Catatan internal.

### 8.8 Promo & harga dinamis

- Kode promo: nominal/persen, masa berlaku, kuota, minimum transaksi, mobil tertentu.
- Aturan harga: weekend, musim liburan/tanggal khusus, durasi panjang.

### 8.9 Sistem & keamanan

- Manajemen staff: buat akun, peran, nonaktifkan.
- Audit log: semua aksi pembayaran, verifikasi, refund, perubahan tarif, hapus data.
- Multi-level approval: refund besar, hapus booking/mobil, ubah tarif.
- Notifikasi internal: booking baru, pembayaran menunggu, jatuh tempo.
- Import/export Excel (armada, booking, laporan).
- Pengaturan: profil usaha, rekening bank, template pesan WhatsApp, durasi hold, buffer waktu.

### 8.10 GPS (fase terakhir)

- Integrasi perangkat GPS (vendor/protocol ditentukan kemudian).
- Lokasi realtime per mobil, histori perjalanan, geofence & alert keluar area.

## 9. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Responsivitas | Semua halaman berfungsi baik di 360px–1440px |
| Performa | Halaman utama customer < 2,5 detik di 4G; API p95 < 500 ms |
| Keamanan | HTTPS; dokumen KTP/SIM di storage privat dengan URL bertanda tangan; token portal acak ≥ 32 byte dan tidak dapat ditebak; rate limit; validasi input server-side |
| Privasi | Dokumen hanya diakses admin & pemiliknya; dapat dihapus otomatis N hari setelah booking selesai (dapat diatur) |
| Ketersediaan | Backup database harian; auto-expire hold tetap jalan meski tidak ada request |
| Audit | Semua aksi sensitif tercatat dan tidak bisa dihapus |
| Bahasa | Bahasa Indonesia; format Rupiah, tanggal WIB |
| Zona waktu | Asia/Jakarta di seluruh sistem |

## 10. Tech stack

| Lapisan | Pilihan |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | NestJS (TypeScript), Prisma ORM, PostgreSQL 16 |
| Frontend | Next.js (App Router, TypeScript), Tailwind CSS |
| Auth admin | JWT (access + refresh), bcrypt, RBAC |
| Storage file | S3-compatible (MinIO lokal / R2 produksi), signed URL |
| PDF | Server-side (Puppeteer/Playwright atau @react-pdf) |
| Job/scheduler | BullMQ + Redis (auto-expire, pengingat) |
| Validasi | Zod (shared schema antara API dan web) |
| Testing | Vitest/Jest (unit), Supertest (API), Playwright (e2e) |
| Deploy | Docker Compose (VPS) — ditentukan kemudian |

## 11. Struktur repo (target)

```
apps/
  api/            NestJS backend
  web-customer/   Next.js customer
  web-admin/      Next.js admin (PWA)
packages/
  db/             Prisma schema, migration, seed
  shared/         Zod schema, tipe, util harga, konstanta
  ui/             Komponen UI bersama (opsional)
docs/
  prd.md, task.md, rules.md, adr/
```

## 12. Model data (ringkas)

Tabel utama: `admin_users`, `customers`, `vehicles`, `vehicle_photos`, `vehicle_rates`, `pricing_rules`, `drivers`, `bookings`, `booking_items`, `booking_charges`, `booking_documents`, `booking_access_tokens`, `invoices`, `invoice_items`, `payments`, `refunds`, `handovers`, `handover_photos`, `promos`, `promo_usages`, `expenses`, `cash_shifts`, `maintenance_records`, `vehicle_reminders`, `reviews`, `notifications`, `approvals`, `audit_logs`, `gps_devices`, `gps_positions` (fase akhir), `settings`.

Detail skema didefinisikan di `packages/db/prisma/schema.prisma` pada Fase 1.

## 13. Fase pengembangan

| Fase | Isi | Hasil |
|---|---|---|
| **0 — Fondasi** | Monorepo, DB schema, API skeleton, auth admin, storage, scheduler | Bisa login admin, migrasi jalan |
| **1 — Admin MVP** | Armada CRUD + tarif, kalender, booking manual, invoice, verifikasi, pembayaran, hold expire | Admin bisa operasional penuh secara manual |
| **2 — Customer MVP** | Landing, pencarian, katalog, detail, keranjang, booking guest, upload dokumen, invoice, WhatsApp, portal status | Customer bisa booking sendiri end-to-end |
| **3 — Operasional** | Sopir, serah-terima, biaya tambahan, refund + approval, CRM, promo & harga dinamis, pengeluaran, kas, laporan, dashboard lengkap, PWA | Sistem lengkap harian |
| **4 — GPS** | Integrasi perangkat, peta realtime, histori, geofence | Setelah vendor ditentukan |

## 14. Kriteria sukses (MVP = Fase 0–2)

- Customer dapat menyelesaikan booking multi-mobil dari HP tanpa bantuan admin dalam < 5 menit.
- Booking kedaluwarsa otomatis tepat 2 jam tanpa intervensi.
- Tidak ada double-booking pada uji konkuren.
- Admin dapat verifikasi dokumen + konfirmasi pembayaran dalam satu layar.
- Invoice PDF dan revisi tersimpan permanen dan sesuai snapshot harga saat booking.
- Semua aksi sensitif terlihat di audit log.

## 15. Keputusan terbuka

| # | Pertanyaan | Pemilik | Batas |
|---|---|---|---|
| 1 | Referensi UI/UX (gaya visual) | User | Sebelum Fase 2 |
| 2 | Vendor/perangkat GPS | User | Sebelum Fase 4 |
| 3 | Rekening bank & template pesan WhatsApp | User | Sebelum Fase 2 |
| 4 | Hosting/VPS & domain | User | Sebelum deploy |
| 5 | Kebijakan retensi dokumen KTP/SIM (hari) | User | Fase 1 |
| 6 | Kebijakan pembatalan & persentase refund | User | Fase 3 |
