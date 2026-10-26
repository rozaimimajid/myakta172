# MyAKTA172 — Laporan Semakan Dashboard Admin V2
**Tarikh semakan:** 27 Oktober 2026 (Malaysia)  
**Repositori:** `rozaimimajid/myakta172`  
**Cabang:** `audit/stabilization-v1` sahaja  
**Status:** **LULUS semakan visual dan simulasi terpilih; BUKAN kelulusan produksi.**

## 1. Tujuan dan sempadan audit
Dokumen ini merekodkan pemeriksaan sembilan modul prototaip Dashboard Admin MyAKTA172, berdasarkan screenshot pengguna, aliran ujian manual terpilih dan ujian automatik Playwright. Semua akaun, alamat `example.test`, nilai kutipan, pembayaran dan peranti dalam prototaip ialah DATA REKAAN. Perubahan simulasi tidak disimpan selepas muat semula.

**Larangan kekal:** Jangan ubah atau gabung `main`, `index.html`, data teks/nota Akta 172, lapan carta alir, cetakan, Desktop/Mobile, Kegemaran, Sejarah Bacaan dan identiti/logo rasmi DigitalHubb.my tanpa arahan khusus pemilik. Laporan ini sahaja ialah fail dokumentasi baharu.

## 2. Rekod semakan visual dan fungsi
| Modul | Bukti semakan | Keputusan pada skop prototaip |
|---|---|---|
| 1. Ringkasan | Paparan empat kad statistik dan agihan pakej | **LULUS PAPARAN** |
| 2. Pengguna & Emel | Direktori 7 pengguna rekaan; profil U002 (Basic), butang Pergi ke Langganan | **LULUS PAPARAN & NAVIGASI TERPILIH** |
| 3. Resit & Pembayaran | Kategori Baharu/Pembaharuan/Naik Taraf; pratonton B001 menandakan BUKAN RESIT BANK SEBENAR | **LULUS PAPARAN & PRATONTON TERPILIH** |
| 4. Langganan | U002 menunjukkan Basic semasa dan Basic sasaran, tarikh mula/tamat | **LULUS PAPARAN & PELARASAN PILIHAN** |
| 5. Kawalan Pakej | RM0/RM15/RM25/RM50; 12 Bahagian/83 rekod seksyen; Rahmah Bahagian IV dibenarkan, V dikunci; Premium V dibenarkan | **LULUS PAPARAN & SEMAKAN AKSES TERPILIH** |
| 6. Peranti | Reset sesi simulasi U002 daripada 1 ke 0; Peranti-A menjadi Tiada; pengguna lain kekal | **LULUS UJIAN MANUAL SIMULASI** |
| 7. Laporan | Kad 7 pengguna, 5 pakej berbayar, 2 menunggu, RM50 diluluskan; mesej penjanaan CSV | **LULUS PAPARAN & TINDAKAN SIMULASI** |
| 8. Log Admin | Catatan reset peranti U002 dan dua eksport CSV, dengan masa dan butiran | **LULUS PAPARAN & REKOD SIMULASI** |
| 9. Tetapan & Keselamatan | Tempoh 30 hari; had satu peranti; kupon cadangan; integrasi belum disambung | **LULUS PAPARAN / STATUS JELAS** |

**Had semakan:** Tidak semua butang dan semua keadaan ralat diuji secara manual oleh pemilik. Keterangan LULUS di atas tidak bermaksud sistem sudah mempunyai penguatkuasaan akses/pembayaran sebenar, penyimpanan kekal atau keselamatan produksi.

## 3. Polisi pakej yang perlu dikekalkan
| Pakej | Harga/bulan | Tempoh | Bahagian dibenarkan |
|---|---:|---|---|
| Free | RM0 | Tiada tamat tempoh berbayar | I, II |
| Basic | RM15 | 30 hari | I, II, IIA, IIB, III |
| Rahmah | RM25 | 30 hari | Semua Basic dan IV |
| Premium | RM50 | 30 hari | Kesemua 12 Bahagian |

- Carian Seksyen dan Kata Kunci (wildcard, Analisis Kes): Basic, Rahmah, Premium.
- Carta Alir Proses Perancangan dan cetakan: Rahmah, Premium **mengikut setiap seksyen rujukan carta yang dibenarkan** sahaja; pemetaan lapan carta belum selesai, jangan aktifkan secara automatik.
- Kegemaran dan Sejarah Bacaan: semua pakej.
- Penanda Warna Teks dan Bacaan Suara: Rahmah, Premium.
- Glosari Istilah: Basic, Rahmah, Premium.
- Hubungan Seksyen Berkaitan: diperuntukkan kepada Basic, Rahmah dan Premium tetapi **belum aktif sehingga disemak dan disahkan**.

## 4. Bukti ujian automatik
Ujian khas `tests/admin-dashboard.mjs` menggunakan Chromium dalam GitHub Actions `MyAKTA172 Admin Preview Tests`. **9/9 kumpulan ujian LULUS** pada run terkini yang telah disemak:
https://github.com/rozaimimajid/myakta172/actions/runs/40375786727

Ujian merangkumi kesahan matriks/83 seksyen, paparan desktop/mobile, penapis, profil/navigasi, pilihan pakej sasaran, kategori dan pratonton resit demo PDF/PNG, kelulusan simulasi, pembaharuan 30 hari, reset peranti, dan kehilangan data demo selepas refresh. Bukti ini terhad kepada prototaip frontend.

## 5. Status keselamatan: belum layak produksi
Komponen berikut **belum dibangunkan atau diintegrasikan**:
1. Pengesahan akaun Admin dan pengguna dengan kawalan peranan; MFA untuk Admin.
2. Pangkalan data berpusat, API dan penguatkuasaan hak pakej/sekatan kandungan pada pelayan.
3. Storan resit persendirian, pengesahan pembayaran bank sebenar, rekod kelulusan boleh diaudit.
4. Pengurusan sesi satu peranti secara server-side dan pembatalan/reset sesi yang sah.
5. Log Admin kekal, audit trail tahan ubah, pengurusan pengekalan dan perlindungan data pengguna.
6. Kelulusan/luput langganan sebenar serta pemisahan kandungan premium daripada fail awam dan PWA cache.
7. Pemetaan tepat dan audit seksyen rujukan semua lapan carta alir/cetakan.
8. Audit fungsi Hubungan Seksyen Berkaitan sebelum diaktifkan.

**Peringatan:** GitHub Pages statik tidak boleh menjamin kawalan akses berbayar jika semua kandungan premium dihantar sebagai fail awam. Pratonton resit demo bukan bukti bayaran sebenar. Kawalan satu peranti dengan JavaScript pelayar sahaja tidak memadai.

## 6. Keputusan dan tindakan susulan
**Keputusan:** Peringkat **Dashboard Admin V2 — prototaip dan semakan visual** boleh ditutup sebagai lulus dalam skopnya. **Belum boleh digunakan oleh pelanggan atau disambungkan kepada aplikasi produksi.** Keutamaan kerja berikutnya ialah reka bentuk backend/auth/storan, peraturan capaian seksyen dan carta fail-closed, serta ujian keselamatan menyeluruh di cabang audit sahaja. Kupon/promosi kekal cadangan tanpa pengaktifan.

Tiada arahan merge ke `main` atau penerbitan pelanggan diberikan oleh pemilik.
