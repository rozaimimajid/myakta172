# MyAKTA172 — Rangka Kerja Dashboard Admin & Pakej Langganan
Tarikh: 26 Oktober 2026
Status: REKA BENTUK SAHAJA — belum dibina atau diaktifkan
Cabang: audit/stabilization-v1

## Prinsip
- Jangan ubah `main`, 83 kandungan seksyen Akta atau fungsi yang disahkan.
- Kos operasi permulaan sifar jika boleh; jangan andaikan GitHub Pages menyediakan pangkalan data atau kawalan akses selamat.
- **GitHub Pages ialah hosting statik:** penyekatan pakej, satu peranti dan kebenaran admin tidak selamat jika hanya berdasarkan JavaScript dalam pelayar. Pengesahan identiti dan hak langganan wajib dibuat pada pelayan/backend atau perkhidmatan pengesahan berpangkalan data dengan peraturan server-side.
- Nama pakej muktamad: Free, Basic, Rahmah, Premium. **Harga dan hak akses terperinci perlu dimuktamadkan sebelum pengaktifan**, bukan ditetapkan secara arbitrari.

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
