// pengaturan.js

let idPenggunaDiedit = null;

// --- 1. LOGIKA PERPINDAHAN TAB MENU KIRI ---
function switchSetTab(tabId) {
    document.querySelectorAll('.set-content-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.set-menu-item').forEach(el => el.classList.remove('active'));

    document.getElementById('set-' + tabId).classList.add('active');

    const menus = document.querySelectorAll('.set-menu-item');
    if (tabId === 'profil') menus[0].classList.add('active');
    if (tabId === 'bengkel') menus[1].classList.add('active');
    if (tabId === 'pengguna') {
        menus[2].classList.add('active');
        renderPengguna();
    }
}

// --- 2. LOGIKA PROFIL & BENGKEL ---
let dataToko = JSON.parse(localStorage.getItem('pos_toko')) || {
    nama: "BENGKEL MOTOR TRISNO",
    telp: "0858-8265-7403",
    alamat: "Jl. H. Salim kelapa dua, Depok",
    pesan: "Terima Kasih Atas Kunjungan Anda!"
};

function simpanPengaturanProfil() {
    const namaBaru = document.getElementById('ganti-nama').value.trim();
    const usernameBaru = document.getElementById('ganti-username').value.trim();
    const passwordBaru = document.getElementById('ganti-password').value;

    if (!namaBaru || !usernameBaru) {
        return alert("Nama Profil dan Username tidak boleh kosong!");
    }

    let sesiSaatIni = JSON.parse(localStorage.getItem('pos_user'));
    if (!sesiSaatIni) return alert("Sesi login error, silakan login ulang!");

    const indexAkun = dataAkun.findIndex(u => u.username === sesiSaatIni.username);

    if (indexAkun !== -1) {
        if (usernameBaru !== sesiSaatIni.username && dataAkun.some(u => u.username === usernameBaru)) {
            return alert("Username sudah dipakai akun lain, silakan cari yang lain!");
        }

        dataAkun[indexAkun].name = namaBaru;
        dataAkun[indexAkun].username = usernameBaru;
        if (passwordBaru !== '') {
            dataAkun[indexAkun].password = passwordBaru;
        }

        simpanAkunKeMemori();
        if (typeof simpanDokumenFirestore === 'function') {
    simpanDokumenFirestore('pos_users', dataAkun[indexAkun]);
}

        // Update sesi aktif di localStorage dan variabel global currentUser
        sesiSaatIni.name = namaBaru;
        sesiSaatIni.username = usernameBaru;
        localStorage.setItem('pos_user', JSON.stringify(sesiSaatIni));
        if (typeof db !== 'undefined') {
    db.collection('pos_pengaturan').doc('toko').set(dataToko);
}

        const labelNama = document.getElementById('user-info-name');
        if (labelNama) labelNama.innerText = sesiSaatIni.name;

        document.getElementById('ganti-password').value = '';
        alert("Profil dan Password berhasil diubah! Gunakan data ini untuk login selanjutnya.");
    } else {
        alert("Terjadi kesalahan: Data akun asal tidak ditemukan.");
    }
}

function loadPengaturanBengkel() {
    document.getElementById('atur-toko-nama').value = dataToko.nama;
    document.getElementById('atur-toko-telp').value = dataToko.telp;
    document.getElementById('atur-toko-alamat').value = dataToko.alamat;
    document.getElementById('atur-toko-pesan').value = dataToko.pesan;
}

function simpanPengaturanBengkel() {
    dataToko.nama = document.getElementById('atur-toko-nama').value;
    dataToko.telp = document.getElementById('atur-toko-telp').value;
    dataToko.alamat = document.getElementById('atur-toko-alamat').value;
    dataToko.pesan = document.getElementById('atur-toko-pesan').value;
    localStorage.setItem('pos_toko', JSON.stringify(dataToko));
    alert('Informasi Bengkel berhasil disimpan!');
}

// --- 3. LOGIKA MANAJEMEN PENGGUNA (AKUN) ---
function getDefaultAkun() {
    return [
        { id: 1, name: 'Admin Utama', username: 'admin', password: '123', role: 'admin' },
        { id: 2, name: 'Kasir 1', username: 'kasir', password: '456', role: 'kasir' }
    ];
}

let dataAkun = JSON.parse(localStorage.getItem('pos_users')) || getDefaultAkun();

function muatUlangDataAkun() {
    dataAkun = JSON.parse(localStorage.getItem('pos_users')) || getDefaultAkun();
}

function simpanAkunKeMemori() {
    const akunTarget = idPenggunaDiedit !== null
    ? dataAkun.find(u => u.id === idPenggunaDiedit)
    : dataAkun[dataAkun.length - 1];
if (typeof simpanDokumenFirestore === 'function' && akunTarget) {
    simpanDokumenFirestore('pos_users', akunTarget);
}
}

function renderPengguna(keyword = '') {
    const tbody = document.getElementById('list-pengguna');
    if (!tbody) return;
    tbody.innerHTML = '';

    const inputSearch = document.getElementById('search-pengguna');
    const kataKunci = keyword || (inputSearch ? inputSearch.value : '');

    const hasilCari = dataAkun.filter(akun =>
        (akun.name || '').toLowerCase().includes(kataKunci.toLowerCase()) ||
        (akun.username || '').toLowerCase().includes(kataKunci.toLowerCase())
    );

    if (hasilCari.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Akun tidak ditemukan.</td></tr>`;
    } else {
        hasilCari.forEach(akun => {
            const passwordTersamar = '*'.repeat((akun.password || '').length);
            const roleWarna = akun.role === 'admin' ? '#2563eb' : '#16a34a';

            tbody.innerHTML += `
                <tr>
                    <td><strong>${akun.name}</strong></td>
                    <td>${akun.username}</td>
                    <td>${passwordTersamar}</td>
                    <td><span style="background: ${roleWarna}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${(akun.role || 'kasir').toUpperCase()}</span></td>
                    <td>
                        <span onclick="bukaFormEditPengguna(${akun.id})" style="color: #2563eb; cursor: pointer; font-weight: bold; margin-right: 12px;">Edit</span>
                        <span onclick="hapusPengguna(${akun.id})" style="color: #dc2626; cursor: pointer; font-weight: bold;">Hapus</span>
                    </td>
                </tr>
            `;
        });
    }
}

function bukaFormPengguna() {
    idPenggunaDiedit = null;
    document.getElementById('modal-user-nama').value = '';
    document.getElementById('modal-user-username').value = '';
    document.getElementById('modal-user-password').value = '';
    document.getElementById('modal-user-role').value = 'kasir';

    const modalTitle = document.querySelector('#modal-pengguna h3');
    if (modalTitle) modalTitle.innerText = "Tambah Pengguna Baru";

    const inputPass = document.getElementById('modal-user-password');
    if (inputPass) inputPass.type = 'password';
    const icon = document.getElementById('toggle-password-icon');
    if (icon) icon.innerText = '👁️‍🗨️';

    document.getElementById('modal-pengguna').classList.add('show');
}

function bukaFormEditPengguna(id) {
    const akun = dataAkun.find(u => u.id === id);
    if (!akun) return;

    idPenggunaDiedit = id;

    document.getElementById('modal-user-nama').value = akun.name;
    document.getElementById('modal-user-username').value = akun.username;
    document.getElementById('modal-user-password').value = akun.password;
    document.getElementById('modal-user-role').value = akun.role;

    const modalTitle = document.querySelector('#modal-pengguna h3');
    if (modalTitle) modalTitle.innerText = "Edit Pengguna";

    const inputPass = document.getElementById('modal-user-password');
    if (inputPass) inputPass.type = 'password';
    const icon = document.getElementById('toggle-password-icon');
    if (icon) icon.innerText = '👁️‍🗨️';

    document.getElementById('modal-pengguna').classList.add('show');
}

function tutupFormPengguna() {
    document.getElementById('modal-pengguna').classList.remove('show');
    idPenggunaDiedit = null;
}

function tambahPenggunaBaru() {
    const nameEl = document.getElementById('modal-user-nama');
    const userEl = document.getElementById('modal-user-username');
    const passEl = document.getElementById('modal-user-password');
    const roleEl = document.getElementById('modal-user-role');

    if (!nameEl || !userEl || !passEl || !roleEl) return alert("Error: ID Form di HTML tidak ditemukan!");

    const name = nameEl.value.trim();
    const username = userEl.value.trim();
    const password = passEl.value;
    const role = roleEl.value;

    if (!name || !username || !password) return alert("Semua kolom harus diisi!");

    // MODE EDIT
    if (idPenggunaDiedit !== null) {
        const index = dataAkun.findIndex(u => u.id === idPenggunaDiedit);
        if (index !== -1) {
            const usernameLama = dataAkun[index].username;
            if (username !== usernameLama && dataAkun.some(u => u.username === username)) {
                return alert("Username sudah dipakai akun lain, silakan cari yang lain!");
            }

            dataAkun[index] = { id: idPenggunaDiedit, name, username, password, role };

            // Sinkronkan jika akun yang diedit adalah akun yang sedang login
            let sesiSaatIni = JSON.parse(localStorage.getItem('pos_user'));
            if (sesiSaatIni && sesiSaatIni.username === usernameLama) {
                sesiSaatIni = { role, name, username };
                localStorage.setItem('pos_user', JSON.stringify(sesiSaatIni));
                if (typeof currentUser !== 'undefined' && currentUser) {
                    currentUser.name = name;
                    currentUser.username = username;
                    currentUser.role = role;
                }
                const labelNama = document.getElementById('user-info-name');
                if (labelNama) labelNama.innerText = name;
            }

            alert("Data pengguna berhasil diperbarui!");
        }
    }
    // MODE TAMBAH BARU
    else {
        if (dataAkun.some(u => u.username === username)) {
            return alert("Username sudah dipakai, silakan cari yang lain!");
        }
        dataAkun.push({ id: Date.now(), name, username, password, role });
        alert("Akun pengguna berhasil ditambahkan!");
    }

    simpanAkunKeMemori();
    const akunTarget = idPenggunaDiedit !== null
    ? dataAkun.find(u => u.id === idPenggunaDiedit)
    : dataAkun[dataAkun.length - 1];
if (typeof simpanDokumenFirestore === 'function' && akunTarget) {
    simpanDokumenFirestore('pos_users', akunTarget);
}
    tutupFormPengguna();
    renderPengguna();
}

document.getElementById('search-pengguna')?.addEventListener('input', function(e) {
    renderPengguna(e.target.value);
});

function togglePasswordVisibility() {
    const inputPass = document.getElementById('modal-user-password');
    const icon = document.getElementById('toggle-password-icon');

    if (inputPass.type === 'password') {
        inputPass.type = 'text';
        icon.innerText = '👁️';
    } else {
        inputPass.type = 'password';
        icon.innerText = '👁️‍🗨️';
    }
}

function hapusPengguna(id) {
    if (dataAkun.length <= 1) return alert("Sistem harus memiliki minimal 1 akun aktif!");

    const akunHapus = dataAkun.find(u => u.id === id);
    const sesiSaatIni = JSON.parse(localStorage.getItem('pos_user'));
    if (akunHapus && sesiSaatIni && akunHapus.username === sesiSaatIni.username) {
        return alert("Tidak dapat menghapus akun yang sedang digunakan untuk login!");
    }

    if (typeof tampilkanKonfirmasi === 'function') {
        tampilkanKonfirmasi("Yakin ingin menghapus akun ini?", function() {
            dataAkun = dataAkun.filter(u => u.id !== id);
            simpanAkunKeMemori();
            if (typeof hapusDokumenFirestore === 'function') {
    hapusDokumenFirestore('pos_users', id);
}
            renderPengguna();
        });
    } else {
        if (confirm("Yakin ingin menghapus akun ini?")) {
            dataAkun = dataAkun.filter(u => u.id !== id);
            simpanAkunKeMemori();
            renderPengguna();
        }
    }
}

window.addEventListener('load', () => {
    loadPengaturanBengkel();
});