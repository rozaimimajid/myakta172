# MyAKTA172 — Matriks Pakej dan Dashboard Admin (Keputusan Gabungan)
Tarikh: 27 Oktober 2026
Status: Matriks ditetapkan oleh pemilik. Hubungan Antara Seksyen telah LULUS audit rasmi dan DIKUNCI 27 Oktober 2026 (run #40500647354); kelayakan Basic/Rahmah/Premium AKTIF dalam dasar pakej. Penguatkuasaan akses pelanggan sebenar masih belum diintegrasi dengan backend.
Cabang: audit/stabilization-v1; JANGAN ubah atau merge main.

## Harga bulanan
Free RM0 | Basic RM15 | Rahmah RM25 | Premium RM50.

## Matriks hak akses yang dipilih pemilik
| Ciri / kemudahan | Free | Basic | Rahmah | Premium |
|---|:---:|:---:|:---:|:---:|
| Bahagian I — Permulaan | ✓ | ✓ | ✓ | ✓ |
| Bahagian II — Dasar dan Pentadbiran | ✓ | ✓ | ✓ | ✓ |
| Bahagian IIA — Jawatankuasa Perancang Wilayah | — | ✓ | ✓ | ✓ |
| Bahagian IIB — Rancangan Fizikal Negara | — | ✓ | ✓ | ✓ |
| Bahagian III — Rancangan Pemajuan | — | ✓ | ✓ | ✓ |
| Bahagian IV — Kawalan Perancangan | — | — | ✓ | ✓ |
| Bahagian V — Caj Pemajuan | — | — | — | ✓ |
| Bahagian VA — Perintah Pemeliharaan Pokok | — | — | — | ✓ |
| Bahagian VI — Lembaga Rayuan | — | — | — | ✓ |
| Bahagian VII — Notis Pembelian dan Pengambilan Tanah | — | — | — | ✓ |
| Bahagian VIII — Kawasan Pemajuan | — | — | — | ✓ |
| Bahagian IX — Peruntukan Pelbagai | — | — | — | ✓ |
| Carian Seksyen dan Kata Kunci termasuk wildcard & Analisis Kes | — | ✓ | ✓ | ✓ |
| Carta Alir Proses Perancangan termasuk cetakan | — | — | ✓* | ✓* |
| Kegemaran / Penanda Buku | ✓ | ✓ | ✓ | ✓ |
| Sejarah Bacaan | ✓ | ✓ | ✓ | ✓ |
| Penanda Warna Teks | — | — | ✓ | ✓ |
| Bacaan Suara | — | — | ✓ | ✓ |
| Glosari Istilah | — | ✓ | ✓ | ✓ |
| Hubungan Seksyen Berkaitan (Aktif — audit disahkan; backend belum disambung) | — | ✓ | ✓ | ✓ |

* PERATURAN WAJIB: Kebenaran membuka DAN mencetak sesuatu carta alir mengikut hak akses Bahagian/Seksyen yang berkaitan dalam pakej pengguna, bukan akses automatik kepada semua lapan carta. Apabila satu carta merujuk beberapa seksyen daripada Bahagian berlainan, pemetaan seksyen wajib ditentukan sebelum membuka carta tersebut. Contoh: KM Bahagian IV untuk Rahmah; Caj Pemajuan Bahagian V Premium sahaja. Jangan mengubah carta sedia ada; kawalan dibuat pada lapisan entitlement berasingan.

## Keperluan Dashboard Admin yang digabungkan daripada perbincangan terdahulu
1. Ringkasan: bilangan pengguna, agihan pakej, langganan aktif/tamat, bayaran pending, ringkasan kutipan dan penukaran pakej.
2. Direktori pengguna: ID, emel, nama (jika tersedia), pakej, tarikh mula/tamat, status, peranti/sesi aktif, carian dan penapis.
3. Pembayaran manual bank: pengguna menghantar resit melalui storan persendirian; admin menyemak Lulus/Tolak; lampiran resit bukan URL awam; audit trail diperlukan. Hanya backend boleh mengaktifkan entitlement.
4. Langganan: Free/Basic/Rahmah/Premium, naik taraf/turun taraf, pembaharuan, luput dan kembali ke Free mengikut polisi, rekod sebab tindakan.
5. Kawalan pakej: matriks di atas, pemetaan semua Bahagian kepada ID seksyen sebenar, pemetaan lapan carta kepada seksyen rujukan, had carian dan ciri tambahan; jangan anggap semakan JavaScript sahaja selamat.
6. Kawalan satu peranti: satu sesi aktif setiap akaun melalui backend, rekod pertukaran dan reset terkawal.
7. Laporan dan audit log: eksport ringkasan, tindakan admin, semakan pembayaran, perubahan pakej.
8. Kupon/promosi: cadangan daripada reka bentuk lama, bukan ciri wajib atau diaktifkan sehingga keputusan lanjut.
9. Akses Admin: peranan admin/user, pengesahan selamat, MFA jika tersedia, peraturan database/storage.

## Pelaksanaan dan batasan
- Peringkat 1 = dokumen matriks hak akses; Peringkat 2 = prototaip Admin dengan data simulasi, tanpa transaksi sebenar.
- Peringkat berikutnya: model data, backend pengesahan server-side, storan resit tertutup, peraturan peranti, ujian dan semakan pelan kos sifar.
- Produk GitHub Pages statik tidak memberi kawalan akses terlindung kepada kandungan premium jika semua teks dihantar ke pelayar. Pertimbangkan hosting/backend sesuai sebelum menjual.
- Jangan mengubah kod Akta 172, reka bentuk lapan carta, mod Desktop/Mobile, simpanan, atau logo DigitalHubb.my yang dikunci.
