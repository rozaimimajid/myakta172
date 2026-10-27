# MyAKTA172 — Fasa 3: Asas Backend Auto-Downgrade (27 Oktober 2026)

**Rujukan dasar DIKUNCI:** [AUTO-DOWNGRADE-DESIGN-LOCK.md](AUTO-DOWNGRADE-DESIGN-LOCK.md)  
**Cabang:** `audit/stabilization-v1` sahaja. **`main` dan aplikasi utama tidak diubah.**

## Hasil fasa ini
- `admin-subscription-engine.cjs`: enjin Node.js untuk menentukan pakej **berkesan pada masa server** bagi setiap permintaan; tarikh tamat Basic/Rahmah/Premium menghasilkan **Free**, tanpa menunggu klik Admin atau scheduler.
- `authorizeEntitlement()`: rujuk identiti yang disahkan, rekod DB, status akaun, satu sesi/peranti aktif dan matriks hak seksyen/fungsi. Tidak menerima tuntutan pakej pengguna daripada localStorage/JS/payload pelanggan.
- `createProtectedContentHandler()`: contoh gerbang API; **tidak membaca data sebelum kebenaran diluluskan**, pulangkan `Cache-Control: private, no-store`. Data/kandungan mestilah daripada storan terlindung yang berbeza daripada fail awam/PWA.
- `reconcileExpiredAccount()`: operasi **transaksi atomik** yang merekodkan peristiwa `AUTO_EXPIRED` unik, menukar pakej tersimpan kepada Free dan mengekalkan rekod pengguna. Memerlukan backend `store.transaction()` yang benar-benar serializable/ACID, dengan uniqueness `eventId`.
- `tests/admin-auto-downgrade.cjs`: semakan sempadan tepat tamat, Basic/Rahmah/Premium, kebenaran Free selepas luput, penolakan premium, bayaran Menunggu, akaun digantung, satu sesi/peranti, 30 hari, transaksi selari, rollback, idempotensi dan sejarah tidak terpadam. Dijalankan melalui GitHub Actions bersama regresi Dashboard.

## Integrasi belum dibuat — jangan anggap sistem produksi
- **Tiada sistem auth pengguna/Admin, DB, pengesahan bank, penyimpanan resit atau scheduler production disambungkan.**
- Kod ini ialah lapisan **backend foundation** dan **contract adapter**, bukan servis HTTP yang boleh terus menerima pelanggan.
- `admin-preview.html` masih menggunakan data simulasi dan **tidak** menunjukkan penurunan pakej secara automatik selepas refresh. Perbezaan UI/DB sebenar belum dibangunkan.
- Kandungan premium dalam hosting statik, `index.html`, JavaScript atau cache awam **tidak boleh dilindungi hanya dengan logik frontend**. Kandungan perlu dialihkan ke servis terlindung sebelum sistem berbayar diaktifkan.

## Kontrak untuk backend sebenar
`authenticate(request)` → `{accountId, sessionId, role:'user', status:'Aktif'}` yang **telah diverifikasi**, bukan dakwaan klien.  
`loadSubscription(accountId)` → `{accountId,plan,status,startsAt,expiresAt}` daripada DB. Tarikh mesti ISO 8601 dengan zon masa (`Z` atau ofset).  
`checkSingleActiveSession(accountId,sessionId)` → `{authorized:true, activeCount:1}` berdasarkan DB sesi terlindung.  
`store.transaction(accountId, fn)` → transaksi serializable per-akaun dengan pembacaan semasa, penulisan pakej dan insert audit unik yang commit/rollback bersama.  
`readContent(resource)` → data khusus resource yang diminta daripada storan dilindungi, bukan fail premium awam.

### Entiti data asas untuk migrasi (belum dilaksanakan)
- **users** — ID kekal, emel, status Aktif/Digantung, peranan, created_at.
- **subscriptions** — account_id, plan semasa, starts_at, expires_at, revision/updated_at; kekangan status dan validasi waktu.
- **subscription_history** — account_id, plan dahulu, tarikh mula/tamat, sebab perubahan.
- **payments** — account_id, kategori Langganan Baharu/Pembaharuan/Naik Taraf, amount, approval status, approved_by/at; bukti bank terlindung.
- **device_sessions** — satu sesi aktif yang boleh dibatalkan, hash token/ID peranti, tarikh log masuk/luput.
- **audit_events** — event_id unik, actor, tindakan, masa, before/after, metadata. Event AUTO_EXPIRED berkunci per `accountId:expiresAt`.
- **favorites/reading_history/highlights** — dikekalkan dan tidak dipadam kerana turun taraf.

## Urutan pembangunan seterusnya
1. Pilih backend & storan sebenar yang boleh digunakan pada kos permulaan rendah, dengan kebenaran peranan dan MFA Admin.
2. Bina jadual, migrasi, trigger/idempotent transaction dan ujian concurrency DB.
3. Sambung autentikasi, pengesahan satu peranti dan setiap endpoint premium kepada `authorizeEntitlement()`.
4. Hentikan penyiaran kandungan Premium di hosting statik dan cache publik. Pastikan UI PWA tidak memintas hak.
5. Integrasi pembayaran/pengesahan resit dan keputusan pembaharuan yang diluluskan sahaja.
6. Tambahkan reconciliation scheduler sebagai penyesuaian log/rekod; endpoint tetap menyekat akses tepat pada masa tamat walaupun scheduler lewat.
7. Jalankan audit integrasi, keselamatan, mobile/desktop dan ujian manual pengguna sebelum publisiti/produksi.

**Perlindungan:** Jangan ubah polisi, harga, teks Akta, lapan carta alir, logo, navigasi terkunci, reka bentuk Dashboard atau cabang `main` tanpa arahan pemilik.

## Kemajuan tambahan — Pangkalan data SQLite setempat untuk ujian (27 Oktober 2026)

- `admin-backend-sqlite.sql`: jadual akaun, langganan, sesi peranti (token dihash), transaksi pembayaran metadata, favorites, sejarah bacaan, highlight, audit dan sejarah pakej dengan constraints/foreign keys.
- `admin-backend-sqlite.cjs`: sambungan sebenar enjin `reconcileExpiredAccount()` ke SQLite melalui transaksi `BEGIN IMMEDIATE`, `COMMIT`/`ROLLBACK`, event id unik, sejarah pakej dan semakan satu sesi peranti.
- `tests/admin-sqlite-integration.cjs`: ujian pangkalan data sementara di luar repositori; menyemak lapan tugasan serentak, satu rekod AUTO_EXPIRED, hak Free tepat selepas luput, pemeliharaan sejarah, sesi, rollback dan **data kekal selepas SQLite ditutup/dibuka semula**.
- `.gitignore` menolak fail SQLite, DB, persekitaran rahsia dan dependencies daripada GitHub. `admin-backend-sqlite.cjs` juga **menolak lokasi DB di dalam repositori** agar tidak terdedah melalui pelayan web statik.
- Pelaksanaan Node.js dalam aliran kerja ujian menggunakan `node --experimental-sqlite` (Node 22). Ini tidak memerlukan langganan atau akaun pelayan pangkalan data, tetapi hanya pembuktian konsep setempat.

**AMARAN PENTING:** SQLite setempat ialah contoh penyambung penyimpanan, bukan pangkalan data berpusat/produksi. Tiada login Admin/pengguna sebenar, token login yang disahkan, MFA, API pelanggan, sistem resit/pembayaran sebenar atau deployment dipasang. Tanpa sistem auth dan kandungan premium pada storan peribadi, jangan benarkan pelanggan sebenar menggunakan sistem. Jangan letakkan fail `.sqlite` dalam root web GitHub Pages atau pautan Codespaces awam.

Langkah seterusnya: skema SQL/polisi transaksi untuk pangkalan data berpusat, autentikasi selamat, kawalan satu peranti pada pelayan, API kandungan berbayar terlindung, integrasi kelulusan pembayaran dan scheduler audit.

## Kemajuan Fasa 3 — Identiti OIDC dan pangkalan data berpusat (27 Oktober 2026)

- `admin-auth-foundation.cjs`: pengesahan kriptografi token **akses API** OIDC RS256 melalui kunci awam dipercayai (dipin pada pelayan), issuer/audience, expiry, `iat`, `nbf`; tidak membenarkan `alg:none`, `jku` atau pemilihan kunci arbitrari. Hanya `auth_subject` token yang disahkan boleh dipadankan dengan pengguna tersimpan. Pakej/peranan dalam token pelanggan tidak dipercayai; peranan diperoleh daripada rekod server.
- Sesi ialah token rawak 256-bit dalam kuki `__Host-myaktasession` dengan atribut HttpOnly, Secure dan SameSite=Strict; hanya SHA-256 sesi disimpan. Pemeriksaan sesi aktif dan satu peranti perlu dibuat terhadap DB pada setiap permintaan. Pengesahan MFA wajib bagi Admin sebelum operasi berprivilej, bergantung tuntutan `amr=mfa` yang ditandatangani penerbit dan disahkan.
- `admin-backend-sqlite.sql` serta `admin-backend-sqlite.cjs` dikembangkan untuk pemetaan identiti `auth_issuer/auth_subject` dan pengesahan hash sesi dalam DB ujian. Data contoh masih `example.test` sahaja.
- `admin-backend-postgresql.sql`: migrasi **PostgreSQL staging** termasuk akaun, pakej, pembayaran, sesi, favorites/sejarah/penanda warna, RLS di semua jadual privasi, gerbang tertutup tanpa grant pengguna awam dan fungsi penurunan pakej atomik. Fungsi tidak diberikan `EXECUTE` kepada `PUBLIC`.
- `tests/admin-auth-foundation.cjs`, `tests/admin-auth-sqlite-integration.cjs` dan `tests/admin-postgresql-integration.cjs` ditambah kepada GitHub Actions; PostgreSQL diuji di dalam kontena sementara. Ujian PostgreSQL hanya mengesahkan skema dan fungsi transaksi, **bukan penyambungan kepada perkhidmatan pangkalan data yang telah diterbitkan**.

### Batasan keselamatan dan integrasi

1. **Tiada penyedia identiti OIDC sebenar**, konfigurasi kunci rotasi, domain HTTPS, proses daftar/pengesahan emel atau login Admin yang diaktifkan. Sampel JWT dalam ujian menggunakan kunci ujian sementara.
2. **Tiada pangkalan data PostgreSQL awan** disambung. Nama, pengguna dan kata laluan PostgreSQL dalam aliran kerja adalah palsu dan hanya untuk kontena GitHub Actions. Jangan digunakan semula pada produksi.
3. **Tiada API HTTP pelanggan sebenar** dan tiada sesi yang diterbitkan pada `index.html`. Jangan menyalin token sebenar ke Codespaces/log/ChatGPT.
4. **Belum diaudit untuk penggunaan produksi:** MFA Admin, rate limiting, pengesahan emel, reset akaun, pengekalan data, privasi, perlindungan kandungan berbayar daripada fail awam dan cache PWA, pengesahan resit bank, audit pentadbir, disaster recovery, pemantauan dan kos operasi.
5. Jangan dedahkan peranan akses (role/grant) PostgreSQL atau simpan password/token, fail `.sqlite`, resit atau emel sebenar di repo. Hanya gunakan backend HTTPS dengan DB private apabila bersedia.

**Status:** asas kriptografi identiti, pangkalan data staging dan ujian kini disediakan. Integrasi pengguna sebenar **BELUM AKTIF** dan hanya boleh dibuat selepas pemilihan penyedia/konfigurasi oleh pemilik, kemudian ujian keselamatan serta pengesahan penerbitan khusus.
