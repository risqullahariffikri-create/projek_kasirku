// ui.js

function switchTab(tabId, title) {
    // 1. Sembunyikan semua tab konten
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 2. Tampilkan tab konten yang dipilih
    document.getElementById('tab-' + tabId).classList.add('active');
    
    // 3. Hapus warna biru dari semua tombol sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 4. Tambahkan warna biru ke tombol sidebar yang sedang diklik
    const activeBtn = document.getElementById('nav-' + tabId);
    if(activeBtn) activeBtn.classList.add('active');
    
    // 5. Ubah teks judul di header biru atas
    if (title) {
        document.getElementById('header-title').innerText = title;
    }

    // 6. Auto-fill form jika masuk ke tab pengaturan
    if (tabId === 'pengaturan' && currentUser) {
        const inputNama = document.getElementById('ganti-nama');
        const inputUsername = document.getElementById('ganti-username');
        
        if (inputNama) inputNama.value = currentUser.name;
        if (inputUsername) inputUsername.value = currentUser.username || currentUser.role; 
    }

    // ==========================================
    // SIMPAN TAB AKTIF KE MEMORI BROWSER
    // ==========================================
    localStorage.setItem('pos_active_tab', tabId);
    if (title) {
        localStorage.setItem('pos_active_title', title);
    }
}

// Fungsi untuk membuka/menutup menu titik tiga di pojok kanan atas
function toggleHeaderMenu() {
    const dropdown = document.getElementById('header-dropdown');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// Menutup menu secara otomatis jika user mengeklik sembarang tempat di luar menu
document.addEventListener('click', function(e) {
    const container = document.getElementById('menu-pengaturan-container');
    const dropdown = document.getElementById('header-dropdown');
    if (container && dropdown && !container.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// ==========================================
// FUNGSI MODAL KONFIRMASI KUSTOM
// ==========================================
let fungsiHapusGlobal = null;

function tampilkanKonfirmasi(pesan, fungsiEksekusi) {
    document.getElementById('teks-konfirmasi').innerText = pesan;
    fungsiHapusGlobal = fungsiEksekusi;
    document.getElementById('modal-konfirmasi').classList.add('show');
}

function tutupKonfirmasi() {
    document.getElementById('modal-konfirmasi').classList.remove('show');
    fungsiHapusGlobal = null;
}

// Eksekusi fungsi hapus saat tombol "Ya, Hapus" diklik
document.getElementById('btn-eksekusi-hapus')?.addEventListener('click', function() {
    if (typeof fungsiHapusGlobal === 'function') {
        fungsiHapusGlobal();
    }
    tutupKonfirmasi();
});

// ==========================================
// FUNGSI SIDEBAR COLLAPSIBLE & KERANJANG HP
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    if (window.innerWidth <= 768) {
        const isOpen = sidebar.classList.toggle('mobile-open');
        if (backdrop) backdrop.classList.toggle('show', isOpen);
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function tutupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('show');
}

function pilihMenu(tabId, title) {
    switchTab(tabId, title);
    tutupSidebar();
}

function toggleKeranjangMobile(buka) {
    const panel = document.getElementById('keranjang-panel');
    if (!panel) return;
    if (buka) {
        panel.classList.add('mobile-show');
    } else {
        panel.classList.remove('mobile-show');
    }
}

// Bersihkan state overlay jika layar dibesarkan ke mode desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        tutupSidebar();
        toggleKeranjangMobile(false);
    }
});