# Rules — Aturan Pengembangan FA RENT CAR

Dokumen ini mengikat semua pengerjaan di repo ini (manusia maupun AI agent). Jika ada konflik, urutan prioritas: **rules.md → prd.md → design.md → task.md → kode yang ada**.

---

## 1. Alur kerja

1. Baca `docs/prd.md`, `docs/design.md`, dan `docs/task.md` sebelum mulai.
2. Kerjakan task sesuai urutan fase. Jangan lompat fase tanpa persetujuan user.
3. Tandai task `[~]` saat mulai, `[x]` saat selesai (kode + test + dokumen), `[!]` jika diblokir beserta alasannya.
4. Satu PR = satu task atau satu kelompok task kecil yang saling terkait. PR harus bisa direview dalam < 15 menit.
5. Semua UI mengikuti `docs/design.md` (token, komponen, penyesuaian brand). Layar tanpa referensi dibuat sesuai sistem itu lalu dimintakan persetujuan user via screenshot.
6. Setiap keputusan arsitektur yang tidak tercantum di PRD dicatat di `docs/adr/NNNN-judul.md` (konteks, keputusan, konsekuensi) dan di tabel "Catatan keputusan" `task.md`.
7. Jika PRD tidak menjawab suatu pertanyaan bisnis, **tanya user**; jangan mengasumsikan aturan bisnis (harga, refund, syarat).

## 2. Struktur & penamaan

- Monorepo: `apps/api`, `apps/web-admin`, `apps/web-customer`, `packages/db`, `packages/shared`.
- Bahasa kode: **TypeScript strict** di semua paket. Tidak ada `any` tanpa komentar alasan.
- Nama file: `kebab-case.ts`; komponen React: `PascalCase.tsx`.
- Nama tabel/kolom DB: `snake_case`; model Prisma: `PascalCase`; field Prisma: `camelCase` dengan `@map`.
- Istilah domain dalam kode memakai **bahasa Inggris** (`booking`, `vehicle`, `driver`, `handover`, `invoice`); teks UI memakai **bahasa Indonesia**.
- Enum status disimpan sebagai string enum uppercase: `PENDING_CONFIRMATION`, `ACTIVE`, `COMPLETED`, `EXPIRED`, `CANCELLED`.

## 3. Aturan domain yang tidak boleh dilanggar

1. **Tidak ada deposit.** Jangan tambahkan field/logika deposit.
2. **Tidak ada payment gateway.** Pembayaran hanya dicatat manual oleh admin.
3. **Customer tidak punya akun.** Akses portal hanya via token acak (≥ 32 byte, `crypto.randomBytes`), bukan nomor invoice atau ID berurutan.
4. **Booking aktif hanya jika** semua dokumen `APPROVED` **dan** total pembayaran ≥ total invoice aktif.
5. **Ketersediaan mobil dicek di dalam transaksi DB** dengan lock (`SELECT ... FOR UPDATE` / advisory lock per vehicle) untuk mencegah double-booking.
6. **Invoice adalah snapshot.** Jangan pernah menghitung ulang invoice dari tarif saat ini. Perubahan → buat versi baru; versi lama tidak boleh diubah/dihapus.
7. **Hold expiry dijalankan oleh job** (BullMQ delayed job saat booking dibuat + cron pengaman), bukan hanya dicek saat request.
8. **Refund wajib approval superadmin** sebelum status berubah dan uang dicatat keluar.
9. **Semua aksi sensitif menulis audit log** dalam transaksi yang sama: konfirmasi/ubah pembayaran, verifikasi dokumen, refund, ubah tarif, ubah status booking, hapus data apa pun, ubah peran staff. Audit log **append-only** (tidak ada endpoint update/delete).
10. **Hapus data = soft delete** (`deletedAt`) kecuali file sementara. Hard delete hanya untuk retensi dokumen KTP/SIM sesuai kebijakan.
11. **Zona waktu Asia/Jakarta** untuk semua perhitungan durasi & tampilan; simpan di DB sebagai `timestamptz` UTC.
12. **Perhitungan harga hanya di `packages/shared`** (pure function, ter-unit-test), dipakai API dan web agar estimasi customer = invoice.
13. Uang disimpan sebagai **integer rupiah** (bukan float/decimal berkoma).

## 4. Keamanan & privasi

- Dokumen KTP/SIM dan bukti transfer di bucket **privat**; akses hanya lewat signed URL berumur pendek (≤ 10 menit) yang diterbitkan setelah cek otorisasi.
- Upload divalidasi server-side: tipe MIME asli (bukan hanya ekstensi), ukuran ≤ 5 MB, nama file diganti UUID.
- Password admin: bcrypt cost ≥ 12. JWT access ≤ 15 menit, refresh dengan rotasi, disimpan httpOnly cookie.
- Rate limit pada endpoint publik (booking, portal, promo) dan login.
- Semua input divalidasi Zod di API; jangan percaya validasi client.
- Jangan log data pribadi (NIK, nomor HP lengkap, isi dokumen) ke log aplikasi.
- Rahasia hanya lewat env; `.env` tidak pernah di-commit; `.env.example` selalu diperbarui.
- Tidak ada endpoint yang mengembalikan daftar customer/booking tanpa auth admin.

## 5. Database

- Semua perubahan skema lewat migrasi Prisma; tidak ada `db push` di luar dev lokal.
- Setiap migrasi harus bisa dijalankan dari nol (`migrate reset` + `seed` harus sukses).
- Index wajib untuk kolom yang dipakai filter/urut: tanggal booking, status, vehicleId, token portal (unik).
- Relasi `booking_items → vehicles` dan `payments → invoices` tidak boleh cascade delete.

## 6. API

- REST, prefix `/api/v1`. Admin: `/api/v1/admin/*` (JWT). Publik: `/api/v1/public/*`. Portal: `/api/v1/portal/:token/*`.
- Respons error seragam: `{ "error": { "code": "STRING_CODE", "message": "...", "details": [] } }`.
- Paginasi cursor atau `page/limit` konsisten di semua daftar; maksimal `limit` 100.
- Tidak ada logika bisnis di controller; taruh di service. Transaksi di service.
- Setiap endpoint memiliki Zod schema request & response di `packages/shared` dan dipakai kedua sisi.

## 7. Frontend

- Next.js App Router, Server Components default; Client Component hanya jika perlu interaksi.
- Tailwind CSS; token desain hanya dari preset bersama `packages/ui` yang diturunkan dari `docs/design.md`. Jangan hardcode hex di komponen. Komponen dasar dipakai dari `packages/ui`, bukan dibuat ulang per app.
- Semua teks UI bahasa Indonesia, format `Rp 1.200.000`, tanggal `Sen, 15 Sep 2026 · 09:00 WIB`.
- Wajib responsive 360px–1440px; uji di viewport mobile sebelum PR.
- Aksesibilitas dasar: label pada input, kontras cukup, fokus terlihat, tombol punya teks/aria-label.
- Tidak ada fetch data langsung dari komponen tanpa lewat client API bertipe.
- Web admin harus tetap berguna di HP (PWA).

## 8. Testing

- Util harga & mesin status: unit test wajib, cakupan kasus tepi (durasi 6/7/8 hari, 29/30/31 hari, lintas weekend, promo melebihi total).
- API: integration test untuk create booking (konkuren), konfirmasi pembayaran, transisi status, expiry.
- E2E Playwright minimal: alur booking customer & alur verifikasi admin.
- Test harus lulus lokal sebelum PR; CI menjalankan lint + test + build.
- Jangan melemahkan/menghapus test agar lulus. Jika perilaku berubah sesuai PRD, ubah test dan jelaskan di PR.

## 9. Git & PR

- Branch: `feat/<fase>-<ringkas>`, `fix/<ringkas>`, `chore/<ringkas>`.
- Commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`), bahasa Inggris, imperatif.
- PR wajib berisi: tujuan, task yang ditutup (`task.md` ref), cara verifikasi, screenshot untuk perubahan UI.
- Jangan commit file hasil build, `.env`, `node_modules`, atau artefak screenshot ke root repo.
- Perubahan skema DB dan perubahan aturan bisnis harus disebut eksplisit di deskripsi PR.

## 10. Kualitas kode

- Fungsi kecil, satu tanggung jawab. Hindari file > 400 baris; pecah bila lebih.
- Tidak ada `console.log` di kode produksi; pakai logger.
- Komentar hanya untuk niat yang tidak jelas dari kode. Tidak ada `TODO` tanpa nomor task.
- Jangan menambah dependensi baru tanpa alasan tertulis di PR; utamakan yang sudah ada.
- Jangan refactor di luar lingkup task.
- Handle error secara eksplisit; jangan menelan exception.

## 11. Dokumentasi

- `docs/prd.md` diperbarui jika ruang lingkup/aturan bisnis berubah (dengan persetujuan user).
- `docs/task.md` diperbarui setiap task berubah status.
- `README.md` root berisi cara menjalankan dev dalam ≤ 10 langkah.
- Endpoint API terdokumentasi via OpenAPI (Swagger) yang dihasilkan otomatis dari kode.

## 12. Larangan tegas

- ❌ Menambah fitur di luar PRD tanpa persetujuan user.
- ❌ Menyimpan dokumen identitas di bucket publik.
- ❌ Menghitung ulang invoice lama.
- ❌ Mengubah/menghapus audit log.
- ❌ Menggunakan nomor invoice/ID berurutan sebagai akses portal.
- ❌ Menyimpan uang sebagai float.
- ❌ Hard delete booking, invoice, pembayaran.
- ❌ Menaruh logika harga di frontend selain memanggil `packages/shared`.
- ❌ Menampilkan field deposit, pemilih cabang, atau lokasi antar-jemput dari referensi desain (lihat design.md §7).
