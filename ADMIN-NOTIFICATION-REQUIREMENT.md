# MyAKTA172 — KEPERLUAN NOTIFIKASI ADMIN (28 Oktober 2026)

**Status:** Keperluan baharu ditetapkan pemilik. **Dua saluran pemberitahuan Admin adalah WAJIB dalam versi operasi sebenar.**  
**Cabang:** `audit/stabilization-v1` sahaja; **JANGAN ubah `main`**.  
**Pelaksanaan:** BELUM AKTIF. Dokumentasi ini bukan bukti push/emel telah dihantar atau aplikasi Admin telah diterbitkan.

## 1. Keputusan pemilik — dua saluran wajib
Admin MyAKTA172 perlu menerima notifikasi mengenai perkara yang memerlukan perhatian melalui **kedua-dua saluran serentak**:
1. **Aplikasi MyAKTA172 Admin pada telefon:** notifikasi push sistem (apabila peranti menyokong, aplikasi dipasang dan kebenaran telah diberi) serta senarai **Pusat Notifikasi Admin** dalam aplikasi supaya makluman tidak hilang jika push gagal atau dimatikan.
2. **Emel rasmi DigitalHubb.my:** salinan emel transaksi/pengurusan yang dihantar ke alamat penerima Admin rasmi yang disahkan dalam konfigurasi backend.

**Alamat emel penerima khusus belum disahkan dalam arahan ini;** jangan meneka, memaparkan atau hard-code alamat penerima di kod sumber. Gunakan konfigurasi persekitaran selamat, misalnya `ADMIN_NOTIFICATION_EMAIL`, dan sahkan pemilikan alamat sebelum fungsi dihantar secara langsung.

## 2. Pencetus notifikasi yang dicadangkan untuk pelaksanaan
**Keutamaan tinggi — memerlukan tindakan Admin:**
- Permohonan langganan baharu berbayar + resit pembayaran diterima dan menunggu semakan.
- Permohonan **upgrade** (termasuk kredit baki, sebut harga yang diterima, jumlah bayaran serta resit diterima) yang memerlukan kelulusan.
- Permohonan **downgrade berjadual berbayar** dengan resit menunggu pengesahan.
- Permohonan pembaharuan langganan + resit menunggu pengesahan.
- Permohonan reset peranti / sokongan pengguna yang memerlukan keputusan Admin; kejadian keselamatan signifikan (contohnya cubaan log masuk Admin mencurigakan) mengikut polisi keselamatan kelak.

**Makluman operasi — boleh digabung menjadi ringkasan agar tidak membanjiri Admin:**
- Pendaftaran akaun pengguna baharu (jika diluluskan sebagai jenis notifikasi).
- Auto-downgrade Basic/Rahmah/Premium → Free apabila tempoh tamat.
- Langganan berbayar akan tamat tidak lama lagi dan bayaran/kelulusan masih tertangguh.
- Bayaran diluluskan/ditolak atau pengaktifan upgrade/downgrade yang telah selesai sebagai rekod.

**Prinsip:** Transaksi pending **tidak** mengaktifkan akses berbayar; setiap makluman menunjukkan status sebenar dan tindakan yang diperlukan. Peringkat pencetus, pilihan ringkasan dan tetapan pemberitahuan terperinci boleh dimuktamadkan sebelum implementasi tanpa mengubah kewajipan dua saluran.

## 3. Reka bentuk aliran backend
1. Peristiwa sebenar direkod selepas transaksi DB yang berjaya (`event_id` unik, penerima, jenis peristiwa, masa, status dan pautan tindakan). Gunakan corak **transactional outbox** supaya peristiwa pembayaran tidak hilang kerana kegagalan servis push/emel.
2. Sistem menghantar kepada kedua-dua saluran secara **berasingan**, dengan cubaan semula terkawal, idempotensi, log kejayaan/gagal dan kawalan kadar. Kegagalan satu saluran **tidak** menghapuskan notifikasi dalam Pusat Notifikasi Admin atau menghalang saluran yang satu lagi.
3. Push memerlukan pelayan HTTPS, pemasangan aplikasi/PWA yang layak, service worker, pendaftaran push pada telefon serta **kebenaran notifikasi daripada Admin**. Jangan mendakwa semua pelayar/peranti menyokong push tanpa pengujian khusus.
4. Emel dihantar menggunakan penyedia e-mel transaksi yang dibenarkan, dengan konfigurasi pengirim/penerima disahkan dan kawalan penghantaran/ralat pada server (bukan memanggil mail API terus dari JS/browser).
5. Tindakan **Lihat Permohonan / Semak Resit / Lulus atau Tolak** memerlukan login Admin sah, MFA dan pemeriksaan peranan di backend pada setiap akses, walaupun Admin menekan pautan dari push atau emel.

## 4. Privasi & keselamatan
- Paparan push dan emel awal hendaklah **minima**: kategori, ID permohonan, masa dan status tindakan, bukan nombor akaun bank penuh, resit, token, OTP, kata laluan atau data peribadi sensitif.
- Resit bank hanya boleh dibuka dalam Dashboard Admin selepas pengesahan; gunakan pautan sementara di pelayan, bukan lampiran bank dalam push atau emel awam.
- Token langganan push, alamat emel penerima, kredensial penyedia emel dan kunci push disimpan di backend sahaja; elak hard-code dalam repositori.
- Sediakan rekod notifikasi (baru, dibaca, perlu tindakan, selesai, gagal dihantar) dan kawalan pembatalan peranti Admin yang hilang atau diganti.
- Notifikasi bukan pengganti **proses transaksi atomik** atau penguatkuasaan masa tamat pakej.

## 5. Ujian penerimaan wajib
- Resit/langganan baharu, upgrade dan downgrade berjadual menghasilkan satu rekod notifikasi dan dua kerja penghantaran (push+emel) yang boleh diaudit.
- Jika satu saluran gagal, rekod tetap wujud, cubaan semula dilakukan, saluran lain tetap dihantar, tiada notifikasi gandaan tidak wajar.
- Jika Admin tidak memasang PWA atau menolak permission push, makluman tetap boleh dilihat di Pusat Notifikasi dan dihantar ke emel rasmi.
- Klik dari push/emel tidak boleh melihat atau meluluskan resit tanpa login Admin + MFA.
- Uji Android dan iPhone yang disokong, mod latar, aplikasi tertutup, pembatalan token peranti, rangkaian lemah dan perubahan pakej yang serentak.
- Uji penghantaran kepada emel Admin yang telah disahkan sahaja; tiada emel/resit sebenar digunakan dalam CI.

## 6. Sempadan & perlindungan
- **Belum ada service worker push, subscription push device Admin, penyedia penghantaran emel, backend notifikasi, akaun emel yang disahkan atau Pusat Notifikasi Admin** dalam aplikasi sebenar.
- Semua perubahan ini hanya **perancangan terdokumen** sementara pembangunan dihentikan mengikut arahan pemilik; tiada notifikasi dihantar.
- **Jangan ubah reka bentuk Dashboard Biru Royal yang telah dikunci tanpa arahan khusus.** Perancangan Pusat Notifikasi dan butang loceng ialah tambahan masa depan yang perlu diselaraskan dengan reka bentuk yang diluluskan.
- Dasar harga pakej, Auto-Downgrade, Upgrade Kaedah B dan Downgrade Berjadual kekal DIKUNCI; jangan ubah teks Akta 172, 8 carta alir, logo DigitalHubb.my, navigasi atau cabang `main`.
