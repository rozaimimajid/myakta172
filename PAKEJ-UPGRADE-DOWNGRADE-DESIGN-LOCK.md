# MyAKTA172 — DASAR UPGRADE & DOWNGRADE PAKEJ (DESIGN LOCK)

**Diluluskan dan DIKUNCI:** 28 Oktober 2026  
**Pemilik:** Keputusan pemilik projek MyAKTA172 dalam perbincangan pakej  
**Cabang:** `audit/stabilization-v1` sahaja; jangan ubah `main`.  
**Status:** Dasar perniagaan rasmi; **belum diintegrasikan pada transaksi pelanggan sebenar**.

## 1. Pakej dan tempoh yang kekal
- Free: RM0, tiada tamat tempoh berbayar.
- Basic: RM15 / 30 hari.
- Rahmah: RM25 / 30 hari.
- Premium: RM50 / 30 hari.
- Langganan berbayar tamat tanpa pembaharuan diluluskan **automatik menjadi Free** mengikut `AUTO-DOWNGRADE-DESIGN-LOCK.md`. Dasar ini tidak berubah.

## 2. UPGRADE — Kaedah B: kredit baki + tempoh baharu 30 hari (DIKUNCI)

**Kes terpakai:** Free → Basic/Rahmah/Premium; Basic → Rahmah/Premium; Rahmah → Premium.

1. Pengguna **memilih naik taraf semasa pakej asal masih aktif** dan sistem menunjukkan harga pakej sasaran, baki masa belum digunakan, kredit, bayaran bersih, dan tarikh asas pengiraan.
2. Untuk pakej berbayar, `kredit = harga_pakej_asal × max(0, masa_berbaki / tempoh_asal)`, dihadkan antara RM0 dan harga asal. Pengiraan menggunakan masa server berautoriti, bukan jam peranti; pembundaran wang kepada sen (RM0.01) secara konsisten. Pakej Free: kredit RM0.
3. `bayaran_upgrade = max(RM0, harga_pakej_baharu - kredit)`. Pengguna mesti **menerima pengiraan** sebelum membuat bayaran.
4. **Bayaran dibuat ketika permohonan upgrade**; tidak perlu menunggu paket asal tamat. Sebut harga sah **24 jam**; jika belum dibayar/diserahkan dalam tempoh sah, sistem mengira semula kredit dan jumlah. Untuk bayaran/resit yang diserahkan dalam tempoh sebut harga sah, jumlah dan kredit **dibekukan pada nilai tersebut sepanjang semakan Admin**. Kelulusan lewat bukan alasan menambah bayaran.
5. **Pending/Tolak** tidak memberi akses pakej baharu. Pengguna kekal pada pakej lama selagi langganan asal aktif. Jika langganan asal tamat ketika masih Pending, hak akses jatuh ke Free secara automatik; tiada akses berbayar selepas tamat.
6. Selepas pembayaran **disahkan dan diluluskan** oleh Admin, hak pakej baharu diaktifkan **serta-merta pada masa kelulusan**. Tempoh baharu **30 hari penuh** bermula daripada masa kelulusan, bukan daripada masa bayaran, masa sebut harga, atau tarikh tamat pakej lama. Baki masa langganan asal diselesaikan melalui kredit terkunci; **tidak dibawa sebagai hari tambahan**. Hanya satu pakej berbayar aktif dalam satu masa.
7. Jika Admin lambat meluluskan, pengguna **tidak kehilangan 30 hari penuh pakej baharu**, dan tiada bayaran tambahan akibat kelewatan semakan. Permohonan dan tarikh-tarikh penting perlu terpapar dalam rekod Admin serta log audit.
8. Pakej berbayar baharu akan **automatik jatuh kepada Free** selepas 30 hari jika tiada pembaharuan diluluskan.

**Contoh (masa tepat separuh langganan):** Basic RM15, baki 15/30 hari → kredit RM7.50; Premium RM50 → **bayar RM42.50** ketika mohon upgrade. Jika bayar pada hari ke-15 dan Admin lulus pada hari ke-18, Basic digunakan hingga kelulusan; Premium mendapat **30 hari bermula hari ke-18**. Kredit RM7.50 dan jumlah RM42.50 tidak dikira semula selepas bayaran yang sah dikemukakan.

## 3. DOWNGRADE — Pertukaran berjadual selepas tamat (DIKUNCI)

**Kes terpakai:** Premium → Rahmah/Basic; Rahmah → Basic; pakej berbayar → Free.

1. Pengguna boleh **menjadualkan downgrade semasa pakej semasa masih aktif**. Pakej sedia ada terus memberikan semua hak sehingga tarikh tamatnya; downgrade **tidak mengurangkan atau mematikan baki tempoh yang telah dibayar**.
2. Untuk downgrade kepada pakej berbayar, **tiada kredit prorata dan tiada pemulangan wang**, kerana seluruh tempoh asal tetap boleh digunakan. Harga pakej sasaran adalah **harga penuh 30 hari**. Tiada debit/pembayaran automatik.
3. Pengguna diberitahu jumlah pakej sasaran dan boleh menyerahkan bayaran serta resit untuk semakan. Jika bayaran **telah diluluskan sebelum tamat pakej lama**, pakej rendah **bermula pada tarikh/masa tamat lama** dengan **30 hari penuh baharu**, tanpa pertindihan. Tiada akses pakej lebih rendah diaktifkan sebelum tarikh tersebut.
4. Jika bayaran pakej rendah **belum diluluskan** pada masa pakej lama tamat, akaun **automatik menjadi Free** sementara menunggu. Apabila bayaran diluluskan kemudian, **30 hari penuh pakej rendah** bermula pada masa kelulusan; tiada tempoh berbayar terpotong kerana lewat disemak.
5. Downgrade kepada **Free** ialah pertukaran pada tarikh tamat lama tanpa bayaran, tanpa kelulusan Admin untuk hak Free.
6. Rekod pilihan downgrade berjadual, permohonan pembayaran, masa kelulusan, tarikh mula berkesan, dan tempoh baharu mesti kekal untuk audit; pengguna bebas melihat statusnya pada akaun.
7. Jika pengguna membatalkan pilihan berjadual, atau memilih transaksi baru yang bertentangan, backend mesti mengesahkan keadaan semasa dan memerlukan pengesahan transaksi; **jangan aktifkan dua langganan berbayar serentak**.

**Contoh:** Premium RM50 untuk 1–30 November. Pengguna pilih Rahmah pada 15 November. Premium kekal sehingga tamat 30 November. Jika bayaran Rahmah RM25 telah diluluskan lebih awal, Rahmah aktif mulai 1 Disember selama 30 hari. Jika belum diluluskan, Free bermula ketika Premium tamat; Rahmah bermula 30 hari dari kelulusan berikutnya.

## 4. Keperluan sistem & perlindungan

- Sebelum pengguna membayar upgrade, papar **harga sasaran, kredit pakej lama, jumlah tepat perlu dibayar, tempoh sah sebut harga, dan pemakluman bahawa aktivasi memerlukan kelulusan**.
- Sebelum pengguna membayar downgrade, papar **harga penuh pakej rendah, tarikh tamat pakej sekarang, tarikh kuat kuasa yang dijadualkan dan syarat kelulusan pembayaran**.
- Backend wajib membuat pengiraan menggunakan tarikh/waktu server yang dipercayai, mengesahkan harga dan kelulusan, serta menyimpan **sebut harga/kredit terkunci, resit, status permohonan, log perubahan dan tarikh mula/tamat baharu** dalam transaksi atomik. Jangan terima nilai amaun atau hak akses daripada JavaScript pengguna.
- Pengiraan tempoh dipaparkan dalam waktu Malaysia bagi kegunaan pengguna tetapi disimpan sebagai UTC / timestamp berzon masa untuk ketepatan.
- Dalam semua keadaan, **hak akses berbayar hanya selepas kelulusan dan ketika langganan baharu telah bermula**. Pending/Tolak tidak memanjangkan akses. Kawalan satu akaun/satu peranti kekal.
- Semua peraturan hanya untuk **satu akaun** dan **satu langganan aktif**; kekalkan sejarah pakej dan pembayaran walaupun naik/turun taraf.
- Perlu ujian kes: upgrade tengah tempoh; upgrade tepat masa tamat; sebut harga 24 jam luput; kelulusan lewat; downgrade prabayar awal; downgrade Pending ketika tamat; auto-Free; bayaran ditolak; permintaan serentak; pembundaran sen; waktu zon dan pembatalan permohonan.

## 5. Sempadan pelaksanaan

Keputusan **DIKUNCI**, tidak diubah kecuali arahan khusus pemilik. Kod Dashboard Admin sekarang masih demonstrasi dan **belum melaksanakan kredit prorata/pemilihan downgrade berjadual sebenar**. Enjin auto-downgrade dan lapisan backend yang dibina berasingan belum disambungkan kepada transaksi pelanggan; jangan dakwa sudah berfungsi untuk pengguna sebenar.

Jangan ubah `main`, teks Akta 172, reka bentuk Dashboard Biru Royal, navigasi, logo DigitalHubb.my, Hubungan Antara Seksyen atau lapan carta alir yang telah dikunci.
