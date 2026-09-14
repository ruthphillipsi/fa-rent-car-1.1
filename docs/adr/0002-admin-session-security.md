# ADR 0002 — Sesi admin, CSRF, dan audit transaksional

Tanggal: 2026-09-13 · Status: Diterapkan

## Keputusan

- JWT access berumur 15 menit, algoritma HS256, issuer/audience eksplisit. Refresh token acak 48 byte, masa sesi absolut 7 hari. Database hanya menyimpan SHA-256 token refresh.
- Cookie auth `HttpOnly`, `SameSite=Lax`, host-only. Produksi memakai `Secure` dan prefiks `__Host-`; cookie lokal tanpa `Secure` hanya untuk HTTP development.
- Setiap request terproteksi memverifikasi JWT **dan** sesi/user di database. Logout, penonaktifan user, soft delete, dan pencabutan sesi langsung menghentikan akses, bukan menunggu JWT habis.
- Semua mutasi auth memakai JSON serta double-submit CSRF: token acak 32 byte diterbitkan melalui response JSON dan cookie HttpOnly, lalu dibandingkan secara konstan dengan header `X-CSRF-Token`. CORS tidak dibuka; request browser cross-site ditolak.
- Rotasi menghasilkan baris sesi baru dan mencabut generasi lama. Pemakaian ulang token lama mencabut seluruh keluarga sesi. Advisory lock PostgreSQL per keluarga menyerialisasi refresh, replay, serta logout yang bersamaan. Frontend menyatukan permintaan refresh dalam satu promise dan memakai Web Locks antartab pada secure context, dengan pemeriksaan ulang sesi sesudah memperoleh lock. Kegagalan server sebelum rotasi tidak menghapus cookie yang masih valid.
- Audit login, rotasi, replay, dan logout disimpan dalam transaksi yang sama dengan perubahan sesi. Service menerima transaction client; interceptor tidak dipakai untuk menulis audit setelah commit. Trigger database menolak update, delete, dan truncate audit.
- Log aplikasi hanya memuat metode HTTP, status, durasi, dan correlation ID; tidak memuat URL bertoken, body, cookie, password, atau nomor kontak. Error internal tidak membocorkan stack maupun nilai environment.

## Batas lingkup

RBAC awal menyediakan `STAFF` dan `SUPERADMIN`; endpoint pemeriksaan layanan hanya untuk superadmin. Modul audit akan dipakai kembali oleh tindakan sensitif tiap fase, bukan izin untuk menambahkan endpoint update/delete audit.

Rate limiter awal berjalan per proses API: 10 percobaan login/menit per email ternormalisasi (key berupa hash, berlaku juga untuk akun yang tidak ada), ditambah batas sumber koneksi 120 request/menit per endpoint. Dengan demikian kegagalan satu akun tidak menghabiskan kuota login semua staff yang memakai proxy sama. API tidak mempercayai header forwarded dari client; `trust proxy` tidak diaktifkan karena rewrite Next.js bukan sanitasi header. Batas koneksi tetap konservatif dan dapat dibagi oleh beberapa pengguna di balik proxy. Deployment harus menetapkan ingress tepercaya serta limiter terdistribusi sebelum scaling. Cookie aman membutuhkan HTTPS; deployment produksi belum menjadi hasil pengiriman ini.

Storage baru menyediakan bucket privat dan signed URL staging 5 menit dengan scope pemilik. Belum ada endpoint penerimaan KTP/SIM: validasi isi file, otorisasi booking, pemindahan dari staging, dan retensi harus selesai sebelum upload identitas diaktifkan.

Client khusus presigning memakai `requestChecksumCalculation: WHEN_REQUIRED`: request signing tidak memiliki body sehingga checksum otomatis akan salah mengikat upload ke body kosong. Client SDK untuk transfer langsung tetap memakai checksum default. Perilaku ini mengikuti [dokumentasi checksum AWS SDK v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-checksums.html); integration test mengunggah PNG nonkosong, membandingkan byte unduhan, dan menolak akses tanpa signature maupun pemilik yang salah.

## Pembuktian

Integration test memakai schema PostgreSQL, nama queue Redis, dan bucket S3 acak per eksekusi. Tes mencakup akses tanpa auth, CSRF, invalid input, cookie, hashing refresh, rotasi/replay, race refresh/logout, RBAC negatif, pencabutan user, audit append-only, rollback, scheduler, dan rate limit. Tidak ada test concurrency booking yang diklaim sebelum booking diimplementasikan.
