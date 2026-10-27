# Audit Peringkat B — Ketepatan Hubungan Antara Seksyen MyAKTA172

Tarikh: 27 Oktober 2026. Cabang: `audit/stabilization-v1`.
Skop: hubungan automatik yang dikesan berdasarkan teks 83 rekod seksyen Akta 172 (cetakan semula 1 Jun 2021); **bukan** audit kesahihan undang-undang terkini, dan bukan senarai lengkap semua hubungan substantif antara seksyen.

## Keputusan
- 83 rekod seksyen diperiksa; 29 mengandungi rujukan eksplisit yang dipautkan.
- 53 hubungan unik terhasil; **52** merupakan rujukan terus ke seksyen Akta 172 yang dikenal pasti dalam teks; **1** ialah rujukan kepada undang-undang lain yang tersalah dipautkan.
- Isu disahkan: teks Seksyen **56** menyebut “Seksyen 8, 9, 11, 12, 13, 14, 19, 21 dan 22 Akta Suruhanjaya Siasatan 1950 [Akta 119]”. Ini **bukan** pautan kepada Seksyen 8 Akta 172. Parser sedia ada mengenali permulaan frasa sahaja lalu menghasilkan pautan **56 → 8** yang tidak tepat. Rujukan lain dalam senarai tersebut juga bukan seksyen Akta 172 tetapi kini tidak dikesan oleh parser.
- Semakan menilai pautan eksplisit daripada sumber teks yang dikunci. Status “rujukan dalam Akta 172” merujuk kepada pengenalpastian silang tekstual, bukan penilaian atau pengesahan hubungan doktrin undang-undang, kesesuaian pindaan terbaru atau akibat undang-undang.
- Perkataan “Seksyen” yang merujuk akta lain, senarai nombor selepas satu perkataan “seksyen”, serta rujukan bentuk “subseksyen” perlu dilayan berasingan dalam reka bentuk pengesan masa depan.

## Tindakan yang dicadangkan
1. Tandakan pautan **56 → 8** sebagai *false positive*. Kekalkan teks Seksyen 56 sepenuhnya.
2. Pada pembetulan seterusnya, tapis rujukan ke Akta lain berdasarkan konteks nama Akta dan senarai rujukan, bukan dengan memadam teks perundangan.
3. Uji semula 83 seksyen dalam Desktop/Mobile, dan pastikan pautan Seksyen 19 → 22 serta semua hubungan lain kekal berfungsi.
4. Audit perundangan manual terhadap *hubungan substantif yang tidak disebut secara eksplisit* (contohnya kaitan proses KM) ialah skop berasingan; jangan menambah pautan secara inferens tanpa pengesahan pemilik.

## Senarai 53 pautan yang dikenal pasti

| Dari | Ke | Status rujukan |
|---|---|---|
| 2 | 32 | RUJUKAN DALAM AKTA 172 |
| 2 | 4 | RUJUKAN DALAM AKTA 172 |
| 2 | 6A | RUJUKAN DALAM AKTA 172 |
| 2 | 16B | RUJUKAN DALAM AKTA 172 |
| 2 | 2B | RUJUKAN DALAM AKTA 172 |
| 2 | 36 | RUJUKAN DALAM AKTA 172 |
| 2 | 2A | RUJUKAN DALAM AKTA 172 |
| 2 | 37 | RUJUKAN DALAM AKTA 172 |
| 2 | 30 | RUJUKAN DALAM AKTA 172 |
| 2 | 35A | RUJUKAN DALAM AKTA 172 |
| 2 | 5 | RUJUKAN DALAM AKTA 172 |
| 2 | 6B | RUJUKAN DALAM AKTA 172 |
| 8 | 7 | RUJUKAN DALAM AKTA 172 |
| 8 | 10 | RUJUKAN DALAM AKTA 172 |
| 9 | 7 | RUJUKAN DALAM AKTA 172 |
| 10 | 17 | RUJUKAN DALAM AKTA 172 |
| 11A | 11 | RUJUKAN DALAM AKTA 172 |
| 11A | 7 | RUJUKAN DALAM AKTA 172 |
| 11A | 9 | RUJUKAN DALAM AKTA 172 |
| 11B | 11 | RUJUKAN DALAM AKTA 172 |
| 11B | 17 | RUJUKAN DALAM AKTA 172 |
| 16 | 13 | RUJUKAN DALAM AKTA 172 |
| 16 | 12 | RUJUKAN DALAM AKTA 172 |
| 16A | 12 | RUJUKAN DALAM AKTA 172 |
| 19 | 22 | RUJUKAN DALAM AKTA 172 |
| 20 | 22 | RUJUKAN DALAM AKTA 172 |
| 20B | 20A | RUJUKAN DALAM AKTA 172 |
| 21A | 21B | RUJUKAN DALAM AKTA 172 |
| 22 | 21 | RUJUKAN DALAM AKTA 172 |
| 24 | 23 | RUJUKAN DALAM AKTA 172 |
| 26 | 18 | RUJUKAN DALAM AKTA 172 |
| 26 | 19 | RUJUKAN DALAM AKTA 172 |
| 26 | 20 | RUJUKAN DALAM AKTA 172 |
| 26 | 25 | RUJUKAN DALAM AKTA 172 |
| 27 | 19 | RUJUKAN DALAM AKTA 172 |
| 27 | 22 | RUJUKAN DALAM AKTA 172 |
| 27 | 21 | RUJUKAN DALAM AKTA 172 |
| 28 | 20 | RUJUKAN DALAM AKTA 172 |
| 28 | 22 | RUJUKAN DALAM AKTA 172 |
| 28 | 21 | RUJUKAN DALAM AKTA 172 |
| 29 | 25 | RUJUKAN DALAM AKTA 172 |
| 31 | 27 | RUJUKAN DALAM AKTA 172 |
| 32 | 35 | RUJUKAN DALAM AKTA 172 |
| 35B | 35A | RUJUKAN DALAM AKTA 172 |
| 37 | 30 | RUJUKAN DALAM AKTA 172 |
| 39 | 38 | RUJUKAN DALAM AKTA 172 |
| 39 | 40 | RUJUKAN DALAM AKTA 172 |
| 41 | 44 | RUJUKAN DALAM AKTA 172 |
| 43 | 44 | RUJUKAN DALAM AKTA 172 |
| 44 | 43 | RUJUKAN DALAM AKTA 172 |
| 48 | 47 | RUJUKAN DALAM AKTA 172 |
| 56 | 8 | RUJUKAN AKTA LAIN |
| 59 | 1 | RUJUKAN DALAM AKTA 172 |

## Perlindungan
Audit ini hanya menghasilkan dokumen dapatan. Tiada perubahan kepada `index.html`, teks 83 seksyen, 19 nota editorial, navigasi, carta alir, atau `main`.
