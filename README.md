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
   DB_SSL=true
   PORT=3001
   NODE_ENV=production
   ```

2. Saat deploy ke Vercel, Anda perlu menambahkan environment variables yang sama di dashboard Vercel:
   - Buka dashboard Vercel
   - Pilih project Anda
   - Klik "Settings" > "Environment Variables"
   - Tambahkan semua variabel di atas satu per satu
   - **PENTING**: Pastikan `NODE_ENV` diatur ke `production`
   - **PENTING**: Jika menggunakan PlanetScale, atur `DB_SSL=true`

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

## Troubleshooting

### Error "Terjadi kesalahan server: connect ECONNREFUSED 127.0.0.1:3306"

Jika Anda mendapatkan error ini setelah deploy ke Vercel, berarti aplikasi masih mencoba terhubung ke database lokal. Untuk memperbaikinya:

1. Pastikan Anda telah mengatur environment variables di dashboard Vercel:
   - `NODE_ENV=production` (sangat penting)
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dengan nilai yang benar dari penyedia database cloud Anda
   - `DB_SSL=true` jika penyedia database Anda memerlukan koneksi SSL

2. Redeploy aplikasi Anda setelah mengatur environment variables:
   ```
   vercel --prod
   ```

3. Jika masih bermasalah, coba periksa log di dashboard Vercel untuk melihat error yang lebih detail

### Error SSL/TLS dengan Database

Jika Anda mengalami masalah SSL dengan database:

1. Pastikan `DB_SSL=true` diatur di environment variables
2. Jika menggunakan sertifikat self-signed, aplikasi sudah dikonfigurasi untuk menerima sertifikat tersebut (`rejectUnauthorized: false`)

### Cara Memeriksa Environment Variables di Vercel

1. Buka dashboard Vercel
2. Pilih project Anda
3. Klik tab "Deployments"
4. Pilih deployment terbaru
5. Klik tab "Logs"
6. Cari log yang menampilkan "Running in production mode" dan "Database connection config"

Jika log menampilkan "Running in development mode", berarti `NODE_ENV` tidak diatur dengan benar
