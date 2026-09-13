---
name: fa-security-payments
description: "Gunakan saat menangani KTP/SIM, upload privat, token portal tamu, autentikasi dan RBAC admin, konfirmasi transfer manual, refund, audit log, atau data pribadi FA RENT CAR."
---

# Keamanan dokumen dan transaksi manual

## Sebelum mengubah kode

Baca aturan akses, pembayaran, dan retensi terbaru di PRD/rules. Petakan aktor, objek, operasi, dan lokasi penyimpanan data. Tandai data sensitif yang melewati browser, API, storage, log, cache, dan worker.

## Portal dan akses admin

1. Terapkan autentikasi, izin per operasi, dan otorisasi per objek di server. Tombol tersembunyi atau ID yang sulit ditebak tidak menggantikan pemeriksaan akses.
2. Ikuti matriks staff/superadmin terbaru. Refund dan tindakan sensitif lain harus melewati approval yang disyaratkan PRD, bukan hanya label role di UI.
3. Portal guest memakai token acak kriptografis, minimal 32 byte sesuai acuan PRD, bukan nomor invoice/telepon. Simpan hash token dan rancang pencabutan/rotasi sesuai kebijakan produk.
4. Batasi token ke booking yang benar. Jangan menerima booking ID lain dari client tanpa memeriksa keterikatannya.
5. Lindungi token dari access log, analytics, referrer, dan cache; gunakan kebijakan referrer/cache yang sesuai. Jangan memasukkan data KTP/SIM atau token portal ke pesan WhatsApp tanpa kebutuhan dan keputusan eksplisit.
6. Ikuti mekanisme session yang sudah dipilih. Bila memakai cookie, periksa HttpOnly, Secure, SameSite, dan mitigasi CSRF. Rate-limit login, pencarian token, booking publik, dan upload.

## Upload dan dokumen privat

- Verifikasi izin sebelum menerbitkan akses upload/download. Validasi tipe file berdasarkan isi, ukuran, ekstensi yang diizinkan, serta kepemilikan object key; jangan percaya MIME atau nama file dari browser.
- Acuan PRD untuk KTP/SIM adalah JPG/PNG/PDF maksimal 5 MB; pastikan masih berlaku. Jangan menganggap bukti transfer memiliki aturan format identik tanpa memeriksa kontraknya.
- Gunakan object key acak dan storage privat. Signed URL harus terbatas waktu dan diterbitkan hanya setelah otorisasi; jangan menyimpan URL sementara sebagai identitas permanen dokumen.
- Tangani upload terputus, objek yatim, karantina/pemindaian file sesuai kemampuan sistem, dan kegagalan storage tanpa menyatakan dokumen berhasil diterima.
- Jangan menaruh dokumen, token, URL bertanda tangan, atau isi request sensitif di log, fixture, Git, screenshot, maupun artefak publik.
- Untuk PWA admin, jangan cache respons portal, dokumen, atau API sensitif di service worker.
- Retensi dokumen harus berdasarkan kebijakan yang disetujui. Jika jumlah hari belum ditentukan, jangan menebak atau mengaktifkan penghapusan otomatis terhadap data nyata.

## Konfirmasi pembayaran dan refund

1. Acuan produk adalah transfer manual: admin memasukkan nominal dan mengunggah foto bukti sebelum konfirmasi. Jangan mengganti alur ini dengan payment gateway tanpa permintaan.
2. Server memeriksa nominal, bukti yang sudah tersimpan dan terkait transaksi, izin aktor, status dokumen, status booking, dan deadline hold.
3. Aktivasi membutuhkan dokumen disetujui dan pembayaran 100% sesuai invoice yang berlaku. Nominal tidak valid atau bukti hilang tidak boleh mengubah booking menjadi aktif.
4. Terapkan idempotensi pada retry/double-click. Update pembayaran, status booking, dan catatan audit harus konsisten; cegah pembayaran ganda atau aktivasi parsial.
5. Refund memerlukan approval superadmin sesuai PRD. Validasi akumulasi refund tidak melebihi pembayaran yang dapat dikembalikan dan simpan histori, bukan menghapus pembayaran lama.
6. Audit append-only mencatat aktor, waktu, operasi, objek, serta perubahan yang diperlukan; redaksi field sensitif. Jangan mengabadikan isi dokumen atau token dalam snapshot audit.

## Verifikasi minimum

Uji guest tanpa token, token salah/dicabut, akses booking milik pihak lain, staff tanpa izin, file palsu/terlalu besar, signed URL kedaluwarsa, nominal kurang/tidak valid, bukti hilang, dokumen ditolak, konfirmasi ganda, serta refund tanpa approval. Pastikan error dan log tidak membocorkan data pribadi.
