// js/fitur/riwayat.js

let dataRiwayat = JSON.parse(localStorage.getItem('pos_riwayat')) || [];
let idRiwayatDiedit = null;

function simpanRiwayatKeMemori() {
    localStorage.setItem('pos_riwayat', JSON.stringify(dataRiwayat));
}

function parseTanggal(strDate) {
    if (!strDate) return new Date(0);
    const parts = strDate.split(' ');
    const tanggalPart = parts[0].split('/');
    return new Date(tanggalPart[2], tanggalPart[1] - 1, tanggalPart[0]);
}

function normalisasiMetode(metode = '') {
    const m = metode.toLowerCase();
    if (m.includes('debit')) return 'Debit';
    if (m.includes('qris')) return 'QRIS';
    return 'Cash';
}

function filterDataRiwayat(filterValue) {
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    return dataRiwayat.filter(trx => {
        if (filterValue === 'semua') return true;

        const trxDate = parseTanggal(trx.tanggal);

        if (filterValue === 'hari_ini') {
            return trxDate.getTime() === hariIni.getTime();
        }
        if (filterValue === 'minggu_ini') {
            const selisihHari = (hariIni - trxDate) / (1000 * 60 * 60 * 24);
            return selisihHari >= 0 && selisihHari <= 7;
        }
        if (filterValue === 'bulan_ini') {
            return trxDate.getMonth() === hariIni.getMonth() &&
                   trxDate.getFullYear() === hariIni.getFullYear();
        }
        return true;
    });
}

function tambahRiwayat(pelanggan, metode, itemsBeli, total, kasir = '') {
    const now = new Date();
    const formatWaktu = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`;
    const metodeSingkat = normalisasiMetode(metode);
    const namaKasir = kasir || ((typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'Admin');

    const trxBaru = {
        id: Date.now(),
        tanggal: formatWaktu,
        pelanggan: pelanggan,
        kasir: namaKasir,
        metode: metodeSingkat,
        items: itemsBeli.map(item => ({ ...item })),
        total: total,
        detailCustom: null
    };

    dataRiwayat.push(trxBaru);
    simpanRiwayatKeMemori();

    // Kirim transaksi baru ke Cloud Firestore
    if (typeof simpanDokumenFirestore === 'function') {
        simpanDokumenFirestore('pos_riwayat', trxBaru);
    }

    renderRiwayat();
}

function renderRiwayat() {
    const tbody = document.getElementById('riwayat-list-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dropdown = document.getElementById('filter-waktu');
    const filterValue = dropdown ? dropdown.value : 'semua';
    const dataFiltered = filterDataRiwayat(filterValue);

    if (dataFiltered.length === 0) {
        // Ubah colspan dari 6 menjadi 7 karena bertambah 1 kolom
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">Belum ada transaksi pada periode ini.</td></tr>`;
        return;
    }

    const riwayatTerbaru = [...dataFiltered].reverse();

    riwayatTerbaru.forEach(trx => {
        const detailBarang = trx.detailCustom
            ? trx.detailCustom.replace(/\n/g, '<br>')
            : trx.items.map(i => `${i.nama} (x${i.qty})`).join('<br>');

        const namaKasir = trx.kasir || 'Admin';

        tbody.innerHTML += `
            <tr>
                <td style="color: #6b7280; font-size: 13px;">${trx.tanggal}</td>
                <td style="font-weight: bold;">${trx.pelanggan}</td>
                <td>${detailBarang}</td>
                <td style="color: #2563eb; font-weight: bold;">Rp ${trx.total.toLocaleString('id-ID')}</td>
                <td><span style="background: #f3f4f6; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #d1d5db; color: #111;">${trx.metode}</span></td>
                <td><span style="background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #bfdbfe;">👤 ${namaKasir}</span></td>
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
    const dataFiltered = filterDataRiwayat(filterValue);

    if (dataFiltered.length === 0) {
        alert("Tidak ada data untuk diekspor pada filter ini.");
        return;
    }

    let csvContent = "ID Transaksi,Waktu,Pelanggan,Kasir,Metode Pembayaran,Total (Rp),Rincian Barang\n";

    dataFiltered.forEach(trx => {
        const pelangganAman = String(trx.pelanggan || '').replace(/"/g, '""');
        const kasirAman = String(trx.kasir || 'Admin').replace(/"/g, '""');
        const rincian = (trx.detailCustom
            ? trx.detailCustom.replace(/\n/g, ' | ')
            : trx.items.map(i => `${i.nama} (x${i.qty})`).join(' | ')
        ).replace(/"/g, '""');

        csvContent += `${trx.id},${trx.tanggal},"${pelangganAman}","${kasirAman}",${trx.metode},${trx.total},"${rincian}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Penjualan_${filterValue}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// FUNGSI MENGHAPUS RIWAYAT & MENGEMBALIKAN STOK
// ----------------------------------------------------
function hapusRiwayat(id) {
    tampilkanKonfirmasi('Yakin ingin menghapus riwayat transaksi ini? Stok barang akan dikembalikan.', function() {
        const trx = dataRiwayat.find(t => Number(t.id) === Number(id));

        if (trx && typeof dataStok !== 'undefined') {
            trx.items.forEach(itemBeli => {
                if (itemBeli.isJasa) return;
                const stokItem = dataStok.find(s =>
                    String(s.id) === String(itemBeli.id) || s.nama === itemBeli.nama
                );
                if (stokItem) {
                    stokItem.stok += itemBeli.qty;
                    if (typeof simpanDokumenFirestore === 'function') {
                        simpanDokumenFirestore('pos_stok', stokItem);
                    }
                }
            });
        }

        dataRiwayat = dataRiwayat.filter(t => Number(t.id) !== Number(id));

        simpanRiwayatKeMemori();
        if (typeof simpanStokKeMemori === 'function') simpanStokKeMemori();
        if (typeof hapusDokumenFirestore === 'function') {
            hapusDokumenFirestore('pos_riwayat', id);
        }

        renderRiwayat();
        if (typeof renderStok === 'function') renderStok();

        alert('Riwayat dihapus dan stok barang telah dikembalikan!');
    });
}

// ----------------------------------------------------
// FUNGSI MODAL POP-UP RIWAYAT & PRINT
// ----------------------------------------------------
function bukaFormRiwayat(id) {
    const trx = dataRiwayat.find(t => Number(t.id) === Number(id));
    if (!trx) return;
    idRiwayatDiedit = trx.id;
    document.getElementById('modal-riwayat-pelanggan').value = trx.pelanggan;
    document.getElementById('modal-riwayat-metode').value = normalisasiMetode(trx.metode);

    const teksBarang = trx.detailCustom
        ? trx.detailCustom
        : trx.items.map(i => `${i.nama} (x${i.qty})`).join('\n');
    document.getElementById('modal-riwayat-barang').value = teksBarang;
    document.getElementById('modal-riwayat').classList.add('show');
}

function tutupFormRiwayat() {
    document.getElementById('modal-riwayat').classList.remove('show');
    idRiwayatDiedit = null;
}

function simpanRiwayat() {
    if (!idRiwayatDiedit) return;
    const trx = dataRiwayat.find(t => Number(t.id) === Number(idRiwayatDiedit));
    if (trx) {
        trx.pelanggan = document.getElementById('modal-riwayat-pelanggan').value;
        trx.metode = document.getElementById('modal-riwayat-metode').value;
        trx.detailCustom = document.getElementById('modal-riwayat-barang').value;

        if (typeof simpanDokumenFirestore === 'function') {
            simpanDokumenFirestore('pos_riwayat', trx);
        }
    }

    simpanRiwayatKeMemori();
    renderRiwayat();
    tutupFormRiwayat();
    alert("Data transaksi berhasil diupdate!");
}

function printNota() {
    if (!idRiwayatDiedit) return;
    const trx = dataRiwayat.find(t => Number(t.id) === Number(idRiwayatDiedit));
    if (!trx) return;

    const toko = (typeof ambilInfoToko === 'function')
        ? ambilInfoToko()
        : (JSON.parse(localStorage.getItem('pos_toko')) || {
            nama: "BENGKEL MOTOR TRISNO",
            telp: "0858-8265-7403",
            alamat: "Jl. H. Salim kelapa dua, Depok",
            pesan: "Terima Kasih Atas Kunjungan Anda!"
        });

    const teksBarang = trx.detailCustom
        ? trx.detailCustom.replace(/\n/g, '<br>')
        : trx.items.map(i => `${i.nama} (x${i.qty}) = Rp ${(i.harga * i.qty).toLocaleString('id-ID')}`).join('<br>');

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
            <div>Waktu    : ${trx.tanggal}</div>
            <div>No. Trx  : TRX-${trx.id}</div>
            <div>Pelanggan: ${trx.pelanggan}</div>
            <div>Kasir    : ${trx.kasir || 'Admin'}</div>
            <hr>
            <div style="margin-bottom: 10px;">${teksBarang}</div>
            <hr>
            <div class="flex bold">
                <span>TOTAL:</span>
                <span>Rp ${trx.total.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex">
                <span>Pembayaran:</span>
                <span>${trx.metode}</span>
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
}