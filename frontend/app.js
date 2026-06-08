/**
 * app.js
 * File ini hanya berfungsi sebagai Router Utama.
 * Logika spesifik ada di folder /js/
 */

const Router = () => {
    const root = document.getElementById('app-root');
    
    // Mengecek apakah user sudah login atau belum via State (dari js/state.js)
    if (!State.user.token) {
        if (State.currentPage === 'register') {
            root.innerHTML = ViewRegister(); // dari js/views.js
            attachRegisterLogic();          // dari js/auth.js
        } else {
            root.innerHTML = ViewLogin();    // dari js/views.js
            attachLoginLogic();             // dari js/auth.js
        }
    } else {
        const role = State.user.role;
        // Menentukan tampilan dashboard berdasarkan Role
        if (role === 'manager') {
            root.innerHTML = ViewManagerDashboard();
            // Panggil logika Admin/Manager setelah HTML dirender
            if (typeof loadPengajuanAdmin === 'function') loadPengajuanAdmin();
        } 
        else if (role === 'admin') {
            root.innerHTML = ViewAdminDashboard();
            // Panggil logika Admin/Manager setelah HTML dirender
            if (typeof loadPengajuanAdmin === 'function') loadPengajuanAdmin();
        } 
        else {
            root.innerHTML = ViewTenantDashboard(); // Render HTML
            
            // Panggil fungsi Tenant setelah HTML ada
            if (typeof initTenantData === 'function') initTenantData();
            if (typeof loadStatusPengajuanTenant === 'function') loadStatusPengajuanTenant();
        }
    }
};

// Fungsi navigasi halaman
window.changePage = (page) => { 
    State.currentPage = page; 
    Router(); 
};

// Menjalankan sistem pertama kali
document.addEventListener('DOMContentLoaded', () => {
    Router();
});