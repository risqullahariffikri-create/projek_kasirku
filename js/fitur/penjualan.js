// penjualan.js

let keranjang = [];
let totalBelanja = 0;

// Helper mengambil info toko terbaru dari Pengaturan Bengkel
function ambilInfoToko() {
    if (typeof dataToko !== 'undefined' && dataToko) {
        return dataToko;
    }
    return JSON.parse(localStorage.getItem('pos_toko')) || {
        nama: "BENGKEL MOTOR TRISNO",
        telp: "0858-8265-7403",
        alamat: "Jl. H. Salim kelapa dua, Depok",
        pesan: "Terima Kasih Atas Kunjungan Anda!"
    };
}

// Buka/Tutup menu Jasa
function toggleJasaForm() {
    const container = document.getElementById('form-jasa-container');
    const icon = document.getElementById('jasa-toggle-icon');
    if (container.style.display === 'none' || container.style.display === '') {
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

    keranjang.push({
        id: 'JASA_' + Date.now(),
        nama: 'Jasa: ' + nama,
        harga: harga,
        qty: 1,
        isJasa: true
    });

    namaInput.value = '';
    hargaInput.value = '';
    renderKeranjang();
}

// Render Kartu Katalog
function renderKatalog(keyword = '') {
    const grid = document.getElementById('katalog-produk');
    if (!grid) return;
    grid.innerHTML = '';

    const hasilCari = dataStok.filter(item =>
        item.nama.toLowerCase().includes(keyword.toLowerCase())
    );

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

// Fitur Pencarian Katalog
document.getElementById('search-item')?.addEventListener('input', function(e) {
    renderKatalog(e.target.value);
});

function tambahKeKeranjang(id) {
    const item = dataStok.find(s => String(s.id) === String(id));
    if (!item || item.stok <= 0) return alert('Stok barang habis!');

    const existing = keranjang.find(k => String(k.id) === String(id));
    if (existing) {
        if (existing.qty >= item.stok) return alert('Stok tidak mencukupi!');
        existing.qty += 1;
    } else {
        keranjang.push({ ...item, qty: 1 });
    }
    renderKeranjang();
}

// Fungsi tombol [-] dan [+] (sudah aman untuk ID angka maupun string jasa)
function ubahQty(id, delta) {
    const item = keranjang.find(k => String(k.id) === String(id));

    if (item) {
        item.qty += delta;

        if (!item.isJasa) {
            const stokItem = dataStok.find(s => String(s.id) === String(id));
            if (stokItem && item.qty > stokItem.stok) {
                item.qty = stokItem.stok;
                alert('Melebihi batas stok yang tersedia!');
            }
        }

        if (item.qty <= 0) {
            keranjang = keranjang.filter(k => String(k.id) !== String(id));
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
    // Update tombol melayang keranjang versi HP
    const totalItem = keranjang.reduce((acc, item) => acc + item.qty, 0);
    const mobileCount = document.getElementById('mobile-cart-count');
    const mobileTotal = document.getElementById('mobile-cart-total');
    if (mobileCount) mobileCount.innerText = `${totalItem} Item`;
    if (mobileTotal) mobileTotal.innerText = 'Rp ' + totalBelanja.toLocaleString('id-ID');
}

// ========================================================
// FUNGSI BAYAR & PRINT OTOMATIS
// ========================================================
function bayar() {
    const namaPelanggan = document.getElementById('nama-pelanggan').value.trim() || 'Umum';
    const metodeSelect = document.getElementById('metode-bayar');
    const metodeBayar = metodeSelect.options[metodeSelect.selectedIndex].text;

    if (keranjang.length === 0) return alert('Keranjang dan Jasa masih kosong!');

    document.getElementById('konfirmasi-pelanggan').innerText = namaPelanggan;
    document.getElementById('konfirmasi-metode').innerText = metodeBayar;

    const listBarangHTML = keranjang.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>${item.nama} (x${item.qty})</span>
            <span style="font-weight: bold;">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</span>
        </div>
    `).join('');

    document.getElementById('konfirmasi-barang').innerHTML = listBarangHTML;
    document.getElementById('konfirmasi-total').innerText = 'Rp ' + totalBelanja.toLocaleString('id-ID');

    document.getElementById('modal-konfirmasi-bayar').classList.add('show');
}

function tutupKonfirmasiBayar() {
    document.getElementById('modal-konfirmasi-bayar').classList.remove('show');
}

function prosesBayar() {
    const namaPelanggan = document.getElementById('nama-pelanggan').value.trim() || 'Umum';
    const metodeSelect = document.getElementById('metode-bayar');
    const metodeBayar = metodeSelect.options[metodeSelect.selectedIndex].text;
    const namaKasir = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'Admin';

// Kurangi stok barang fisik & update ke Firestore
    keranjang.forEach(itemBeli => {
        if (!itemBeli.isJasa) {
            const stokItem = dataStok.find(s => String(s.id) === String(itemBeli.id));
            if (stokItem) {
                stokItem.stok -= itemBeli.qty;
                if (typeof simpanDokumenFirestore === 'function') {
                    simpanDokumenFirestore('pos_stok', stokItem);
                }
            }
        }
    });

    if (typeof simpanStokKeMemori === 'function') simpanStokKeMemori();

    if (typeof tambahRiwayat === "function") {
        tambahRiwayat(namaPelanggan, metodeBayar, keranjang, totalBelanja, namaKasir);
    }

    const trxTerakhir = dataRiwayat[dataRiwayat.length - 1];
    const toko = ambilInfoToko();
    const teksBarang = trxTerakhir.items
        .map(i => `${i.nama} (x${i.qty}) = Rp ${(i.harga * i.qty).toLocaleString('id-ID')}`)
        .join('<br>');

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
            <h2>${toko.nama}</h2>
            <p>${toko.alamat}<br>Telp: ${toko.telp}</p>
            <hr>
            <div>Waktu    : ${trxTerakhir.tanggal}</div>
            <div>No. Trx  : TRX-${trxTerakhir.id}</div>
            <div>Pelanggan: ${trxTerakhir.pelanggan}</div>
            <div>Kasir    : ${trxTerakhir.kasir || namaKasir}</div>
            <hr>
            <div style="margin-bottom: 10px;">${teksBarang}</div>
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
            <p style="margin-top: 15px;">${toko.pesan}</p>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
        printWindow.document.write(strukHTML);
        printWindow.document.close();
    }

    keranjang = [];
    document.getElementById('nama-pelanggan').value = 'Umum';

    renderKeranjang();
    if (typeof renderStok === "function") renderStok();
    tutupKonfirmasiBayar();
    if (typeof toggleKeranjangMobile === 'function') toggleKeranjangMobile(false);
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

            div.onclick = function() {
                document.getElementById('nama-jasa').value = j.nama;
                document.getElementById('harga-jasa').value = j.harga;
                dropdownEl.style.display = 'none';
            };
            dropdownEl.appendChild(div);
        });

        dropdownEl.style.display = hasilCari.length > 0 ? 'block' : 'none';
    }

    inputNama.addEventListener('input', function(e) { renderList(e.target.value); });
    inputNama.addEventListener('focus', function(e) { renderList(e.target.value); });

    document.addEventListener('click', function(e) {
        if (!inputNama.contains(e.target) && !dropdownEl.contains(e.target)) {
            dropdownEl.style.display = 'none';
        }
    });
}

// Inisialisasi awal tanpa menimpa window.onload milik file lain
window.addEventListener('load', () => {
    if (typeof renderStok === "function") renderStok();
    if (typeof renderRiwayat === "function") renderRiwayat();
    setupAutocompleteJasa();
});