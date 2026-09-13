---
name: fa-booking-pricing
description: "Gunakan saat mengubah booking tamu multi-mobil, ketersediaan armada/sopir, hold dan kedaluwarsa, kalkulasi tarif, promo, invoice snapshot, atau revisi penyewaan FA RENT CAR."
---

# Booking, ketersediaan, dan harga

## Sumber aturan

Baca PRD, rules, schema, state machine, dan test terkait sebelum mengubah domain. Acuan PRD yang pernah ditinjau: booking tanpa akun, beberapa mobil dalam satu invoice, durasi/sopir dapat berbeda per mobil, hold 2 jam yang dapat diperpanjang admin, lunas 100% dan dokumen disetujui sebelum aktif, tanpa deposit, serta ambil/kembali di kantor. Verifikasi semuanya terhadap dokumen terbaru; jangan menambahkan antar-jemput atau pembayaran otomatis dari contoh desain.

## Alur implementasi

1. Nyatakan invariant dan transisi yang diubah, termasuk siapa yang boleh memicunya. Cocokkan nama status dengan implementasi, bukan menciptakan enum paralel.
2. Validasi interval setiap item, kepemilikan booking, status armada, dan penugasan sopir di server. Tetapkan semantik batas interval serta buffer dari aturan yang disetujui.
3. Simpan waktu sebagai instant yang tidak ambigu; tampilkan dan hitung batas kalender bisnis dalam `Asia/Jakarta`. Jangan bergantung pada timezone mesin.
4. Cek bentrok untuk mobil maupun sopir, termasuk hold yang masih berlaku, booking aktif, blok servis, dan buffer sesuai model yang ada.
5. Jadikan alokasi semua item booking atomik. Jika satu mobil gagal, jangan meninggalkan reservasi item lain. Lindungi race condition melalui constraint database atau transaksi/locking yang benar; pemeriksaan SELECT sebelum INSERT saja tidak cukup.
6. Untuk banyak resource, gunakan urutan lock konsisten. Tangani konflik transaksi dengan retry terbatas atau error domain yang jelas.
7. Simpan deadline hold di server. Worker expiry harus idempotent, membaca deadline terbaru setelah perpanjangan, dan tidak membatalkan booking yang sudah aktif.
8. Pastikan ketersediaan dan aktivasi memakai deadline server meski worker tertunda. Race konfirmasi pembayaran versus expiry harus memiliki satu hasil konsisten dalam transaksi.

## Kalkulasi harga dan invoice

- Gunakan nilai uang integer rupiah dengan validasi rentang aman; jangan menghitung uang memakai pecahan floating-point.
- Hitung harga final di server dari input yang tervalidasi. Total dari browser bukan sumber kebenaran.
- Pisahkan kalkulator murni dari query database agar kombinasi tarif harian/mingguan/bulanan dapat diuji deterministik.
- Sebelum menerapkan kombinasi termurah, pastikan arti satu hari/minggu/bulan, pembulatan durasi, prioritas tarif musiman, promo, overtime, dan denda. Jangan mengasumsikan bulan selalu 30 hari tanpa keputusan.
- Buat rincian per item dan biaya tambahan. Uji urutan diskon, aturan penumpukan promo, batas diskon, dan total tidak negatif sesuai PRD.
- Snapshot rincian harga dan aturan relevan ketika invoice terbit. Perubahan tarif tidak boleh menghitung ulang invoice lama.
- Perubahan booking menghasilkan revisi invoice yang dapat ditelusuri, bukan menimpa histori. Hitung ulang ketersediaan secara atomik saat mengubah tanggal/armada.
- Nomor invoice harus unik, tetapi bukan kredensial untuk membuka portal.

## Verifikasi minimum

- Dua request bersamaan untuk mobil/sopir sama tidak boleh keduanya berhasil.
- Satu item bentrok pada booking multi-mobil membuat seluruh alokasi gagal tanpa sisa hold.
- Uji tepat sebelum, saat, dan sesudah deadline; perpanjangan; worker retry; race expiry/aktivasi.
- Uji interval bersebelahan, buffer, pergantian tanggal WIB, dan blok servis.
- Uji batas tarif harian/mingguan/bulanan, promo, biaya sopir, dan perubahan tarif setelah invoice terbit.
- Uji revisi tanpa kehilangan invoice lama dan tanpa membuat jadwal bentrok.

Gunakan database PostgreSQL terisolasi untuk pembuktian concurrency; mock repository saja tidak membuktikan lock/constraint bekerja.
