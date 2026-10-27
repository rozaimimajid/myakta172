# MyAKTA172 — AUTO-DOWNGRADE PAKEJ: DESIGN LOCK

**Tarikh kelulusan:** 27 Oktober 2026  
**Keputusan pemilik:** SETUJU — DIKUNCI  
**Repositori:** `rozaimimajid/myakta172`  
**Cabang pembangunan:** `audit/stabilization-v1` sahaja; **JANGAN UBAH `main`**.  
**Status pelaksanaan:** DASAR MUKTAMAD untuk backend Fasa 3. **Belum diimplementasikan pada pelanggan sebenar.**

## 1. Keputusan rasmi yang dikunci
Apabila tempoh langganan berbayar **Basic, Rahmah atau Premium** berakhir tanpa pembaharuan yang telah **disahkan/diluluskan**, hak akses pengguna **turun secara automatik ke pakej Free (RM0)**. Admin tidak perlu menekan butang Tukar Pakej, dan tiada tempoh tangguh akses premium secara tersirat.

Pakej Free tidak mempunyai tarikh tamat langganan berbayar. Setiap langganan berbayar berjangka **30 hari**.

## 2. Penguatkuasaan masa dan akses
- Backend merupakan **sumber kebenaran tunggal** bagi masa tamat, status pembayaran, pakej berkesan dan hak akses; gunakan waktu server yang dipercayai. Tepat apabila `server_now >= expires_at`, hak akses berbayar tamat.
- Semakan hak akses perlu berlaku pada **setiap permintaan kandungan atau fungsi berbayar**, bukan hanya ketika login, membuka Dashboard, atau apabila suatu tugasan berjadual berjalan. Maka walaupun kerja latar belum mengemas kini paparan, backend mesti terus membenarkan **Free sahaja** selepas luput.
- Tugasan berjadual/background pada backend boleh mengemas kini `current_plan=Free`, paparan Admin dan log status untuk konsistensi rekod, tetapi **bukan satu-satunya kawalan keselamatan**.
- Selepas luput, akses efektif pengguna hanyalah **Free: Bahagian I dan II; Kegemaran dan Sejarah Bacaan**. Carian Seksyen dan Kata Kunci/wildcard, Analisis Kes, Glosari Istilah, Hubungan Seksyen Berkaitan, penanda warna, bacaan suara dan carta alir/cetakan hendaklah mengikuti matriks Free yang dikunci.
- Token atau sesi sedia ada **tidak boleh membawa hak premium lama**; hak dinilai pada backend setiap permintaan. Jangan menyediakan kandungan premium melalui fail awam, caching atau PWA selepas tamat tempoh.
- Jika akaun digantung, sekatan akaun tetap terpakai; tamat tempoh langganan tidak boleh memintas penggantungan. Polisi satu akaun satu peranti terus dikekalkan.

## 3. Data dan sejarah
- **Kekalkan akaun, ID, emel, Kegemaran, Sejarah Bacaan, sejarah pakej, rekod resit/pembayaran dan log pentadbiran.** Jangan padamkan data ini kerana auto-downgrade.
- Data berkaitan ciri premium seperti penanda warna yang pernah disimpan boleh dikekalkan untuk pemulihan jika pengguna melanggan semula, **tetapi jangan boleh diakses/diedit melalui ciri premium sewaktu berada dalam Free**.
- Rekodkan event boleh diaudit: akaun, pakej asal, tarikh/masa tamat, perubahan efektif kepada Free, sebab `AUTO_EXPIRED` dan masa pemprosesan. Kekalkan sejarah pakej terdahulu untuk laporan.
- Paparan Admin pengguna mesti membezakan **pakej efektif semasa: Free** daripada **sejarah pakej berbayar terdahulu: Tamat**. Jangan kelirukan pengguna dengan pakej Rahmah masih seolah-olah aktif.

## 4. Pembaharuan dan pembayaran
- Bayaran dalam status **Menunggu** tidak melanjutkan akses berbayar. Hanya pembaharuan yang disahkan/diluluskan boleh mengaktifkan semula Basic/Rahmah/Premium.
- Pembaharuan pakej sama yang diluluskan *sebelum* tarikh tamat: tambah 30 hari bermula tarikh tamat sedia ada. Pembaharuan yang diluluskan *selepas* tamat: mula tempoh 30 hari baharu mengikut peraturan pengaktifan yang disahkan.
- Tiada pemotongan bayaran secara automatik ditetapkan oleh keputusan ini; **auto-downgrade bukan auto-renew atau auto-debit**.

## 5. Ujian penerimaan wajib sebelum produksi
1. Rahmah yang masih aktif boleh menggunakan seksyen/fungsi mengikut Rahmah.
2. Sebaik sahaja `server_now >= expires_at`, tanpa tindakan Admin, API menolak sumber premium tetapi membenarkan akses Free.
3. Kemas kini paparan pengguna dan Admin menunjukkan Free semasa, dengan rekod Rahmah tamat disimpan.
4. Akaun/emel, Kegemaran/Sejarah Bacaan, resit serta rekod log tidak hilang.
5. Token, sesi lama, device kedua, kandungan cache/PWA dan panggilan terus API tidak memintas sekatan.
6. Pembayaran Menunggu tidak mengaktifkan hak premium; pembayaran Diluluskan mengaktifkan semula dengan tarikh yang betul.
7. Akaun Digantung tetap digantung; tiada akses diberikan hanya kerana downgrade.
8. Ujian sempadan tepat masa tamat, zon waktu, permintaan serentak dan idempotensi event berjalan tanpa akses tambahan atau log berganda.

## 6. Perlindungan
Keputusan reka bentuk ini **DIKUNCI**. Jangan ubah reka bentuk Desktop/Mobile, teks Akta 172, fungsi Hubungan Antara Seksyen, lapan carta alir, logo rasmi DigitalHubb.my dan fungsi lain yang diluluskan. Jangan sentuh cabang `main`. Pelaksanaan hanya dalam cabang `audit/stabilization-v1` selepas arahan pembangunan seterusnya daripada pemilik.

**Peringatan:** Dashboard Admin sekarang ialah simulasi frontend; status `Tamat` dalam paparan yang sedia ada **belum sama dengan auto-downgrade sebenar**. Dokumen ini mencatat keputusan yang diluluskan, **bukan dakwaan bahawa sistem automatik telah siap berfungsi**.
