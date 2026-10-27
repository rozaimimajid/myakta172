# MyAKTA172 — Fasa 3: Asas Backend Auto-Downgrade (27 Oktober 2026)

**Rujukan dasar DIKUNCI:** [AUTO-DOWNGRADE-DESIGN-LOCK.md](AUTO-DOWNGRADE-DESIGN-LOCK.md)  
**Cabang:** `audit/stabilization-v1` sahaja. **`main` dan aplikasi utama tidak diubah.**

## Hasil fasa ini
- `admin-subscription-engine.cjs`: enjin Node.js untuk menentukan pakej **berkesan pada masa server** bagi setiap permintaan; tarikh tamat Basic/Rahmah/Premium menghasilkan **Free**, tanpa menunggu klik Admin atau scheduler.
- `authorizeEntitlement()`: rujuk identiti yang disahkan, rekod DB, status akaun, satu sesi/peranti aktif dan matriks hak seksyen/fungsi. Tidak menerima tuntutan pakej pengguna daripada localStorage/JS/payload pelanggan.
- `createProtectedContentHandler()`: contoh gerbang API; **tidak membaca data sebelum kebenaran diluluskan**, pulangkan `Cache-Control: private, no-store`. Data/kandungan mestilah daripada storan terlindung yang berbeza daripada fail awam/PWA.
- `reconcileExpiredAccount()`: operasi **transaksi atomik** yang merekodkan peristiwa `AUTO_EXPIRED` unik, menukar pakej tersimpan kepada Free dan mengekalkan rekod pengguna. Memerlukan backend `store.transaction()` yang benar-benar serializable/ACID, dengan uniqueness `eventId`.
- `tests/admin-auto-downgrade.cjs`: semakan sempadan tepat tamat, Basic/Rahmah/Premium, kebenaran Free selepas luput, penolakan premium, bayaran Menunggu, akaun digantung, satu sesi/peranti, 30 hari, transaksi selari, rollback, idempotensi dan sejarah tidak terpadam. Dijalankan melalui GitHub Actions bersama regresi Dashboard.

## Integrasi belum dibuat — jangan anggap sistem produksi
- **Tiada sistem auth pengguna/Admin, DB, pengesahan bank, penyimpanan resit atau scheduler production disambungkan.**
- Kod ini ialah lapisan **backend foundation** dan **contract adapter**, bukan servis HTTP yang boleh terus menerima pelanggan.
- `admin-preview.html` masih menggunakan data simulasi dan **tidak** menunjukkan penurunan pakej secara automatik selepas refresh. Perbezaan UI/DB sebenar belum dibangunkan.
- Kandungan premium dalam hosting statik, `index.html`, JavaScript atau cache awam **tidak boleh dilindungi hanya dengan logik frontend**. Kandungan perlu dialihkan ke servis terlindung sebelum sistem berbayar diaktifkan.

## Kontrak untuk backend sebenar
`authenticate(request)` → `{accountId, sessionId, role:'user', status:'Aktif'}` yang **telah diverifikasi**, bukan dakwaan klien.  
`loadSubscription(accountId)` → `{accountId,plan,status,startsAt,expiresAt}` daripada DB. Tarikh mesti ISO 8601 dengan zon masa (`Z` atau ofset).  
`checkSingleActiveSession(accountId,sessionId)` → `{authorized:true, activeCount:1}` berdasarkan DB sesi terlindung.  
`store.transaction(accountId, fn)` → transaksi serializable per-akaun dengan pembacaan semasa, penulisan pakej dan insert audit unik yang commit/rollback bersama.  
`readContent(resource)` → data khusus resource yang diminta daripada storan dilindungi, bukan fail premium awam.

### Entiti data asas untuk migrasi (belum dilaksanakan)
- **users** — ID kekal, emel, status Aktif/Digantung, peranan, created_at.
- **subscriptions** — account_id, plan semasa, starts_at, expires_at, revision/updated_at; kekangan status dan validasi waktu.
- **subscription_history** — account_id, plan dahulu, tarikh mula/tamat, sebab perubahan.
- **payments** — account_id, kategori Langganan Baharu/Pembaharuan/Naik Taraf, amount, approval status, approved_by/at; bukti bank terlindung.
- **device_sessions** — satu sesi aktif yang boleh dibatalkan, hash token/ID peranti, tarikh log masuk/luput.
- **audit_events** — event_id unik, actor, tindakan, masa, before/after, metadata. Event AUTO_EXPIRED berkunci per `accountId:expiresAt`.
- **favorites/reading_history/highlights** — dikekalkan dan tidak dipadam kerana turun taraf.

## Urutan pembangunan seterusnya
1. Pilih backend & storan sebenar yang boleh digunakan pada kos permulaan rendah, dengan kebenaran peranan dan MFA Admin.
2. Bina jadual, migrasi, trigger/idempotent transaction dan ujian concurrency DB.
3. Sambung autentikasi, pengesahan satu peranti dan setiap endpoint premium kepada `authorizeEntitlement()`.
4. Hentikan penyiaran kandungan Premium di hosting statik dan cache publik. Pastikan UI PWA tidak memintas hak.
5. Integrasi pembayaran/pengesahan resit dan keputusan pembaharuan yang diluluskan sahaja.
6. Tambahkan reconciliation scheduler sebagai penyesuaian log/rekod; endpoint tetap menyekat akses tepat pada masa tamat walaupun scheduler lewat.
7. Jalankan audit integrasi, keselamatan, mobile/desktop dan ujian manual pengguna sebelum publisiti/produksi.

**Perlindungan:** Jangan ubah polisi, harga, teks Akta, lapan carta alir, logo, navigasi terkunci, reka bentuk Dashboard atau cabang `main` tanpa arahan pemilik.
