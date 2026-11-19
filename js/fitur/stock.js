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
        const text = e.target.result.replace(/\r/g, '');
        const baris = text.split('\n');
        let jumlahBerhasil = 0;

        for (let i = 1; i < baris.length; i++) {
            if (baris[i].trim() === '') continue;

            let kolom = baris[i].split(',');
            if (kolom.length < 3) kolom = baris[i].split(';');

            if (kolom.length >= 3) {
                const nama = kolom[0].trim();
                const harga = parseInt(kolom[1].replace(/[^0-9]/g, ''));
                const stok = parseInt(kolom[2].replace(/[^0-9]/g, ''));

                if (nama !== '' && !isNaN(harga) && !isNaN(stok)) {
                    const newId = dataStok.length > 0 ? Math.max(...dataStok.map(s => Number(s.id))) + 1 : 1;
                    const barangBaru = { id: newId, nama, harga, stok };
                    dataStok.push(barangBaru);
                    if (typeof simpanDokumenFirestore === 'function') {
                        simpanDokumenFirestore('pos_stok', barangBaru);
                    }
                    jumlahBerhasil++;
                }
            }
        }

        if (jumlahBerhasil > 0) {
            simpanStokKeMemori();
            renderStok();
            alert(`Sukses! ${jumlahBerhasil} barang baru berhasil di-import.`);
        } else {
            alert("Gagal mengimpor. Pastikan baris data memiliki 3 kolom: Nama Barang, Harga, dan Stok.");
        }
        event.target.value = '';
    };
    reader.readAsText(file);
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