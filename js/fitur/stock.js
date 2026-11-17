// stok.js

// AMBIL DATA DARI MEMORI, JIKA KOSONG GUNAKAN DATA DEFAULT
let dataStok = JSON.parse(localStorage.getItem('pos_stok')) || [
    { id: 2, nama: "Celana Jeans", harga: 150000, stok: 14 },
    { id: 3, nama: "Topi Biru", harga: 35000, stok: 50 },
    { id: 4, nama: "Sepatu Kets Putih", harga: 250000, stok: 10 }
];

let idStokDiedit = null; 

// FUNGSI BARU: Simpan Permanen
function simpanStokKeMemori() {
    localStorage.setItem('pos_stok', JSON.stringify(dataStok));
}

function renderStok(keyword = '') {
    const tbody = document.getElementById('stok-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const hasilCari = dataStok.filter(item => item.nama.toLowerCase().includes(keyword.toLowerCase()));

    if (hasilCari.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Barang tidak ditemukan.</td></tr>`;
    } else {
        hasilCari.forEach((item) => {
            let aksiHTML = `
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

    if (typeof renderKatalog === 'function') renderKatalog();
}

document.getElementById('search-stok')?.addEventListener('input', function(e) {
    renderStok(e.target.value);
});

// FUNGSI BARU: IMPORT DARI EXCEL (CSV)
function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        // Hapus karakter carriage return (\r) bawaan Windows agar tidak error
        const text = e.target.result.replace(/\r/g, ''); 
        const baris = text.split('\n'); 

        let jumlahBerhasil = 0;

        for (let i = 1; i < baris.length; i++) {
            if (baris[i].trim() === '') continue; // Lewati baris yang kosong

            // Coba pisahkan dengan koma terlebih dahulu
            let kolom = baris[i].split(',');
            
            // Jika hasilnya kurang dari 3 kolom, berarti Excel menggunakan titik koma (;)
            if (kolom.length < 3) {
                kolom = baris[i].split(';'); 
            }
            
            if (kolom.length >= 3) {
                const nama = kolom[0].trim();
                
                // Bersihkan karakter selain angka (berjaga-jaga jika terketik 'Rp' atau titik)
                const hargaBersih = kolom[1].replace(/[^0-9]/g, '');
                const stokBersih = kolom[2].replace(/[^0-9]/g, '');
                
                const harga = parseInt(hargaBersih);
                const stok = parseInt(stokBersih);

                // Validasi agar nama tidak kosong dan harga/stok adalah angka valid
                if (nama !== '' && !isNaN(harga) && !isNaN(stok)) {
                    const newId = dataStok.length > 0 ? Math.max(...dataStok.map(s => s.id)) + 1 : 1;
                    dataStok.push({ id: newId, nama, harga, stok });
                    jumlahBerhasil++;
                }
            }
        }

        if (jumlahBerhasil > 0) {
            simpanStokKeMemori();
            renderStok();
            alert(`Sukses! ${jumlahBerhasil} barang baru berhasil di-import dari Excel.`);
        } else {
            alert("Gagal mengimpor. Pastikan baris data Anda memiliki 3 kolom: Nama Barang, Harga, dan Stok.");
        }
        
        // Reset input agar pengguna bisa mengunggah ulang file yang sama jika ada revisi
        event.target.value = ''; 
    };
    reader.readAsText(file);
}

// BUKA MODAL, EDIT, TUTUP MODAL SAMA
function bukaFormStok() {
    idStokDiedit = null; 
    document.getElementById('modal-stok-title').innerText = "Tambah Stok Barang Baru";
    document.getElementById('btn-simpan-stok').innerText = "Simpan Barang";
    document.getElementById('btn-simpan-stok').style.background = "#2563eb"; 
    document.getElementById('modal-stok').classList.add('show');
}

function editStok(id) {
    const item = dataStok.find(s => s.id === id);
    if (!item) return;
    idStokDiedit = id; 
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
    const nama = document.getElementById('modal-nama-barang').value;
    const harga = parseInt(document.getElementById('modal-harga-barang').value);
    const stok = parseInt(document.getElementById('modal-stok-barang').value);

    if (!nama || isNaN(harga) || isNaN(stok)) {
        alert("Semua kolom harus diisi dengan benar!");
        return;
    }

    if (idStokDiedit) {
        const item = dataStok.find(s => s.id === idStokDiedit);
        if (item) { item.nama = nama; item.harga = harga; item.stok = stok; }
    } else {
        const newId = dataStok.length > 0 ? Math.max(...dataStok.map(s => s.id)) + 1 : 1;
        dataStok.push({ id: newId, nama, harga, stok });
    }

    simpanStokKeMemori(); // SIMPAN PERMANEN
    document.getElementById('search-stok').value = '';
    renderStok();       
    tutupFormStok();    
}

function hapusStok(id) {
    tampilkanKonfirmasi('Yakin ingin menghapus barang ini?', function() {
        dataStok = dataStok.filter(item => item.id !== id);
        simpanStokKeMemori(); // SIMPAN PERMANEN
        const keyword = document.getElementById('search-stok')?.value || '';
        renderStok(keyword);
    });
}