# Sistem Antrian Online

Aplikasi sistem antrian online sederhana yang dibangun dengan Node.js, Express, MySQL, dan Socket.IO.

## Fitur

- Pendaftaran antrian oleh pelanggan
- Panel admin untuk mengelola antrian
- Pembaruan status antrian secara real-time menggunakan Socket.IO
- Tampilan status antrian untuk pelanggan

## Cara Deploy ke Vercel

### Persiapan Database

Karena Vercel tidak menyediakan database MySQL, Anda perlu menggunakan layanan database cloud seperti:
- [PlanetScale](https://planetscale.com/) (MySQL compatible)
- [Railway](https://railway.app/) (MySQL)
- [AWS RDS](https://aws.amazon.com/rds/mysql/)
- [Google Cloud SQL](https://cloud.google.com/sql)

1. Buat database MySQL di salah satu layanan tersebut
2. Catat informasi koneksi database (host, username, password, nama database)

### Persiapan Deployment

1. Buat akun di [Vercel](https://vercel.com) jika belum memilikinya
2. Install Vercel CLI:
   ```
   npm install -g vercel
   ```
3. Login ke Vercel dari terminal:
   ```
   vercel login
   ```

### Konfigurasi Environment Variables

1. Salin file `.env.example` menjadi `.env` dan isi dengan informasi database Anda:
   ```
   DB_HOST=your-database-host.com
   DB_USER=your-database-username
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   PORT=3001
   NODE_ENV=production
   ```

2. Saat deploy ke Vercel, Anda perlu menambahkan environment variables yang sama di dashboard Vercel

### Deploy ke Vercel

1. Dari direktori proyek, jalankan perintah:
   ```
   vercel
   ```

2. Ikuti petunjuk yang muncul di terminal
3. Setelah deployment selesai, Vercel akan memberikan URL untuk aplikasi Anda

### Alternatif: Deploy melalui GitHub

1. Push kode ke repository GitHub
2. Buat akun di Vercel dan hubungkan dengan GitHub
3. Import repository dari GitHub
4. Konfigurasi environment variables di dashboard Vercel
5. Deploy aplikasi

## Pengembangan Lokal

1. Clone repository
2. Install dependencies:
   ```
   npm install
   ```
3. Buat file `.env` berdasarkan `.env.example`
4. Jalankan aplikasi:
   ```
   npm run dev
   ```

## Struktur Proyek

- `server.js` - File utama aplikasi
- `database.js` - Konfigurasi dan fungsi database
- `public/` - File statis (CSS, JavaScript, gambar)
- `views/` - File HTML
