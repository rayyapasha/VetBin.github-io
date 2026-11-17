# VetBin — Peta Tong Sampah Kampus & Admin Dashboard

Platform web pengelolaan sampah kampus cerdas (**VetBin**) yang dilengkapi peta lokasi tong interaktif, panduan pemilahan sampah (AI Vision / Computer Vision), pelaporan tong penuh/rusak ke petugas secara real-time, poin & voucher mitra kampus, autentikasi Admin & Mahasiswa, serta ekspor/import database `.sql` untuk **phpMyAdmin (MySQL/MariaDB)**.

---

## Akun Login Bawaan

| Peran | Username / Email | Password |
| :--- | :--- | :--- |
| **Admin Kampus** | `Admin` | `Admin` |
| **Petugas Kebersihan** | `Petugas` | `Petugas` |
| **Pengguna / Mahasiswa** | `2510501272@kampus.ac.id` | `2510501272@kampus.ac.id` |

> Mahasiswa baru juga dapat mendaftar akun melalui tab **Daftar** pada modal Login, dan seluruh fitur peta, panduan pilah, serta pelaporan tetap dapat diakses langsung.

---

## 1. Menjalankan di Localhost

### Prasyarat
- **Node.js v22 LTS** (`>= 22.13.0`, disarankan memakai versi LTS terbaru agar modul bawaan `node:sqlite` berjalan tanpa kompilasi tambahan)
- **npm** (terpasang otomatis bersama Node.js)

### Langkah Menjalankan (Full-Stack Server: SQLite + WebSocket Real-Time)
1. **Clone / masuk ke folder project:**
   ```bash
   git clone <url-repo-github-anda>
   cd <nama-folder-project>
   ```
2. **Install dependensi:**
   ```bash
   npm install
   ```
3. *(Opsional)* **Konfigurasi Environment Variables:**
   Salin `.env.example` menjadi `.env` jika ingin mengaktifkan AI Scanner berbasis Gemini API di server lokal:
   ```bash
   cp .env.example .env
   ```
   Isi `GEMINI_API_KEY` di `.env` (jika dikosongkan, aplikasi tetap berjalan normal menggunakan Local Computer Vision Scanner).
4. **Jalankan server development localhost:**
   ```bash
   npm run dev
   ```
5. **Buka di browser:**
   ```
   http://localhost:3000
   ```
   Server otomatis menginisialisasi database SQLite di `data/vetbin.db`, menyinkronkan dump ke `database/vetbin_phpmyadmin.sql`, dan mengaktifkan sinkronisasi real-time WebSocket (`/ws`) antar tab/pengguna.

### Simulasi Build Produksi & Static Preview di Localhost
Untuk menguji hasil build statis (seperti saat di-host di Netlify):
```bash
npm run build
npm run preview
```
Lalu buka URL yang tampil di terminal (umumnya `http://localhost:4173`).

---

## 2. Import Database `.sql` ke phpMyAdmin

File dump SQL siap pakai tersedia di:
```
database/vetbin_phpmyadmin.sql
```
Langkah import:
1. Buka **phpMyAdmin** (`http://localhost/phpmyadmin`).
2. Buat database baru (misalnya `vetbin_db`) atau langsung buka tab **Import** (file `.sql` sudah menyertakan `CREATE DATABASE IF NOT EXISTS vetbin_db`).
3. Pilih file `database/vetbin_phpmyadmin.sql`, lalu klik **Go / Kirim**.
4. Di dalam dashboard **Admin -> Ringkasan / Laporan**, tersedia juga tombol **Export .SQL (phpMyAdmin)** untuk mengunduh snapshot database terbaru kapan saja.

---

## 3. Upload ke GitHub & Deploy ke Netlify

### A. Upload ke GitHub
Repository sudah dilengkapi `.gitignore` sehingga `node_modules/`, `dist/`, `.env`, dan database lokal `data/` tidak ikut ter-upload.
```bash
git init
git add .
git commit -m "Initial commit VetBin"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

### B. Deploy ke Netlify
Konfigurasi Netlify sudah disiapkan otomatis di `netlify.toml` dan `public/_redirects`:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `22`
- **SPA Redirect:** `/* -> /index.html (200)`

Langkah di dashboard Netlify:
1. Login ke [Netlify](https://app.netlify.com/) -> klik **Add new site** -> **Import an existing project**.
2. Pilih **GitHub** dan pilih repository VetBin Anda.
3. Pengaturan build (`npm run build` & `dist`) akan terdeteksi otomatis dari `netlify.toml`. Klik **Deploy site**.

### Bagaimana Mode Netlify Static Bekerja?
Saat di-host sebagai situs statis di Netlify (tanpa server Node.js/Express):
- Aplikasi otomatis mendeteksi tidak adanya server backend melalui `/api/health` dan beralih mulus ke **Standalone Browser Backend** (`localStorage` + `BroadcastChannel`).
- Seluruh fitur — Login (`Admin`/`Admin` & `2510501272@kampus.ac.id`), lapor tong, verifikasi & kirim laporan ke petugas, scan QR poin, tukar voucher, CRUD titik tong, sinkronisasi real-time antar tab browser, serta ekspor `.sql` phpMyAdmin — tetap berjalan penuh tanpa error jaringan maupun WebSocket.
