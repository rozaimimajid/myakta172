# MyAKTA172 — FASA 3B: INTEGRASI BACKEND POSTGRESQL AWAN

**Tarikh:** 28 Oktober 2026  
**Cabang pembangunan:** `audit/stabilization-v1`; **`main` tidak disentuh**.  
**Status:** **Kod penyambung + backend peribadi + ujian PostgreSQL sementara LULUS; sambungan kepada pangkalan data awan sebenar BELUM AKTIF.**

## Komponen yang siap dikodkan

1. `admin-cloud-postgres.cjs`: adapter PostgreSQL berparameter, pemetaan akaun penyedia identiti, langganan, sesi peranti, penukaran satu peranti secara atomik, pembatalan sesi, transaksi `AUTO_EXPIRED`, rekod audit dan pemeriksaan status.
2. `admin-cloud-config.cjs`: konfigurasi pangkalan data awan daripada **server secrets sahaja** (`DATABASE_URL`, pilihan `DATABASE_CA_PEM`), TLS dengan pengesahan sijil dan nama hos, penolakan konfigurasi tempatan/tidak selamat, serta semakan peranan SQL supaya **bukan owner/superuser/BYPASSRLS**.
3. `admin-cloud-backend.cjs`: menggabungkan adapter dengan `admin-auth-foundation.cjs` dan `admin-subscription-engine.cjs`, termasuk gerbang kandungan berbayar **sebelum** bacaan data. `verifyToken` daripada penyedia OIDC sah dan `readContent` daripada storan terlindung masih perlu dikonfigurasikan.
4. `admin-backend-cloud-roles.sql`: peranan `myakta_backend_runtime` yang **NOLOGIN**, set grant minimum untuk operasi Fasa 3B dan polisi RLS khusus. Tidak memberikan akses kepada payments/receipt/favorites/highlights atau fungsi `SECURITY DEFINER` yang tidak diperlukan.
5. `admin-cloud-readiness.cjs`: ujian sambungan baca-sahaja yang tidak mencetak URL, kata laluan atau mesej ralat sambungan mentah.
6. `tests/admin-cloud-backend-integration.cjs` dan `tests/admin-cloud-config.cjs`: ujian pada PostgreSQL 16 sementara dan semakan konfigurasi keselamatan. Dijalankan melalui `.github/workflows/admin-preview.yml`.

## Aliran sambungan sebenar yang disediakan

```text
Aplikasi Pengguna / Dashboard Admin (belum dihubungkan)
        | permintaan HTTPS + token OIDC sah + kuki sesi terhad
        v
API backend server (Fasa 3C belum diterbitkan)
        | semak JWT kriptografi / akaun penyedia / sesi berhash
        v
admin-cloud-backend.cjs
        | hanya selepas semakan hak pengguna/pakej/peranti
        v
admin-cloud-postgres.cjs
        | sambungan TLS, akaun SQL perkhidmatan terhad
        v
PostgreSQL private (pelayan sebenar BELUM dikonfigurasikan)
        | transaksi akaun/langganan/audit
        v
AUTO_EXPIRED dan perlindungan entitlement pada setiap permintaan
```

**Peringatan:** Fungsi dalam modul backend bukan laluan HTTP yang sudah boleh diakses pelanggan. Tidak boleh melangkaui login/OIDC, MFA Admin, hak akses server, CSRF, had permintaan atau perlindungan kandungan. Fail Akta 172/PWA dalam hosting statik yang masih boleh dicapai orang ramai **tidak selamat dijadikan kandungan premium hanya dengan JS**.

## Tindakan penyediaan awan yang masih diperlukan

**Langkah 1 — Perkhidmatan yang dimiliki pemilik projek:** Sediakan satu pangkalan data **PostgreSQL private**, satu pelayan **Node.js HTTPS** dan storan peribadi resit/kandungan premium. Semak pelan percuma/kuota secara rasmi sebelum memilih; tiada pembelian atau komitmen kos dibuat melalui kerja ini.

**Langkah 2 — Migrasi menggunakan akses DBA sahaja:** Jalankan `admin-backend-postgresql.sql` di pangkalan data projek, kemudian `admin-backend-cloud-roles.sql`. Jangan jalankan pada pangkalan data yang mempunyai data penting tanpa sandaran/semakan. Fail SQL direka untuk pemasangan baru. Migrasi perubahan skema bagi akaun lama perlu dirancang secara berasingan.

**Langkah 3 — SQL role peribadi:** DBA membuat akaun **LOGIN backend** baharu dengan kata laluan rawak yang kuat dan memberi keahlian `myakta_backend_runtime`. Pastikan akaun itu bukan pemilik skema, superuser, atau pemegang `BYPASSRLS`, dan **hanya server backend** mengetahui kata laluan. Akaun DBA berasingan daripada akaun aplikasi.

**Langkah 4 — Konfigurasi rahsia pada server:** Tetapkan `DATABASE_URL=postgresql://<runtime_login>:<password_url_encoded>@<cloud_host>:5432/<database>` melalui sistem secrets hosting sahaja. `DATABASE_CA_PEM` pilihan jika perlu CA sijil pelayan yang dipercayai. **Jangan tampal URL sebenar dalam chat, terminal dikongsi, GitHub, Javascript, HTML atau log.** Kode TLS menolak sambungan tanpa validasi. URL tidak boleh mengandungi query `sslmode`; semua semakan SSL dilakukan oleh pelayan.

**Langkah 5 — Pemeriksaan:** Pada backend **terasing dan dilindungi**, pasang kebergantungan Node `pg@8.16.3`, kemudian jalankan `node admin-cloud-readiness.cjs` di persekitaran yang telah diberikan rahsia. Hasil `CLOUD_BACKEND_READINESS_OK` mengesahkan TLS/DB/peranan runtime; ia **tidak** mengesahkan API awam atau pembayaran sudah selamat.

**Langkah 6 — Sambungan peringkat seterusnya:** Sediakan penyedia identiti OIDC sebenar, login/logout, pengesahan emel dan MFA Admin (Fasa 3C), kemudian API HTTPS terhad dan storan kandungan premium (Fasa 4), pembayaran/resit (Fasa 5), sambungan Dashboard dan notifikasi telefon/emel (Fasa 6). Setiap tindakan mesti melalui audit keselamatan sebelum dihidupkan.

## Perlindungan dasar terkunci

- Basic RM15, Rahmah RM25, Premium RM50, 30 hari dan Free RM0.
- `AUTO-DOWNGRADE-DESIGN-LOCK.md` kekal: akses Free bermula tepat selepas tamat walaupun DB belum direkonsiliasi.
- `PAKEJ-UPGRADE-DOWNGRADE-DESIGN-LOCK.md` kekal: Kaedah B kredit prorata/30 hari baharu selepas kelulusan; downgrade berjadual.
- `ADMIN-NOTIFICATION-REQUIREMENT.md` kekal: telefon Admin + emel rasmi DigitalHubb.my.
- **Tidak mengubah** paparan Admin Biru Royal, aplikasi utama, logo, Akta 172, carta alir atau `main`.

## Definisi selesai yang tepat

- **LULUS**: fungsi repository Postgres, transaksi atomik, satu sesi/peranti, hak akses Free/Premium, RLS/peranan terhad, regresi Dashboard — diuji pada PostgreSQL CI sementara.
- **BELUM DIUJI**: sambungan awan sebenar, domain HTTPS projek, login pelanggan sebenar, pembayaran/resit bank, penghantaran emel/push, audit produksi, pemulihan sandaran dan pematuhan perkhidmatan awan.
- **Syarat menanda Fasa 3B selesai sepenuhnya:** sambungan TLS dari backend projek kepada PostgreSQL awan yang dikawal pemilik disahkan dan diuji pada staging berasingan, tanpa menjejaskan `main` atau hak pengguna sedia ada.
