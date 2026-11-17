// pelanggan.js
let dataPelanggan = JSON.parse(localStorage.getItem('pos_pelanggan')) || [
    { id: 1, nama: "Andi Saputra", telp: "081299887766", motor: "Yamaha NMAX", plat: "B 6789 XYZ", alamat: "Jl. Margonda Raya, Depok" }
];

let idPelangganDiedit = null; 

function simpanPelangganKeMemori() {
    localStorage.setItem('pos_pelanggan', JSON.stringify(dataPelanggan));
}

// ==========================================
// FUNGSI MODAL POP-UP PELANGGAN
// ==========================================
function bukaFormPelanggan() {
    idPelangganDiedit = null;
    document.getElementById('modal-pelanggan-title').innerText = "Tambah Pelanggan Baru";
    document.getElementById('btn-simpan-pel').innerText = "Simpan Pelanggan";
    document.getElementById('btn-simpan-pel').style.background = "#2563eb"; 
    
    // Kosongkan input form
    document.getElementById('pel-nama').value = '';
    document.getElementById('pel-telp').value = '';
    document.getElementById('pel-motor').value = '';
    document.getElementById('pel-plat').value = '';
    document.getElementById('pel-alamat').value = '';

    document.getElementById('modal-pelanggan').classList.add('show');
}

function tutupFormPelanggan() {
    document.getElementById('modal-pelanggan').classList.remove('show');
    idPelangganDiedit = null;
}

// ==========================================
// FUNGSI TABEL & CRUD
// ==========================================
function renderPelanggan(keyword = '') {
    const tbody = document.getElementById('pelanggan-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    const hasilCari = dataPelanggan.filter(p => 
        p.nama.toLowerCase().includes(keyword.toLowerCase()) || 
        p.plat.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasilCari.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Data pelanggan tidak ditemukan.</td></tr>`;
    } else {
        hasilCari.forEach((p) => {
            tbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${p.nama}</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">📞 ${p.telp}</span>
                    </td>
                    <td>
                        <strong>${p.motor}</strong><br>
                        <span style="background: #000; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">${p.plat}</span>
                    </td>
                    <td style="font-size: 13px;">${p.alamat}</td>
                    <td>
                        <span onclick="editPelanggan(${p.id})" style="color: #2563eb; cursor: pointer; font-weight: bold; font-size: 13px; margin-right: 12px;">Edit</span>
                        <span onclick="hapusPelanggan(${p.id})" style="color: #dc2626; cursor: pointer; font-weight: bold; font-size: 13px;">Hapus</span>
                    </td>
                </tr>
            `;
        });
    }

    // Refresh data sinkronisasi autocomplete di kasir
    if (typeof setupAutocompletePelanggan === 'function') setupAutocompletePelanggan();
}

function tambahPelanggan() {
    const nama = document.getElementById('pel-nama').value;
    const telp = document.getElementById('pel-telp').value;
    const motor = document.getElementById('pel-motor').value;
    const plat = document.getElementById('pel-plat').value;
    const alamat = document.getElementById('pel-alamat').value;

    if (!nama || !motor || !plat) {
        alert('Nama, Jenis Motor, dan Plat Nomor wajib diisi!');
        return;
    }

    if (idPelangganDiedit) {
        const index = dataPelanggan.findIndex(p => p.id === idPelangganDiedit);
        if (index !== -1) {
            dataPelanggan[index] = { id: idPelangganDiedit, nama, telp, motor, plat, alamat };
        }
        alert('Data pelanggan berhasil diperbarui!');
    } else {
        const newId = Date.now();
        dataPelanggan.push({ id: newId, nama, telp, motor, plat, alamat });
        alert('Data pelanggan bengkel berhasil ditambahkan!');
    }

    simpanPelangganKeMemori(); 
    tutupFormPelanggan(); 
    renderPelanggan();
}

function editPelanggan(id) {
    const p = dataPelanggan.find(x => x.id === id);
    if (!p) return;

    document.getElementById('pel-nama').value = p.nama;
    document.getElementById('pel-telp').value = p.telp;
    document.getElementById('pel-motor').value = p.motor;
    document.getElementById('pel-plat').value = p.plat;
    document.getElementById('pel-alamat').value = p.alamat;

    idPelangganDiedit = id;

    document.getElementById('modal-pelanggan-title').innerText = "Edit Data Pelanggan";
    document.getElementById('btn-simpan-pel').innerText = "Update Pelanggan";
    document.getElementById('btn-simpan-pel').style.background = "#16a34a"; 
    
    document.getElementById('modal-pelanggan').classList.add('show');
}

function hapusPelanggan(id) {
    tampilkanKonfirmasi('Yakin ingin menghapus data pelanggan ini?', function() {
        dataPelanggan = dataPelanggan.filter(p => p.id !== id);
        simpanPelangganKeMemori(); 
        if (idPelangganDiedit === id) tutupFormPelanggan();
        renderPelanggan();
    });
}

document.getElementById('search-pelanggan')?.addEventListener('input', function(e) {
    renderPelanggan(e.target.value);
});

// ==========================================
// FITUR AUTOCOMPLETE KUSTOM (KOTAK GELAP PENJUALAN)
// ==========================================
function setupAutocompletePelanggan() {
    const inputEl = document.getElementById('nama-pelanggan');
    const dropdownEl = document.getElementById('custom-dropdown-pelanggan');
    if (!inputEl || !dropdownEl) return;

    function renderList(keyword = '') {
        dropdownEl.innerHTML = '';
        let hasilCari = [{ nama: 'Umum', plat: '' }];
        
        const filterPelanggan = dataPelanggan.filter(p => 
            p.nama.toLowerCase().includes(keyword.toLowerCase()) || 
            p.plat.toLowerCase().includes(keyword.toLowerCase())
        );
        
        hasilCari = hasilCari.concat(filterPelanggan);

        hasilCari.forEach(p => {
            const div = document.createElement('div');
            div.className = 'custom-dropdown-item';
            div.innerText = p.plat ? `${p.nama} (${p.plat})` : p.nama;
            
            div.onclick = function() {
                inputEl.value = div.innerText; 
                dropdownEl.style.display = 'none'; 
            };
            dropdownEl.appendChild(div);
        });

        dropdownEl.style.display = hasilCari.length > 0 ? 'block' : 'none';
    }

    // Hindari duplikasi event listener dengan cloneNode jika di-refresh berulang kali
    const newTarget = inputEl.cloneNode(true);
    inputEl.parentNode.replaceChild(newTarget, inputEl);
    
    newTarget.addEventListener('input', function(e) { renderList(e.target.value); });
    newTarget.addEventListener('focus', function(e) { renderList(e.target.value); });
    
    document.addEventListener('click', function(e) {
        if (!newTarget.contains(e.target) && !dropdownEl.contains(e.target)) {
            dropdownEl.style.display = 'none';
        }
    });
}

window.addEventListener('load', () => {
    if (typeof renderPelanggan === "function") renderPelanggan();
});