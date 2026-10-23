# MyAKTA172 — KUNCI KANDUNGAN AKTA 172 (TASK 1 & TASK 2)

**Tarikh kelulusan rekod:** 24 Oktober 2026  
**Cabang kerja sahaja:** `audit/stabilization-v1`; **`main` TIDAK BOLEH DIUBAH** tanpa arahan nyata pemilik.  
**Laporan asas:** `AUDIT-AKTA172-TASK1-TASK2-FINAL.md`.  
**Dokumen rujukan:** Akta 172, cetakan semula dikemas kini sebagaimana pada **1 Jun 2021**.

## Skop LOCK

1. **83 rekod seksyen utama** dalam `index.html` → `DATA.parts` dan `DATA.sections`: nombor seksyen, tajuk, susunan, Bahagian, dan `text` (teks sebenar Akta).
2. **19 catatan editorial** merentasi **13 seksyen**: 1, 5, 22, 26, 27, 28, 29, 30, 35A, 35E, 35H, 36, 58. Catatan berada di `DATA.sections[].notes`, **bukan** disatukan dengan `text`.
3. Kekalkan pemaparan blok berasingan `Nota Editorial / Catatan` selepas teks perundangan; jangan ubah label, susunan, atau kandungan nota secara sampingan.
4. Format identiti seksyen seperti `35A` (bukan `35 A`) dan teks rujukan `VIA` (bukannya `VI A`) diterima pemilik. Jangan jadikan perbezaan jarak dalam PDF sebagai pembetulan yang tidak diminta.
5. **Semua 8 carta alir dan semua mod cetak tetap LOCK** mengikut `CARTA-ALIR-DESIGN-LOCK.md`. Jangan ubah carta alir, pautan, geometri, berlian, navigasi, cetak, rupa bentuk atau tetapan lain secara sampingan.

## Prosedur bagi perubahan yang diminta pemilik pada masa depan

- Terima arahan jelas pemilik yang menyatakan skop perubahan; elakkan pengubahsuaian tersirat atau pengulangan audit tanpa sebab.
- Semak dokumen perundangan yang relevan dan rekod asas kesahan/tarikh sumber; buat perubahan **minimum** di cabang audit sahaja.
- Periksa diff bagi memastikan tiada unsur terkunci lain berubah; uji fungsi berkaitan dan dapatkan pengesahan pemilik apabila melibatkan paparan.
- Jangan merge/push ke `main` tanpa arahan khusus.

## Pengertian status audit

**TASK 1:** selesai bagi **audit perbandingan teks berkomputer** merentasi 83 seksyen (tiada ralat kandungan disahkan), **bukan** pengesahan visual manual setiap aksara pada semua halaman dan **bukan** pengesahan kemas kini undang-undang selepas 1 Jun 2021.  
**TASK 2:** selesai bagi padanan 19/19 nota, pengasingan data dan pemaparan kod; pemilik mengesahkan sampel visual Seksyen 27 pada desktop/mobile.

**Nota:** LOCK ini ialah **dasar kawalan perubahan yang didokumenkan**. Fail Markdown sahaja tidak melaksanakan perlindungan automatik atau kawalan akses GitHub.
