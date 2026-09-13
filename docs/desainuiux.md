# Desain UI/UX — Blueprint Layar FA RENT CAR

Dokumen ini menjabarkan **setiap layar** dari referensi Stitch yang dikirim user menjadi spesifikasi bagian-per-bagian (urutan, isi, komponen, perilaku, varian mobile). Tujuannya: hasil implementasi terlihat **sama dengan referensi**, hanya berbeda pada data dan penyesuaian brand FA RENT CAR (lihat `design.md` §7).

Hubungan dokumen:
- `design.md` = token & komponen (warna, tipografi, radius, bayangan).
- `desainuiux.md` (ini) = susunan layar, konten, dan interaksi.
- `docs/design-reference/*.html|png` = sumber visual asli; buka file ini saat implementasi untuk mencocokkan proporsi.

Aturan umum:
1. Ikuti urutan bagian dan hierarki teks persis seperti di bawah. Jangan menambah/mengurangi bagian tanpa persetujuan user.
2. Semua teks contoh di bawah adalah **teks final** kecuali angka/data yang berasal dari database.
3. Semua ikon = Material Symbols Outlined; nama ikon dicantumkan dalam `[kurung]`.
4. Desktop ≥ 1024px, mobile < 768px. Tablet mengikuti desktop dengan kolom dikurangi.

---

## A. WEB CUSTOMER

### A1. Beranda — Desktop
Referensi: `beranda_customer_web_fe_rent_car_harga_biru_besar`

**Navbar** (sticky, putih blur, tinggi 72px, border bawah)
- Kiri: logo kotak hitam radius 8px berisi "FA" putih tebal; di kanannya dua baris: "FA RENT CAR" (bold 16px) dan "Rental & Mobility" (caption abu).
- Tengah: pill `surface-low` berisi 5 menu: **Beranda** (aktif = putih + bayangan), Katalog Armada, Tata Cara Sewa, Cek Status, Kontak & Bantuan.
- Kanan: tombol hijau WhatsApp `[chat] WhatsApp Admin`, tombol hitam `[directions_car] Cek Ketersediaan`, ikon `[person]` dalam lingkaran `surface-low` (membuka Cek Booking).

**Hero** (padding atas 64px, teks tengah, maks lebar 760px)
- Badge pill `surface-low`: titik biru + "Armada Aktif: **N Unit Siap Jalan**".
- `display-lg`: **"Sewa Mobil Lepas Kunci & Dengan Sopir di Cirebon"** (baris kedua bisa patah di "di Cirebon").
- `body-lg` abu: "N armada siap jalan. Cek ketersediaan mobil sesuai tanggal, kalkulasi total tarif transparan tanpa biaya siluman, dan pesan langsung tanpa wajib registrasi akun."

**Search card** (putih radius 24px, bayangan lembut, maks lebar 1040px, padding 24px)
- Baris 1: segmented control `Lepas Kunci | Dengan Sopir` — item "Dengan Sopir" membawa chip biru muda "+Rp {tarif_sopir}/hari". Kanan: caption `[verified] Tarif sudah termasuk pajak, tanpa biaya tersembunyi` (mengganti "PPh 23 & Asuransi All-Risk").
- Baris 2 (grid 3 kolom + tombol): 
  - `[calendar_today] TANGGAL & JAM MULAI` → input datetime "15 Agu 2026, 09:00 WIB".
  - `[event_available] TANGGAL & JAM SELESAI` → input datetime.
  - `[location_on] LOKASI PENGAMBILAN` → field read-only "Kantor FA RENT CAR, Kedawung" (tanpa dropdown).
  - Tombol biru `[search] Cari Mobil Tersedia (N Unit)`; angka N dihitung realtime dari tanggal.
- Di bawah card: baris status kecil: titik biru "Status Armada Hari Ini:" + "**N Unit Tersedia Siap Pakai** • N Sedang Jalan • N Perawatan Berkala"; kanan `[sync] Terakhir disinkronkan N detik lalu`.

**Armada Pilihan Minggu Ini** (section, padding 64px)
- Eyebrow biru uppercase "READY TO ROLL"; `headline-lg` "Armada Pilihan Minggu Ini"; subteks abu "Semua unit melalui inspeksi berkala, pembersihan kabin, dan AC dingin optimal."; kanan link biru "Lihat Semua N Unit [arrow_forward]".
- Grid 3 kartu mobil (spesifikasi kartu: `design.md` §5 "Kartu mobil"): tag pill di atas foto (kiri: kategori/keunggulan seperti "Terpopuler Keluarga", "Bensin"; kanan: "Matic 7 Seater"), foto 16:10, nama mobil `title`, varian caption, kotak spesifikasi 2×2 `[speed] km`, `[airline_seat_recline_normal] N Kursi`, `[luggage] Muat N Koper`, `[ac_unit] AC Double Blower`, label uppercase "TARIF SEWA HARIAN", harga biru besar "Rp 750.000" + "/ hari", tombol hitam penuh "Pesan Sekarang".
- Data: 3 mobil dengan flag `featured` dari admin, fallback 3 terlaris.

**Tata Cara Pemesanan Praktis**
- Eyebrow "PROSEDUR RINGKAS"; `headline-lg` "Tata Cara Pemesanan Praktis"; subteks "Tanpa registrasi akun. Alur pemesanan jelas, terukur, dan transparan dari awal hingga serah terima kunci."
- Grid 3×2 kartu putih radius 16px: kotak angka biru muda 40px dengan angka biru bold (1–6), judul `title`, teks `body-md` abu:
  1. **Pilih Mobil & Tanggal** — "Lihat ketersediaan riil armada yang tidak bentrok jadwal sewa lain. Unit yang Anda pilih ditahan selama proses reservasi."
  2. **Form Cepat (Tanpa Login)** — "Isi nama lengkap, nomor WhatsApp aktif, lalu unggah foto KTP dan SIM. Berkas disimpan terenkripsi."
  3. **Terima Invoice Otomatis** — "Dapatkan invoice PDF resmi berformat `FA-YYYYMMDD-XXX` langsung di layar dan tautan status pribadi."
  4. **Transfer Bank** — "Lunasi 100% biaya sewa ke rekening resmi CV FA RENT CAR dalam 2 jam agar unit tidak kedaluwarsa."
  5. **Verifikasi Admin** — "Kirim bukti transfer via WhatsApp. Admin memverifikasi dokumen dan pembayaran, status berubah menjadi Aktif."
  6. **Serah Terima Kunci** — "Ambil mobil di kantor FA RENT CAR dengan checklist inspeksi digital bodi & BBM sebelum tanda tangan."

**Kebijakan Transparan & Anti-Biaya Siluman**
- Eyebrow "INTEGRITAS LAYANAN"; `headline-lg` "Kebijakan Transparan & Anti-Biaya Siluman"; subteks satu kalimat.
- 3 kartu: ikon dalam kotak biru muda 48px, judul, teks, footer caption hijau `[check_circle]`:
  - `[verified]` **Garansi Unit Bersih & Prima** / "Standar Kebersihan & Kelayakan"
  - `[shield]` **Privasi Dokumen KTP & SIM** — "Sesuai UU PDP No. 27/2022, file identitas Anda dihapus otomatis {N} hari setelah sewa selesai." / "Enkripsi Database Server"
  - `[support_agent]` **Bantuan 24 Jam** — "Kantor buka 24 jam. Kendala di jalan? Hubungi admin, kami bantu solusinya." / "Respons Cepat via WhatsApp"

**CTA gelap** (kartu hitam radius 24px, padding 48px, dua kolom)
- Chip putih transparan `[headset_mic] Layanan Konsultasi`; `headline-md` putih "Butuh Sewa Bulanan atau Rombongan?"; teks abu terang; kanan tombol hijau "[chat] Chat WhatsApp Admin".

**Footer** (4 kolom, border atas)
1. Logo + "FA RENT CAR" + deskripsi "Layanan sewa mobil terpercaya di Cirebon…" + `[pin_drop]` **Kantor & Pool** "Jl. Pilang Raya No.10, Pilangsari, Kedawung, Cirebon".
2. **Jam Layanan & Darurat**: kotak `surface-low` "LAYANAN PEMESANAN & POOL / Buka 24 Jam" + kotak kedua "WHATSAPP ADMIN / 0852-2448-4488".
3. **Navigasi & Pembayaran**: link Katalog Armada, Persyaratan Sewa, Layanan Sopir, Cek Status; kotak `surface-low` "REKENING RESMI / {Bank} / {No. Rek} monospace / a.n. CV FA RENT CAR".
4. **Kepatuhan & Legalitas**: paragraf UU PDP + 3 baris ikon: `[lock] Enkripsi Data KTP & SIM`, `[description] Perjanjian Sewa Digital`, `[verified_user] Serah Terima Terdokumentasi`.
- Baris bawah: "© {tahun} CV FA RENT CAR. Hak cipta dilindungi." | Kebijakan Privasi · Syarat & Ketentuan · Pusat Bantuan.

### A2. Beranda — Mobile
Referensi: `beranda_customer_mobile_web_fe_rent_car`

- **Topbar** 56px: `[menu]` kiri, logo kotak hitam + "FA RENT CAR / Premium Fleet", kanan tombol hijau kecil `[chat] Admin` + `[person]`.
- Badge armada aktif → judul `headline-lg-mobile` → paragraf.
- **Search card** vertikal: segmented penuh lebar; tiga field bertumpuk (label uppercase kecil + nilai bold + ikon kiri), lokasi read-only; tombol biru penuh; caption `[verified_user]` di bawah.
- **Baris 3 keunggulan** (kartu kecil sejajar): `[flash_on] Konfirmasi Cepat`, `[shield] Tanpa Deposit`, `[clean_hands] Steril & Higienis`.
- **Armada Pilihan**: kartu penuh lebar bertumpuk (bukan carousel), isi sama seperti desktop; harga biru besar kiri, tombol hitam "Pesan Sekarang" kanan sejajar.
- **Tata Cara**: 6 baris vertikal (angka biru muda 32px kiri, judul bold + teks).
- **CTA WhatsApp** hijau penuh: "Respon Kilat 24/7 / Chat Admin (0852-2448-4488)".
- **Footer** ringkas: badge nama usaha, alamat, rekening dalam kotak, hak cipta.
- **Bottom tab bar**: `[directions_car] Armada`, `[search] Cari`, `[receipt_long] Booking`, `[support_agent] Bantuan`, `[account_circle] Akun→Cek Booking`. Aktif biru.

### A3. Katalog Armada — Desktop
Referensi: `katalog_armada_customer_web_fe_rent_car_harga_biru_besar`

- Navbar sama; menu aktif "Katalog Armada". Tombol hijau bertuliskan "Chat Admin (0852-2448-4488)".
- **Breadcrumb**: Beranda `[chevron_right]` Katalog Armada.
- **Header**: `headline-lg` "Katalog & Ketersediaan Armada"; paragraf: "Pilih tanggal untuk menyaring mobil yang benar-benar siap sewa secara real-time. Mobil yang sedang dirental pada rentang tanggal pilihan otomatis ditandai **"Terbooking"**."; kanan kartu kecil `[verified] Inspeksi Rutin / Unit Higienis & Teruji`.
- **Layout dua kolom**: sidebar filter 280px sticky (kartu putih) + konten.

**Sidebar filter** (judul `[tune] Filter Pencarian` + link "Reset Semua")
1. **Periode Sewa**: chip `[schedule] N Hari`; dua input tanggal (Mulai / Selesai) dengan ikon; toggle "Hanya tampilkan mobil yang tersedia" (default ON).
2. **Kategori Kendaraan**: radio list dengan jumlah di kanan: Semua Kategori (N), City Car & Compact, MPV Keluarga, SUV, Sedan, Minibus.
3. **Pilihan Layanan**: dua kartu radio: "Lepas Kunci (Self-Drive) / Syarat KTP & SIM A" dan "Dengan Sopir / +Rp {tarif}/hari (termasuk sopir)".
4. **Transmisi**: checkbox Automatic (AT), Manual (MT).
5. **Rentang Tarif Harian**: dua input Min/Maks Rp.
6. Tombol biru penuh `[search] Terapkan Filter`.

**Konten**
- Baris hasil: "Menampilkan **N Mobil Tersedia** untuk periode **15 – 18 Agu 2026**"; kanan dropdown "Urutkan: Tarif Terendah | Tarif Tertinggi | Terpopuler | Tahun Terbaru".
- Grid 3 kolom kartu mobil versi katalog: tag "Ready / Siap Sewa" biru muda + kategori + tahun; nama; caption lokasi "Kantor FA RENT CAR, Kedawung"; kotak spesifikasi 2×2; "TARIF HARIAN" + harga biru; tombol biru "Pilih Mobil [arrow_forward]".
- **Kartu terbooking**: foto grayscale + overlay putih 70% berisi `[event_busy]` "Terbooking di Tanggal Ini" + "Tersedia kembali mulai {tanggal}"; tag merah muda "Terbooking s/d {tgl}"; footer "Status Ketersediaan: Booked (Sewa Aktif)" + tombol tinted `[calendar_month] Lihat Jadwal Bebas` (membuka kalender ketersediaan mobil).
- **Paginasi**: "Menampilkan 1 – 6 dari total N armada aktif" | Prev 1 2 3 Next; 6 kartu per halaman (desktop), 12 opsional.
- **Banner komitmen** (kartu `surface-low` radius 16px): `[health_and_safety]` "Komitmen Transparansi & Pemeriksaan Sebelum Serah Terima" + paragraf; tanpa angka "40 titik" kecuali user konfirmasi.
- Footer sama seperti A1.

### A4. Katalog Armada — Mobile
Referensi: `katalog_armada_mobile_web_fe_rent_car`

- Topbar sama A2. Breadcrumb kecil. Judul + badge pill hijau "Live Status".
- **Kartu jadwal** `surface-low`: `[calendar_today] JADWAL SEWA ARMADA` + "15 – 18 Agu 2026" bold + chip biru "N Hari"; tap membuka sheet tanggal.
- **Baris chip horizontal scroll**: `[tune]` (buka sheet filter lengkap = isi sidebar A3), Semua (N), Lepas Kunci, Dengan Sopir, MPV (N), SUV (N), Sedan (N), Matic (AT).
- Baris hasil "N Mobil Tersedia Siap Pakai" + dropdown urut.
- Kartu mobil penuh lebar; harga biru kiri, tombol biru "Pilih Mobil →" kanan.
- Paginasi → tombol "Muat Lebih Banyak".
- Bottom tab bar (aktif: Armada).

### A5. Layar customer tanpa referensi (dibuat mengikuti sistem)
Wajib screenshot → persetujuan user sebelum final.
- **Detail Mobil**: breadcrumb; galeri 1 besar + 2 kecil; nama + tag; kotak spesifikasi 4 kolom; fasilitas chip; tabel tarif (harian/mingguan/bulanan/sopir/overtime); kalender ketersediaan bulan; syarat sewa; panel kanan sticky: harga, tanggal, segmented sopir, ringkasan, tombol hitam "Tambah ke Booking".
- **Keranjang & Form Booking**: stepper 3 langkah; daftar mobil dipilih (thumbnail, periode, sopir, harga, hapus); "+ Tambah mobil lain"; form data penyewa 2 kolom; upload KTP & SIM berdampingan; checkbox S&K; panel ringkasan sticky + kode promo + tombol biru "Buat Invoice".
- **Invoice & Countdown** (setelah submit): badge kuning "Menunggu Konfirmasi"; countdown besar `01:59:59`; nomor invoice monospace; rincian; kotak rekening + "Salin"; tombol hijau "Kirim Bukti via WhatsApp" (pesan terisi: nomor invoice, nama, total); tombol "Unduh Invoice PDF"; peringatan simpan tautan.
- **Portal Status** (tautan token): header status + countdown (jika masih hold); timeline 5 langkah; kartu dokumen (status Disetujui/Ditolak + alasan + tombol "Unggah Ulang"); kartu pembayaran; info pengambilan + peta; tombol "Ajukan Perpanjangan"; setelah selesai: form rating bintang + ulasan; berita acara serah-terima PDF.
- **Cek Status** (menu navbar): satu input "Nomor WhatsApp" + "Nomor Invoice" → kirim tautan portal via WA (tidak menampilkan data langsung).

---

## B. WEB ADMIN

### B1. Kerangka (shell) — Desktop
Referensi: semua layar admin desktop

- **Sidebar** 256px putih, border kanan, tinggi penuh, sticky:
  - Logo: kotak hitam radius 12px `[directions_car]` putih + "FA RENT CAR" bold + "Operations Hub" caption biru uppercase.
  - Label "MAIN MENU" `label-md` abu.
  - Menu (ikon + teks, radius 12px, tinggi 44px; aktif = latar biru teks putih; hover `surface-low`):
    `[dashboard]` Dashboard · `[calendar_month]` Kalender · `[garage_home]` Manajemen Armada · `[receipt_long]` Manajemen Booking · `[verified_user]` Verifikasi & Pembayaran · `[car_rental]` Serah Terima & Kondisi · `[badge]` Sopir · `[group]` Customer · `[payments]` Keuangan · `[build_circle]` Servis & Dokumen · `[share_location]` GPS & Geofence (disabled + chip "Fase 4") · `[monitoring]` Laporan · `[admin_panel_settings]` Pengaturan & Audit.
  - Bawah: kartu profil `surface-low` radius 12px: avatar inisial, nama, peran; ikon `[lock_open]` = keluar.
- **Topbar** 64px putih blur, border bawah: kiri kotak pencarian `surface-low` radius 12px `[search] Cari plat nomor, penyewa, invoice…  ⌘K`; kanan tombol hitam `[add_circle] Buat Booking Baru`, ikon bel dengan titik merah, avatar + "Nama / Peran". **Tidak ada pemilih cabang.**
- **Area konten** latar `background`, padding 32px, maks lebar 1280px.

### B2. Dashboard — Desktop
Referensi: `dashboard_operasional_admin_desktop_2` (utama) & `_1` (varian header 2 baris)

**Header kartu putih** (radius 16px, padding 24px, dua kolom)
- Kiri: pill hijau muda "Operasional Live" + caption "• Terakhir diperbarui: Baru saja"; `headline-lg` "Pusat Kendali Operasional"; teks abu "Ringkasan status booking, armada aktif, dan tindak lanjut prioritas tinggi FA RENT CAR."
- Kanan (wrap 2 baris): tombol hitam `[add_circle] + Booking Manual` (buka modal B2-M), tombol secondary `[calendar_month] Kalender Hari Ini`, `[build] Input Servis`, `[download] Laporan Harian`. (Tombol "Cek GPS Armada" diganti Kalender sampai Fase 4.)

**4 kartu statistik** (grid 4, tinggi sama)
1. **VOLUME BOOKING** `[car_rental]` ikon kotak biru muda — angka `stat` "18" + "unit hari ini" — bawah: "342 Bulan Ini" + hijau `[trending_up] +14.2% MoM`.
2. **TINDAKAN MENDESAK** `[notification_important]` kotak merah muda dengan titik merah — angka merah "6" + "booking perlu aksi" — bawah: "Hold Timeout & Pembayaran" + badge merah "Penting".
3. **PENERIMAAN KAS (GROSS)** `[payments]` kotak hijau muda — "Rp 14.850.000" — "Penerimaan kas hari ini" — bawah: "Akumulasi Bulan:" + biru "Rp 312.400.000".
4. **SIKLUS SEWA BERJALAN** `[sync_alt]` — dua kotak `surface-low`: "Aktif Jalan **42**" (angka biru) & "Selesai **280**" — bawah caption "12 Dibatalkan • 8 Kedaluwarsa".

**Utilisasi Armada** (kartu penuh lebar)
- Kiri: ikon `[directions_car]` kotak biru muda + `headline-md` "Utilisasi Armada" + caption "Kapasitas N unit kendaraan terdaftar". Kanan: "60%" `stat` + chip "Tingkat Okupansi Optimal".
- Bar tersegmen tinggi 8px radius full: biru (disewa) / hitam (siap) / kuning (ditahan) / merah (servis).
- Legenda 4 kolom: titik warna + label uppercase + "**20 Mobil** (44.4%)".

**Baris dua kolom (2fr : 1fr)**
- **Urgent Action Center** (kiri): header ikon "!" merah muda + judul + subteks "Selesaikan pesanan berbatas waktu untuk mencegah armada menganggur" + badge merah "3 Tertahan". Daftar item `surface-low` radius 12px padding 20px, ikon kotak putih kiri:
  - `[timer]` INV monospace · badge merah muda `[hourglass_top] 18m 42s tersisa` · "**Budi Santoso • Toyota Avanza (E 1188 AB)**" · "Status: Belum ada pembayaran transfer • Batas hold 2 jam" · tombol secondary `[chat] Hubungi WA` + destructive `[cancel] Batal Manual`.
  - `[receipt_long]` INV · badge biru muda "Bukti Transfer Masuk" · nama • mobil · "Nominal: Rp 2.550.000 (BCA) • Butuh verifikasi KTP & SIM A" · tombol biru `[verified] Verifikasi Sekarang`.
  - `[edit_calendar]` INV · badge abu "Permintaan Perubahan" · nama • mobil · "Ajukan perpanjangan 1 hari • Menunggu persetujuan" · tombol secondary `[visibility] Review Booking`. (Mengganti item "Perusahaan/B2B".)
  - Klik item → halaman Verifikasi (B4) dengan item terpilih.
- **Kolom kanan** dua kartu bertumpuk:
  - **Peringatan Servis & Legalitas** `[warning]` + badge kuning "Perhatian": item `surface-low`: ikon kotak putih `[oil_barrel]` "Servis Ganti Oli (< 500 km)" + plat & model + link biru "Jadwalkan"; `[badge]` "Jatuh Tempo Pajak STNK" + "E 2039 KL (Avanza) • Exp: 24 Agu 2026 (14 hari)" + link "Perpanjang".
  - **Mobil Paling Laris (Bulan Ini)** `[stars]` + caption "Top 4 Model": 4 baris "1. Nama Mobil" — "38x Sewa" biru bold — bar horizontal 6px (biru untuk #1, hitam untuk lainnya, proporsional).

**Jadwal Pengambilan & Pengembalian Hari Ini** (kartu penuh)
- Header: ikon `[schedule]` + judul + subteks "Pantau pergerakan fisik unit, serah terima kunci, dan inspeksi kembali"; kanan segmented "Semua Jadwal | Khusus Hari Ini (3)" (aktif hitam).
- Tabel kolom: WAKTU (titik biru=pengambilan/abu=pengembalian + "14:00 WIB" monospace) · TIPE AKSI (badge biru muda `[logout] PENGAMBILAN` / abu `[login] PENGEMBALIAN`) · UNIT KENDARAAN (ikon kotak + nama bold + "plat • warna/odo" monospace kecil) · PENYEWA & KONTAK (nama + nomor WA monospace) · SOPIR (nama sopir atau "Lepas kunci") · STATUS OPERASIONAL (chip) · TINDAKAN (tombol secondary `[checklist] Form Checklist` / `[document_scanner] Inspeksi Masuk`).
- Kolom "Lokasi Handover" **dihapus** (selalu kantor).

**Modal B2-M: Input Booking Manual Cepat** (overlay blur, panel putih radius 24px, lebar 640px)
- Header ikon `[car_rental]` + "Input Booking Manual (Walk-in / Telepon)" + caption "Invoice dibuat otomatis" + `[close]`.
- Form 2 kolom: Nama Penyewa, Nomor WhatsApp, Pilih Unit Armada (select multi), Model Layanan (Lepas Kunci / Dengan Sopir), Tgl & Jam Mulai, Tgl & Jam Selesai (atau Durasi preset: 1 Hari, 2 Hari, 3 Hari, 1 Minggu).
- Ringkasan: "Estimasi Subtotal Rp …" dan "Total Ditagihkan Rp …" (tanpa deposit).
- Footer: tombol secondary "Batal" + biru "Simpan & Terbitkan Invoice".

### B3. Dashboard — Mobile
Referensi: `dashboard_operasional_admin_mobile_web_spaced`

- **Topbar**: logo + "FA RENT CAR" + chip hitam kecil "OPS HUB"; baris kedua caption `[location_on] Kantor Kedawung`; kanan bel + avatar.
- Baris chip: hijau muda "Live Sync • 12 detik lalu" + kanan `[wifi_tethering] Online`.
- Judul `headline-lg-mobile` + teks.
- **Tombol aksi horizontal scroll**: hitam "+ Booking Baru", secondary "Kalender", "Input Servis", "Laporan".
- **Stat card grid 2×2** (padding 16px): Volume Booking / Urgent Tasks (kartu merah muda penuh, angka merah "6 Perlu Aksi") / Penerimaan / Status Sewa ("42 Aktif" biru).
- **Utilisasi** kartu: judul + chip "60% Okupansi"; bar; legenda 2×2.
- **Tindakan Mendesak**: judul + badge merah "3 Tertahan" + link "Lihat Semua"; kartu item dengan thumbnail mobil 48px, INV monospace, badge waktu, nama, mobil • plat, status biru; tombol berpasangan penuh lebar (secondary + destructive / secondary "Cek Struk" + biru "Verifikasi Sekarang").
- **Servis & Legalitas**: list baris (ikon merah kotak, plat + model bold, keterangan merah, tombol hitam kecil "Jadwalkan"/"Perpanjang").
- **Jadwal Serah Terima Hari Ini**: timeline vertikal; setiap item: badge hitam "14:00 WIB • PENGAMBILAN" + plat monospace kanan; nama mobil bold; baris `[person] Nama` + nomor WA biru; baris `[store] Kantor FA RENT CAR`.
- **Bottom tab bar**: `[dashboard] Dashboard`, `[directions_car] Armada`, `[receipt_long] Booking` (badge angka merah), `[verified_user] Verifikasi`, `[more_horiz] Menu` (sheet berisi sisa menu).

### B4. Manajemen Booking & Verifikasi — Desktop
Referensi: `manajemen_booking_verifikasi_desktop`

**Header**: caption biru "Modul Operasional" + chip hijau "Auto-Sync Aktif"; `headline-lg` "Manajemen Booking & Verifikasi Transaksi"; kanan tombol secondary `[file_download] Ekspor Rekap CSV` + hitam `[add_circle] + Booking Manual`.

**Bar filter** (kartu putih, satu baris): input `[search] INV / NIK / TELP` · date range `[calendar_today] 09 Ags 2026 – 15 Ags 2026` · select `[commute] Semua Tipe Sewa | Lepas Kunci | Dengan Sopir` · select mobil · ikon `[filter_alt_off]` reset · tombol biru `[tune] Terapkan`.

**Tabs status** (pill row): Semua (342) · Menunggu Konfirmasi (6) · Aktif / Dirental (42) · Selesai (280) · Dibatalkan (12) · Kedaluwarsa (8). Aktif = hitam teks putih; angka dalam chip kecil.

**Layout dua kolom (5fr : 7fr)**

*Kiri — Antrean* (kartu putih)
- Header: "Antrean Transaksi Menunggu Validasi (6)" + caption "Urut: Prioritas Batas Waktu".
- Item terpilih (latar `secondary-fixed`, border biru): INV monospace + chip "Multi-Car" + nama bold; badge merah muda `[timer] Sisa 01:24:18` + caption "Batas Bayar 2 Jam"; `[date_range] 09 – 12 Ags 2026` + chip "3 Hari"; daftar mobil `[directions_car] BMW E46 325i (B 1846 FE) & Toyota Avanza (B 2910 UXZ)`; footer: "Total Tagihan **Rp 3.900.000**" + chip hijau "Bukti Terunggah" + `[chevron_right]`.
- Item lain (ringkas): INV + chip tipe + nama; badge waktu `[schedule] Sisa 00:45:10`; "Mobil (plat) · N Hari"; harga bold kanan + chip status ("Review Dokumen" biru muda / "Bukti Belum Valid" merah muda / "Menunggu Verifikasi" kuning).

*Kanan — Panel detail* (kartu putih, scroll internal)
1. **Header customer**: avatar inisial biru muda 56px; nama `headline-md`; caption "ID: CUST-8831"; "+62 … · email"; kanan tombol hijau `[chat] Hubungi Customer` + ikon `[open_in_new]` (profil CRM).
2. **3 kotak info** `surface-low`: "DURASI & JADWAL / 09 – 12 Ags 2026 / 3 Hari Penuh (72 Jam)"; "TITIK PENGAMBILAN / Kantor FA RENT CAR / Catatan: {catatan customer}"; "STATUS RISIKO PENYEWA / `[verified]` Skor: Bersih / Langganan (4x Sukses, 0 Insiden)" — atau merah bila blacklist.
3. **Rincian Komponen Tagihan**: baris label–nilai: "Sewa BMW E46 325i (3 Hari × Rp 650.000)" Rp 1.950.000; "Sewa Toyota Avanza (3 Hari × Rp 450.000)"; "Layanan Sopir – Avanza (1 Hari × Rp 200.000)"; "Diskon {promo} (10%)" biru "− Rp 600.000"; garis; "Total Tagihan:" `price-lg` biru. **Tanpa baris deposit.**
4. **Modul Verifikasi Dokumen** `[badge]`: caption "Tersimpan terenkripsi · Watermark FA RENT CAR" + chip "2 Dokumen Siap Review". Dua kartu berdampingan (KTP, SIM A): header ikon + nama dokumen + chip status (Terverifikasi hijau / Menunggu kuning / Ditolak merah); area thumbnail 16:10 dengan watermark diagonal "FA RENT CAR ONLY · {tanggal}" + tombol `[zoom_in] Perbesar`; baris "NIK:" monospace, "Nama KTP:"; untuk SIM: "No SIM:", "Masa Berlaku:" (merah jika < 30 hari / kedaluwarsa); tombol biru "Setujui KTP/SIM" + destructive "Tolak". Klik Tolak → **Form Penolakan** inline (`[warning]` judul, select alasan: Foto buram / Tidak sesuai nama / Kedaluwarsa / Lainnya, textarea catatan, tombol `[send] Kirim via WA` + `[sticky_note_2] Simpan`).
5. **Validasi Pembayaran** `[payments]`: judul "Validasi Pembayaran & Rekonsiliasi" + caption "Transfer manual · dicatat admin" + chip hijau "100% Cocok (LUNAS)" atau merah "Kurang Rp …" atau abu "Belum Ada Pembayaran"; tombol `[visibility] Lihat Struk`. Grid: "METODE PEMBAYARAN / `[account_balance]` Bank {X} Transfer"; "WAKTU TRANSAKSI MASUK / 09 Ags 2026 · 13:45 WIB"; "NOMINAL TERTERA DI INVOICE / Rp 3.900.000"; "NOMINAL MASUK / Rp 3.900.000 `[check_circle]` hijau". Bila belum ada pembayaran, tampilkan **form input**: nominal, tanggal & jam, bank, upload bukti, tombol biru "Simpan Pembayaran".
6. **Prasyarat Aktivasi** `[task_alt]`: tiga chip checklist: "Dana 100% Lunas", "Bukti Transfer Sah", "KTP & SIM Lolos" (hijau centang / abu kosong).
7. Tombol biru besar penuh `[key] Aktifkan Booking & Kunci Armada (Status: Aktif)` — disabled sampai 3 prasyarat terpenuhi.
8. Baris 3 tombol secondary: `[print] Cetak Invoice PDF` · `[edit_note] Koreksi Pembayaran` · destructive `[cancel] Batalkan / Refund`.

**Modal Input Pemesanan Manual** (sama seperti B2-M; judul "Input Pemesanan Manual (Walk-in / Telepon)", caption "Admin · Kode invoice otomatis").

### B5. Manajemen Booking & Verifikasi — Mobile
Referensi: `manajemen_booking_verifikasi_mobile_web_spaced`

- Topbar sama B3. Judul "Manajemen Booking" + caption "Verifikasi Identitas & Pembayaran"; kanan chip biru muda `[verified] 6 Butuh Review`.
- Baris ikon: `[search]` `[tune]` + chip tanggal + chip "Tipe: Semua Unit" + chip "Metode: Semua" (scroll horizontal).
- Tabs pill scroll horizontal: Semua 342 · `[pending_actions]` Menunggu Konfirmasi 6 (aktif hitam) · Aktif 42 · Selesai 280 · Dibatalkan 12.
- Banner kuning muda: `[bolt] Antrean Prioritas #1` — "Jadwal pickup hari ini pukul 15:00 WIB" + kanan "1/6".
- **Kartu detail satu kolom** (sama urutan B4 tapi vertikal): INV + chip "MULTI-CAR" + badge `[schedule] Sisa Waktu: 01:24:18` + "Dibuat: 09 Ags, 13:30"; avatar + nama + `[verified]` + WA + tombol hijau penuh "Hubungi WA"; kotak `[shield] Skor Risiko`; **Unit Armada Dipesan (2 Mobil)** list (nama bold, plat, "Lepas Kunci • Odo • Tersedia"); Rincian Tagihan; Dokumen (2 kartu bertumpuk, tombol Setujui/Tolak sejajar); Pembayaran; Prasyarat; tombol biru besar "Aktifkan Booking"; tombol secondary bertumpuk.
- Navigasi antar antrean: tombol bawah sticky "‹ Sebelumnya | 1/6 | Berikutnya ›".
- Bottom tab bar (aktif: Verifikasi).

### B6. Layar admin tanpa referensi (dibuat mengikuti sistem)
Wajib screenshot → persetujuan user.
- **Kalender**: toggle Hari/Minggu/Bulan; baris per mobil (nama + plat), blok berwarna per booking (biru aktif, kuning hold, abu servis, merah terlambat); filter mobil/status; klik blok → sheet detail.
- **Manajemen Armada**: tabel/grid mobil (foto, nama, plat, status chip, tarif harian, odo, servis berikutnya); tombol hitam "+ Tambah Mobil"; halaman detail dengan tabs: Info · Foto · Tarif · Kalender · Servis & Dokumen · Riwayat.
- **Serah Terima & Kondisi**: pilih booking aktif → form Keluar/Kembali: odometer, BBM slider 8 bar, checklist grid, diagram mobil 4 sisi dengan penanda kerusakan, upload foto multi, tanda tangan canvas, tombol "Terbitkan Berita Acara".
- **Sopir**: kartu sopir (foto, nama, status chip Tersedia/Tugas/Libur, SIM exp), jadwal mingguan, penugasan.
- **Customer (CRM)**: tabel (nama, WA, total booking, total belanja, label chip), detail dengan riwayat & catatan & tombol blacklist.
- **Keuangan**: tabs Pemasukan · Pengeluaran · Refund (approval) · Kas & Shift; tabel + tombol tambah.
- **Servis & Dokumen**: daftar pengingat (jatuh tempo diurutkan), riwayat servis per mobil.
- **Laporan**: filter periode; kartu ringkasan; grafik garis pendapatan & booking; grafik batang per mobil; heatmap hari×jam; tombol Ekspor PDF/Excel.
- **Pengaturan & Audit**: tabs Profil Usaha · Rekening · Template WhatsApp · Aturan (hold, buffer, retensi dokumen) · Staff & Peran · Audit Log (tabel: waktu, aktor, aksi, objek, sebelum→sesudah).
- **Login**: kartu tengah 400px: logo, "Masuk ke Operations Hub", email, password, tombol hitam "Masuk".

---

## C. Perilaku & interaksi lintas layar

| Elemen | Perilaku |
|---|---|
| Countdown hold | Tick tiap detik; < 15 menit berubah merah; 0 → badge "Kedaluwarsa" dan tombol aksi disabled |
| Badge status | Selalu dari enum booking; warna sesuai `design.md` §5 |
| Tombol WhatsApp | Membuka `wa.me/62…?text=` dengan template dari Pengaturan; teks berisi nomor invoice |
| Kartu mobil terbooking | Tidak bisa dipilih; hover menampilkan tanggal tersedia kembali |
| Filter katalog | Mengubah query string URL agar tautan dapat dibagikan; hasil diperbarui tanpa reload |
| Tabel admin | Klik baris membuka detail; kolom dapat diurutkan; kosong → empty state |
| Form | Validasi inline saat blur; tombol submit loading spinner kecil di dalam tombol |
| Toast | Kanan atas desktop / bawah mobile; sukses hijau, gagal merah, 4 detik |
| Skeleton | Sesuai bentuk kartu/tabel saat memuat |
| Modal/Sheet | Desktop = modal tengah radius 24px; mobile = bottom sheet dengan handle |
| Keyboard | ⌘K/Ctrl+K fokus pencarian global admin; Esc tutup modal |

## D. Checklist kesesuaian sebelum PR UI

- [ ] Urutan bagian sama dengan blueprint layar terkait.
- [ ] Tidak ada teks "FE Rent Car", Jakarta, cabang, deposit, DP, antar-jemput, bandara/hotel, asuransi all-risk, PPh 23, B2B.
- [ ] Harga di sisi customer biru besar; tombol utama hitam; tombol submit biru.
- [ ] Label kecil uppercase; INV & plat monospace.
- [ ] Screenshot desktop 1280px dan mobile 390px dilampirkan di PR dan dibandingkan side-by-side dengan PNG referensi.
