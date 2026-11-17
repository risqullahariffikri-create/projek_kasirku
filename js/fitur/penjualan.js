// penjualan.js

let keranjang = [];
let totalBelanja = 0;
let biayaJasa = 0;

// Tambahkan fungsi baru ini untuk mendeteksi pilihan jasa
// Buka/Tutup menu Jasa
function toggleJasaForm() {
    const container = document.getElementById('form-jasa-container');
    const icon = document.getElementById('jasa-toggle-icon');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.innerText = '▲';
    } else {
        container.style.display = 'none';
        icon.innerText = '▼';
    }
}

// Masukkan Jasa ke dalam List Keranjang
function tambahJasaKeKeranjang() {
    const namaInput = document.getElementById('nama-jasa');
    const hargaInput = document.getElementById('harga-jasa');
    const nama = namaInput.value.trim();
    const harga = parseInt(hargaInput.value);

    if (!nama || isNaN(harga) || harga <= 0) {
        return alert('Masukkan nama jasa dan harga yang valid!');
    }

    // Masukkan sebagai item ke keranjang (Beri penanda isJasa: true)
    keranjang.push({
        id: 'JASA_' + Date.now(), // ID unik agar bisa nambah banyak jasa
        nama: 'Jasa: ' + nama,
        harga: harga,
        qty: 1,
        isJasa: true // Penanda bahwa ini bukan barang fisik
    });

    // Kosongkan form setelah ditambah
    namaInput.value = '';
    hargaInput.value = '';
    renderKeranjang();
}
// 2. GABUNGKAN BARANG & JASA SEBELUM DISIMPAN KE RIWAYAT
    let keranjangFinal = [...keranjang];
    
    if (biayaJasa > 0) {
        // Ambil teks dari input "Cari / ketik nama jasa..."
        let inputNamaJasa = document.getElementById('nama-jasa').value.trim();
        let namaJasaText = "Ongkos / Jasa Pasang";
        
        // Cek apakah user mengetik nama jasa secara manual
        if (inputNamaJasa !== "") {
            namaJasaText = "Jasa: " + inputNamaJasa;
        } else {
            // Jika dikosongkan, coba ambil dari pilihan dropdown (jika dipakai)
            const selectJasa = document.getElementById('pilih-jasa');
            if (selectJasa && selectJasa.value !== 'manual' && selectJasa.value !== '0') {
                namaJasaText = "Jasa " + selectJasa.options[selectJasa.selectedIndex].text.split(' (')[0]; 
            }
        }
        
        // Masukkan jasa sebagai "barang" ke struk
        keranjangFinal.push({
            id: 'JASA', 
            nama: namaJasaText, 
            harga: biayaJasa, 
            qty: 1
        });
    }
// Render Kartu Katalog
function renderKatalog(keyword = '') {
    const grid = document.getElementById('katalog-produk');
    if (!grid) return;
    grid.innerHTML = '';

    const hasilCari = dataStok.filter(item => item.nama.toLowerCase().includes(keyword.toLowerCase()));

    hasilCari.forEach(item => {
        grid.innerHTML += `
            <div class="produk-card">
                <h4>${item.nama}</h4>
                <p class="stok-text">Stok: <strong>${item.stok}</strong></p>
                <div class="card-bottom">
                    <span class="harga-text">Rp ${item.harga.toLocaleString('id-ID')}</span>
                    <button class="btn-tambah" onclick="tambahKeKeranjang(${item.id})">Tambah</button>
                </div>
            </div>
        `;
    });
}

// Fitur Pencarian
document.getElementById('search-item')?.addEventListener('input', function(e) {
    renderKatalog(e.target.value);
});

function tambahKeKeranjang(id) {
    const item = dataStok.find(s => s.id === id);
    if (!item || item.stok <= 0) return alert('Stok barang habis!');

    const existing = keranjang.find(k => k.id === id);
    if (existing) {
        if (existing.qty >= item.stok) return alert('Stok tidak mencukupi!');
        existing.qty += 1;
    } else {
        keranjang.push({ ...item, qty: 1 });
    }
    renderKeranjang();
}

// Fungsi tombol [-] dan [+]
function ubahQty(id, delta) {
    const item = keranjang.find(k => k.id === id);
    
    if (item) {
        item.qty += delta;
        
        // Pengecekan stok HANYA JIKA BUKAN JASA
        if (!item.isJasa) {
            const stokItem = dataStok.find(s => s.id === id);
            if (stokItem && item.qty > stokItem.stok) {
                item.qty = stokItem.stok;
                alert('Melebihi batas stok yang tersedia!');
            }
        }

        if (item.qty <= 0) {
            keranjang = keranjang.filter(k => k.id !== id);
        }
    }
    renderKeranjang();
}

function renderKeranjang() {
    const list = document.getElementById('keranjang-list');
    if (!list) return;
    list.innerHTML = '';
    totalBelanja = 0;

    keranjang.forEach((item) => {
        const subtotal = item.harga * item.qty;
        totalBelanja += subtotal;

        list.innerHTML += `
            <div class="keranjang-item">
                <div class="keranjang-item-info">
                    <h4>${item.nama}</h4>
                    <p>Rp ${item.harga.toLocaleString('id-ID')}</p>
                </div>
                <div class="keranjang-item-actions">
                    <button class="qty-btn" onclick="ubahQty('${item.id}', -1)">-</button>
                    <strong>${item.qty}</strong>
                    <button class="qty-btn dark" onclick="ubahQty('${item.id}', 1)">+</button>
                    <span class="item-total">Rp ${subtotal.toLocaleString('id-ID')}</span>
                </div>
            </div>
        `;
    });
    
    document.getElementById('total-harga').innerText = 'Rp ' + totalBelanja.toLocaleString('id-ID');
}

// ========================================================
// FUNGSI BAYAR & PRINT OTOMATIS
// ========================================================
// 1. Fungsi yang HANYA memunculkan pop-up konfirmasi
function bayar() {
    const namaPelanggan = document.getElementById('nama-pelanggan').value || 'Umum';
    const metodeSelect = document.getElementById('metode-bayar');
    const metodeBayar = metodeSelect.options[metodeSelect.selectedIndex].text;

    if (keranjang.length === 0) return alert('Keranjang dan Jasa masih kosong!');

    // Masukkan data pelanggan & metode ke pop-up
    document.getElementById('konfirmasi-pelanggan').innerText = namaPelanggan;
    document.getElementById('konfirmasi-metode').innerText = metodeBayar;
    
    // Susun list barang dan jasa untuk di pop-up
    const listBarangHTML = keranjang.map(item => {
        return `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span>${item.nama} (x${item.qty})</span>
                    <span style="font-weight: bold;">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</span>
                </div>`;
    }).join('');
    
    document.getElementById('konfirmasi-barang').innerHTML = listBarangHTML;
    document.getElementById('konfirmasi-total').innerText = 'Rp ' + totalBelanja.toLocaleString('id-ID');

    // Tampilkan pop-up modal
    document.getElementById('modal-konfirmasi-bayar').classList.add('show');
}

// 2. Fungsi untuk menutup pop-up
function tutupKonfirmasiBayar() {
    document.getElementById('modal-konfirmasi-bayar').classList.remove('show');
}

// 3. Fungsi asli yang mengeksekusi stok, riwayat, dan print nota (Dipanggil dari dalam pop-up)
function prosesBayar() {
    const namaPelanggan = document.getElementById('nama-pelanggan').value || 'Umum';
    const metodeSelect = document.getElementById('metode-bayar');
    const metodeBayar = metodeSelect.options[metodeSelect.selectedIndex].text;

    // Kurangi stok di database lokal (Kecuali Jasa)
    keranjang.forEach(itemBeli => {
        if (!itemBeli.isJasa) { 
            const stokItem = dataStok.find(s => s.id === itemBeli.id);
            if (stokItem) stokItem.stok -= itemBeli.qty;
        }
    });

    if (typeof simpanStokKeMemori === 'function') simpanStokKeMemori();

    // Simpan ke Riwayat Transaksi 
    if (typeof tambahRiwayat === "function") {
        tambahRiwayat(namaPelanggan, metodeBayar, keranjang, totalBelanja);
    }

    // SUSUN STRUK HTML
    const trxTerakhir = dataRiwayat[dataRiwayat.length - 1];
    const teksBarang = trxTerakhir.items.map(i => `${i.nama} (x${i.qty}) = Rp ${(i.harga * i.qty).toLocaleString('id-ID')}`).join('<br>');
    const namaKasir = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'Admin';

    const strukHTML = `
        <html>
        <head>
            <title>Cetak Nota</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: auto; padding: 20px; font-size: 14px; }
                h2 { text-align: center; margin-bottom: 5px; }
                p { text-align: center; margin-top: 0; font-size: 12px; }
                hr { border-top: 1px dashed #000; }
                .flex { display: flex; justify-content: space-between; }
                .bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <h2>BENGKEL MOTOR TRISNO</h2>
            <p>Jl. H. Salim kelapa dua, Depok<br>Telp: 0858-8265-7403</p>
            <hr>
            <div>Waktu   : ${trxTerakhir.tanggal}</div>
            <div>No. Trx : TRX-${trxTerakhir.id}</div>
            <div>Pelanggan: ${trxTerakhir.pelanggan}</div>
            <div>Kasir   : ${namaKasir}</div>
            <hr>
            <div style="margin-bottom: 10px;">
                ${teksBarang}
            </div>
            <hr>
            <div class="flex bold">
                <span>TOTAL:</span>
                <span>Rp ${trxTerakhir.total.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex">
                <span>Pembayaran:</span>
                <span>${trxTerakhir.metode}</span>
            </div>
            <hr>
            <p style="margin-top: 15px;">Terima Kasih Atas Kunjungan Anda!</p>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `;

    // Buka Jendela Print
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(strukHTML);
    printWindow.document.close();

    // RESET FORM PENJUALAN
    keranjang = [];
    document.getElementById('nama-pelanggan').value = '';
    
    renderKeranjang();
    if (typeof renderStok === "function") renderStok(); 
    
    // Tutup pop-up konfirmasi
    tutupKonfirmasiBayar();
}

    // Daftar harga jasa tetap bengkel
const masterJasa = [
    { nama: "Ganti Oli", harga: 15000 },
    { nama: "Servis Ringan", harga: 25000 },
    { nama: "Servis Berat", harga: 50000 },
    { nama: "Bongkar CVT", harga: 35000 },
    { nama: "Ganti Kampas Rem", harga: 20000 }
];

function setupAutocompleteJasa() {
    const inputNama = document.getElementById('nama-jasa');
    const inputHarga = document.getElementById('harga-jasa');
    const dropdownEl = document.getElementById('custom-dropdown-jasa');
    if (!inputNama || !dropdownEl) return;

    function renderList(keyword = '') {
        dropdownEl.innerHTML = '';
        
        const hasilCari = masterJasa.filter(j => 
            j.nama.toLowerCase().includes(keyword.toLowerCase())
        );

        hasilCari.forEach(j => {
            const div = document.createElement('div');
            div.className = 'custom-dropdown-item';
            div.innerText = `${j.nama} - Rp ${j.harga.toLocaleString('id-ID')}`;
            
            // Jika diklik, isi otomatis form nama & harga
            div.onclick = function() {
                document.getElementById('nama-jasa').value = j.nama;
                document.getElementById('harga-jasa').value = j.harga;
                dropdownEl.style.display = 'none';
            };
            dropdownEl.appendChild(div);
        });

        dropdownEl.style.display = hasilCari.length > 0 ? 'block' : 'none';
    }

    // Hindari event listener bertumpuk dengan cloneNode
    const newTarget = inputNama.cloneNode(true);
    inputNama.parentNode.replaceChild(newTarget, inputNama);

    newTarget.addEventListener('input', function(e) { renderList(e.target.value); });
    newTarget.addEventListener('focus', function(e) { renderList(e.target.value); });
    
    document.addEventListener('click', function(e) {
        if (!newTarget.contains(e.target) && !dropdownEl.contains(e.target)) {
            dropdownEl.style.display = 'none';
        }
    });
}

function hitungJasa() {
    const inputHarga = document.getElementById('harga-jasa');
    biayaJasa = parseInt(inputHarga.value) || 0;
    renderKeranjang(); // Update total tagihan
}
// Inisialisasi awal saat web dibuka
window.onload = () => {
    if (typeof renderStok === "function") renderStok();
    if (typeof renderRiwayat === "function") renderRiwayat();
    // Aktifkan pencarian jasa
    setupAutocompleteJasa();
};