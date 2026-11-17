// auth.js

let currentUser = null;
const WAKTU_KEDALUWARSA = 30 * 60 * 1000; // 30 menit
let timerAktivitas;

// FUNGSI LOGIN DINAMIS BERDASARKAN MANAJEMEN PENGGUNA
function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Ambil daftar akun dari memori (sama dengan di pengaturan.js)
    let daftarAkun = JSON.parse(localStorage.getItem('pos_users')) || [
        { id: 1, name: 'Admin Utama', username: 'admin', password: '123', role: 'admin' },
        { id: 2, name: 'Kasir 1', username: 'kasir', password: '456', role: 'kasir' }
    ];

    // Cek apakah username dan password cocok dengan data di sistem
    const akunDitemukan = daftarAkun.find(u => u.username === user && u.password === pass);

    if (akunDitemukan) {
        // Jika ketemu, masuk sebagai akun tersebut
        currentUser = { role: akunDitemukan.role, name: akunDitemukan.name, username: akunDitemukan.username };
    } else {
        // Tampilkan pesan error jika salah
        document.getElementById('login-error').style.display = 'block';
        return;
    }

    localStorage.setItem('pos_user', JSON.stringify(currentUser));
    localStorage.setItem('pos_waktu_aktif', Date.now()); 
    masukDashboard();
    jalankanSistemAktivitas();
}

// FUNGSI KUSUS LOGIN TAMU
function loginTamu() {
    currentUser = { role: 'pelanggan', name: 'Pelanggan', username: 'tamu' };
    localStorage.setItem('pos_user', JSON.stringify(currentUser));
    localStorage.setItem('pos_waktu_aktif', Date.now()); 
    masukDashboard();
    jalankanSistemAktivitas();
}

// FUNGSI MASUK DASHBOARD
function masukDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').style.display = 'flex';
    document.getElementById('user-info-name').innerText = currentUser.name;

    aturHakAkses();
    
    // Khusus pelanggan, paksa masuk ke tab Stok (Katalog)
    if (currentUser.role === 'pelanggan') {
        if (typeof switchTab === 'function') switchTab('stok', 'Katalog Harga Barang');
    } else {
        const lastTab = localStorage.getItem('pos_active_tab') || 'penjualan';
        const lastTitle = localStorage.getItem('pos_active_title') || 'Menu Penjualan';
        if (typeof switchTab === 'function') switchTab(lastTab, lastTitle);
    }
    
    if (typeof renderStok === 'function') renderStok(); 
}

// FUNGSI LOGOUT
function logout() {
    currentUser = null;
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_active_tab');
    localStorage.removeItem('pos_active_title');
    localStorage.removeItem('pos_waktu_aktif');
    
    clearTimeout(timerAktivitas);

    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';
}

// FUNGSI PEMBATASAN HAK AKSES
function aturHakAkses() {
    let style = document.getElementById('keamanan-css');
    if (!style) {
        style = document.createElement('style');
        style.id = 'keamanan-css';
        document.head.appendChild(style);
    }
    style.innerHTML = ''; 

    // JIKA YANG LOGIN ADALAH PELANGGAN / TAMU
    if (currentUser.role === 'pelanggan') {
        style.innerHTML = `
            /* Sembunyikan tombol Penjualan, Riwayat, Pelanggan di Sidebar */
            #nav-penjualan, #nav-riwayat, #nav-pelanggan { display: none !important; }
            
            /* Sembunyikan tombol Tambah & Import Stok */
            .stok-header-action > div { display: none !important; }
            
            /* Sembunyikan Kolom Aksi (Edit/Hapus) di Tabel Stok */
            #tab-stok th:last-child, #tab-stok td:last-child { display: none !important; }
            
            /* Sembunyikan Pengaturan Profil & Garisnya di Dropdown Titik Tiga */
            #menu-pengaturan-link, #menu-pengaturan-garis { display: none !important; }
        `;
    } 
    // JIKA YANG LOGIN ADALAH KASIR
    else if (currentUser.role === 'kasir') {
        style.innerHTML = `
            /* Kasir tetap bisa lihat Penjualan, Riwayat, Pelanggan, tapi tombol stok & pengaturannya dibatasi */
            .stok-header-action > div { display: none !important; }
            #tab-stok th:last-child, #tab-stok td:last-child { display: none !important; }
            #menu-pengaturan-link, #menu-pengaturan-garis { display: none !important; }
        `;
    } 
    // JIKA ADMINISTRATOR (Akses Normal)
    else {
        style.innerHTML = ``;
    }
}

// FITUR LUPA PASSWORD (MASTER KEY)
function lupaPassword() {
    const pinDarurat = prompt("Masukkan PIN Darurat (Master Key) untuk mereset akun:");
    if (pinDarurat === "BENGKELTRISNO123") {
        localStorage.removeItem('pos_user'); // Menghapus sesi login saat ini
        localStorage.removeItem('pos_users'); // TAMBAHKAN BARIS INI: Menghapus database akun agar kembali ke bawaan pabrik
        
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        alert("BERHASIL! Sistem telah di-reset.\nSilakan login dengan bawaan pabrik:\nUsername: admin\nPassword: 123");
    } else if (pinDarurat !== null) {
        alert("Gagal! PIN Darurat salah.");
    }
}
// SISTEM AUTO-LOGOUT JIKA TIDAK AKTIF
function resetWaktuAktivitas() {
    if (!currentUser) return;
    localStorage.setItem('pos_waktu_aktif', Date.now());
    clearTimeout(timerAktivitas);
    timerAktivitas = setTimeout(() => {
        alert("Sesi berakhir (30 menit tanpa aktivitas). Silakan login kembali.");
        logout();
    }, WAKTU_KEDALUWARSA);
}

function jalankanSistemAktivitas() {
    window.addEventListener('mousemove', resetWaktuAktivitas);
    window.addEventListener('click', resetWaktuAktivitas);
    window.addEventListener('keydown', resetWaktuAktivitas);
    window.addEventListener('scroll', resetWaktuAktivitas);
    resetWaktuAktivitas();
}

// CEK LOGIN SAAT HALAMAN DI-REFRESH
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('pos_user');
    const waktuAktifTerakhir = localStorage.getItem('pos_waktu_aktif');
    const waktuSekarang = Date.now();

    if (savedUser) {
        if (waktuAktifTerakhir && (waktuSekarang - waktuAktifTerakhir > WAKTU_KEDALUWARSA)) {
            logout(); 
        } else {
            currentUser = JSON.parse(savedUser);
            masukDashboard();
            jalankanSistemAktivitas();
        }
    }
});