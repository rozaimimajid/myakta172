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


## Kemas kini audit silang perundangan — 20 Oktober 2026

**Asas semakan:** Akta Perancangan Bandar dan Desa 1976 (Akta 172), teks PLANMalaysia sebagaimana pada 1 Jun 2021:
- https://www.planmalaysia.gov.my/planmalaysia/resources/dokumen/Akta_172/AKTA_172_MUKTAMAD_SEBAGAIMANA_1_JUN_2021.pdf
- https://www.planmalaysia.gov.my/epublisiti/article?id=keperluan-akta-172

### Perkara yang telah terbukti oleh automasi (bukan pengesahan keseluruhan undang-undang)
- GitHub Actions pada commit 572322e dan versi ujian terdahulu telah berjaya.
- Ujian kontrak keputusan RSN/RT/RKK merangkumi sembilan variasi sedia ada dan 46 laluan YA/TIDAK.
- Ini menguji destinasi dan tingkah laku paparan; kesahihan semua fakta, peringkat kuasa dan pengecualian perlu diaudit berasingan.

### Jurang liputan dikesan — perlu keputusan reka bentuk sebelum kod baharu
1. **Seksyen 16 — Pembatalan RT belum ditawarkan sebagai variasi carta berasingan.** Menu semasa: Penyediaan RT, Pengubahan RT, Penggantian RT. Keperluan meliputi pembatalan perlu ditentukan dan diwujudkan sebagai laluan tersendiri jika skop aplikasi ialah proses Akta 172 yang lengkap. Jangan samakan pembatalan dengan penggantian.
2. **Seksyen 16A — laluan arahan kepada Pengarah Negeri tidak diwakili sebagai keputusan/pengecualian.** Jika JPN berpuas hati PBPT tidak mengambil langkah, JPN boleh mengarahkan Pengarah Negeri menyediakan RT atau cadangan di bawah peruntukan berkenaan. Seksyen 12–16 terpakai melalui subseksyen 16A(2).
3. **RKK — Seksyen 16B(3) menetapkan kaedah penyediaan seperti RT dan kuat kuasa seperti RT.** Variasi Pengubahan/Penggantian RKK semasa merupakan pemodelan melalui hubungan dengan peruntukan RT; ia tidak semestinya prosedur autonomi yang disebut secara nyata dalam Seksyen 16B. Pastikan label pedagogi tidak membayangkan peruntukan bebas.
4. **Penolakan draf penyediaan RT** kini mempunyai laluan kembali terus ke proses penyediaan draf. Perlu sahkan sama ada sambungan tersebut sekadar pembelajaran bersyarat atau memerlukan permulaan tatacara baharu, termasuk publisiti, mengikut sifat pindaan dan keputusan pihak berkuasa.
5. **Kelulusan JPN vs persetujuan PBN dan kuat kuasa** mesti terus dipisahkan dalam semakan semantik setiap carta, khususnya laluan terminal selepas penolakan.

### Keutamaan
- P1: Sahkan tatacara pembatalan RT (Seksyen 16) dan tambah liputan yang berbeza daripada penggantian.
- P1: Modelkan pengecualian Seksyen 16A dengan syarat JPN/PBPT/ Pengarah Negeri yang tepat.
- P2: Semak terma RKK melalui subseksyen 16B(1)–(3) dan tatacara RT yang dirujuk.
- P2: Audit semantik setiap laluan dan kandungan penuh Akta 172.

**Keputusan terkini: BELUM LULUS UNTUK MERGE.** Lulus ujian pelayar tidak menggugurkan jurang liputan undang-undang ini. Tiada pindaan ke cabang main dibenarkan tanpa kelulusan pengguna.


## Audit visual PDF sebenar — artifak GitHub Actions 39391448829

Artifak asal: `myakta172-audit-chart-pdfs` (artifact ID 12250230714; sumber cabang audit commit `040db081`). Semakan visual dan pengekstrakan kedudukan teks dibuat pada PDF sebenar yang dimuat turun daripada larian ujian.

### Penemuan yang boleh disahkan
- **RT-popup.pdf:** 2 muka surat. Muka surat kedua hanya mengandungi langkah 7 dan penamat, dengan kandungan teks sehingga kira-kira 124/843 pt tinggi halaman; kebanyakan ruang A4 tidak digunakan. Klasifikasi: isu susun atur/cetakan, bukan kegagalan penjanaan PDF.
- **RSN-popup.pdf:** 1 muka surat; kandungan berada dalam sempadan A4. Perlu semak saiz fon/carta sebelum diterima sebagai mutu visual muktamad.
- **RKK-popup.pdf:** 1 muka surat; kandungan berada dalam sempadan A4. Perlu semak saiz fon/carta sebelum diterima sebagai mutu visual muktamad.
- **KM-actual-popup.pdf:** 2 muka surat; kedua-duanya mengandungi kandungan yang bermakna.
- Tiada muka surat kosong dikesan dalam sembilan PDF artifak yang tersedia menggunakan pemeriksaan teks; ini tidak membuktikan kebolehbacaan sempurna semua elemen grafik.
- Artifak ini mengandungi hanya cetakan variasi lalai popup untuk RT/RSN/RKK, **bukan** 11 PDF setiap variasi. Ujian automatik menguji semua variasi tetapi belum menyimpan semua PDF berasingan untuk audit visual.

### Perlu dibetulkan / diuji
1. **P1 Cetakan RT:** kurangkan muka surat kedua yang hampir kosong tanpa memotong kandungan atau mengecilkan fon secara berlebihan. Elakkan tetapan skala yang menyebabkan teks sukar dibaca.
2. **P1 Liputan bukti:** simpan PDF bagi setiap 11 variasi dalam artifak supaya penyemakan halaman sebenar bukan semata-mata pemeriksaan CSS.
3. **P2 Pemeriksaan visual:** semak bingkai berlian, susunan anak panah, saiz fon dan ruang di sempadan halaman. Ujian unit DOM tidak mencukupi.
4. **P2 Artifak RSN/RKK:** cetakan satu halaman tampak padat; kekalkan kebolehbacaan sebagai keutamaan mengatasi bilangan halaman.

**Keputusan cetakan visual: BELUM LULUS SEPENUHNYA.** Tiada perubahan kod produksi dibuat daripada penemuan ini. Jangan merge ke `main` sehingga audit lengkap.


## Audit visual lengkap 11 variasi — 20 Oktober 2026

**Asas bukti:** Artifak PDF `myakta172-audit-chart-pdfs`, GitHub Actions run `39392175349`, commit `6ea47e1b`, selepas ujian menyimpan PDF setiap variasi. Semua 11 PDF diperiksa menggunakan paparan halaman dan ukuran lokasi teks dalam halaman A4 (tinggi ~843 pt).

| Variasi | Halaman | Kedudukan teks paling bawah pada halaman akhir / 843 pt |
|---|---:|---:|
| RSN prep / review / amend | 1 / 1 / 1 | 771 / 696 / 706 |
| RT prep | 2 | 124 |
| RT review | 2 | 188 |
| RT amend | 2 | 188 |
| RT cancel | 2 | 188 |
| RT director | 2 | 345 |
| RKK prep / review / amend | 1 / 1 / 1 | 789 / 715 / 706 |

**P1 — Pembaziran halaman RT terbukti bagi kelima-lima variasi.** Semua RT memerlukan dua muka surat, tetapi baki halaman kedua digunakan kurang daripada separuh; variasi prep/review/amend/cancel sangat rendah. Dokumen tidak kosong sepenuhnya; terdapat langkah terakhir/terminal dan teks laluan alternatif. Jangan laporkan sebagai 'halaman kosong'.

**P2 — Kekemasan hujung carta dan terminal.** Pemeriksaan visual halaman akhir menunjukkan beberapa kotak terminal laluan keputusan dipaparkan rapat selepas proses akhir. Semak pengasingan visual terminal tanpa menambah pembaziran halaman.

**Batasan audit:** PDF membuktikan hasil Chromium pada tetapan cetakan ujian, bukan setiap versi pelayar atau tetapan pencetak. Keputusan lulus CSS `break-inside: avoid` (148/148 elemen) tidak sama dengan lulus mutu cetakan visual.

**Cadangan pembaikan berhati-hati:** Profil cetak RT sahaja, cuba pengoptimuman jurang menegak, margin cetak, dan susunan terminal; kekalkan saiz fon boleh baca. Bandingkan PDF sebelum/selepas dengan ujian automatik dan semakan visual pada semua lima RT. Jangan ubah cetakan RSN, RKK dan KM tanpa sebab.

**Status:** Cetakan belum diluluskan untuk penggabungan. Tiada perubahan kod aplikasi dibuat dalam langkah ini.


## Eksperimen pembaikan cetakan RT — 20 Oktober 2026

Commit kod `1f969448` mengubah **hanya CSS pada tetingkap cetak RT**: margin A4 daripada 12 mm kepada 8 mm, ketinggian baris daripada 1.22 kepada 1.18, margin body kepada 0; saiz fon kekal 11 px. Ujian regresi GitHub Actions run `39393135718` lulus.

Perbandingan PDF daripada artifak sebelum (`39392175349`) dan selepas (`39393135718`):

| RT | Sebelum | Selepas | Kandungan halaman terakhir |
|---|---:|---:|---|
| prep | 2 halaman | 2 halaman | Hanya penamat, teks hingga 36 pt dari atas |
| review | 2 | 2 | Langkah 6 dan terminal; teks hingga 175 pt |
| amend | 2 | 2 | Langkah 6 dan terminal; teks hingga 175 pt |
| cancel | 2 | 2 | Langkah 6 dan terminal; teks hingga 175 pt |
| director | 2 | 2 | Langkah akhir dan terminal; teks hingga 275 pt |

**Rumusan:** Margin kecil sahaja tidak menyelesaikan pembaziran satu halaman bagi kesemua RT. Jangan dakwa telah selesai. Syor tindakan susulan: semak pengulangan/ruang komponen terminal dan kadar ketinggian langkah sebelum membuat perubahan lanjut; jangan mengecilkan fon secara agresif. RSN/RKK/KM tidak diubah oleh eksperimen ini. Status: BELUM LULUS audit visual cetakan.


## Eksperimen jarak penamat RT — 20 Oktober 2026

Commit `2e4d4e5` mengecilkan jarak pemisah terminal, kotak penamat dan anak panah dalam **CSS popup cetak RT sahaja**; tiada perubahan carta alir dalam aplikasi utama. GitHub Actions run `39394850356` berjaya.

Semakan artifak PDF sebenar (`myakta172-audit-chart-pdfs`, artifact ID 12250593733) menunjukkan:

| Variasi RT | Sebelum | Selepas |
|---|---:|---:|
| Penyediaan | 2 halaman | **1 halaman** |
| Pengubahan | 2 | 2 |
| Penggantian | 2 | 2 |
| Pembatalan | 2 | 2 |
| Arahan Pengarah Negeri | 2 | 2 |

Halaman kedua bagi pengubahan, penggantian dan pembatalan masih menggunakan ruang kecil (teks hingga kira-kira 119 pt). Halaman kedua variasi Pengarah Negeri hingga sekitar 280 pt. Jangan anggap isu cetakan telah diselesaikan sepenuhnya.

**Kesimpulan:** Pengoptimuman berjaya untuk Penyediaan RT sahaja dan tidak menjejaskan ujian regresi. Status audit visual keseluruhan masih BELUM LULUS; pemeriksaan bentuk berlian, garis dan kebolehbacaan pada resolusi sebenar masih diperlukan. Cabang `main` tidak disentuh.


## Pembaikan cetakan RT — keputusan 20 Oktober 2026

Pelarasan CSS cetak RT sahaja pada commit `e3f81680` (jarak cabang keputusan) dan `9c4417b2` (jarak kotak langkah/rujukan/tajuk). Saiz fon asas **11px dikekalkan**. GitHub Actions run `39395380401` dan `39395593594` kedua-duanya berjaya.

**Semakan PDF sebenar pada artifak run 39395593594:** Penyediaan RT, Pengubahan RT, Penggantian RT dan Pembatalan RT masing-masing **1 halaman**. Arahan Pengarah Negeri (16A) masih **2 halaman**, dengan halaman kedua hanya sedikit kandungan (teks hingga ~89 pt daripada atas). Semua PDF tersebut dijana oleh ujian Chromium dan tidak boleh disamakan dengan pengesahan kualiti pencetak sebenar.

**P1 baki:** Pengoptimuman RT 16A agar tidak menghasilkan halaman kedua terlalu kosong, tanpa membuang langkah atau mengecilkan fon. **P2:** Semak kebolehbacaan visual dan keutuhan anak panah/berlian selepas pemadatan CSS. **Keputusan keseluruhan:** belum lulus merge ke main.


## Audit cetakan RT Seksyen 16A — pelarasan khusus

Commit `7ce9d375` menambahkan kelas CSS cetakan hanya apabila variasi `director` dipilih. CSS mengetatkan ruang kotak langkah, cabang dan pemisah tanpa mengubah kandungan atau saiz fon asas 11 px. GitHub Actions run `39396105659` SUCCESS.

Perbandingan fail sebenar `RT-director-popup.pdf`: **2 halaman sebelum dan selepas**. Isi halaman kedua berkurang: batas teks terakhir pada halaman kedua kira-kira **89 pt → 36 pt** dari atas. Perubahan kecil ini **belum menyingkirkan halaman kedua**. Elakkan pemadatan lebih agresif sebelum pengesahan kebolehbacaan visual dan pemisahan halaman; jangan dakwa masalah telah selesai.

Kedudukan: empat variasi RT lain masih satu halaman pada audit terdahulu; audit cetakan 16A belum lulus sepenuhnya. `main` tidak disentuh.


## Penyelesaian pembaziran halaman RT 16A — 20 Oktober 2026

Commit `5315ec95` hanya menyusun semula jarak pemisah dan terminal alternatif dalam **popup cetakan RT Seksyen 16A**. GitHub Actions run `39396908187` selesai SUCCESS. Semakan semula PDF sebenar daripada artifact `12252316256` mengesahkan **semua lima variasi RT kini tepat satu halaman A4**:

| Variasi | Bilangan halaman | Terminal akhir hadir |
|---|---:|---|
| Penyediaan | 1 | Ya |
| Pengubahan | 1 | Ya |
| Penggantian | 1 | Ya |
| Pembatalan | 1 | Ya |
| Arahan Pengarah Negeri / 16A | 1 | Ya; termasuk `RT sedia ada masih berkuat kuasa` |

Ini menyelesaikan **isu bilangan halaman dan ruang pembaziran RT** dalam penghasilan PDF Chromium yang diuji, tanpa mengecilkan fon asas atau membuang terminal. Audit mutu visual halus (bentuk berlian/anak panah pada resolusi cetak) dan kesahihan penuh teks perundangan **masih terbuka**. Tiada penggabungan ke `main`.


## Audit visual bentuk dan kebolehbacaan PDF — 20 Oktober 2026

**Bukti:** PNG yang dirender daripada artifak sebenar GitHub Actions run `39396908187` (versi 11 variasi); perbandingan RSN prep, RT prep/review/cancel/director dan RKK prep secara berdampingan.

1. **P1 — Simbol keputusan berbentuk berlian tidak dikekalkan dalam PDF cetak.** Pada PDF berkenaan, soalan keputusan dan kotak YA/TIDAK kelihatan sebagai susunan segi empat biasa, tanpa geometri berlian yang jelas. Skrip cetak klon memadam `svg` dan gaya popup cetak tidak memuatkan gaya berlian seperti paparan aplikasi. Oleh itu ujian 60 destinasi keputusan lulus tetapi identiti visual carta keputusan masih belum disahkan dalam PDF.
2. **P1 — Teks cetakan kelihatan terlalu kecil pada paparan satu helaian A4**, khususnya carta yang mengandungi banyak langkah dan perihal panjang. Saiz fon 11px pada CSS tidak sama dengan jaminan teks mudah dibaca pada kertas A4; pemampatan menegak mempertingkat risiko ini.
3. **P2 — Elemen alternatif terminal terlalu rapat** dalam beberapa variasi, dan di RT 16A terdapat beberapa baris terminal/pemisah yang sangat padat di kaki carta. Semak penjarakan dan sempadan bacaan.
4. **Keputusan:** 5/5 RT satu halaman secara teknikal tetapi **BELUM LULUS mutu visual cetakan**. Jangan membuat pengoptimuman halaman tambahan semata-mata; utamakan geometri keputusan dan kebolehbacaan, walaupun hasil akhirnya 2 halaman.

**Cadangan kawalan:** Tambah ujian yang memeriksa geometri berlian dalam dokumen cetak dan ukuran fon/carta sebelum mengubah gaya cetak. Simpan rujukan sebelum/selepas. Cabang `main` kekal tidak disentuh.


## Pengesahan cetakan berlian RT — 20 Oktober 2026

Commit `f5e2515d` mengekalkan SVG keputusan dalam popup cetak RT dan memberikan gaya garis berlian. GitHub Actions run `39397577797` SUCCESS; pengesahan visual fail PDF membuktikan bentuk berlian kini kelihatan. Namun, **empat variasi RT (review, amend, cancel, director) kembali kepada 2 halaman**; `prep` kekal 1 halaman. Ini regresi penggunaan kertas berbanding keadaan sebelumnya (5/5 pada satu halaman). **Jangan dakwa pembaikan menyeluruh telah selesai.** Bentuk keputusan dan kebolehbacaan harus diberi keutamaan sebelum pemaksaan satu halaman.

Commit `ad220150` menambah ujian yang mengesahkan setiap keputusan RT dalam dokumen cetak mengandungi polygon SVG berlian; GitHub Actions run `39397986847` SUCCESS. Audit kualiti cetakan dan pengesahan perundangan menyeluruh masih terbuka. `main` tidak disentuh.


## Eksperimen ketinggian berlian cetakan RT — 20 Oktober 2026

Commit `6f95c1eb` menurunkan min-height CSS keputusan cetak RT daripada 54px kepada 42px dan padding 8px 28px kepada 5px 24px; polygon SVG berlian dan fon asas kekal. GitHub Actions run `39398302984` SUCCESS. PDF artifak `12252104546` telah diperiksa secara berasingan: RT prep **1 halaman**, RT review, amend dan cancel **2 halaman** masing-masing dengan hanya ~41 aksara pada halaman kedua; RT director **2 halaman** dengan ~402 aksara di halaman kedua. Ini menunjukkan pengecilan ketinggian berlian sahaja **tidak menyelesaikan pembaziran halaman**. Jangan memampatkan secara agresif: perlu menilai struktur kumpulan keputusan dan terminal serta kebolehbacaan sebenar. `main` tidak disentuh.
