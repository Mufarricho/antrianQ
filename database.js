// database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi database
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);

// Konfigurasi database berdasarkan environment
const dbConfig = {
  // Konfigurasi untuk development (lokal)
  development: {
    host: 'localhost',
    user: 'root',
    password: '', // Password kosong, sesuaikan dengan konfigurasi MySQL Anda
    database: 'antrian_online',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  // Konfigurasi untuk production (Vercel)
  production: {
    // Gunakan environment variables untuk menyimpan kredensial database
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false // Set to false to accept self-signed certificates
    } : undefined
  }
};

// Log database config (without sensitive info)
const configToUse = isDevelopment ? dbConfig.development : dbConfig.production;
console.log('Database connection config:', {
  host: configToUse.host,
  database: configToUse.database,
  ssl: configToUse.ssl ? 'enabled' : 'disabled'
});

// Gunakan konfigurasi sesuai environment
let pool;
try {
  // Log environment variables (without sensitive info)
  console.log('Environment variables check:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
    DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'Set (value hidden)' : 'Not set',
    DB_NAME: process.env.DB_NAME ? 'Set' : 'Not set',
    DB_SSL: process.env.DB_SSL
  });
  
  const config = isDevelopment ? dbConfig.development : dbConfig.production;
  console.log('Attempting to create database pool with config:', {
    host: config.host,
    database: config.database,
    ssl: config.ssl ? 'enabled' : 'disabled'
  });
  
  pool = mysql.createPool(config);
  console.log('Database pool created successfully');
  
  // Test the connection
  pool.getConnection()
    .then(connection => {
      console.log('Database connection test successful');
      connection.release();
    })
    .catch(err => {
      console.error('Database connection test failed:', err.message);
      console.error('Error code:', err.code);
      console.error('Error errno:', err.errno);
      console.error('Error sqlState:', err.sqlState);
      console.error('Error sqlMessage:', err.sqlMessage);
    });
} catch (error) {
  console.error('Failed to create database pool:', error);
  console.error('Error details:', error.message);
  throw error;
}

// Inisialisasi database
async function initDatabase() {
  try {
    // Jika di production, skip pembuatan database karena biasanya sudah dibuat
    if (!isDevelopment) {
      console.log('Skipping database creation in production environment');
      // Langsung buat tabel menggunakan pool yang sudah terhubung ke database
      await createTables();
      return;
    }
    
    // Membuat koneksi ke MySQL tanpa memilih database (hanya untuk development)
    const tempConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Password kosong, sesuaikan dengan konfigurasi MySQL Anda
    });

    // Membuat database jika belum ada
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS antrian_online`);
    
    // Tutup koneksi sementara
    await tempConnection.end();
    
    // Gunakan pool untuk membuat tabel
    await createTables();
    console.log('Database berhasil diinisialisasi');
  } catch (error) {
    console.error('Error saat inisialisasi database:', error);
  }
}

// Fungsi untuk mendapatkan nomor antrian berikutnya
async function getNextQueueNumber() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Ambil nilai counter saat ini
      const [rows] = await connection.query('SELECT nilai FROM counter WHERE id = 1');
      
      // Cek apakah data counter ada
      if (!rows || rows.length === 0) {
        console.log('Counter tidak ditemukan, membuat counter baru');
        await connection.query('INSERT INTO counter (id, nilai) VALUES (1, 0)');
        await connection.commit();
        return 1;
      }
      
      const currentNumber = rows[0].nilai;
      
      // Increment nilai counter
      const nextNumber = currentNumber + 1;
      await connection.query('UPDATE counter SET nilai = ? WHERE id = 1', [nextNumber]);
      
      await connection.commit();
      console.log(`Nomor antrian berikutnya: ${nextNumber}`);
      return nextNumber;
    } catch (error) {
      console.error('Error pada getNextQueueNumber:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

// Fungsi untuk menambah antrian baru
async function addQueue(nama) {
    const connection = await pool.getConnection();
    try {
      const nomor = await getNextQueueNumber();
      console.log(`Menambahkan antrian: ${nama} dengan nomor: ${nomor}`);
  
      const [result] = await connection.query(
        'INSERT INTO antrian (nama, nomor_antrian, status) VALUES (?, ?, "menunggu")',
        [nama, nomor]
      );
  
      console.log('Insert result:', result);
      
      // Kembalikan dengan format yang konsisten
      return { 
        id: result.insertId,
        nomor: nomor,
        nama: nama
      };
    } catch (error) {
      console.error('Database error pada addQueue:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

// Fungsi untuk mendapatkan semua antrian
async function getAllQueues() {
  const [rows] = await pool.query('SELECT * FROM antrian ORDER BY nomor_antrian');
  return rows;
}

// Fungsi untuk mengubah status antrian
async function updateQueueStatus(id, status) {
  const [result] = await pool.query(
    'UPDATE antrian SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

// Fungsi untuk mendapatkan status antrian berdasarkan nomor
async function getQueueStatus(nomor) {
    try {
      console.log(`Mengambil status untuk nomor antrian ${nomor} dari database`);
      
      const [rows] = await pool.query(
        'SELECT * FROM antrian WHERE nomor_antrian = ?',
        [nomor]
      );
      
      console.log(`Hasil query: ${rows.length} baris`);
      
      if (rows.length === 0) {
        console.log(`Nomor antrian ${nomor} tidak ditemukan`);
        return null;
      }
      
      console.log(`Status antrian ${nomor}: ${rows[0].status}`);
      return rows[0];
    } catch (error) {
      console.error(`Error saat mengambil status antrian ${nomor}:`, error);
      throw error;
    }
  }

// Fungsi untuk menghapus antrian berdasarkan ID
async function deleteQueue(id) {
  try {
    const [result] = await pool.query(
      'DELETE FROM antrian WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error saat menghapus antrian:', error);
    throw error;
  }
}

// Fungsi untuk membuat tabel
async function createTables() {
  const connection = await pool.getConnection();
  try {
    // Membuat tabel antrian
    await connection.query(`
      CREATE TABLE IF NOT EXISTS antrian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        nomor_antrian INT NOT NULL,
        status ENUM('menunggu', 'proses', 'selesai') DEFAULT 'menunggu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Membuat tabel counter untuk nomor antrian
    await connection.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id INT PRIMARY KEY DEFAULT 1,
        nilai INT DEFAULT 0
      )
    `);
    
    // Cek apakah counter sudah ada datanya
    const [rows] = await connection.query('SELECT * FROM counter WHERE id = 1');
    if (rows.length === 0) {
      // Jika belum ada, inisialisasi counter
      await connection.query('INSERT INTO counter (id, nilai) VALUES (1, 0)');
    }
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initDatabase,
  addQueue,
  getAllQueues,
  updateQueueStatus,
  getQueueStatus,
  deleteQueue
};