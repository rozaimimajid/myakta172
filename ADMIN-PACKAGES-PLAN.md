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

## Hasil Ujian Automatik Dashboard V2
- **27 Oktober 2026 (MYT): 9/9 kumpulan ujian LULUS** melalui GitHub Actions `MyAKTA172 Admin Preview Tests`, run #4.
- Polisi: 12 Bahagian / 83 seksyen, semua empat pakej dan harga, peraturan carta fail-closed, ciri Hubungan Seksyen belum aktif, tempoh 30 hari.
- Pelayar: desktop, matriks seksyen, carian emel, rekod bayaran serta resit fail ujian, kelulusan, pembaharuan bayaran sama pakej, tukar pakej, reset peranti, log tindakan, mod mobile dan reset data selepas refresh.
- Laporan ujian: https://github.com/rozaimimajid/myakta172/actions/runs/40367284492
- Pengesahan ini **hanya untuk prototaip Admin**, bukan audit keselamatan sistem produksi atau integrasi kepada aplikasi pengguna.

## Pembaikan Modul Resit & Pembayaran — 27 Oktober 2026
- Tambah `kategori` kepada setiap transaksi: **Langganan Baharu**, **Pembaharuan**, **Naik Taraf**; direkod dalam direktori profil, jadual pembayaran dan CSV.
- Dalam borang permohonan simulasi, kategori dikira secara automatik: Free → berbayar = Baharu; pakej sama = Pembaharuan; pakej lebih tinggi = Naik Taraf. Turun taraf melalui borang ini disekat, dan permohonan yang tidak lagi sepadan dengan pakej semasa tidak boleh diluluskan dalam simulasi.
- Butang **Lihat Resit**: B001–B004 menunjukkan kad resit **rekaan** bertanda bukan resit bank; fail ujian PDF/JPG/PNG yang baharu dipilih disimpan hanya dalam memori halaman dan boleh dibuka sementara melalui dialog pratonton. Fail tidak dihantar ke rangkaian/backend atau disimpan dalam storan kekal; semua data hilang apabila refresh.
- Tiada resit pelanggan sebenar, nombor akaun, rekod bayaran bank atau akses kewangan dimuat naik. **Pratonton fail ujian tidak membuktikan transaksi telah dibayar.**
- Keperluan versi sebenar: ruang simpanan resit tertutup di backend; pengesahan admin+MFA; URL resit sementara selepas semakan role; semakan bank manual; bukti, timestamp dan audit keputusan; mekanisme pengesahan jenis fail pada pelayan. `main` dan fail aplikasi utama tidak diubah.

## Keputusan rasmi terkini — Hubungan Seksyen Berkaitan (27 Oktober 2026)

> **Nota kemas kini:** Pernyataan "tertangguh"/"belum aktif sehingga audit" dalam catatan sejarah di atas telah **digantikan** oleh keputusan rasmi berikut, bukan arahan untuk mengaudit semula fungsi terkunci.

- Audit fungsi aplikasi utama LULUS dan DIKUNCI: GitHub Actions #40500647354 (**203 pemeriksaan, tiada kegagalan**), 83 seksyen diperiksa, 83 pautan unik (53 asal + 30 tambahan), 43 seksyen dengan hubungan. Seksyen 56 dan rujukan Akta 119 dikekalkan, seperti `HUBUNGAN-ANTARA-SEKSYEN-DESIGN-LOCK.md`.
- Polisi pakej untuk fungsi `related`: **Free — Tidak; Basic/Rahmah/Premium — Ya**. Status polisi/matriks **AKTIF — audit lulus**.
- **Integrasi sebenar BELUM siap.** `admin-related-access-guard.cjs` ialah gerbang kebenaran untuk backend kelak; apabila identiti, langganan, sesi tunggal, seksyen sumber/destinasi atau penyedia backend tidak disahkan, ia **menolak permintaan**. Modul ini bukan login/backend yang sudah diterbitkan.
- Ujian `tests/admin-related-guard.cjs` dilaksanakan dalam aliran kerja Admin GitHub Actions bersama ujian paparan. Modul backend perlu dipasang pada API dilindungi dan membaca kandungan hubungan daripada sumber bukan awam sebelum meluluskan akses pelanggan berbayar.
- Jangan membenarkan klien menganggap tanda ✓ di Dashboard sebagai keizinan sebenar. Kandungan premium yang masih diterbitkan dalam fail awam/`index.html`/cache tidak boleh dilindungi secara kukuh hanya dengan JS browser. **Jangan aktifkan penguatkuasaan produksi sebelum pengesahan integrasi dan audit keselamatan.**
- Hanya fail Dashboard/gerbang Admin dan ujian pada `audit/stabilization-v1` yang diselaraskan; jangan ubah `main` atau teks/fungsi hubungan yang telah dikunci.

## DASAR DIKUNCI — AUTO-DOWNGRADE 30 HARI → FREE (27 Oktober 2026)

Rujukan muktamad: [`AUTO-DOWNGRADE-DESIGN-LOCK.md`](AUTO-DOWNGRADE-DESIGN-LOCK.md).

Apabila langganan Basic/Rahmah/Premium tamat tanpa pembaharuan diluluskan, **pakej efektif pengguna menjadi Free secara automatik** tanpa Admin klik Tukar Pakej. Backend wajib menyekat kandungan/ciri berbayar pada setiap permintaan tepat selepas tamat, sementara identiti pengguna, Kegemaran, Sejarah Bacaan dan rekod pakej/pembayaran lama dikekalkan. Pembaharuan berbayar mengaktifkan semula hak selepas kelulusan. **Status semasa: dasar disahkan, backend auto-downgrade belum dibangunkan; jangan anggap prototaip melaksanakannya.** Jangan ubah `main`.

### Kemajuan Fasa 3 — Asas automasi telah dikodkan
Dokumentasi integrasi: [ADMIN-BACKEND-FASE3-STATUS.md](ADMIN-BACKEND-FASE3-STATUS.md). Modul `admin-subscription-engine.cjs` dan ujiannya disediakan sebagai asas backend bagi auto-downgrade. **Pelaksanaan pada pelanggan sebenar belum berlaku**; Dashboard prototaip tidak diubah. Penguatkuasaan produksi memerlukan penyambung DB/auth/peranti dan perlindungan kandungan premium pada server.

## KEPUTUSAN RASMI DIKUNCI — UPGRADE & DOWNGRADE (28 Oktober 2026)

**Dokumen reka bentuk muktamad:** [`PAKEJ-UPGRADE-DOWNGRADE-DESIGN-LOCK.md`](PAKEJ-UPGRADE-DOWNGRADE-DESIGN-LOCK.md).

- **UPGRADE — Kaedah B:** Pengguna memohon dan membayar ketika memilih naik taraf. Sistem memaparkan harga pakej baharu ditolak **kredit baki masa pakej lama**, serta amaun sebenar yang perlu dibayar. Sebut harga sah 24 jam. Bayaran yang dikemukakan dalam tempoh sah mengunci kredit/amaun sepanjang semakan. Pakej asal kekal selagi aktif; pakej baharu **30 hari penuh bermula selepas Admin mengesahkan/meluluskan bayaran**. Tiada caj tambahan kerana kelulusan lewat. Jika pakej asal luput ketika menunggu, hak beralih sementara kepada Free.
- **DOWNGRADE — Berjadual:** Pakej berbayar sedia ada kekal hingga tamat. Pakej rendah dibayar pada **harga penuh 30 hari**, tanpa kredit/refund kerana baki pakej asal tetap dinikmati. Jika pembayaran pakej rendah diluluskan lebih awal, aktifkan pakej rendah pada saat pakej lama tamat selama **30 hari penuh**. Jika belum diluluskan pada masa tamat, sistem beralih ke Free sementara; selepas kelulusan, aktifkan pakej rendah selama **30 hari penuh mulai kelulusan**. Turun ke Free tidak memerlukan pembayaran.
- **Larangan:** Tiada auto-debit; jangan aktifkan dua pakej berbayar serentak; Pending/Tolak bukan akses berbayar; tarikh dan harga disahkan backend; kekalkan sejarah. Dasar auto-downgrade ke Free yang telah dikunci kekal berkuat kuasa.
- **Status teknikal:** Keputusan ini ialah dasar reka bentuk yang diluluskan, **belum dibina ke dalam aliran transaksi sebenar**. Rekod simulasi dan backend sedia ada tidak membuktikan fungsi upgrade/downgrade muktamad telah beroperasi. Rujukan kepada polisi prorata "belum dipersetujui" dalam catatan sejarah di atas **digantikan** oleh keputusan rasmi ini.
- **Perlindungan:** Jangan ubah `main` atau ciri/carta alir/tulisan perundangan dan UI terkunci.

## KEPERLUAN RASMI — DUA SALURAN NOTIFIKASI ADMIN (28 Oktober 2026)

Rujukan: [`ADMIN-NOTIFICATION-REQUIREMENT.md`](ADMIN-NOTIFICATION-REQUIREMENT.md).

Pemilik menghendaki Admin menerima **notifikasi push pada aplikasi MyAKTA172 Admin di telefon** serta **notifikasi emel kepada alamat rasmi DigitalHubb.my**. Kedua-dua saluran wajib disediakan apabila sistem operasi sebenar dibangunkan. Pencetus utama yang dicadangkan: resit/permohonan baharu, upgrade Kaedah B, downgrade berjadual, pembaharuan dan perkara memerlukan keputusan Admin; perkara auto-downgrade/status rutin boleh diringkaskan bagi mengelak notifikasi berlebihan.

Notifikasi memerlukan backend, penyedia email, push service worker/kebenaran telefon, outbox/retry, Pusat Notifikasi dalam aplikasi, serta kawalan login Admin/MFA untuk pautan tindakan. **Alamat emel tepat belum disahkan** dan mesti ditetapkan melalui konfigurasi server, bukan diandaikan. **Status belum dilaksanakan / belum menghantar notifikasi.** Jangan mengubah Dashboard yang telah dikunci atau `main` tanpa arahan khusus.
