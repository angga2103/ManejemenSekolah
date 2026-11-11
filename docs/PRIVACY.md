# Kebijakan Privasi & Perlindungan Data Pribadi (UU PDP No. 27/2022)

**Nama Platform:** Integrated School & Pesantren Management SaaS  
**Kepatuhan Hukum:** Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)

---

## 1. Prinsip Perlindungan Data Pribadi Anak & Santri (Pasal 25 UU PDP)

Sebagian besar data subjek yang dikelola oleh platform adalah santri dan siswa di bawah usia 18 tahun (kategori anak).

1. **Persetujuan Eksplisit Orang Tua/Wali (Parental Consent)**:
   * Pemrosesan data santri (termasuk identitas, foto, rekam medis, dan kehadiran) wajib memperoleh persetujuan terverifikasi dari orang tua atau wali yang sah pada saat pendaftaran.
   * Wali santri memiliki hak untuk melihat dan memperbarui persetujuan data secara transparan melalui portal aplikasi.
2. **Kerahasiaan Nomor Identitas Nasional (NIK & NISN)**:
   * Kolom NIK dan NISN dienkripsi menggunakan algoritma standar AES-256 pada level penyimpanan basis data.
   * Data ini tidak pernah diekspos secara publik atau dibagikan ke pihak ketiga tanpa dasar hukum yang sah.

---

## 2. Perlindungan Khusus Data Sensitif Bimbingan Konseling (BK)

Catatan konseling santri, riwayat pelanggaran berat, dan sesi konsultasi psikologis diklasifikasikan sebagai **Data Pribadi yang Bersifat Spesifik / Sensitif**:

1. **Akses Terbatas Tertutup (Segregated Access)**:
   * Catatan BK hanya dapat diakses oleh Guru Bimbingan Konseling yang ditugaskan secara resmi dan Kepala Sekolah / Pengasuh Pondok.
   * Guru mata pelajaran, staf tata usaha, dan pihak lain dilarang keras memiliki hak akses baca (`read`) terhadap tabel `counseling_records`.
2. **Audit Akses Terperinci**:
   * Setiap aktivitas melihat, mencetak, atau memperbarui catatan BK dicatat ke dalam `audit_logs` dengan stempel waktu, IP address, dan identitas petugas.

---

## 3. Hak Pemilik Data Pribadi (Data Subject Rights)

Sesuai ketentuan Bab IV UU PDP, platform menyediakan mekanisme teknis untuk:

1. **Hak Mendapatkan Informasi & Akses (Right to Access)**:
   * Santri dan wali santri dapat mengunduh salinan data pribadi dan riwayat akademik dalam format PDF atau JSON terstandar.
2. **Hak Pemutakhiran Data (Right to Rectification)**:
   * Wali santri dapat mengajukan permohonan koreksi data keluarga atau kontak darurat yang kemudian diverifikasi oleh Bagian Tata Usaha.
3. **Hak Penghapusan / Hak untuk Dilupakan (Right to Erasure)**:
   * Setelah santri lulus atau mutasi dan masa retensi hukum terlewati (misal: kewajiban penyimpanan arsip ijazah), institusi dapat melakukan anonimisasi terhadap data pribadi santri.

---

## 4. Retensi & Pemusnahan Data

| Kategori Data | Masa Retensi | Metode Pemusnahan |
| :--- | :--- | :--- |
| **Log Keamanan & Audit** | 365 Hari | Dihapus otomatis melalui cron background job |
| **Data Presensi Harian** | 3 Tahun Akademik | Pengarsipan agregat, raw data dipangkas |
| **Catatan Transaksi Finansial** | 5 Tahun (Sesuai UU Akuntansi) | Arsip terenkripsi permanen |
| **Token Sesi & Refresh Token** | 7 Hari | Dihapus otomatis (*TTL expiry*) di Redis & DB |
