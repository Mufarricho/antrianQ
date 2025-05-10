// Customer JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi Socket.IO
    const socket = io();
    
    // Elemen-elemen pada halaman
    const registrationForm = document.getElementById('registrationForm');
    const queueInfo = document.getElementById('queueInfo');
    const daftarBtn = document.getElementById('daftarBtn');
    const namaInput = document.getElementById('nama');
    const nomorAntrian = document.getElementById('nomorAntrian');
    const namaCustomer = document.getElementById('namaCustomer');
    const statusAntrian = document.getElementById('statusAntrian');
    const notifikasi = document.getElementById('notifikasi');
    
    // Cek apakah sudah ada data antrian di localStorage
    const queueData = localStorage.getItem('queueData');
    if (queueData) {
        const data = JSON.parse(queueData);
        showQueueInfo(data);
        
        // Dapatkan status terbaru dari server
        fetchQueueStatus(data.nomor_antrian);
    }
    
    // Event listener untuk tombol daftar
    daftarBtn.addEventListener('click', async function() {
        const nama = namaInput.value.trim();
        if (!nama) {
            alert('Silakan masukkan nama Anda');
            return;
        }
        
        try {
            const response = await fetch('/api/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nama })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error('Gagal mendaftar antrian');
            }
            
            const data = await response.json();
            console.log('Data dari server:', data);
            
            // Pastikan data yang diterima valid
            if (!data || !data.id || !data.nomor) {
                console.error('Data tidak valid dari server:', data);
                throw new Error('Data tidak valid dari server');
            }
            
            // Simpan data antrian ke localStorage
            const queueData = {
                id: data.id,
                nama: nama,
                nomor_antrian: data.nomor, // Server mengembalikan nomor, bukan id
                status: 'menunggu'
            };
            localStorage.setItem('queueData', JSON.stringify(queueData));
            
            // Tampilkan informasi antrian
            showQueueInfo(queueData);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mendaftar antrian');
        }
    });
    
    // Fungsi untuk menampilkan informasi antrian
    function showQueueInfo(data) {
        if (!data || !data.nomor_antrian) {
            console.error('Data tidak valid untuk showQueueInfo:', data);
            alert('Terjadi kesalahan saat menampilkan informasi antrian');
            return;
        }
        
        registrationForm.style.display = 'none';
        queueInfo.style.display = 'block';
        
        nomorAntrian.textContent = data.nomor_antrian;
        namaCustomer.textContent = data.nama;
        
        updateStatusDisplay(data.status);
    }
    
    // Fungsi untuk memperbarui tampilan status
    function updateStatusDisplay(status) {
        statusAntrian.className = 'status';
        notifikasi.style.display = 'none';
        
        switch(status) {
            case 'menunggu':
                statusAntrian.textContent = 'Menunggu';
                statusAntrian.classList.add('waiting');
                break;
            case 'proses':
                statusAntrian.textContent = 'Dalam Proses';
                statusAntrian.classList.add('process');
                break;
            case 'selesai':
                statusAntrian.textContent = 'Selesai';
                statusAntrian.classList.add('done');
                notifikasi.style.display = 'block';
                
                // Tampilkan pesan dan redirect setelah 3 detik
                notifikasi.textContent = 'Pesanan Anda selesai dan siap diambil! Halaman akan kembali ke form pendaftaran dalam 3 detik...';
                
                // Set timer untuk kembali ke form pendaftaran
                setTimeout(function() {
                    // Hapus data antrian dari localStorage
                    localStorage.removeItem('queueData');
                    
                    // Tampilkan kembali form pendaftaran
                    registrationForm.style.display = 'block';
                    queueInfo.style.display = 'none';
                    
                    // Reset form
                    namaInput.value = '';
                }, 3000);
                break;
        }
    }
    
    // Fungsi untuk mendapatkan status antrian terbaru dari server
    async function fetchQueueStatus(nomorAntrian) {
        try {
            console.log(`Mengambil status untuk nomor antrian: ${nomorAntrian}`);
            const response = await fetch(`/api/queue/${nomorAntrian}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error('Gagal mendapatkan status antrian');
            }
            
            const data = await response.json();
            console.log('Data status dari server:', data);
            
            if (!data) {
                console.error('Data kosong dari server');
                return;
            }
            
            // Update status di localStorage
            try {
                const queueDataStr = localStorage.getItem('queueData');
                if (!queueDataStr) {
                    console.error('Data antrian tidak ditemukan di localStorage');
                    return;
                }
                
                const queueData = JSON.parse(queueDataStr);
                queueData.status = data.status;
                localStorage.setItem('queueData', JSON.stringify(queueData));
                
                // Update tampilan
                updateStatusDisplay(data.status);
            } catch (parseError) {
                console.error('Error saat parsing data localStorage:', parseError);
            }
            
        } catch (error) {
            console.error('Error saat fetch status:', error);
        }
    }
    
    // Socket.IO event untuk update status
    socket.on('status-update', function(data) {
        try {
            const queueDataStr = localStorage.getItem('queueData');
            if (!queueDataStr) {
                console.log('Tidak ada data antrian di localStorage');
                return;
            }
            
            const queueData = JSON.parse(queueDataStr);
            if (queueData && queueData.id === data.id) {
                queueData.status = data.status;
                localStorage.setItem('queueData', JSON.stringify(queueData));
                updateStatusDisplay(data.status);
                
                // Log untuk debugging
                console.log(`Status antrian diperbarui: ${data.status}`);
            }
        } catch (error) {
            console.error('Error saat memproses status-update:', error);
        }
    });
});