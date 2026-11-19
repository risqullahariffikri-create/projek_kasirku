// js/fitur/stock.js

let dataStok = JSON.parse(localStorage.getItem('pos_stok')) || [];
let idStokDiedit = null;

function simpanStokKeMemori() {
    localStorage.setItem('pos_stok', JSON.stringify(dataStok));
}

function renderStok(keyword = '') {
    const tbody = document.getElementById('stok-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    const hasilCari = dataStok.filter(item =>
        item.nama.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasilCari.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Barang tidak ditemukan.</td></tr>`;
    } else {
        hasilCari.forEach((item) => {
            const aksiHTML = `
                <span onclick="editStok(${item.id})" style="color: #2563eb; cursor: pointer; font-weight: bold; margin-right: 15px;">Edit</span>
                <span onclick="hapusStok(${item.id})" style="color: #dc2626; cursor: pointer; font-weight: bold;">Hapus</span>
            `;
            tbody.innerHTML += `
                <tr>
                    <td style="color: #6b7280;">#${item.id}</td>
                    <td style="font-weight: bold;">${item.nama}</td>
                    <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
                    <td style="color: #16a34a; font-weight: bold;">${item.stok}</td>
                    <td>${aksiHTML}</td>
                </tr>
            `;
        });
    }

    if (typeof renderKatalog === 'function') {
        const kwKatalog = document.getElementById('search-item')?.value || '';
        renderKatalog(kwKatalog);
    }
}

document.getElementById('search-stok')?.addEventListener('input', function(e) {
    renderStok(e.target.value);
});

function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const namaSheetPertama = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[namaSheetPertama];

            // Ubah isi Excel/CSV menjadi array baris-kolom
            const baris = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            let jumlahBerhasil = 0;
            let maxId = dataStok.length > 0
                ? Math.max(...dataStok.map(s => Number(s.id) || 0))
                : 0;

            for (let i = 0; i < baris.length; i++) {
                const kolom = baris[i];
                if (!kolom || kolom.length < 3) continue;

                const nama = String(kolom[0]).trim();
                const harga = typeof kolom[1] === 'number'
                    ? Math.round(kolom[1])
                    : parseInt(String(kolom[1]).replace(/[^0-9]/g, ''), 10);
                const stok = typeof kolom[2] === 'number'
                    ? Math.round(kolom[2])
                    : parseInt(String(kolom[2]).replace(/[^0-9]/g, ''), 10);

                // Lewati baris header judul kolom (misal: "Nama Barang | Harga | Stok") atau baris kosong
                if (!nama || isNaN(harga) || isNaN(stok)) continue;

                maxId++;
                const barangBaru = { id: maxId, nama, harga, stok };
                dataStok.push(barangBaru);

                if (typeof simpanDokumenFirestore === 'function') {
                    simpanDokumenFirestore('pos_stok', barangBaru);
                }
                jumlahBerhasil++;
            }

            if (jumlahBerhasil > 0) {
                simpanStokKeMemori();
                renderStok();
                alert(`Sukses! ${jumlahBerhasil} barang berhasil di-import ke database.`);
            } else {
                alert("Gagal mengimpor. Pastikan file memiliki 3 kolom berurutan: Nama Barang, Harga, dan Stok.");
            }
        } catch (err) {
            console.error("Error import file:", err);
            alert("Format file tidak valid. Gunakan file Excel (.xlsx / .xls) atau .csv.");
        }

        event.target.value = '';
    };

    // Baca sebagai ArrayBuffer (bukan readAsText) agar bebas bahasa alien
    reader.readAsArrayBuffer(file);
}

function bukaFormStok() {
    idStokDiedit = null;
    document.getElementById('modal-stok-title').innerText = "Tambah Stok Barang Baru";
    document.getElementById('btn-simpan-stok').innerText = "Simpan Barang";
    document.getElementById('btn-simpan-stok').style.background = "#2563eb";
    document.getElementById('modal-stok').classList.add('show');
}

function editStok(id) {
    const item = dataStok.find(s => Number(s.id) === Number(id));
    if (!item) return;
    idStokDiedit = item.id;
    document.getElementById('modal-nama-barang').value = item.nama;
    document.getElementById('modal-harga-barang').value = item.harga;
    document.getElementById('modal-stok-barang').value = item.stok;
    document.getElementById('modal-stok-title').innerText = "Edit Data Stok Barang";
    document.getElementById('btn-simpan-stok').innerText = "Update Barang";
    document.getElementById('btn-simpan-stok').style.background = "#16a34a";
    document.getElementById('modal-stok').classList.add('show');
}

function tutupFormStok() {
    document.getElementById('modal-stok').classList.remove('show');
    document.getElementById('modal-nama-barang').value = '';
    document.getElementById('modal-harga-barang').value = '';
    document.getElementById('modal-stok-barang').value = '';
    idStokDiedit = null;
}

function simpanStok() {
    const nama = document.getElementById('modal-nama-barang').value.trim();
    const harga = parseInt(document.getElementById('modal-harga-barang').value);
    const stok = parseInt(document.getElementById('modal-stok-barang').value);

    if (!nama || isNaN(harga) || isNaN(stok)) {
        alert("Semua kolom harus diisi dengan benar!");
        return;
    }

    let itemTersimpan = null;

    if (idStokDiedit !== null) {
        const item = dataStok.find(s => Number(s.id) === Number(idStokDiedit));
        if (item) {
            item.nama = nama;
            item.harga = harga;
            item.stok = stok;
            itemTersimpan = item;
        }
    } else {
        const newId = dataStok.length > 0 ? Math.max(...dataStok.map(s => Number(s.id))) + 1 : 1;
        itemTersimpan = { id: newId, nama, harga, stok };
        dataStok.push(itemTersimpan);
    }

    simpanStokKeMemori();
    if (typeof simpanDokumenFirestore === 'function' && itemTersimpan) {
        simpanDokumenFirestore('pos_stok', itemTersimpan);
    }

    document.getElementById('search-stok').value = '';
    renderStok();
    tutupFormStok();
}

function hapusStok(id) {
    tampilkanKonfirmasi('Yakin ingin menghapus barang ini?', function() {
        dataStok = dataStok.filter(item => Number(item.id) !== Number(id));
        simpanStokKeMemori();
        if (typeof hapusDokumenFirestore === 'function') {
            hapusDokumenFirestore('pos_stok', id);
        }
        const keyword = document.getElementById('search-stok')?.value || '';
        renderStok(keyword);
    });
}