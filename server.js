// server.js
// Memuat variabel lingkungan dari file .env jika ada
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const database = require('./database');

// Inisialisasi Express dan Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Inisialisasi database
database.initDatabase();

// Endpoint untuk halaman customer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'customer.html'));
});

// Endpoint untuk halaman admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API untuk mendaftarkan antrian baru
// API untuk mendaftarkan antrian baru
app.post('/api/queue', async (req, res) => {
    try {
      console.log('Body request:', req.body);
      const { nama } = req.body;
      if (!nama) {
        return res.status(400).json({ error: 'Nama diperlukan' });
      }
      
      const result = await database.addQueue(nama);
      console.log('Hasil pendaftaran antrian:', result);
      
      // Broadcast ke semua client bahwa ada antrian baru
      io.emit('queue-update');
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error saat mendaftarkan antrian:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
    }
  });

// API untuk mendapatkan semua antrian (untuk admin)
app.get('/api/queues', async (req, res) => {
  try {
    const queues = await database.getAllQueues();
    res.json(queues);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API untuk mendapatkan status antrian berdasarkan nomor
app.get('/api/queue/:nomor', async (req, res) => {
    try {
      const nomor = parseInt(req.params.nomor);
      console.log(`Request status untuk nomor antrian: ${nomor}`);
      
      if (isNaN(nomor)) {
        console.error('Nomor antrian tidak valid:', req.params.nomor);
        return res.status(400).json({ error: 'Nomor antrian tidak valid' });
      }
      
      const queue = await database.getQueueStatus(nomor);
      console.log('Hasil query status:', queue);
      
      if (!queue) {
        return res.status(404).json({ error: 'Antrian tidak ditemukan' });
      }
      
      res.json(queue);
    } catch (error) {
      console.error('Error saat mengambil status antrian:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
    }
  });
// API untuk mengubah status antrian (untuk admin)
app.put('/api/queue/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['menunggu', 'proses', 'selesai'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    
    const updated = await database.updateQueueStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Antrian tidak ditemukan' });
    }
    
    // Broadcast ke semua client bahwa ada perubahan status
    io.emit('status-update', { id, status });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API untuk menghapus antrian (untuk admin)
app.delete('/api/queue/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Tambahkan fungsi deleteQueue di database.js
    const deleted = await database.deleteQueue(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Antrian tidak ditemukan' });
    }
    
    // Broadcast ke semua client bahwa ada perubahan
    io.emit('queue-update');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saat menghapus antrian:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client terhubung:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client terputus:', socket.id);
  });
});

// Jalankan server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});