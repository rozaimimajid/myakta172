# MyAKTA172 — Panduan Pratonton Cabang Audit

**Cabang:** `audit/stabilization-v1`  
**Status:** Pengujian belum dilaksanakan. Jangan gabung ke `main`.

## Perlindungan
- Jangan ubah GitHub Pages production atau DNS untuk tujuan ujian ini.
- Jangan gunakan alamat `https://rozaimimajid.github.io/myakta172/` untuk memaparkan cabang audit; alamat tersebut kekal milik main.
- Jangan membuka pratonton melalui PWA terpasang yang sedang digunakan.
- Jangan menyalin fail ujian ke main.

## Kaedah ujian yang disyorkan
1. Cipta persekitaran statik sementara dan berasingan yang mengambil kandungan daripada **cabang audit** sahaja (contohnya GitHub Codespaces dengan local preview), jika pengguna bersetuju.
2. Gunakan origin/port berbeza daripada aplikasi production untuk memastikan Service Worker dan cache tidak bercampur.
3. Mulakan dengan ujian desktop: Utama > Bahagian > Seksyen > Utama > buka Bahagian semula.
4. Uji KM, RSN, RT, RKK, carian, suara, bookmark, mobile dan cetak.
5. Uji PWA/offline hanya selepas fungsi atas lulus dan menggunakan storan/cache pengujian yang berasingan.
6. Rekod keputusan setiap ujian: LULUS / GAGAL / BELUM DIUJI, termasuk bukti ralat.
7. Jika ada masalah, betulkan **hanya** dalam cabang audit; jangan gabung tanpa kelulusan.

## Keadaan semasa (disahkan secara statik)
- Semua 18 blok JavaScript inline boleh diparse.
- Service Worker boleh diparse.
- 160 atribut ID unik ditemui.
- Elemen KM, RSN, RT dan RKK masih wujud.
- `main` masih menggunakan index.html SHA `c68bc58e707eec37b01e2d052fbfe27920ad00fd`.
- Ujian klik sebenar: **BELUM DIUJI**.

## Pintu kelulusan
Jangan buat pull request merge atau penerbitan production sebelum ujian regresi selesai dan pemilik aplikasi mengesahkan.
