/**
 * js/views.js
 * Kumpulan template UI dan Layout sistem (Versi Sidebar + Topbar + Modal Profil Dinamis Multi-Role).
 */

// 1. KOMPONEN TABEL PENGAJUAN (UPDATED: Tambah kolom Status)
const PengajuanTable = () => `
    <div id="section-pengajuan-masuk" class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm mt-8 hidden animate-fade-in">
        <h3 class="text-slate-800 font-black text-lg mb-6 uppercase tracking-tighter flex items-center gap-2">
            <i class="ph-bold ph-bell text-amber-500 text-2xl"></i> Pengajuan Sewa Menunggu
        </h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th class="pb-4 pl-2">Penyewa</th>
                        <th class="pb-4">Properti</th>
                        <th class="pb-4">Status</th>
                        <th class="pb-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody id="tabel-pengajuan-dashboard">
                </tbody>
            </table>
        </div>
    </div>
`;

// 🔥 FUNGSI GLOBAL UNTUK TOLAK PENGAJUAN (NEW)
window.prosesTolak = async (idAjukan) => {
    if (!confirm("Apakah Anda yakin ingin menolak pengajuan ini?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/pengajuan/update-status/${idAjukan}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${State.user.token}`
            },
            body: JSON.stringify({ status: 'ditolak' })
        });

        const result = await res.json();
        if (result.success) {
            alert("Pengajuan telah ditolak.");
            // Refresh halaman atau panggil kembali fungsi load data jika ada
            if (typeof loadPengajuanAdmin === 'function') {
                loadPengajuanAdmin();
            } else {
                window.location.reload();
            }
        } else {
            alert("Gagal: " + result.message);
        }
    } catch (err) {
        console.error("Error penolakan:", err);
        alert("Gagal menghubungi server.");
    }
};

// Global Functions untuk Modal Profil
window.openProfileModal = () => {
    const modal = document.getElementById('modal-profile');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const isTenant = State.user.role === 'tenant';
        const isVerified = State.user.status_verifikasi === 'verified';

        // Penentuan Nama: Tenant dari DB, Admin/Manager diekstrak dari Email
        let defaultName = State.user.nama;
        if (!isTenant && State.user.email) {
            defaultName = State.user.email.split('@')[0];
        }

        // Isi form dengan data state saat ini
        document.getElementById('prof-nama').value = defaultName || '';
        document.getElementById('prof-email').value = State.user.email || '';
        document.getElementById('prof-telepon').value = State.user.telepon || State.user.telepon_pengelola || '';
        document.getElementById('prof-alamat').value = State.user.alamat_domisili || '';

        // Ambil elemen-elemen UI
        const wrapAlamat = document.getElementById('wrap-prof-alamat');
        const profNama = document.getElementById('prof-nama');
        const profTelepon = document.getElementById('prof-telepon');
        const profAlamat = document.getElementById('prof-alamat');
        const btnSubmit = document.getElementById('btn-submit-profil');
        const badgeStatus = document.getElementById('badge-verifikasi');
        const labelNama = document.getElementById('label-prof-nama');

        // Reset state awal form (Editable & Tombol Aktif)
        profNama.readOnly = false;
        profNama.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

        profTelepon.readOnly = false;
        profTelepon.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

        profAlamat.readOnly = false;
        profAlamat.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

        btnSubmit.disabled = false;
        btnSubmit.className = 'flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-200 flex justify-center items-center gap-2';
        btnSubmit.innerHTML = 'Simpan Perubahan';
        labelNama.innerText = 'Nama Lengkap';

        // LOGIKA A: Jika Role adalah TENANT
        if (isTenant) {
            wrapAlamat.classList.remove('hidden');
            badgeStatus.classList.remove('hidden');

            if (isVerified) {
                badgeStatus.innerHTML = '<i class="ph-fill ph-check-circle text-emerald-500"></i> Akun Terverifikasi';
                badgeStatus.className = 'text-[10px] font-black uppercase tracking-widest mt-2 flex items-center justify-center gap-1 text-emerald-100 bg-emerald-500/20 px-3 py-1 rounded-full w-max mx-auto';

                // Disable input dan tombol simpan karena sudah terkunci verifikasi
                profNama.readOnly = true;
                profNama.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

                profTelepon.readOnly = true;
                profTelepon.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

                profAlamat.readOnly = true;
                profAlamat.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

                btnSubmit.disabled = true;
                btnSubmit.className = 'flex-1 bg-slate-300 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs cursor-not-allowed flex justify-center items-center gap-2';
                btnSubmit.innerHTML = 'Data Terkunci (Terverifikasi)';
            } else {
                badgeStatus.innerHTML = '<i class="ph-fill ph-warning-circle text-amber-500"></i> Menunggu Verifikasi Admin';
                badgeStatus.className = 'text-[10px] font-black uppercase tracking-widest mt-2 flex items-center justify-center gap-1 text-amber-100 bg-amber-500/20 px-3 py-1 rounded-full w-max mx-auto';
            }
        }
        // LOGIKA B: Jika Role adalah MANAGER atau ADMIN
        else {
            wrapAlamat.classList.add('hidden');
            badgeStatus.classList.add('hidden');

            labelNama.innerText = 'Nama Pengguna (Diekstrak dari Email)';
            profNama.readOnly = true;
            profNama.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');
        }
    }
};

window.closeProfileModal = () => {
    const modal = document.getElementById('modal-profile');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// FUNGSI UPDATE PROFIL TERINTEGRASI BACKEND
window.submitUpdateProfile = async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-profil');
    const originalText = btnSubmit.innerHTML;

    btnSubmit.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Menyimpan...';
    btnSubmit.disabled = true;

    const isTenant = State.user.role === 'tenant';
    let payload = {};

    if (isTenant) {
        payload = {
            nama_lengkap: document.getElementById('prof-nama').value,
            telepon: document.getElementById('prof-telepon').value,
            alamat_domisili: document.getElementById('prof-alamat').value
        };
    } else {
        payload = {
            telepon_pengelola: document.getElementById('prof-telepon').value
        };
    }

    try {
        const res = await fetch('http://127.0.0.1:3000/api/profile/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${State.user.token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (!result.success) throw new Error(result.message);

        alert('Profil berhasil diperbarui!');

        if (isTenant) {
            State.user.nama = payload.nama_lengkap;
            State.user.telepon = payload.telepon;
            State.user.alamat_domisili = payload.alamat_domisili;
        } else {
            State.user.telepon_pengelola = payload.telepon_pengelola;
            State.user.telepon = payload.telepon_pengelola;
        }

        if (typeof State.syncProfile === 'function') {
            State.syncProfile();
        }

        changePage('dashboard');
        closeProfileModal();

    } catch (err) {
        alert('Gagal menyimpan: ' + err.message);
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
};

// FUNGSI GLOBAL UNTUK PENGAJUAN SEWA TARI TENANT (NEW)
window.ajukanSewa = async (idProperti) => {
    const konfirmasi = confirm("Apakah Anda yakin ingin mengajukan sewa untuk properti ini?");
    if (!konfirmasi) return;

    try {
        const token = State.user.token;
        if (!token) {
            alert('Sesi Anda telah habis. Silakan login ulang sebagai Tenant!');
            return;
        }

        const response = await fetch('http://localhost:3000/api/pengajuan/buat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id_properti: idProperti
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Berhasil: ' + result.message);
        } else {
            alert('Gagal: ' + (result.message || 'Terjadi kesalahan pada sistem.'));
        }

    } catch (error) {
        console.error('Error saat fetch pengajuan:', error);
        alert('Gagal menghubungi server. Pastikan server backend API sedang menyala.');
    }
};

// FUNGSI TRIGGER FILTER DASHBOARD
window.applyDashboardFilter = () => {
    const startEl = document.getElementById('filter-start');
    const endEl = document.getElementById('filter-end');

    if (startEl && endEl && typeof fetchAndRenderCharts === 'function') {
        fetchAndRenderCharts(startEl.value, endEl.value);
    } else if (typeof fetchAndRenderCharts === 'function') {
        fetchAndRenderCharts();
    } else {
        console.warn("Fungsi fetchAndRenderCharts belum siap atau tidak ditemukan.");
    }
};

// FUNGSI RESET FILTER DASHBOARD
window.resetDashboardFilter = () => {
    const startEl = document.getElementById('filter-start');
    const endEl = document.getElementById('filter-end');

    if (startEl) startEl.value = '';
    if (endEl) endEl.value = '';

    if (typeof fetchAndRenderCharts === 'function') {
        fetchAndRenderCharts('', '');
    }
};

const SidebarItem = (label, icon, link, isActive = false) => `
    <a href="${link}" class="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${
        isActive
        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }">
        <i class="ph-bold ${icon} text-xl"></i>
        <span>${label}</span>
    </a>
`;

const DashboardLayout = (roleName, roleColor, content) => {
    let menuItems = '';

    if (roleName === 'Manager' || roleName === 'Admin' || State.user.role === 'manager' || State.user.role === 'admin') {
        menuItems += SidebarItem('Dashboard', 'ph-squares-four', 'index.html', true);
        menuItems += SidebarItem('Manajemen Unit', 'ph-house-line', 'properti.html');
        menuItems += SidebarItem('Data Penyewa', 'ph-users-three', 'tenant.html');
        menuItems += SidebarItem('Kontrak Sewa', 'ph-file-text', 'kontrak.html');
        menuItems += SidebarItem('Keuangan', 'ph-credit-card', 'pembayaran.html');
    } else {
        menuItems += SidebarItem('Dashboard', 'ph-squares-four', 'index.html', true);
        menuItems += SidebarItem('Katalog Property', 'ph-storefront', 'properti.html');
        menuItems += SidebarItem('Kontrak Saya', 'ph-file-text', 'kontrak.html');
        menuItems += SidebarItem('Tagihan & Bayar', 'ph-receipt', 'pembayaran.html');
    }

    let rawName = State.user.nama;
    if (!rawName && State.user.email) {
        rawName = State.user.email.split('@')[0];
    }
    const userName = rawName || roleName;
    const initial = userName.charAt(0).toUpperCase();

    let colorClass = 'text-slate-500';
    if (roleColor === 'blue') colorClass = 'text-blue-500';
    else if (roleColor === 'emerald') colorClass = 'text-emerald-500';
    else if (roleColor === 'slate') colorClass = 'text-slate-500';

    return `
        <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans relative">
            <aside class="w-72 bg-white border-r border-slate-200 flex-col hidden lg:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div class="h-20 flex items-center px-8 border-b border-slate-100 cursor-pointer" onclick="window.location.href='index.html'">
                    <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-200">
                        <i class="ph-fill ph-buildings text-white text-xl"></i>
                    </div>
                    <h1 class="font-black text-xl tracking-tight text-slate-800 uppercase">Core<span class="text-blue-600">Prop</span></h1>
                </div>
                <div class="px-6 py-8 flex-1 overflow-y-auto">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Menu Utama</p>
                    <nav class="flex flex-col gap-1.5">
                        ${menuItems}
                    </nav>
                </div>
            </aside>
            <div class="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0">
                    <div class="flex items-center gap-4">
                        <div class="lg:hidden w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <i class="ph-fill ph-buildings text-white text-sm"></i>
                        </div>
                        <h2 class="text-xl font-black text-slate-800 tracking-tighter hidden md:block">
                            Selamat datang, <span class="text-blue-600 capitalize">${userName.split(' ')[0]}</span>! 
                        </h2>
                    </div>
                    <div class="flex items-center gap-4 sm:gap-6">
                        <button onclick="openProfileModal()" class="flex items-center gap-3 text-left hover:bg-slate-50 p-2 rounded-2xl transition active:scale-95 border border-transparent hover:border-slate-100">
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">
                                ${initial}
                            </div>
                            <div class="hidden md:block">
                                <p class="text-sm font-bold text-slate-800 truncate max-w-[120px] capitalize">${userName}</p>
                                <p class="text-[10px] font-black ${colorClass} uppercase tracking-widest">${State.user.role}</p>
                            </div>
                            <i class="ph-bold ph-caret-down text-slate-400 hidden sm:block"></i>
                        </button>
                    </div>
                </header>
                <main class="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8fafc] p-6 lg:p-10 scroll-smooth relative">
                    <div class="max-w-6xl mx-auto">
                        ${content}
                    </div>
                </main>
            </div>

            <div id="modal-profile" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 items-center justify-center p-4">
                <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[95vh] overflow-y-auto">
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative">
                        <button onclick="closeProfileModal()" class="absolute top-4 right-4 text-white/70 hover:text-white transition">
                            <i class="ph ph-x-circle text-3xl"></i>
                        </button>
                        <div class="w-20 h-20 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center font-black text-4xl mx-auto mb-4 border border-white/30 shadow-inner">
                            ${initial}
                        </div>
                        <h3 class="text-2xl font-black text-white tracking-tighter capitalize">${userName}</h3>
                        <p class="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">${State.user.role} Account</p>
                        <div id="badge-verifikasi" class="hidden"></div>
                    </div>
                    <form id="form-update-profil" class="p-8 space-y-4" onsubmit="submitUpdateProfile(event)">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label id="label-prof-nama" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nama Lengkap</label>
                                <div class="relative">
                                    <i class="ph-bold ph-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input type="text" id="prof-nama" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-700 transition">
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">No. Telepon</label>
                                <div class="relative">
                                    <i class="ph-bold ph-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input type="text" id="prof-telepon" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-700 transition">
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Email (Akun Login Tetap)</label>
                            <div class="relative">
                                <i class="ph-bold ph-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input type="email" id="prof-email" readonly class="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 font-bold cursor-not-allowed">
                            </div>
                        </div>
                        <div id="wrap-prof-alamat">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Alamat Domisili Lengkap</label>
                            <div class="relative">
                                <i class="ph-bold ph-map-pin absolute left-4 top-4 text-slate-400"></i>
                                <textarea id="prof-alamat" rows="3" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-700 transition resize-none"></textarea>
                            </div>
                        </div>
                        <div class="pt-4 border-t border-slate-100 flex gap-3">
                            <button type="button" onclick="State.clearAuth()" class="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition active:scale-95 shadow-sm border border-red-100 hover:border-red-500" title="Logout">
                                <i class="ph-bold ph-power text-xl"></i>
                            </button>
                            <button type="submit" id="btn-submit-profil" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-200 flex justify-center items-center gap-2">
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
};

// HELPER UNTUK MENGHASILKAN HTML DASHBOARD ADMIN/MANAGER
const getAdminManagerContent = () => {
    const today = new Date();
    const endDateStr = today.toLocaleDateString('en-CA');
    const startDateStr = endDateStr.substring(0, 7) + '-01';

    return `
        <div class="flex flex-col gap-8">
            <div class="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-slate-800 tracking-tight">Dashboard Analitik</h2>
                    <p class="text-slate-500 font-medium mt-1">Pantau performa properti dan keuangan secara real-time.</p>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 shrink-0 overflow-x-auto">
                    <div class="flex items-center bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition" onclick="document.getElementById('filter-start').showPicker()">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 shrink-0">Dari</span>
                        <input type="date" id="filter-start" value="${startDateStr}" class="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer w-[115px]">
                    </div>
                    <span class="text-slate-300 font-black hidden sm:block">-</span>
                    <div class="flex items-center bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition" onclick="document.getElementById('filter-end').showPicker()">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 shrink-0">Sampai</span>
                        <input type="date" id="filter-end" value="${endDateStr}" class="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer w-[115px]">
                    </div>
                    <div class="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button onclick="if(typeof applyDashboardFilter === 'function') applyDashboardFilter()" class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md shadow-blue-200 active:scale-95 flex items-center justify-center gap-2">
                            <i class="ph-bold ph-funnel text-lg"></i> Filter
                        </button>
                        <button onclick="if(typeof resetDashboardFilter === 'function') resetDashboardFilter()" class="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition active:scale-95 flex items-center justify-center" title="Reset Filter">
                            <i class="ph-bold ph-arrows-counter-clockwise text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h3 class="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-3">Total Okupansi</h3>
                    <span id="kpi-okupansi-persen" class="text-5xl font-black text-blue-600">0%</span>
                    <p id="kpi-okupansi-teks" class="text-slate-400 text-sm mt-2 font-medium">Memuat...</p>
                </div>
                
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h3 class="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-3">Total Tunggakan</h3>
                    <span id="kpi-tunggakan-rp" class="text-4xl font-black text-red-600">Rp 0</span>
                    <p id="kpi-tunggakan-nota" class="text-slate-400 text-sm mt-2 font-medium">Memuat...</p>
                </div>
                
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h3 class="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-3">Kontrak Kritis</h3>
                    <span id="kpi-kontrak-kritis" class="text-5xl font-black text-amber-500">0</span>
                    <p class="text-slate-400 text-sm mt-2 font-medium">Sisa sewa < 30 hari</p>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 class="text-slate-800 font-black text-lg mb-6 uppercase tracking-tighter flex items-center gap-2">
                        <i class="ph-bold ph-trend-up text-blue-600 text-2xl"></i> Tren Akuisisi Kontrak Baru
                    </h3>
                    <div class="h-[350px] relative w-full">
                        <canvas id="chartTrenKontrak"></canvas>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <h3 class="text-slate-800 font-black text-lg mb-6 uppercase tracking-tighter flex items-center gap-2">
                            <i class="ph-bold ph-chart-bar text-emerald-500 text-2xl"></i> Analisis Arus Kas & Tunggakan
                        </h3>
                        <div class="h-80 relative w-full">
                            <canvas id="chartPendapatan"></canvas>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <h3 class="text-slate-800 font-black text-lg mb-6 uppercase tracking-tighter flex items-center gap-2">
                            <i class="ph-bold ph-pie-chart text-violet-500 text-2xl"></i> Status Okupansi Properti
                        </h3>
                        <div class="h-80 relative w-full flex items-center justify-center">
                            <canvas id="chartOkupansi"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            ${PengajuanTable()}
        </div>
    `;
};

const ViewManagerDashboard = () => {
    const content = getAdminManagerContent();
    setTimeout(() => { if (typeof applyDashboardFilter === 'function') applyDashboardFilter(); }, 100);
    return DashboardLayout('Manager', 'blue', content);
};

const ViewAdminDashboard = () => {
    const content = getAdminManagerContent();
    setTimeout(() => { if (typeof applyDashboardFilter === 'function') applyDashboardFilter(); }, 100);
    return DashboardLayout('Admin', 'slate', content);
};

const ViewTenantDashboard = () => {
    const content = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <div class="relative">
                    <i class="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                    <input type="text" id="search-unit" onkeyup="filterUnits()" placeholder="Cari nama properti yang disewa..." 
                        class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                
                <div id="unit-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                </div>
            </div>

            <div class="space-y-6 lg:sticky lg:top-10 h-fit">
                <div id="contract-info" class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h4 class="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Informasi Kontrak</h4>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-bold text-slate-500">Masa Sewa</span>
                        <span id="kontrak-periode" class="text-xs font-bold text-slate-800">...</span>
                    </div>
                    <div class="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center mt-4">
                        <p class="text-[10px] font-black uppercase text-emerald-600">Sisa Hari Kontrak</p>
                        <p id="sisa-hari" class="text-3xl font-black text-emerald-700">0 Hari</p>
                    </div>
                    <div id="status-kontrak" class="mt-4 text-center text-[10px] font-black uppercase tracking-widest py-2 rounded-lg bg-slate-100">Aktif</div>
                </div>

                <div id="status-pengajuan-area" class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h4 class="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Status Pengajuan</h4>
                    <div id="list-status-pengajuan" class="text-sm font-bold text-slate-600">
                        Memuat status pengajuan...
                    </div>
                </div>

                <div id="payment-summary" class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h4 class="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Tagihan Berjalan</h4>
                    <p id="total-tagihan" class="text-3xl font-black text-emerald-600">Rp 0</p>
                    <p id="status-tagihan" class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Status: Menunggu</p>
                    
                    <button id="btn-upload" class="w-full mt-6 bg-emerald-500 text-white py-4 rounded-xl font-black text-xs hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">UPLOAD BUKTI TRANSFER</button>
                </div>

                <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                    <h4 class="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Butuh Bantuan?</h4>
                    <p id="admin-name" class="font-bold text-sm">Hubungi Pengelola</p>
                    <a id="wa-link" href="#" class="block w-full mt-6 bg-emerald-500 text-white py-4 rounded-xl font-black text-xs text-center hover:bg-emerald-600 transition">HUBUNGI VIA WA</a>
                </div>
            </div>
        </div>
    `;
    return DashboardLayout('Tenant', 'emerald', content);
};

const ViewLogin = () => `
    <div class="min-h-screen flex items-center justify-center bg-auth relative p-6">
        <div class="absolute inset-0 bg-slate-900/40"></div>
        <div class="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-md relative z-10">
            <div class="text-center mb-10">
                <h2 class="text-3xl font-black text-slate-800 tracking-tight uppercase">Core<span class="text-blue-600">Prop</span></h2>
                <p class="text-slate-400 font-medium mt-1 text-sm">Management System</p>
            </div>
            <form id="formLogin" class="space-y-4">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input type="email" id="email" required class="w-full mt-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-700">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <input type="password" id="password" required class="w-full mt-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-700">
                </div>
                <p id="login-error" class="text-red-500 text-xs font-bold text-center"></p>
                <button type="submit" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95">
                    Masuk 
                </button>
            </form>
            <div class="mt-8 text-center">
                <p class="text-slate-400 text-sm font-bold">Belum punya akun? <a href="javascript:void(0)" onclick="changePage('register')" class="text-blue-600 hover:underline">Daftar</a></p>
            </div>
        </div>
    </div>
`;

const ViewRegister = () => `
    <div class="min-h-screen flex items-center justify-center bg-auth relative p-6">
        <div class="absolute inset-0 bg-slate-900/40"></div>
        <div class="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-xl relative z-10">
            <h2 class="text-3xl font-black text-slate-800 tracking-tight text-center mb-8">Pendaftaran Akun</h2>
            <form id="formRegister" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                        <input type="text" id="reg-nama" required class="w-full mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <input type="email" id="reg-email" required class="w-full mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input type="password" id="reg-pass" required class="w-full mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telepon</label>
                        <input type="text" id="reg-telp" required class="w-full mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold">
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daftar Sebagai</label>
                    <div class="flex gap-4 mt-2">
                        <label class="flex-1">
                            <input type="radio" name="role" value="tenant" checked onchange="toggleKTP(true)" class="hidden peer">
                            <div class="text-center p-3 border rounded-xl cursor-pointer peer-checked:bg-blue-600 peer-checked:text-white font-bold transition shadow-sm">Tenant</div>
                        </label>
                        <label class="flex-1">
                            <input type="radio" name="role" value="manager" onchange="toggleKTP(false)" class="hidden peer">
                            <div class="text-center p-3 border rounded-xl cursor-pointer peer-checked:bg-indigo-600 peer-checked:text-white font-bold transition shadow-sm">Manager</div>
                        </label>
                        <label class="flex-1">
                            <input type="radio" name="role" value="admin" onchange="toggleKTP(false)" class="hidden peer">
                            <div class="text-center p-3 border rounded-xl cursor-pointer peer-checked:bg-slate-800 peer-checked:text-white font-bold transition shadow-sm">Admin</div>
                        </label>
                    </div>
                </div>
                <div id="ktp-container">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor NIK (KTP)</label>
                    <input type="text" id="reg-ktp" placeholder="Wajib untuk penyewa" class="w-full mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold">
                </div>
                <p id="reg-error" class="text-red-500 text-xs font-bold text-center"></p>
                <button type="submit" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95 mt-4">
                    Daftar Akun
                </button>
            </form>
            <div class="mt-8 text-center text-sm font-bold text-slate-400">
                Sudah punya akun? <a href="javascript:void(0)" onclick="changePage('login')" class="text-blue-600 hover:underline">Login</a>
            </div>
        </div>
    </div>
`;