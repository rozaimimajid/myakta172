# MyAKTA172 — Laporan Akhir TASK 1 & TASK 2 (Audit Kandungan)

**Tarikh rekod:** 24 Oktober 2026  
**Repositori:** `rozaimimajid/myakta172`  
**Cabang:** `audit/stabilization-v1` (BUKAN `main`)  
**Sumber perbandingan:** `AKTA_172_MUKTAMAD_SEBAGAIMANA_1_JUN_2021(1).pdf`, Akta Perancangan Bandar dan Desa 1976 [Akta 172], cetakan semula dikemas kini **sebagaimana pada 1 Jun 2021**.  
**Skop:** Data teks bagi 83 rekod seksyen, termasuk seksyen berhuruf, serta 19 catatan editorial pada 13 seksyen. Mukadimah dan Lampiran dikecualikan. Carta alir, logik aplikasi dan fungsi lain tidak diaudit semula dalam tugasan ini.

## Keputusan muktamad yang disokong bukti

| Tugasan | Keputusan | Batas pengesahan |
|---|---|---|
| TASK 1 — teks utama Akta 172 | **LULUS audit perbandingan berkomputer; rekod audit kandungan ditutup dengan batas dinyatakan** | 83/83 rekod; 20,473 daripada 20,475 token perkataan dijajarkan dengan teks PDF yang diekstrak; dua ketidakpadanan token ialah pemformatan `35 A`/`35A` dan `VI A`/`VIA` yang diterima pemilik. Tiada perbezaan tanda baca dikesan bagi pasangan perkataan berturutan yang sejajar. Tanda penutup 83 seksyen dapat dikenal pasti dalam PDF. **Bukan pengesahan visual manual setiap aksara pada seluruh halaman PDF.** |
| TASK 2 — nota kaki/catatan editorial | **SELESAI & DISAHKAN** | Kesemua **19/19** teks catatan dalam aplikasi dipadankan dengan 19 penanda CATATAN dalam PDF mengikut turutan dan 13 seksyen. Kod memisahkan `notes` daripada `text` dan memaparkan seksyen nota secara berasingan. Pemilik mengesahkan paparan Seksyen 27 pada **desktop dan mobile**; ini ujian contoh, bukan dakwaan 13 seksyen diuji visual satu per satu. |

## TASK 1 — 83 rekod seksyen yang diliputi

- **Bahagian I — PERMULAAN:** `1`, `2`.
- **Bahagian II — DASAR DAN PENTADBIRAN:** `2A`, `2B`, `3`, `4`, `5`, `6`.
- **Bahagian IIA — JAWATANKUASA PERANCANG WILAYAH:** `6A`.
- **Bahagian IIB — RANCANGAN FIZIKAL NEGARA:** `6B`.
- **Bahagian III — RANCANGAN PEMAJUAN:** `7`, `8`, `9`, `10`, `11`, `11A`, `11B`, `12`, `12A`, `13`, `14`, `15`, `16`, `16A`, `16B`, `17`.
- **Bahagian IV — KAWALAN PERANCANGAN:** `18`, `19`, `20`, `20A`, `20B`, `21`, `21A`, `21B`, `21C`, `22`, `23`, `24`, `25`, `26`, `27`, `28`, `29`, `30`, `31`, `31A`.
- **Bahagian V — CAJ PEMAJUAN:** `32`, `33`, `34`, `35`.
- **Bahagian VA — PERINTAH PEMELIHARAAN POKOK:** `35A`, `35B`, `35C`, `35D`, `35E`, `35F`, `35G`, `35H`.
- **Bahagian VI — LEMBAGA RAYUAN:** `36`.
- **Bahagian VII — NOTIS PEMBELIAN DAN PENGAMBILAN TANAH:** `37`.
- **Bahagian VIII — KAWASAN PEMAJUAN:** `38`, `39`, `40`, `41`, `42`, `43`, `44`.
- **Bahagian IX — PERUNTUKAN PELBAGAI:** `45`, `46`, `47`, `48`, `49`, `50`, `51`, `52`, `52A`, `53`, `54`, `55`, `56`, `57`, `58`, `59`.

**Kaedah:** padanan susunan token perkataan dan tanda baca daripada data `DATA.sections[].text` dengan teks terbitan PDF; perbezaan ruang, pemisahan baris, kepala/kaki halaman, bentuk huruf, pemformatan nombor-seksyen, serta penanda nota kaki dikecualikan daripada ralat kandungan setelah dikenal pasti. Pemeriksaan imej PDF telah dibuat secara terpilih pada halaman berisiko, termasuk 70, 80 dan 104. Bukti semakan ini **tidak mencukupi** untuk mendakwa pemeriksaan visual individu setiap aksara dalam seluruh dokumen, atau kesahan pindaan selepas 1 Jun 2021.

**Hasil:** Tiada ralat teks perundangan yang disahkan dalam semakan yang dilaksanakan. Tiada pembetulan teks dicadangkan pada masa laporan ini. Had audit ini **bukan** penilaian bahawa Akta 172 versi Jun 2021 ialah naskhah paling terkini berkuat kuasa pada Oktober 2026.

## TASK 2 — 19 catatan editorial

| Seksyen | Bilangan nota | Halaman PDF |
|---|---:|---|
| 1 | 2 | 10 |
| 5 | 1 | 24 |
| 22 | 1 | 56 |
| 26 | 2 | 64–65 |
| 27 | 2 | 67 |
| 28 | 2 | 70 |
| 29 | 2 | 73 |
| 30 | 2 | 75 |
| 35A | 1 | 80 |
| 35E | 1 | 83 |
| 35H | 1 | 84 |
| 36 | 1 | 87 |
| 58 | 1 | 103 |

**Bukti pengasingan:** `DATA.sections[].text` ialah teks utama; `DATA.sections[].notes` ialah data catatan berasingan. Kod paparan menambah blok `section.law-notes` dengan tajuk **Nota Editorial / Catatan** selepas teks Akta, dan menggunakan `textContent` bagi perenggan nota. Penanda asterisk yang merujuk nota dikekalkan menurut konteks PDF; teks editorial tidak dicampurkan ke dalam medan teks Akta.

**Pengesahan pemilik:** 24 Oktober 2026 (perbualan pembangunan): pemilik mengesahkan ketiga-tiga pemeriksaan Seksyen 27 lulus dalam mod desktop dan mobile. Penetapan TASK 2 sebagai selesai adalah berdasarkan audit semua catatan serta pengesahan visual sampel ini.

## Keputusan kunci kandungan (LOCK)

1. Kekalkan **83 rekod seksyen**, tajuk, susunan Bahagian, teks `DATA.sections[].text`, dan **19 nota editorial** dalam `DATA.sections[].notes` tanpa perubahan sampingan.
2. Semua perubahan kandungan perundangan pada masa hadapan memerlukan **arahan khusus pemilik**, rujukan dokumen sah, semakan perbezaan dan audit terhad pada kandungan yang diubah.
3. Jangan tukar bentuk pemformatan rujukan `35A` kepada `35 A` atau `VIA` kepada `VI A` semata-mata untuk menyerupai ruang pengekstrakan PDF.
4. Jangan campurkan catatan editorial ke dalam teks utama atau menghapuskan penanda yang mempunyai fungsi rujukan.
5. Kunci terdahulu `CARTA-ALIR-DESIGN-LOCK.md` **kekal**, termasuk lapan carta alir serta mod cetak. **Jangan ubah `main`**, jangan merge tanpa kebenaran.
6. Kunci ini ialah **rekod kawalan perubahan**, bukan sekatan teknikal yang menghalang semua penulis atau commit secara automatik.

## Penutupan & pengecualian

**TASK 1 dan TASK 2 ditutup sebagai tugasan audit kandungan berdasarkan skop dan bukti di atas.** Tiada keperluan mengulangi kedua-duanya tanpa perubahan sumber/kod atau permintaan khusus. Perkara luar skop (pengesahan visual aksara demi aksara seluruh PDF, perubahan undang-undang selepas tarikh sumber, kesahan menurut kaedah negeri, ujian semua mod/peranti bagi setiap seksyen, Mukadimah dan Lampiran) **bukan disahkan selesai** oleh laporan ini. Tiada fail sumber aplikasi diubah semasa pendokumenan penutupan.
