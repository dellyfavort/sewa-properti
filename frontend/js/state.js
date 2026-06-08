/**
 * js/state.js
 * Mengelola sesi dan identitas user di browser.
 */
const State = {
    user: {
        // Data Otentikasi Utama
        token: localStorage.getItem('token') || null,
        role: localStorage.getItem('role') || null,
        tenantId: localStorage.getItem('tenantId') || null,
        
        // Data Profil Tambahan (Agar bertahan saat pindah halaman/reload)
        id: localStorage.getItem('id_user') || null,
        email: localStorage.getItem('email') || null,
        nama: localStorage.getItem('nama') || null,
        telepon: localStorage.getItem('telepon') || null,
        alamat_domisili: localStorage.getItem('alamat_domisili') || null,
        status_verifikasi: localStorage.getItem('status_verifikasi') || null,
    },
    currentPage: 'login',

    // Fungsi ini dipanggil saat Login berhasil (di js/auth.js)
    updateAuth: (token, role, tenantId = null) => {
        State.user.token = token;
        State.user.role = role;
        State.user.tenantId = tenantId;
        
        // Simpan SEMUA data state user saat ini ke localStorage
        localStorage.setItem('token', State.user.token || '');
        localStorage.setItem('role', State.user.role || '');
        if(State.user.tenantId) localStorage.setItem('tenantId', State.user.tenantId);
        
        localStorage.setItem('id_user', State.user.id || '');
        localStorage.setItem('email', State.user.email || '');
        localStorage.setItem('nama', State.user.nama || '');
        localStorage.setItem('telepon', State.user.telepon || '');
        localStorage.setItem('alamat_domisili', State.user.alamat_domisili || '');
        localStorage.setItem('status_verifikasi', State.user.status_verifikasi || '');

        Router(); // Memanggil Router yang ada di app.js
    },

    // Fungsi baru: Dipanggil saat user mengklik "Simpan Perubahan" di Modal Profil
    syncProfile: () => {
        localStorage.setItem('nama', State.user.nama || '');
        localStorage.setItem('telepon', State.user.telepon || '');
        localStorage.setItem('alamat_domisili', State.user.alamat_domisili || '');
        localStorage.setItem('status_verifikasi', State.user.status_verifikasi || '');
    },

    clearAuth: () => {
        localStorage.clear(); // Bersihkan seluruh isi memori browser
        State.user = { 
            token: null, role: null, tenantId: null, 
            id: null, email: null, nama: null, 
            telepon: null, alamat_domisili: null, status_verifikasi: null 
        };
        State.currentPage = 'login';
        Router();
    }
};