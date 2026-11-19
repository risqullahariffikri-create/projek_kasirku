// js/firebase-config.js

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPWU_peg1-yaTKcdUTihvOmqhtwKfbB-E",
  authDomain: "kasirku-d7deb.firebaseapp.com",
  projectId: "kasirku-d7deb",
  storageBucket: "kasirku-d7deb.firebasestorage.app",
  messagingSenderId: "221764420515",
  appId: "1:221764420515:web:3793354d9156d349349016",
  measurementId: "G-4YZGH60HER"
};

// Inisialisasi Firebase & Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Helper simpan & hapus dokumen ke Firestore
function simpanDokumenFirestore(koleksi, item) {
    if (!item || item.id === undefined) return;
    db.collection(koleksi).doc(String(item.id)).set(item)
        .catch(err => console.error(`Gagal simpan ke ${koleksi}:`, err));
}

function hapusDokumenFirestore(koleksi, id) {
    db.collection(koleksi).doc(String(id)).delete()
        .catch(err => console.error(`Gagal hapus dari ${koleksi}:`, err));
}

// Sinkronisasi Real-Time ke semua perangkat (Admin & Karyawan)
function jalankanRealtimeFirestore() {
    // 1. Real-time Stok Barang & Katalog Penjualan
    db.collection('pos_stok').onSnapshot((snapshot) => {
        dataStok = snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => Number(a.id) - Number(b.id));

        localStorage.setItem('pos_stok', JSON.stringify(dataStok));

        const kwStok = document.getElementById('search-stok')?.value || '';
        const kwKatalog = document.getElementById('search-item')?.value || '';
        if (typeof renderStok === 'function') renderStok(kwStok);
        if (typeof renderKatalog === 'function') renderKatalog(kwKatalog);
    }, err => console.error("Error sync stok:", err));

    // 2. Real-time Riwayat Transaksi
    db.collection('pos_riwayat').onSnapshot((snapshot) => {
        dataRiwayat = snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => Number(a.id) - Number(b.id));

        localStorage.setItem('pos_riwayat', JSON.stringify(dataRiwayat));
        if (typeof renderRiwayat === 'function') renderRiwayat();
    }, err => console.error("Error sync riwayat:", err));

    // 3. Real-time Data Pelanggan
    db.collection('pos_pelanggan').onSnapshot((snapshot) => {
        dataPelanggan = snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => Number(a.id) - Number(b.id));

        localStorage.setItem('pos_pelanggan', JSON.stringify(dataPelanggan));
        const kwPel = document.getElementById('search-pelanggan')?.value || '';
        if (typeof renderPelanggan === 'function') renderPelanggan(kwPel);
    }, err => console.error("Error sync pelanggan:", err));

    // 4. Real-time Akun Pengguna
    db.collection('pos_users').onSnapshot((snapshot) => {
        if (snapshot.empty) {
            const akunDefault = [
                { id: 1, name: 'Admin Utama', username: 'admin', password: '123', role: 'admin' },
                { id: 2, name: 'Kasir 1', username: 'kasir', password: '456', role: 'kasir' }
            ];
            akunDefault.forEach(akun => simpanDokumenFirestore('pos_users', akun));
            return;
        }

        dataAkun = snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => Number(a.id) - Number(b.id));

        localStorage.setItem('pos_users', JSON.stringify(dataAkun));
        if (typeof renderPengguna === 'function') renderPengguna();
    }, err => console.error("Error sync users:", err));

    // 5. Real-time Pengaturan Bengkel
    db.collection('pos_pengaturan').doc('toko').onSnapshot((doc) => {
        if (doc.exists) {
            dataToko = doc.data();
            localStorage.setItem('pos_toko', JSON.stringify(dataToko));
            if (typeof loadPengaturanBengkel === 'function') loadPengaturanBengkel();
        } else if (typeof dataToko !== 'undefined') {
            db.collection('pos_pengaturan').doc('toko').set(dataToko);
        }
    }, err => console.error("Error sync toko:", err));
}

window.addEventListener('DOMContentLoaded', jalankanRealtimeFirestore);