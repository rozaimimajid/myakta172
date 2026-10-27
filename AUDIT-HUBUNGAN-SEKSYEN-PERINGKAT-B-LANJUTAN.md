# MyAKTA172 — Audit B lanjutan: subseksyen, perenggan dan Akta lain
Tarikh: 27 Oktober 2026
Cabang: `audit/stabilization-v1` • Sumber: DATA.sections Akta 172 versi 1 Jun 2021.
Ini ialah semakan teks dan inventori, **bukan** perubahan fungsi, dan bukan pengesahan kemas kini undang-undang selepas 2021.

## Liputan
- Semua **83** seksyen dianalisis.
- Padanan frasa eksplisit: **107** kejadian (seksyen 60, subseksyen 34, perenggan 13); ini ialah kiraan kejadian, bukan bilangan pautan unik.
- Berbanding 53 pautan automatik yang diaudit dalam Peringkat A, terdapat **35 pasangan seksyen tambahan berpotensi** daripada rujukan subseksyen/perenggan yang tidak termasuk dalam pautan semasa. Pasangan ini mesti melalui semakan konteks sebelum dipaparkan, dan tidak boleh dianggap semuanya hubungan sah.
- Semua nombor sasaran yang tertangkap oleh pola mudah memang wujud sebagai nombor seksyen dalam DATA.sections; kewujudan nombor **tidak membuktikan rujukan itu kepada Akta 172**.

## Pemerhatian kritikal
1. Seksyen 56: petikan kepada Akta Suruhanjaya Siasatan 1950 [Akta 119] adalah **tepat menurut arahan pemilik; JANGAN UBAH**. Pautan automatik yang mungkin tersasar ialah perkara destinasi berasingan.
2. Seksyen 29: frasa `perenggan 2(a)` dalam konteks dalaman perlu diperiksa sebagai penomboran perenggan atau kemungkinan rujukan lain; nombor yang wujud bukan bukti ia pautan kepada Seksyen 2 Akta 172.
3. Bentuk seperti `Seksyen 8, 9, 11 ... Akta 119` menggunakan **senarai yang dikongsi nama akta**. Pengecaman setiap rujukan memerlukan konteks rentas frasa, bukan regex satu nombor sahaja.
4. Rujukan `subseksyen (1)` atau `perenggan (a)` tanpa nombor seksyen ialah rujukan dalaman dan tidak patut dijadikan pautan ke seksyen lain secara automatik.
5. Dapatan ini **tidak membuktikan** kesempurnaan semua rujukan substantif perundangan; hanya bentuk teks yang dicari.

## Inventori calon hubungan tambahan (belum diluluskan untuk paparan)
| Dari | Ke calon | Bentuk | Petikan konteks ringkas |
|---|---|---|---|
| 2 | 38 | subseksyen | kawasan pemajuan yang diisytiharkan di bawah subseksyen 38(1); “kawasan khas” ertinya kawasan yang ditetapkan di bawah seksyen 16B; “kawasan plinth” e |
| 2 | 21A | subseksyen | ng pemohon bagi kebenaran merancang di bawah subseksyen 21A(1); “Lembaga Rayuan” ertinya Lembaga Rayuan yang ditubuhkan di bawah seksyen 36; “luas lan |
| 2 | 10 | subseksyen | yang berkuat kuasa dalam kawasan itu menurut subseksyen 10(6); dan, berhubung dengan mana-mana tanah atau bangunan, ertinya rancangan struktur, sebaga |
| 2 | 15 | subseksyen |  ini berkuat kuasa dalam kawasan itu menurut subseksyen 15(1); dan, berhubung dengan mana-mana tanah atau bangunan, ertinya rancangan tempatan, sebaga |
| 13 | 15 | subseksyen | endaklah, sebelum menerima pakainya di bawah subseksyen 15(1), tetapi tidak sebelum rancangan struktur, setakat ia terpakai bagi kawasan draf rancanga |
| 18 | 19 | perenggan | bangunan bagi maksud yang diperihalkan dalam perenggan 19(2)(d). (3) Subseksyen (1) tidak menyentuh pelanjutan penggunaan mana-mana tanah atau banguna |
| 19 | 24 | subseksyen | i bawah seksyen 22 atau dilanjutkan di bawah subseksyen 24(3). (2) Walau apa pun peruntukan subseksyen (1), kebenaran merancang tidak perlu— (a) bagi  |
| 21A | 21 | subseksyen | yang dikehendaki supaya dikemukakan di bawah subseksyen 21(1) untuk kebenaran merancang, pemohon hendaklah mengemukakan suatu laporan cadangan pemajua |
| 21B | 21A | perenggan | 21B. (1) Pelan susun atur di bawah perenggan 21A(1)(f) hendaklah menunjukkan pemajuan yang dicadangkan dan khususnya— (a) jika pemajuan itu  |
| 21C | 58 | perenggan | eorang yang kelayakannya ditetapkan di bawah perenggan 58(2)(h); atau (b) seseorang yang berhak berbuat sedemikian di bawah mana-mana undang-undang be |
| 22 | 34 | subseksyen | n pihak berkuasa perancang tempatan di bawah subseksyen 34(1) untuk membayar caj pemajuan secara ansuran. (5) Syarat-syarat yang dikenakan di bawah su |
| 23 | 22 | subseksyen | uasa perancang tempatan yang dibuat di bawah subseksyen 22(3) boleh dibuat kepada Lembaga Rayuan dalam tempoh satu bulan dari tarikh keputusan itu dik |
| 23 | 21 | subseksyen | eseorang yang telah membuat bantahan menurut subseksyen 21(6) dan yang terkilan dengan keputusan pihak berkuasa perancang tempatan berhubung dengan ba |
| 24 | 22 | subseksyen |  kebenaran merancang yang diberikan di bawah subseksyen 22(3) hendaklah, melainkan jika dilanjutkan tempohnya, luput dua belas bulan selepas tarikh ia |
| 25 | 22 | subseksyen |  kebenaran merancang yang diberikan di bawah subseksyen 22(3) atau sesuatu kelulusan pelan bangunan yang diberikan di bawah mana-mana undang-undang ke |
| 27 | 24 | subseksyen | an itu telah dibuat di bawah seksyen 22 atau subseksyen 24(3) sebelum pemajuan itu dimulakan, diusahakan, atau dijalankan, ia tentu, pada menjalankan  |
| 29 | 2 | perenggan | yang berhubungan dengan suatu notis di bawah perenggan 2(a), yang juga bukannya pemunya tanah itu, boleh disabitkan bagi suatu kesalahan di bawah subs |
| 35B | 22 | perenggan | k pada syarat-syarat yang dikenakan di bawah perenggan 22(5)(f) dan (g). |
| 35C | 35A | perenggan | pemberian suatu kebenaran bertulis, di bawah perenggan 35A(2)(a); atau (d) suatu perintah untuk menanam atau menggantikan pokok di bawah perenggan 35A |
| 35D | 35C | perenggan | okok membuktikan bahawa dia, kerana mematuhi perenggan 35C(a) hingga (d), mengalami kerugian berupa kesusutan dalam nilai tanahnya, dia boleh menuntut |
| 35D | 35A | perenggan | rtulis atau pengenaan syarat-syarat di bawah perenggan 35A(2)(a); atau (iii) perintah untuk menggantikan pokok di bawah perenggan 35A(2)(b), diberitah |
| 35E | 35A | subseksyen | kepada orang yang didapati bersalah di bawah subseksyen 35A(4) kerana menebang mana-mana pokok yang berkenaan dengannya suatu perintah pemeliharaan po |
| 35E | 1 | perenggan | h pihak berkuasa perancang tempatan di bawah perenggan 1(c) bagi penggantian pokok boleh dilanjutkan sekali atas permohonan orang yang berkewajipan me |
| 35F | 35E | subseksyen |  kegagalan untuk menggantikan pokok di bawah subseksyen 35E(1), pihak berkuasa perancang tempatan boleh meneruskan untuk menggantikan pokok itu dan, w |
| 35G | 22 | subseksyen | ksud memberikan kebenaran merancang di bawah subseksyen 22(3) berkenaan dengan sesuatu kawasan yang mengenainya suatu perintah pemeliharaan pokok berk |
| 37 | 22 | subseksyen | tidak diberikan kebenaran merancang di bawah subseksyen 22(3) untuk memajukan tanahnya atas alasan bahawa tanah itu ditunjukkan dalam rancangan pemaju |
| 37 | 3 | perenggan | ai diperlukan bagi maksud yang disebut dalam perenggan 3(1)(b) Akta itu. (7) Walau apa pun mana-mana undang-undang yang berlawanan, dalam menaksir ama |
| 39 | 3 | perenggan | i diperlukan bagi maksud yang tersebut dalam perenggan 3(1)(b) Akta itu. |
| 40 | 38 | subseksyen |  tarikh perisytiharan itu disiarkan di bawah subseksyen 38(1), dengan memberikan perhatian kepada jenis dan keadaan harta itu, lamanya bangunan itu mu |
| 41 | 38 | subseksyen | majuan pada menunaikan kewajipannya di bawah subseksyen 38(2), pihak berkuasa perancang tempatan boleh melantik atau menggaji ejen, atau, dengan kelul |
| 43 | 38 | subseksyen | san pemajuan yang telah dimajukannya menurut subseksyen 38(2). |
| 44 | 41 | subseksyen | dan syarat-syarat apa-apa perkiraan di bawah subseksyen 41(1); (c) untuk memperoleh pelaksanaan yang adil dan saksama seksyen 43; dan (d) amnya untuk  |
| 49 | 48 | subseksyen |  yang kandungannya boleh dibuktikan di bawah subseksyen 48(2) dengan suatu salinan yang diperakui, atau hadir sebagai seorang saksi untuk membuktikan  |
| 56 | 4 | subseksyen |  pendengaran tempatan yang diadakan di bawah subseksyen 4(7) atau 14(1) dan bagi mana-mana orang yang mengadakan siasatan atau pendengaran itu seolah- |
| 57 | 27 | subseksyen | elain fi tambahan yang kena dibayar di bawah subseksyen 27(7) dan 28(7). (2) Pengecualian di bawah subseksyen (1) tidak meliputi caj pemajuan. |

## Langkah susulan
Semak setiap calon pautan mengikut konteks akta, kemudian bezakan rujukan Akta 172, Akta lain, rujukan dalaman dan kabur. Tiada ubah kod `index.html`, teks Akta, catatan editorial, lapan carta alir, Desktop/Mobile, atau `main`.
