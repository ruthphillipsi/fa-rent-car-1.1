---
name: fa-project-delivery
description: "Gunakan saat merencanakan atau mengimplementasikan fitur lintas frontend, API, database, dan worker FA RENT CAR; termasuk fondasi monorepo, migrasi, dan pemecahan pekerjaan per fase."
---

# Pengembangan proyek FA RENT CAR

## Tujuan

Mengirim fitur kecil yang lengkap dan dapat diverifikasi, bukan membangun seluruh roadmap sekaligus.

## Konteks sebelum bekerja

1. Baca instruksi repository yang berlaku dan dokumen terbaru: `docs/prd.md`, `docs/rules.md`, `docs/task.md`, serta ADR terkait jika tersedia.
2. Periksa kode, manifest, lockfile, dan script yang benar-benar ada. Struktur target di PRD bukan bukti bahwa implementasinya sudah tersedia.
3. Jika dokumen belum ada di checkout, nyatakan keterbatasannya. Jangan mengambil alih branch/thread lain atau menyalin dokumen lama tanpa memeriksa relevansi dan izin.
4. Jika keputusan bisnis bertentangan atau belum ditetapkan, tanyakan hanya keputusan yang memblokir tugas. Jangan menganggap skill ini sebagai pengganti PRD atau instruksi pengguna terbaru.

## Alur kerja

1. Tentukan aktor, hasil pengguna, batas lingkup, dan acceptance criteria yang dapat diuji.
2. Petakan perubahan ke UI, kontrak API, domain, database, storage, worker, dan otorisasi. Gunakan hanya lapisan yang diperlukan.
3. Pecah pekerjaan menjadi vertical slice: satu alur pengguna yang bekerja dari UI sampai penyimpanan. Hindari scaffolding fitur yang belum diminta.
4. Jika checkout masih kosong, sepakati fase fondasi berdasarkan PRD sebelum memasang stack. Target yang terdokumentasi adalah pnpm/Turborepo, Next.js, NestJS, Prisma, dan PostgreSQL; versi harus diperiksa sebelum dipilih.
5. Pertahankan batas modul yang ada. Frontend tidak boleh mengakses database atau storage privat langsung; validasi, harga final, dan otorisasi ditegakkan server.
6. Bagikan kontrak dan util murni yang memang dipakai lintas aplikasi. Jangan membocorkan environment server atau dependensi backend ke bundle browser.
7. Untuk perubahan schema, sertakan migrasi yang direview, indeks/constraint relevan, dan rencana kompatibilitas. Jangan reset database berisi data nyata demi membuat migrasi lolos.
8. Untuk job, tentukan idempotensi, retry, dan pemulihan setelah restart. Status bisnis harus tetap benar walaupun worker terlambat.
9. Perbarui task/ADR hanya untuk keputusan dan hasil yang benar-benar terjadi. Jangan menandai selesai sebelum diverifikasi.

## Skill pendamping

- Booking, jadwal, tarif, invoice: `../fa-booking-pricing/SKILL.md`.
- Dokumen, portal tamu, pembayaran, akses admin: `../fa-security-payments/SKILL.md`.
- UI customer/admin dan referensi visual: `../fa-reference-ui/SKILL.md`.
- Pengujian dan kesiapan rilis: `../fa-quality-gates/SKILL.md`.

Baca skill pendamping hanya bila relevan; tidak perlu memuat semuanya untuk perubahan kecil.

## Bukti penyelesaian

- Ringkas perilaku yang berubah dan file/modul terdampak.
- Jalankan check relevan yang tersedia dan tinjau diff untuk perubahan tidak sengaja.
- Laporkan hasil aktual, keputusan terbuka, dan keterbatasan lingkungan.
- Jangan menyebut fitur live, terdeploy, atau terpublikasi tanpa konfirmasi dari lingkungan/alat yang bersangkutan.
