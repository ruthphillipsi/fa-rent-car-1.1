# Design — Sistem Desain FA RENT CAR

Sumber: referensi Stitch "iOS Car Rental Interface" dari user (13 Sep 2026), tersimpan di `docs/design-reference/` (screenshot PNG, HTML, dan dua file DESIGN.md asli). Dokumen ini adalah **ringkasan yang mengikat**; jika ada perbedaan dengan referensi, ikuti dokumen ini karena sudah disesuaikan dengan aturan bisnis FA RENT CAR (tanpa deposit, tanpa cabang, tanpa antar-jemput).

Gaya: **iOS-inspired, Corporate/Modern, dominan putih**, aksen biru untuk aksi dan harga, hitam untuk brand dan tombol utama. Bersih, editorial, padat data tapi lega. Tidak ada gradien warna-warni, glow, ilustrasi 3D, atau ornamen dekoratif.

---

## 1. Warna

Mode terang adalah default dan satu-satunya untuk MVP. Token mengikuti referensi `design-system-light.md`.

### Netral (surface)

| Token | Hex | Pakai untuk |
|---|---|---|
| `background` | `#f8f9fb` | Latar halaman |
| `surface-lowest` | `#ffffff` | Kartu, panel, sidebar, navbar |
| `surface-low` | `#f2f4f6` | Kotak spesifikasi di dalam kartu, latar input |
| `surface` | `#edeef0` | Chip nonaktif, pemisah blok |
| `surface-high` | `#e7e8ea` | Hover pada surface |
| `surface-highest` | `#e1e2e4` | Border halus, garis pemisah |
| `on-surface` | `#191c1e` | Teks utama |
| `on-surface-variant` | `#4c4546` | Teks sekunder, label |
| `outline` | `#7e7576` | Ikon nonaktif, placeholder |

### Brand & aksi

| Token | Hex | Pakai untuk |
|---|---|---|
| `primary` | `#000000` | Logo, tombol utama hitam ("Pesan Sekarang", "+ Booking Manual"), heading berat |
| `primary-container` | `#1b1b1b` | Hover tombol hitam, blok CTA gelap |
| `secondary` | `#184fd6` | Tombol aksi biru, link, harga besar, item menu aktif, indikator fokus |
| `secondary-container` | `#3d6af0` | Hover tombol biru |
| `secondary-fixed` | `#dce1ff` | Latar badge/chip biru muda ("Ready / Siap Sewa", label aktif) |
| `on-secondary-fixed-variant` | `#003ab1` | Teks di atas `secondary-fixed` |

### Semantik

| Token | Hex | Pakai untuk |
|---|---|---|
| `success` | `#1a9e5c` | Status Aktif/Selesai, "+14,2% MoM", verifikasi OK; latar `#e3f5ea` |
| `warning` | `#e6a700` | Ditahan (hold), countdown, dokumen menunggu; latar `#fff4d6`, teks `#8a5a00` |
| `error` | `#ba1a1a` | Kedaluwarsa, ditolak, keterlambatan, tombol Batal/Refund; latar `#ffdad6`, teks `#93000a` |
| `whatsapp` | `#25d366` | Hanya tombol yang membuka WhatsApp |

Aturan: satu halaman maksimal satu tombol hitam utama dan tombol biru untuk aksi lanjutan. Warna semantik hanya untuk status, jangan untuk dekorasi.

## 2. Tipografi

Font: **Inter** (400, 500, 600, 700) untuk seluruh teks. Angka di tabel/keuangan pakai `font-variant-numeric: tabular-nums`. Nomor invoice/plat pakai monospace (`JetBrains Mono` atau `ui-monospace`) ukuran kecil.

| Token | Ukuran / tinggi / bobot | Pakai |
|---|---|---|
| `display-lg` | 48/60, 700, -0.02em | Judul hero customer (desktop) |
| `headline-lg` | 32/40, 700, -0.02em | Judul halaman |
| `headline-lg-mobile` | 24/32, 700 | Judul halaman di mobile |
| `headline-md` | 24/32, 600, -0.01em | Judul bagian, nama mobil di detail |
| `title` | 18/26, 600 | Judul kartu, nama mobil di kartu katalog |
| `price-lg` | 28–32/36, 700, -0.02em, warna `secondary` | Harga di kartu ("Rp 750.000" + "/hari" kecil abu) |
| `stat` | 32–40/40, 700 | Angka besar di kartu statistik admin |
| `body-lg` | 16/24, 500 | Deskripsi utama |
| `body-md` | 14/21, 400 | Teks umum, tabel |
| `label-md` | 12/16, 600, +0.02em, **uppercase** | Label kecil di atas nilai ("TARIF HARIAN", "VOLUME BOOKING", "MAIN MENU") |
| `caption` | 12/16, 400 | Metadata, footnote |

Heading rapat dan berat; label uppercase berjarak. Harga selalu biru dan besar (`price-lg`) di sisi customer.

## 3. Layout & spacing

- Grid **8px**. Jarak antar bagian 32px (mobile) / 48px (desktop).
- Container desktop maks **1280px**, gutter 24px, margin 64px desktop / 20px mobile.
- Kartu: padding **24px** desktop, 16px mobile.
- Web customer desktop: konten terpusat; katalog = sidebar filter 280px + grid 3 kolom.
- Web admin desktop: sidebar kiri **256px** tetap putih + topbar 64px (cabang tidak ada, ganti dengan pencarian global dan tombol "+ Booking Baru") + area konten latar `background`.
- Web admin mobile: sidebar hilang, **bottom tab bar** 5 item (Dashboard, Armada, Booking, Verifikasi, Menu). Web customer mobile juga bottom tab (Armada, Cari, Booking, Bantuan).
- Breakpoint: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Kolom kartu: 1 (mobile) → 2 (md) → 3 (lg).
- Target sentuh minimum 44×44px.

## 4. Bentuk, elevasi, gerak

| Elemen | Radius |
|---|---|
| Chip, badge, tag | `full` (pill) |
| Input, tombol | 8px (`rounded-lg`); tombol besar 12px |
| Kotak spesifikasi dalam kartu | 12px |
| Kartu, panel, modal | 16px (`rounded-2xl`) |
| Hero search bar, blok CTA | 24px |

Elevasi memakai lapisan tonal + bayangan lembut, **bukan border tebal**:

- Level 1 kartu: `0 1px 8px rgba(0,0,0,.04)` atau `0 4px 20px rgba(0,0,0,.04)`, border opsional 1px `surface-highest`.
- Hover kartu: `0 8px 24px rgba(0,0,0,.08)`, gambar scale 1.02, `translateY(-2px)`.
- Tombol biru utama: `0 4px 14px rgba(24,79,214,.3)`.
- Overlay/modal/sheet: latar `rgba(25,28,30,.4)` + `backdrop-blur(20px)`; panel putih radius 24px.
- Navbar/topbar sticky: putih 85% + `backdrop-blur(20px)`, border bawah 1px.

Transisi 150–200ms `ease-out`; tanpa animasi masuk yang berlebihan. Hormati `prefers-reduced-motion`.

## 5. Komponen

### Tombol
- **Primary hitam**: `bg-primary text-white`, 12px radius, padding 14×24, bobot 600. Untuk aksi utama halaman ("Pesan Sekarang", "+ Booking Manual").
- **Primary biru**: `bg-secondary text-white`, bayangan biru. Untuk submit form dan aksi lanjutan ("Cari Mobil Tersedia", "Verifikasi", "Aktifkan Booking").
- **Secondary**: putih, border 1px `surface-highest`, teks `on-surface`; ikon kiri opsional ("Cek GPS Armada", "Laporan Harian").
- **Tinted**: latar `secondary-fixed`, teks `on-secondary-fixed-variant` ("Lihat Jadwal Bebas").
- **Destructive**: latar `#ffdad6`, teks `#93000a` ("Batal", "Tolak"); **tidak pernah merah solid**.
- **WhatsApp**: hijau `#25d366`, ikon chat, teks putih.
- Ukuran: sm 36px, md 44px, lg 52px.

### Badge status
Pill, `label-md`, dengan titik bulat 6px di kiri:

| Status | Latar / teks |
|---|---|
| Menunggu Konfirmasi / Ditahan | `#fff4d6` / `#8a5a00` |
| Aktif / Siap Sewa / Terverifikasi | `#dce1ff` / `#003ab1` (biru) atau `#e3f5ea` / `#146c2e` (hijau untuk selesai/lunas) |
| Selesai | `#e3f5ea` / `#146c2e` |
| Dibatalkan / Kedaluwarsa / Ditolak / Terlambat | `#ffdad6` / `#93000a` |
| Servis / Nonaktif | `#edeef0` / `#4c4546` |
| Tag kategori (MPV, SUV, Matic) | putih 90% blur di atas foto, teks `on-surface` |

### Kartu mobil (customer)
Foto rasio 16:10 radius 12px dengan tag pill kiri-atas ("Ready / Siap Sewa", kategori, tahun kanan-atas) → nama mobil `title` + varian `caption` → **kotak spesifikasi** `surface-low` radius 12px berisi grid 2×2 ikon+teks (kursi, transmisi, BBM, km/bagasi) → label uppercase "TARIF HARIAN" → harga biru besar + "/hari" → tombol hitam "Pesan Sekarang" penuh lebar (customer) atau tombol biru "Pilih Mobil →" (katalog). Mobil terbooking: foto desaturasi + overlay badge hitam "Terbooking di tanggal ini", tombol berganti tinted "Lihat Jadwal Bebas".

### Hero search (customer)
Kartu putih radius 24px berisi: segmented control "Lepas Kunci | Dengan Sopir (+Rp …/hari)", tiga input berlabel ikon (tanggal & jam ambil, tanggal & jam kembali, lokasi tetap "Kantor FA RENT CAR, Kedawung" read-only), tombol biru "Cari Mobil Tersedia (N unit)". Di bawahnya baris status kecil dengan titik biru: "N unit tersedia · N sedang jalan".

### Kartu statistik (admin)
Putih radius 16px padding 24px: label uppercase kiri + ikon dalam kotak `surface-low` 40px kanan → angka `stat` → baris bawah caption dengan indikator pertumbuhan hijau/merah (▲ +14,2% MoM). Kartu "Tindakan mendesak" memakai angka merah dan badge merah muda.

### Bar utilisasi armada (admin)
Satu bar horizontal tersegmen (biru = disewa, hitam = siap, kuning = ditahan, merah = servis) tinggi 6px, legenda di bawah dengan titik warna, label uppercase, angka tebal, persentase abu.

### Daftar aksi mendesak / antrean (admin)
Item radius 12px latar `surface-low`: kolom kiri nomor invoice monospace + badge hitung mundur kuning/merah ("Sisa 01:24:18") → nama customer & mobil (bold) → keterangan status → tombol aksi kanan (WhatsApp secondary, Batal destructive, Verifikasi biru). Item terpilih berlatar `secondary-fixed`.

### Panel verifikasi (admin)
Layout dua kolom: kiri antrean, kanan detail customer (avatar inisial biru muda, nama, kontak, tombol WhatsApp hijau) → tiga kotak info → **rincian tagihan** (baris label/angka, diskon biru, total besar biru) → **dokumen**: dua kartu KTP & SIM berdampingan, thumbnail gambar dengan watermark, NIK/No SIM monospace, tombol "Setujui" biru + "Tolak" destructive → **pembayaran**: thumbnail bukti, metode, nominal invoice vs nominal masuk dengan ikon centang → checklist prasyarat aktivasi (Lunas 100%, Bukti sah, KTP & SIM lolos) → tombol biru besar penuh "Aktifkan Booking & Kunci Armada" → baris tombol secondary "Cetak Invoice PDF", "Koreksi Pembayaran", "Batalkan / Refund".

### Tabel (admin)
Header `label-md` uppercase abu, baris tinggi 56px, pemisah 1px `surface-highest`, tanpa zebra. Kolom waktu memakai titik warna + monospace. Aksi per baris di kanan.

### Timeline jadwal hari ini
Garis vertikal kiri dengan titik biru/abu; setiap item: badge waktu + tipe (PENGAMBILAN biru muda / PENGEMBALIAN abu), nama mobil bold, plat monospace, nama & WA customer.

### Input & form
Tinggi 44px, latar `surface-low` (di kartu putih) atau putih (di latar abu), border 1px `surface-highest`, radius 8px, ikon kiri 20px, label `label-md` uppercase di atas. Fokus: border `secondary` + ring 3px `secondary-fixed`. Error: border `error` + teks `#93000a` 12px di bawah. Segmented control: latar `surface` radius full, item aktif putih dengan bayangan.

### Upload dokumen
Kotak dashed radius 12px latar `surface-low`, ikon + teks "Upload KTP", syarat kecil. Setelah terisi: solid border biru, thumbnail, nama file, tombol "Ganti".

### Navigasi
- **Customer desktop**: navbar putih: logo kotak hitam "FA" + teks "FA RENT CAR / Rental & Mobility"; menu tengah dalam pill `surface-low` (item aktif putih); kanan tombol WhatsApp hijau + tombol hitam "Cek Booking".
- **Admin desktop**: sidebar putih 256px: logo, label "MAIN MENU", item radius 12px ikon+teks, aktif = `bg-secondary text-white`; profil staff di bawah. Topbar: pencarian global (⌘K), tombol hitam "+ Booking Baru", bel notifikasi dengan titik merah, avatar.
- **Mobile**: bottom tab bar putih blur, ikon Material Symbols Outlined 24px, label 11px, aktif biru; badge angka merah pada tab Booking.

### Ikon
**Material Symbols Outlined**, weight 400, ukuran 20px (dalam teks/kartu) atau 24px (navigasi). Tanpa ikon berwarna/emoji.

### Footer customer
Latar putih, 4 kolom: brand + alamat; jam layanan & darurat (kotak `surface-low`); navigasi; kepatuhan/legal (ikon centang: "Enkripsi data KTP & SIM", "Perjanjian sewa digital"); baris hak cipta.

## 6. Konten & nada

- Bahasa Indonesia, sapaan "Anda". Kalimat pendek, langsung. Contoh judul hero: **"Sewa Mobil Lepas Kunci & Dengan Sopir di Cirebon"**.
- Setiap blok punya *eyebrow* `label-md` biru uppercase di atas judul (contoh: "READY TO ROLL", "PROSEDUR PEMESANAN").
- Tampilkan bukti kepercayaan: inspeksi unit, enkripsi dokumen, "tanpa biaya tersembunyi", 4.4★ · 98 ulasan.
- Angka uang: `Rp 1.200.000`; tanggal: `Sen, 15 Sep 2026 · 09:00 WIB`; hitung mundur: `01:47:23`.
- Foto mobil asli FA RENT CAR, latar netral, sudut ¾ depan; jangan pakai gambar stok mobil lain.

## 7. Penyesuaian dari referensi (wajib)

Referensi memakai brand fiktif "FE Rent Car" Jakarta multi-cabang. Saat implementasi:

| Di referensi | Ganti menjadi |
|---|---|
| "FE Rent Car", Jakarta, Pool Kuningan/Gambir | **FA RENT CAR**, Cirebon, "Kantor FA RENT CAR, Kedawung" |
| Pemilih cabang "Pusat Jakarta" di topbar | Hapus; satu lokasi |
| "Lokasi Penjemputan" pilihan / handover di bandara/hotel | Hapus; lokasi tetap kantor (read-only) |
| "Jaminan Deposit Kerusakan (Refundable)" di rincian tagihan | **Hapus**; tidak ada deposit |
| "Transfer bank resmi atau DP" | "Transfer bank, lunas 100%" |
| "Verifikasi DP" | "Verifikasi pembayaran" |
| "GPS & Geofence" di menu admin | Tetap ada tapi nonaktif/disabled sampai Fase 4 |
| "Asuransi All-Risk", "PPh 23", "B2B/Perusahaan" | Hapus kecuali user konfirmasi layanan tersebut |
| Ikon "Buat Booking Baru" di topbar | Tetap ("+ Booking Manual") |
| Menu admin: Dashboard, Manajemen Armada, Manajemen Booking, Verifikasi & Pembayaran, Serah Terima & Kondisi, Servis & Dokumen, GPS & Geofence, Laporan Operasional, Pengaturan & Audit | Tetap, tambah **Kalender**, **Sopir**, **Customer (CRM)**, **Keuangan** (pengeluaran, kas, refund) |

## 8. Implementasi teknis

- Tailwind CSS v3/v4 dengan token di `packages/ui/tailwind-preset.ts` (warna, radius, fontSize, boxShadow, spacing) diturunkan dari §1–§4; kedua web wajib memakai preset ini.
- Font Inter via `next/font/google` (subset latin, weight 400–700), Material Symbols Outlined via `next/font` atau self-host.
- Komponen dasar di `packages/ui`: `Button`, `Badge`, `Card`, `StatCard`, `Input`, `Segmented`, `Select`, `DateTimePicker`, `Upload`, `Table`, `Tabs`, `Sheet/Modal`, `Toast`, `EmptyState`, `Skeleton`, `BottomTabBar`, `Sidebar`, `Topbar`, `PriceTag`, `StatusBadge`, `Countdown`.
- Skeleton loading berbentuk sama dengan konten (kartu abu `surface`), bukan spinner besar.
- Empty state: ikon abu 40px + judul `title` + teks `body-md` + satu tombol aksi.
- Dark mode: **tidak dikerjakan** di MVP (token `design-system-dark.md` disimpan sebagai referensi untuk masa depan).

## 9. Referensi layar

| File di `docs/design-reference/` | Layar | Catatan implementasi |
|---|---|---|
| `beranda_customer_web_*` | Beranda customer desktop | Hero, search card, armada pilihan, tata cara 6 langkah, kebijakan, CTA gelap, footer |
| `beranda_customer_mobile_*` | Beranda customer mobile | Search card vertikal, kartu penuh lebar, bottom tab |
| `katalog_armada_customer_web_*` | Katalog desktop | Sidebar filter + grid 3 kolom + paginasi |
| `katalog_armada_mobile_*` | Katalog mobile | Filter sebagai sheet, kartu 1 kolom |
| `dashboard_operasional_admin_desktop_1/2` | Dashboard admin | Stat card, utilisasi, aksi mendesak, peringatan servis, mobil laris, jadwal hari ini |
| `dashboard_operasional_admin_mobile_*` | Dashboard admin mobile | Stat card 2 kolom, list vertikal, bottom tab |
| `manajemen_booking_verifikasi_desktop` | Booking & verifikasi | Tabs status, antrean kiri, panel detail kanan |
| `manajemen_booking_verifikasi_mobile_*` | Booking & verifikasi mobile | Antrean → detail halaman terpisah |

Layar yang belum ada referensi (detail mobil, form booking, halaman invoice/countdown, portal status, serah-terima, kalender, sopir, laporan) **dibuat mengikuti sistem ini**, lalu di-screenshot dan dimintakan persetujuan user sebelum dianggap final.
