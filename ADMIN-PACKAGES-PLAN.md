# MyAKTA172 — Rangka Kerja Dashboard Admin & Pakej Langganan
Tarikh: 26 Oktober 2026
Status: PROTOTAIP ADMIN V2 DIBINA DALAM CABANG AUDIT — data simulasi sahaja, tiada backend atau pembayaran sebenar
Cabang: audit/stabilization-v1

## Prinsip
- Jangan ubah `main`, 83 kandungan seksyen Akta atau fungsi yang disahkan.
- Kos operasi permulaan sifar jika boleh; jangan andaikan GitHub Pages menyediakan pangkalan data atau kawalan akses selamat.
- **GitHub Pages ialah hosting statik:** penyekatan pakej, satu peranti dan kebenaran admin tidak selamat jika hanya berdasarkan JavaScript dalam pelayar. Pengesahan identiti dan hak langganan wajib dibuat pada pelayan/backend atau perkhidmatan pengesahan berpangkalan data dengan peraturan server-side.
- Nama pakej muktamad: Free, Basic, Rahmah, Premium. **Harga dan matriks hak akses telah diputuskan oleh pemilik** (lihat PACKAGE-MATRIX-DRAFT.md): Free RM0, Basic RM15, Rahmah RM25 dan Premium RM50 sebulan. Tempoh langganan berbayar: 30 hari.

## Paparan Admin (cadangan)
1. Ringkasan: jumlah pengguna mengikut pakej, status akaun, permohonan pending, bayaran menunggu semakan, langganan hampir tamat.
2. Jadual pengguna: ID dalaman, emel, nama (pilihan), pakej, status, tarikh mula/tamat, status peranti, tarikh login terakhir. Carian dan penapis pakej/status.
3. Rekod bayaran: ID transaksi, pemilik akaun, pakej, amaun, tarikh, resit dimuat naik, status Pending/Approved/Rejected, admin yang membuat keputusan, audit log. Resit mesti dikawal akses, bukan URL awam.
4. Kelulusan & naik taraf: pengesahan manual bayaran dan naik/turun taraf, pembatalan, luput automatik, sebab perubahan.
5. Kebenaran pakej: matriks Bahagian/Seksyen yang boleh dibaca serta fungsi tambahan (carian, audio, carta alir, bookmark). Pengesahan entitlement dibuat server-side.
6. Keselamatan: akaun admin berasingan, MFA jika boleh, role admin/user, peraturan akses pangkalan data, log tindakan, anti-abuse, reset peranti terkawal.

## Aliran bayaran manual
Pengguna pilih pakej → terima arahan pembayaran → muat naik resit secara sulit → status Pending → admin sahkan → backend aktifkan entitlement dan tempoh langganan → pengguna melihat status terkini. Jangan membuka akses premium hanya kerana fail resit dimuat naik.

## Model satu peranti
- Satu sesi/peranti aktif per akaun ialah sasaran produk, tetapi pengenalan peranti pelayar tidak sempurna.
- Gunakan rekod sesi/peranti pada backend, tamatkan sesi lama semasa penggantian yang dibenarkan, hadkan kekerapan reset dan catat audit trail.
- Jangan dakwa sekatan tangkapan skrin sebagai kawalan keselamatan yang boleh dijamin di web.

## Urutan pelaksanaan
A. Bekukan rujukan audit dan inventori ciri.
B. Muktamad matriks pakej/harga serta dasar tempoh percubaan.
C. Reka struktur data pengguna, pembayaran, entitlement, audit log.
D. Pilih backend/auth/storan dengan semakan had pelan percuma dan privasi.
E. Bina prototaip Admin berasingan daripada bacaan Akta, mula dengan data dummy.
F. Uji peraturan kebenaran, peranti, resit, tamat tempoh, akaun admin; hanya kemudian integrasi aplikasi.
G. Penilaian keselamatan dan undang-undang sebelum pemasaran.

## Kriteria penerimaan
Tidak ada pengguna Free yang boleh mendapat kandungan premium melalui mod developer, API atau manipulasi pelayar; rekod pengguna dan resit terhad kepada admin dibenarkan; pertukaran pakej direkod; semuanya boleh dipulihkan tanpa menjejaskan teks Akta terkunci.

## Kemajuan sebenar — 27 Oktober 2026 (cabang audit sahaja)
- `admin-preview.html`: paparan Admin V2 dengan sembilan modul — Ringkasan, Pengguna & Emel, Resit & Pembayaran, Langganan, Kawalan Pakej, Peranti, Laporan, Log Admin, Tetapan.
- `admin-preview.css`: reka bentuk desktop/mobile terasing, tanpa meminda gaya atau logo aplikasi utama.
- `admin-preview.js`: simulasi carian dan penapis pengguna, profil dengan sejarah resit, permohonan resit (metadata/nama fail sahaja, tiada muat naik), keputusan lulus/tolak, langganan 30 hari, naik taraf manual dengan sebab, pembaharuan, reset peranti, eksport CSV demo, log tindakan.
- `admin-package-policy.js`: harga/matriks muktamad, 12 Bahagian dan 83 ID seksyen dibaca daripada `DATA.parts` sedia ada pada cabang audit, tanpa menyunting `index.html`. Pengesahan di frontend ini hanya untuk demonstrasi.
- `tests/admin-dashboard.mjs` dan `.github/workflows/admin-preview.yml`: ujian khas panel Admin dalam cabang audit; tidak menyentuh ujian aplikasi utama.
- Fail yang **tidak diubah** dalam pembangunan Admin: `index.html`, `sw.js`, lapan carta alir, fail grafik dan `main`.

### Senarai fungsi yang **belum wujud** (jangan mengelirukan dengan demo)
- Tiada log masuk Admin sebenar, MFA, pangkalan data, API, pembayaran, storan resit, sekatan satu-peranti server-side, reset token atau kawalan luput langganan production.
- Belum ada pautan Dashboard Admin kepada aplikasi MyAKTA172 pengguna; jangan hidupkan ciri berbayar daripada prototaip awam.
- **Pemetaan lapan carta alir kepada semua seksyen rujukan belum diaudit**. Fungsi `canUseChart(plan, requiredSections)` berkelakuan gagal-tertutup apabila seksyen rujukan tiada. Pemetaan dan audit hukum mesti diselesaikan sebelum membenarkan mana-mana carta/cetakan berbayar.
- `Hubungan Seksyen Berkaitan` disenaraikan bagi Basic/Rahmah/Premium tetapi berstatus **tertangguh** sehingga fungsi disemak.

## Struktur backend yang diperlukan sebelum pelancaran (pelan sahaja)
| Entiti | Medan minimum / tujuan |
|---|---|
| auth_users | ID stabil, emel unik, role user/admin, status akaun, MFA admin |
| package_catalog | ID Free/Basic/Rahmah/Premium, harga RM, tempoh 30 hari, versi polisi |
| package_entitlements | ID Bahagian dan Seksyen; hak carian, glosari, suara, penanda, carta/cetakan; pemetaan yang disahkan |
| subscriptions | user_id, package_id, started_at, expires_at, status, changed_by, sebab |
| payment_requests | request_id, user_id, package_id, amount, status Pending/Approved/Rejected, decided_at/by, resit_id |
| private_receipts | fail dalam storan sulit, pemilik, MIME, saiz, masa hantar; tidak ada URL awam |
| device_sessions | user_id, hashed session/device token, started_at, revoked_at; maksimum satu sesi aktif |
| admin_audit_logs | actor, action, target, before/after, reason, timestamp; tahan ubah |

**Transaksi pengaktifan:** Sah pembayaran sebenar → Admin memberi keputusan → backend sahkan kuasa dan jumlah → catat resit/keputusan/log dalam transaksi → aktifkan langganan sehingga 30 hari selepas masa mula. Permohonan Pending/Tolak tidak mengubah hak akses. `Free` kekal tanpa tempoh berbayar.

**Pembaharuan:** jika langganan masih aktif, tambah 30 hari selepas tarikh tamat; jika sudah tamat, mulakan 30 hari dari kelulusan. Naik/turun taraf memerlukan polisi prorata yang dipersetujui sebelum diterapkan dalam transaksi sebenar.

**Keselamatan:** Jangan pernah percaya pakej, ID pengguna, jumlah bayaran atau daftar peranti daripada JS pelayar. Backend sahkan token, role, langganan aktif, kebenaran seksyen sebenar dan entitlement cetakan pada setiap permintaan. Asingkan kandungan premium dan lampiran daripada fail awam GitHub Pages/PWA cache. Matikan akses apabila tamat tempoh atau sesi dibatalkan.

## Pintu penyerahan kepada pemilik
1. Ujian automatik panel Admin selesai dan laporan boleh disemak.
2. Pemilik semak susun atur Desktop/Mobile dan aliran simulasi.
3. Langkah seterusnya ialah backend selamat dalam cabang audit selepas reka bentuk disahkan.
4. Dilarang menggabungkan ke `main`, menerbitkan dashboard Admin atau mengubah aplikasi utama tanpa arahan khusus.
