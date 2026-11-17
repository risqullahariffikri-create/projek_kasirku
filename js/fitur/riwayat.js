// riwayat.js

// AMBIL DATA DARI MEMORI, JIKA KOSONG GUNAKAN ARRAY KOSONG
let dataRiwayat = JSON.parse(localStorage.getItem('pos_riwayat')) || [];
let idRiwayatDiedit = null; 

// FUNGSI SIMPAN PERMANEN
function simpanRiwayatKeMemori() {
    localStorage.setItem('pos_riwayat', JSON.stringify(dataRiwayat));
}

// FUNGSI PEMBANTU: Mengubah format 'DD/MM/YYYY HH.MM.SS' menjadi Object Date untuk dihitung
function parseTanggal(strDate) {
    const parts = strDate.split(' ');
    const tanggalPart = parts[0].split('/'); 
    // Format tanggal yang tersimpan: DD/MM/YYYY
    return new Date(tanggalPart[2], tanggalPart[1] - 1, tanggalPart[0]);
}

function tambahRiwayat(pelanggan, metode, itemsBeli, total) {
    const now = new Date();
    const formatWaktu = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`;
    const metodeSingkat = metode.split(' ')[0]; 

    dataRiwayat.push({
        id: Date.now(),
        tanggal: formatWaktu,
        pelanggan: pelanggan,
        metode: metodeSingkat, 
        items: [...itemsBeli],
        total: total,
        detailCustom: null
    });
    
    simpanRiwayatKeMemori(); // Simpan ke memori browser
    renderRiwayat();
}

function renderRiwayat() {
    const tbody = document.getElementById('riwayat-list-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    // AMBIL NILAI FILTER
    const dropdown = document.getElementById('filter-waktu');
    const filterValue = dropdown ? dropdown.value : 'semua';
    const hariIni = new Date();
    hariIni.setHours(0,0,0,0); // Normalisasi jam ke 00:00 untuk perbandingan akurat

    // FILTER DATA
    let dataFiltered = dataRiwayat.filter(trx => {
        if (filterValue === 'semua') return true;

        const trxDate = parseTanggal(trx.tanggal);

        if (filterValue === 'hari_ini') {
            return trxDate.getTime() === hariIni.getTime();
        }
        
        if (filterValue === 'minggu_ini') {
            // Cek jika transaksi terjadi dalam 7 hari terakhir
            const selisihHari = (hariIni - trxDate) / (1000 * 60 * 60 * 24);
            return selisihHari >= 0 && selisihHari <= 7;
        }

        if (filterValue === 'bulan_ini') {
            return trxDate.getMonth() === hariIni.getMonth() && 
                   trxDate.getFullYear() === hariIni.getFullYear();
        }

        return true;
    });

    if (dataFiltered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Belum ada transaksi pada periode ini.</td></tr>`;
        return;
    }

    const riwayatTerbaru = [...dataFiltered].reverse();

    riwayatTerbaru.forEach(trx => {
        const detailBarang = trx.detailCustom ? trx.detailCustom.replace(/\n/g, '<br>') : trx.items.map(i => `${i.nama} (x${i.qty})`).join('<br>');
        
        tbody.innerHTML += `
            <tr>
                <td style="color: #6b7280; font-size: 13px;">${trx.tanggal}</td>
                <td style="font-weight: bold;">${trx.pelanggan}</td>
                <td>${detailBarang}</td>
                <td style="color: #2563eb; font-weight: bold;">Rp ${trx.total.toLocaleString('id-ID')}</td>
                <td><span style="background: #f3f4f6; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #d1d5db; color: #111;">${trx.metode}</span></td>
                <td>
                    <span onclick="bukaFormRiwayat(${trx.id})" style="color: #2563eb; cursor: pointer; font-weight: bold; margin-right: 15px;">Edit</span>
                    <span onclick="hapusRiwayat(${trx.id})" style="color: #dc2626; cursor: pointer; font-weight: bold;">Hapus</span>
                </td>
            </tr>
        `;
    });
}

// ----------------------------------------------------
// FUNGSI EXPORT KE EXCEL (CSV)
// ----------------------------------------------------
function exportRiwayatCSV() {
    const dropdown = document.getElementById('filter-waktu');
    const filterValue = dropdown ? dropdown.value : 'semua';
    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);

    // Ambil data yang sama persis dengan yang sedang difilter
    let dataFiltered = dataRiwayat.filter(trx => {
        if (filterValue === 'semua') return true;
        const trxDate = parseTanggal(trx.tanggal);
        if (filterValue === 'hari_ini') return trxDate.getTime() === hariIni.getTime();
        if (filterValue === 'minggu_ini') return ((hariIni - trxDate) / (1000 * 60 * 60 * 24)) <= 7;
        if (filterValue === 'bulan_ini') return trxDate.getMonth() === hariIni.getMonth() && trxDate.getFullYear() === hariIni.getFullYear();
        return true;
    });

    if (dataFiltered.length === 0) {
        alert("Tidak ada data untuk diekspor pada filter ini.");
        return;
    }

    // Buat Header Excel
    let csvContent = "ID Transaksi,Waktu,Pelanggan,Metode Pembayaran,Total (Rp),Rincian Barang\n";

    // Masukkan tiap baris transaksi
    dataFiltered.forEach(trx => {
        const rincian = trx.detailCustom 
            ? trx.detailCustom.replace(/\n/g, ' | ') // Ubah enter jadi pembatas
            : trx.items.map(i => `${i.nama} (x${i.qty})`).join(' | ');
        
        // Tanda kutip agar rincian yang ada komanya tidak terpisah beda kolom
        csvContent += `${trx.id},${trx.tanggal},${trx.pelanggan},${trx.metode},${trx.total},"${rincian}"\n`;
    });

    // Proses Download File Otomatis
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Penjualan_${filterValue}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ----------------------------------------------------
// FUNGSI MENGHAPUS RIWAYAT & MENGEMBALIKAN STOK
// ----------------------------------------------------
function hapusRiwayat(id) {
    tampilkanKonfirmasi('Yakin ingin menghapus riwayat transaksi ini? Stok barang akan dikembalikan.', function() {
        const trx = dataRiwayat.find(t => t.id === id);
        
        if (trx) {
            trx.items.forEach(itemBeli => {
                if (typeof dataStok !== 'undefined') {
                    const stokItem = dataStok.find(s => s.nama === itemBeli.nama);
                    if (stokItem) stokItem.stok += itemBeli.qty; 
                }
            });
        }

        dataRiwayat = dataRiwayat.filter(t => t.id !== id);
        
        simpanRiwayatKeMemori(); 
        if (typeof simpanStokKeMemori === 'function') simpanStokKeMemori(); 

        renderRiwayat();
        if (typeof renderStok === 'function') renderStok(); 
        
        alert('Riwayat dihapus dan stok barang telah dikembalikan!');
    });
}

// ----------------------------------------------------
// FUNGSI MODAL POP-UP RIWAYAT & PRINT
// ----------------------------------------------------
function bukaFormRiwayat(id) {
    const trx = dataRiwayat.find(t => t.id === id);
    if (!trx) return;
    idRiwayatDiedit = id;
    document.getElementById('modal-riwayat-pelanggan').value = trx.pelanggan;
    document.getElementById('modal-riwayat-metode').value = trx.metode;
    
    const teksBarang = trx.detailCustom ? trx.detailCustom : trx.items.map(i => `${i.nama} (x${i.qty})`).join('\n');
    document.getElementById('modal-riwayat-barang').value = teksBarang;
    document.getElementById('modal-riwayat').classList.add('show');
}

function tutupFormRiwayat() {
    document.getElementById('modal-riwayat').classList.remove('show');
    idRiwayatDiedit = null;
}

function simpanRiwayat() {
    if (!idRiwayatDiedit) return;
    const trx = dataRiwayat.find(t => t.id === idRiwayatDiedit);
    if (trx) {
        trx.pelanggan = document.getElementById('modal-riwayat-pelanggan').value;
        trx.metode = document.getElementById('modal-riwayat-metode').value;
        trx.detailCustom = document.getElementById('modal-riwayat-barang').value;
    }
    
    simpanRiwayatKeMemori(); // Simpan jika ada editan riwayat
    renderRiwayat();
    tutupFormRiwayat();
    alert("Data transaksi berhasil diupdate!");
}

function printNota() {
    if (!idRiwayatDiedit) return;
    const trx = dataRiwayat.find(t => t.id === idRiwayatDiedit);
    if (!trx) return;
    const teksBarang = trx.detailCustom ? trx.detailCustom.replace(/\n/g, '<br>') : trx.items.map(i => `${i.nama} (x${i.qty}) = Rp ${(i.harga * i.qty).toLocaleString('id-ID')}`).join('<br>');
    const strukHTML = `
        <html><head><title>Cetak Nota</title><style>body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: auto; padding: 20px; font-size: 14px; } h2 { text-align: center; margin-bottom: 5px; } p { text-align: center; margin-top: 0; font-size: 12px; } hr { border-top: 1px dashed #000; } .flex { display: flex; justify-content: space-between; } .bold { font-weight: bold; }</style></head>
        <body><h2>BENGKEL MOTOR TRISNO</h2><p>Jl. H. Salim kelapa dua, Depok<br>Telp: 0858-8265-7403</p><hr><div>Waktu   : ${trx.tanggal}</div><div>No. Trx : TRX-${trx.id}</div><div>Pelanggan: ${trx.pelanggan}</div><div>Kasir   : Admin</div><hr><div style="margin-bottom: 10px;">${teksBarang}</div><hr><div class="flex bold"><span>TOTAL:</span><span>Rp ${trx.total.toLocaleString('id-ID')}</span></div><div class="flex"><span>Pembayaran:</span><span>${trx.metode}</span></div><hr><p style="margin-top: 15px;">Terima Kasih Atas Kunjungan Anda!</p><script>window.onload = function() { window.print(); window.close(); }</script></body></html>
    `;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(strukHTML);
    printWindow.document.close();
}