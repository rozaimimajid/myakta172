# MyAKTA172 — Penutupan Tindakan 3: Semakan Baki Fungsi Aplikasi

**Tarikh:** 24 Oktober 2026  
**Repositori:** `rozaimimajid/myakta172`  
**Cabang dibenarkan:** `audit/stabilization-v1` sahaja (`main` tidak diubah)  
**Jenis kerja:** Semakan bukti regresi terkini, semakan fungsi bukan carta yang belum jelas statusnya, dan penutupan senarai semakan terdahulu tanpa mengulangi audit yang diluluskan.

## Bukti ujian sebenar yang diperoleh

GitHub Actions **MyAKTA172 audit smoke test**, run [39928636323](https://github.com/rozaimimajid/myakta172/actions/runs/39928636323), selesai dengan **conclusion: success** pada **23 Oktober 2026**, untuk commit aplikasi **`ed32fce93038d1329a48219dd481c003009f9679`** dalam cabang audit.

- Langkah **Run browser regression**: success.
- Suite `tests/smoke.mjs`: **42 ujian `await check`**. Dengan mekanisme ujian mengembalikan exit bukan sifar apabila kegagalan berlaku, status langkah `success` menyokong **42/42 ujian berjaya** untuk commit berkenaan.
- Langkah **Upload chart print previews** dan **Upload regression result summary**: success. Artifak `myakta172-audit-chart-pdfs` dan `myakta172-audit-regression-results` telah direkodkan; kandungan fail ZIP tidak diperiksa satu per satu dalam penutupan ini.
- Commit selepas itu untuk TASK 1 dan TASK 2 menambah **dokumen Markdown sahaja**, tidak mengubah kod aplikasi atau suite ujian. Maka bukti CI di atas mewakili kod aplikasi semasa selagi fail aplikasi tidak berubah.

## Fungsi bukan carta: liputan ujian tersedia

1. **Navigasi dan bacaan Akta:** komponen halaman utama, sidebar tutup/buka, perubahan seksyen/tajuk/teks, pulang ke Utama, pemilihan bahagian dan navigasi mod mobile — termasuk dalam suite automatik.
2. **Carian kata kunci dan analisis kes:** hasil pautan seksyen, tiada padanan, input kosong, pembersihan input — termasuk dalam suite automatik.
3. **Rekod bacaan/kegemaran:** penyimpanan bookmark dan sejarah, penolakan ID seksyen palsu bagi senarai desktop/mobile — termasuk dalam suite automatik.
4. **Tetapan:** mod tema dan pilihan suara — termasuk dalam suite automatik; **ketepatan pertuturan sebenar / arahan mikrofon pada semua peranti bukan bukti suite ini**.
5. **PWA/offline:** pemasangan, pembukaan halaman Akta daripada cache, fail SVG yang tiada, pembersihan cache lama — termasuk dalam suite automatik.
6. **Cetak:** butang cetak, gaya cetak dan sejumlah ujian pembukaan dokumen — termasuk dalam suite automatik. **Lapan carta alir dan cetakannya telah diluluskan pemilik dan berada di bawah LOCK tersendiri; tidak diaudit/diubah lagi di sini.**
7. **Keselamatan input/storan — semakan kod sasaran:** Tiada panggilan `eval(` dalam `index.html`; glosari dan hasil carian menggunakan `escapeHtml`; fungsi senarai simpanan melakukan semakan ID kanonik; nota editorial menggunakan `textContent` dan diasingkan daripada teks utama. Ini ialah kawalan khusus, **bukan pentest keselamatan menyeluruh**.
8. **Nota editorial:** data 19 nota dalam 13 seksyen dan kod pemisahan teks utama disahkan dalam TASK 2; pemilik mengesahkan contoh Seksyen 27 di desktop/mobile. Tidak diulang dalam tindakan ini.

## Keputusan penutupan tindakan 3

**SELESAI — Semakan fungsi berbaki berasaskan audit kod + 42 ujian regresi di CI yang berjaya.** Tiada ralat baharu dapat dibuktikan yang memerlukan pembetulan dalam skop ujian yang dilaksanakan. **Tiada kod aplikasi diubah.** Audit berkelompok I–X tidak diulang.

### Had keputusan yang mesti kekal nyata

- Ini **bukan** pensijilan pelancaran, pengesahan setiap aliran pengguna pada semua model telefon/pelayar, atau pengujian keselamatan serangan sebenar.
- Ini **bukan** bukti visual bahawa setiap dokumen PDF dalam artifak bebas potongan; reka bentuk carta yang diluluskan pemilik kekal LOCK.
- **Tindakan 5** (ujian keseluruhan sebelum pelancaran) ialah gerbang berasingan yang **belum dilaksanakan/ditutup** oleh laporan ini. Jangan samakan kejayaan CI smoke dengan kelulusan komersial atau merge.
- **Tindakan 4** (Mukadimah dan Lampiran) juga tidak disentuh.

## Kawalan perubahan

Kandungan 83 seksyen + 19 nota editorial dikunci dalam `AKTA172-CONTENT-LOCK.md`. Lapan carta alir dan mod cetak dikunci dalam `CARTA-ALIR-DESIGN-LOCK.md`. Jangan ubah mana-mana perkara tersebut tanpa arahan jelas pemilik. **Jangan ubah atau merge `main`.**

**Dokumen ini menutup tindakan audit fungsi #3 pada skop yang disahkan, dan tidak membatalkan had atau syarat pelancaran daripada laporan audit terdahulu.**
