---
name: fa-quality-gates
description: "Gunakan saat menulis regression test, memverifikasi fitur/bugfix, menilai kesiapan PR/rilis, atau memeriksa risiko booking, pembayaran, keamanan, dan UI FA RENT CAR."
---

# Pengujian berbasis risiko dan kesiapan rilis

## Persiapan

1. Baca diff, acceptance criteria, instruksi repository, manifest, script CI, dan test yang sudah ada.
2. Petakan perilaku berubah, dependency terdampak, dan risiko regresinya. Pilih check berdasarkan perubahan; perubahan dokumen tidak perlu menyalakan seluruh aplikasi.
3. Gunakan runner dan versi yang terpasang. Jangan mengasumsikan perintah pnpm/test atau service pendukung sudah tersedia pada checkout kosong.
4. Pakai database, storage, dan seed sintetis yang terisolasi. Jangan menjalankan migration reset, cleanup, atau test destruktif pada produksi/shared database.

## Matriks verifikasi

| Permukaan berubah | Bukti yang diperlukan |
| --- | --- |
| Harga/promo/invoice | Unit test tabel kasus batas, nilai uang, snapshot dan revisi |
| Booking/ketersediaan | Integration test PostgreSQL nyata untuk constraint, transaksi, race, dan rollback multi-item |
| Hold/worker | Clock terkendali; test deadline, retry, restart, perpanjangan, race aktivasi/expiry |
| API/RBAC/portal | Test status HTTP, kontrak error, otorisasi objek, role negatif, validasi dan idempotensi |
| Upload/pembayaran/refund | Test file/nominal/bukti invalid, kebocoran akses, dokumen ditolak, approval dan duplikasi |
| Migrasi | Apply pada database terisolasi; uji preservasi data dan kompatibilitas kode bila relevan |
| UI | Interaksi browser pada aplikasi berjalan, viewport mobile/desktop, screenshot baru untuk perubahan visual |
| Dokumen/skill | Struktur/path, metadata, link lokal, konsistensi aturan, dan diff tanpa rahasia |

## Skenario lintas sistem utama

Jalankan subset relevan dengan perubahan; tandai skenario yang belum didukung implementasi, bukan berpura-pura mengujinya.

- Guest memilih beberapa mobil, mengunggah dokumen, memperoleh invoice dan tautan portal.
- Admin menyetujui dokumen, memasukkan nominal dan bukti transfer, lalu mengaktifkan booking yang memenuhi syarat.
- Dokumen ditolak dapat diunggah ulang tanpa mengizinkan akses ke booking lain.
- Hold kedaluwarsa membebaskan ketersediaan; request konfirmasi terlambat tidak mengaktifkannya secara tidak sah.
- Tarif baru tidak mengubah invoice lama; revisi mempertahankan histori.
- Booking bersamaan tidak mengalokasikan mobil atau sopir yang sama pada interval bentrok.
- Pembatalan/refund menjaga approval, total keuangan, dan audit.

## Aturan pelaksanaan

- Reproduksi bug dengan test yang gagal karena bug tersebut jika memungkinkan, kemudian buktikan perbaikannya.
- Jangan melemahkan assertion, menambah skip, atau memperluas timeout untuk menyembunyikan masalah. Perubahan expectation harus didasarkan pada perilaku yang memang diminta berubah.
- Jalankan lint, typecheck, test, dan build yang relevan melalui script repository. Periksa root cause saat hasil mengejutkan.
- Test concurrency harus memakai transaksi/koneksi bersamaan; test sekuensial atau mock tidak membuktikan race aman.
- Pisahkan kegagalan produk dari blocker lingkungan, tetapi jangan menyatakan check lolos jika tidak selesai.
- Tinjau diff akhir, file tak terlacak, referensi terdampak, dan potensi rahasia sebelum handoff.
- Jika PR diminta, ikuti jalur source-control resmi, sertakan ringkasan dan Verification aktual, serta ikuti review/CI sesuai instruksi platform. Jangan menganggap CI selesai hanya karena push berhasil.

## Format laporan

Tuliskan hasil fitur, check yang dijalankan beserta hasil aktualnya, bukti UI bila relevan, dan yang belum terverifikasi. Bedakan `lulus`, `gagal`, `terblokir`, dan `tidak dijalankan`; jangan menyamakan keterbatasan lingkungan dengan keberhasilan produk.
