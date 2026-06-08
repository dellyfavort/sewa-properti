/**
 * js/dashboard.js
 * Logika khusus untuk dashboard Admin/Manager
 */

// FUNGSI UNTUK TOLAK PENGAJUAN
async function prosesTolak(idAjukan) {
    if (!confirm("Apakah Anda yakin ingin MENOLAK pengajuan ini?")) return;

    try {
        const res = await fetch(`http://127.0.0.1:3000/api/pengajuan/update-status/${idAjukan}`, {
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
            // Refresh data setelah aksi
            loadPengajuanAdmin(); 
        } else {
            alert("Gagal: " + result.message);
        }
    } catch (err) {
        console.error("Error saat menolak:", err);
        alert("Gagal memproses penolakan.");
    }
}

async function loadPengajuanAdmin() {
    const tbody = document.getElementById('tabel-pengajuan-dashboard');
    if (!tbody) return;

    try {
        const res = await fetch('http://127.0.0.1:3000/api/pengajuan/semua', {
            headers: { 'Authorization': `Bearer ${State.user.token}` }
        });
        const result = await res.json();

        if (result.success && result.data.length > 0) {
            document.getElementById('section-pengajuan-masuk').classList.remove('hidden');
            
            tbody.innerHTML = result.data.map(item => {
                // Logika warna badge
                let statusBadge = '';
                if(item.status === 'disetujui') statusBadge = 'bg-emerald-100 text-emerald-700';
                else if(item.status === 'ditolak') statusBadge = 'bg-rose-100 text-rose-700';
                else statusBadge = 'bg-amber-100 text-amber-700';

                return `
                <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td class="py-4 pl-2 font-bold text-slate-700">${item.nama_tenant}</td>
                    <td class="py-4 text-slate-600">${item.nama_properti}</td>
                    <td class="py-4">
                        <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusBadge}">
                            ${item.status}
                        </span>
                    </td>
                    <td class="py-4 text-center">
                        ${item.status === 'menunggu' ? `
                            <div class="flex justify-center gap-2">
                                <button onclick="window.location.href='kontrak.html?id_ajukan=${item.id_ajukan}'" 
                                        class="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md active:scale-95">
                                    Setujui
                                </button>
                                <button onclick="prosesTolak(${item.id_ajukan})" 
                                        class="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition shadow-md active:scale-95">
                                    Tolak
                                </button>
                            </div>
                        ` : '<span class="text-[10px] text-slate-400 font-bold">N/A</span>'}
                    </td>
                </tr>
            `}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-400">Belum ada pengajuan.</td></tr>';
        }
    } catch (err) {
        console.error("Gagal memuat pengajuan:", err);
    }
}

async function loadStatusPengajuanTenant() {
    const container = document.getElementById('list-status-pengajuan');
    if (!container) return;

    try {
        const res = await fetch('http://127.0.0.1:3000/api/pengajuan/status-saya', {
            headers: { 'Authorization': `Bearer ${State.user.token}` }
        });

        // Cek apakah response sukses (status 200-299)
        if (!res.ok) {
            throw new Error(`Server merespon dengan status: ${res.status}`);
        }

        const result = await res.json();

        if (result.success && result.data) {
            const status = result.data.status;
            // Menambahkan logika warna untuk tenant (disetujui/ditolak/menunggu)
            let colorClass = 'bg-amber-400';
            if (status === 'disetujui') colorClass = 'bg-emerald-500';
            if (status === 'ditolak') colorClass = 'bg-rose-500';

            container.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${colorClass}"></span>
                    <span class="uppercase font-black text-[10px] tracking-widest">${status}</span>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Properti: ${result.data.nama_properti}</p>
            `;
        } else {
            container.innerHTML = '<p class="text-slate-400 text-xs">Belum ada pengajuan.</p>';
        }
    } catch (err) {
        console.error("DEBUG ERROR:", err); // Pesan ini akan muncul di Console F12
        container.innerHTML = `<p class="text-red-500 text-xs">Gagal memuat status: ${err.message}</p>`;
    }
}