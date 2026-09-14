---
name: fa-reference-ui
description: "Gunakan saat membangun atau mengubah UI web customer/admin FA RENT CAR berdasarkan referensi HTML/screenshot, design.md atau desainuiux.md; termasuk komponen, responsive, aksesibilitas, dan pembuktian visual."
---

# Implementasi UI berdasarkan referensi

## Temukan acuan yang berlaku

1. Cari `docs/design.md`, `desainuiux.md`/`designUIUX.md` (di root atau docs), dan `docs/design-reference/` jika tersedia. Baca juga PRD/rules agar contoh visual tidak mengubah scope bisnis.
2. Pastikan mana referensi terbaru yang disetujui. Prototipe yang sudah ditolak bukan fallback desain. Jika acuan belum ada di checkout, laporkan dan minta akses/acuan sebelum menjanjikan kemiripan.
3. Petakan layar yang diminta ke route, screenshot, dan HTML sumber yang tepat. Bedakan detail yang benar-benar terlihat dari interpretasi untuk layar tanpa referensi.
4. Perlakukan HTML referensi sebagai bahan desain: periksa sebelum menjalankan, jangan menyalin script eksternal, tracker, kredensial, atau dependensi CDN begitu saja ke aplikasi.

## Alur implementasi

- Ekstrak warna, tipografi, spacing, radius, shadow, lebar layout, ikon, dan breakpoint dari acuan; gunakan token/komponen bersama yang sudah ada.
- Ikuti versi Next.js/Tailwind dan pola router yang terpasang. Jangan meng-upgrade stack hanya untuk menyalin contoh.
- Pertahankan hirarki visual, kepadatan konten, dan posisi aksi utama. Jangan menambah gradient, glass effect, animasi, atau ornamen yang tidak ada dalam referensi.
- Adaptasikan konten ke FA RENT CAR dan aturan terbaru: jangan menyalin brand FE Rent Car, Jakarta, pilihan cabang, deposit, atau antar-jemput dari template jika di luar scope.
- Gunakan Bahasa Indonesia, rupiah, dan WIB secara konsisten. Jangan menampilkan rating, harga, ketersediaan, atau foto placeholder sebagai data bisnis terverifikasi.
- Implementasikan loading, kosong, error, sukses, validasi, dan disabled/pending state untuk tindakan async; jangan hanya menyelesaikan happy-path screenshot.
- Gunakan elemen semantik, label form, pesan error terhubung, fokus terlihat, navigasi keyboard, dan dialog dengan pengelolaan fokus. Status tidak boleh dibedakan hanya oleh warna.
- Pada mobile, pastikan navigasi/sticky action tidak menutupi konten atau field saat keyboard terbuka. Tabel admin harus tetap dapat digunakan tanpa menyebabkan seluruh halaman overflow.
- Aksi booking, upload, pembayaran, dan navigasi harus bekerja atau ditandai jelas sebagai prototipe. Jangan membuat tombol sukses palsu untuk meniru desain.

## Verifikasi terhadap aplikasi berjalan

1. Jalankan preview menggunakan setup/run script proyek; periksa halaman benar-benar ter-render, bukan hanya server mengembalikan HTTP sukses.
2. Bandingkan kandidat dengan referensi pada viewport dan state yang setara. Uji minimal mobile 390px dan desktop 1440px, serta batas 360px bila relevan dengan PRD.
3. Periksa navigasi, form, feedback error, fokus keyboard, overflow, dan aksi utama melalui interaksi browser. Periksa console/network error yang memengaruhi alur.
4. Ambil screenshot baru untuk perubahan visual. Gunakan data sintetis; jangan mengekspos KTP/SIM, bukti transfer, token, atau pelanggan nyata.
5. Bagikan bukti yang aman dan checklist route/aksi untuk reviewer. Rekaman video hanya bila diminta atau dibutuhkan secara eksplisit oleh alur QA yang disetujui.
6. Laporkan selisih yang masih ada. Jika runtime atau aset menghalangi verifikasi, nyatakan keterbatasan tersebut; jangan mengklaim hasil identik hanya dari inspeksi kode.
