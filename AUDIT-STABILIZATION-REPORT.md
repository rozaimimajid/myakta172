# MyAKTA172 — Laporan Validasi Statik Fasa B
Tarikh: 20 Oktober 2026
Cabang: audit/stabilization-v1
Skop: baca sahaja terhadap index.html dan sw.js selepas pembersihan awal. Tidak mengesahkan fungsi pelayar.

## Keputusan disahkan
- Tag script pembukaan dan penutupan: 18/18.
- Tag style pembukaan dan penutupan: 34/34.
- ID carta KM, RSN, RT dan RKK: setiap satu wujud sekali.
- ID desktopHome, desktopHomeButton dan nav: setiap satu wujud sekali.
- Pengendali addEventListener click untuk desktopHomeButton (padanan yang diaudit): satu.
- Mekanisme lama yang dicari: collapseHomeSidebar, home-nav-source-of-truth-v32, home-sidebar-collapse-v29 — tiada.
- Tiga skrip masih berada selepas tag penutup body (satu bertanda rt-v25-preview-autostart).
- PWA sw.js menggunakan cache myakta172-pwa-v32; strategi network-first dengan fallback index.html.

## Risiko belum selesai
1. Struktur HTML tidak kanonik kerana skrip selepas body.
2. Pemeriksaan sintaks JavaScript dan ujian interaksi belum dilaksanakan secara menyeluruh.
3. Belum dibuktikan bahawa klik Utama menutup sidebar dan boleh membuka semula Bahagian.
4. Semakan konten Akta, seksyen rujukan, dan fungsi carta belum lengkap.
5. Service Worker memerlukan ujian versi kemas kini, offline dan fallback aset.

## Kriteria ujian wajib sebelum merge
- [ ] Ujian membuka 3 Bahagian dan klik Utama => semua Bahagian tertutup.
- [ ] Klik kembali setiap Bahagian => senarai Seksyen dapat dibuka.
- [ ] Buka Seksyen => halaman bacaan tepat, tiada kesan sampingan.
- [ ] KM, RSN, RT, RKK => semua tab dan pautan berfungsi.
- [ ] Desktop/mobile, mod terang/gelap, suara, kegemaran, cetak => regresi.
- [ ] PWA online/offline serta muat semula => menggunakan versi betul.
- [ ] Semakan konsol => tiada ralat JS kritikal.

## Keputusan
TIDAK LULUS UNTUK MERGE ke main pada masa ini.
Ini ialah pemeriksaan struktur statik sahaja. Semua ujian pelayar di atas masih BELUM DIUJI.


## Validasi tambahan — pemeriksaan statik JavaScript/HTML
- 18 daripada 18 blok JavaScript inline lulus ujian parse sintaks menggunakan pemungkus fungsi, tanpa pelaksanaan kod.
- Fail sw.js lulus ujian parse sintaks yang sama.
- 160 ID HTML ditemui dan semuanya unik dalam kod sumber; tiada ID pendua yang dikesan.
- ID utama desktopHome, nav, kmFlowChart, rsnV24Chart, rtV25Chart dan rkkV26Chart ditemui.
- Penutup body telah dipindahkan selepas semua markup, gaya dan skrip terdahulu tanpa perubahan turutan blok (commit 2331e5a).
- Ujian pelayar sebenar: BELUM DIUJI. Persekitaran ujian mempunyai Chromium tetapi sumber fail GitHub tidak dapat dimuat turun terus. Hasil semakan parse statik TIDAK bermakna kawalan, PWA, laluan navigasi atau fungsi aplikasi telah lulus.

## Keputusan terkini
TIDAK LULUS UNTUK MERGE. Teruskan ujian interaksi dalam persekitaran pelayar berasingan apabila sumber kod dan aset boleh dimuatkan secara lengkap.
