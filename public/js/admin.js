// Admin JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi Socket.IO
    const socket = io();
    
    // Elemen-elemen pada halaman
    const queueTableBody = document.getElementById('queueTableBody');
    const totalAntrian = document.getElementById('totalAntrian');
    const totalProses = document.getElementById('totalProses');
    const totalSelesai = document.getElementById('totalSelesai');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Load data antrian saat halaman dimuat
    loadQueueData();
    
    // Refresh data saat tombol refresh diklik
    refreshBtn.addEventListener('click', function() {
        loadQueueData();
    });
    
    // Socket.IO event listener untuk update antrian
    socket.on('queue-update', function() {
        loadQueueData();
    });
    
    // Socket.IO event listener untuk update status
    socket.on('status-update', function() {
        loadQueueData();
    });
    
    // Fungsi untuk memuat data antrian dari server
    async function loadQueueData() {
        try {
            const response = await fetch('/api/queues');
            if (!response.ok) {
                throw new Error('Gagal memuat data antrian');
            }
            
            const queues = await response.json();
            
            // Perbarui tampilan tabel
            updateQueueTable(queues);
            
            // Perbarui counter
            updateCounters(queues);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat memuat data antrian');
        }
    }
    
    // Fungsi untuk memperbarui tampilan tabel antrian
    function updateQueueTable(queues) {
        queueTableBody.innerHTML = '';
        
        queues.forEach(queue => {
            const row = document.createElement('tr');
            
            // Format waktu
            const createdAt = new Date(queue.created_at);
            const formattedTime = createdAt.toLocaleString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Status badge class
            let statusClass = '';
            let statusText = '';
            switch(queue.status) {
                case 'menunggu':
                    statusClass = 'status-waiting';
                    statusText = 'Menunggu';
                    break;
                case 'proses':
                    statusClass = 'status-process';
                    statusText = 'Dalam Proses';
                    break;
                case 'selesai':
                    statusClass = 'status-done';
                    statusText = 'Selesai';
                    break;
            }
            
            // Buat tombol aksi berdasarkan status
            let actionButtons = '';
            if (queue.status === 'menunggu') {
                actionButtons = `
                    <button class="btn btn-info btn-process" onclick="changeStatus(${queue.id}, 'proses')">
                        <i class="fas fa-sync"></i> Proses
                    </button>
                `;
            } else if (queue.status === 'proses') {
                actionButtons = `
                    <button class="btn btn-success btn-done" onclick="changeStatus(${queue.id}, 'selesai')">
                        <i class="fas fa-check"></i> Selesai
                    </button>
                `;
            } else {
                // Untuk status selesai, tambahkan tombol delete
                actionButtons = `
                    <div class="d-flex gap-2">
                        <button class="btn btn-secondary" disabled>
                            <i class="fas fa-check-double"></i> Selesai
                        </button>
                        <button class="btn btn-danger btn-delete" onclick="deleteQueue(${queue.id})">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                `;
            }
            
            // Set HTML untuk baris tabel
            row.innerHTML = `
                <td>${queue.nomor_antrian}</td>
                <td>${queue.nama}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${formattedTime}</td>
                <td>${actionButtons}</td>
            `;
            
            queueTableBody.appendChild(row);
        });
    }
    
    // Fungsi untuk memperbarui counter
    function updateCounters(queues) {
        const total = queues.length;
        const proses = queues.filter(q => q.status === 'proses').length;
        const selesai = queues.filter(q => q.status === 'selesai').length;
        
        totalAntrian.textContent = total;
        totalProses.textContent = proses;
        totalSelesai.textContent = selesai;
    }
    
    // Tambahkan fungsi changeStatus ke objek window agar bisa diakses dari onclick
    window.changeStatus = async function(id, status) {
        try {
            const response = await fetch(`/api/queue/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                throw new Error('Gagal mengubah status antrian');
            }
            
            // Reload data setelah berhasil mengubah status
            loadQueueData();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengubah status antrian');
        }
    };
    
    // Tambahkan fungsi deleteQueue ke objek window untuk menghapus antrian
    window.deleteQueue = async function(id) {
        // Konfirmasi penghapusan
        if (!confirm('Apakah Anda yakin ingin menghapus antrian ini?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/queue/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Gagal menghapus antrian');
            }
            
            // Reload data setelah berhasil menghapus
            loadQueueData();
            
            // Tampilkan notifikasi sukses
            alert('Antrian berhasil dihapus');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menghapus antrian');
        }
    };
});