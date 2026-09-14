# ADR 0001 — Fondasi bertahap dengan sesi admin nyata

Tanggal: 2026-09-13 · Status: Diterapkan untuk irisan awal Fase 0

## Konteks

Repository awal hanya memiliki PRD, task, aturan, serta referensi desain. Pengembangan dimulai sesuai urutan fase; satu pengiriman awal tidak menyatakan semua modul rental sudah selesai.

## Keputusan

- Gunakan Node.js 24, pnpm workspace, Turborepo, TypeScript strict, Next.js App Router, NestJS, Prisma, dan PostgreSQL 16 sesuai stack PRD. Lockfile mengunci versi yang dipakai. NestJS 11 dipilih agar kompatibel dengan `nestjs-zod` dan throttler; Prisma 6 memakai client native tanpa mengganti stack database.
- Schema pertama mencakup admin, keluarga sesi, audit log, mobil, foto/tarif dasar, dan pengaturan. Booking, invoice, pembayaran, serta modul operasional ditambahkan melalui migrasi fase berikutnya; task schema lengkap tetap parsial.
- Semua secret dan password seed dibuat acak untuk lingkungan lokal, disimpan di `.env` yang diabaikan Git. Seed tidak mengganti password/role admin yang sudah ada atau menimpa mobil yang telah diedit. Lima kendaraan sintetis ditandai `isDemo`; foto dan transaksi bisnis tidak dipalsukan.
- Paket shared berisi kontrak endpoint yang sudah tersedia, client API tervalidasi, formatter Rupiah/WIB, dan optimizer tarif generik. Optimizer menerima jumlah hari serta ukuran paket secara eksplisit, bukan menetapkan satu bulan = 30 hari atau aturan pembulatan durasi. Tarif contoh bukan tarif bisnis yang sudah disetujui.
- Compose menyediakan layanan standar untuk pengembangan dengan nama project unik per canonical path checkout. Sandbox tanpa Docker memakai layanan native dengan data privat di `.hoplite/native`, tanpa mengganti PostgreSQL dengan database tiruan. Pemakaian ulang layanan memerlukan bukti kepemilikan proses/data directory, bukan hanya health check; script tidak mereset data yang telah ada.
- Image MinIO Compose memakai registry resmi `quay.io/minio/minio` dan digest manifest multi-arsitektur yang dikunci. Rilis tetap sama dengan binary native; pull Docker Hub yang ditolak tidak diatasi dengan kredensial atau mengganti storage menjadi mock.
- Setup, dev, seed, dan shortcut migrasi root menolak database non-loopback atau mode produksi sebelum mutasi. Jalur `@fa/db migrate:deploy` tetap eksplisit untuk operator deployment; guard development bukan pengganti kontrol akses database produksi.
- Setup dan run berasal dari repository. Web admin, web customer, dan API berjalan di port 3000, 3001, dan 4000. Frontend tidak mengakses database/storage privat secara langsung.

## Konsekuensi

Fondasi dapat diverifikasi melalui migrasi, seed, unit test, build, serta sesi admin nyata. UI belum menawarkan booking, pembayaran, upload identitas, atau transaksi operasional. Halaman armada awal hanya inspeksi data seed, bukan penyelesaian CRUD Fase 1.

Sebelum kalkulasi booking dipakai, perlu keputusan tentang durasi satu paket bulanan, pembulatan sebagian hari, dan prioritas/penumpukan aturan harga khusus. Rekening, retensi dokumen, refund, GPS, domain, dan deployment tetap mengikuti keputusan terbuka PRD.
