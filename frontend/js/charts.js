/**
 * js/charts.js
 * Menangani pembuatan grafik dan pengambilan data analitik.
 */

let chartPendapatanUtama = null;
let chartOkupansiStatus = null;
let chartTrenKontrak = null;

// Mengambil nilai dari input kalender (filter-start & filter-end) yang ada di views.js
window.applyDashboardFilter = () => {
    const startEl = document.getElementById('filter-start');
    const endEl = document.getElementById('filter-end');
    
    if (startEl && endEl) {
        fetchAndRenderCharts(startEl.value, endEl.value);
    } else {
        fetchAndRenderCharts();
    }
};

// FUNGSI RESET FILTER DASHBOARD
window.resetDashboardFilter = () => {
    const startEl = document.getElementById('filter-start');
    const endEl = document.getElementById('filter-end');
    
    // Kosongkan input agar tampil mode "Semua Waktu / All Time"
    if (startEl) startEl.value = '';
    if (endEl) endEl.value = '';
    
    // Panggil ulang chart tanpa parameter untuk reset ke data keseluruhan
    if (typeof fetchAndRenderCharts === 'function') {
        fetchAndRenderCharts('', '');
    }
};

async function fetchAndRenderCharts(startDate = '', endDate = '') {
    try {
        const url = new URL('http://127.0.0.1:3000/api/dashboard/stats');
        
        // Memodifikasi parameter URL agar sesuai dengan rentang tanggal (start & end)
        if (startDate) url.searchParams.append('start', startDate);
        if (endDate) url.searchParams.append('end', endDate);

        const res = await fetch(url, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${State.user.token}`
            }
        });
        
        const json = await res.json();
        if (!json.success) return;

        const d = json.data;

        // Update KPI
        document.getElementById('kpi-okupansi-persen').innerText = `${d.kpi.okupansi_persen}%`;
        document.getElementById('kpi-okupansi-teks').innerText = d.kpi.okupansi_teks;
        document.getElementById('kpi-tunggakan-rp').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.kpi.tunggakan_rp);
        document.getElementById('kpi-tunggakan-nota').innerText = `Dari ${d.kpi.tunggakan_nota} Nota`;
        document.getElementById('kpi-kontrak-kritis').innerText = d.kpi.kontrak_kritis;

        // Reset Chart jika sudah ada (agar tidak terjadi tumpukan grafik/glitch saat di-filter ulang)
        if (chartPendapatanUtama) chartPendapatanUtama.destroy();
        if (chartOkupansiStatus) chartOkupansiStatus.destroy();
        if (chartTrenKontrak) chartTrenKontrak.destroy();

        // 1. Chart Pendapatan (Berubah menjadi Doughnut Chart: Arus Kas & Tunggakan)
        
        // 🔥 SUPER JARING PENGAMAN: Kebal terhadap segala format data dari Backend!
        let totalMasuk = 0;
        let totalTunggakan = 0;

        if (d.keuangan) {
            // Evaluasi data Arus Kas (Masuk)
            if (Array.isArray(d.keuangan.dibayar)) {
                // Jika bentuknya Array (saat filter tanggal), jumlahkan semuanya
                totalMasuk = d.keuangan.dibayar.reduce((a, b) => a + (Number(b) || 0), 0);
            } else {
                // Jika bentuknya hanya 1 angka langsung dari backend (saat Reset/All Time)
                totalMasuk = Number(d.keuangan.dibayar) || 0;
            }

            // Evaluasi data Tunggakan
            if (Array.isArray(d.keuangan.tunggakan)) {
                totalTunggakan = d.keuangan.tunggakan.reduce((a, b) => a + (Number(b) || 0), 0);
            } else {
                totalTunggakan = Number(d.keuangan.tunggakan) || 0;
            }
        }

        const ctxP = document.getElementById('chartPendapatan').getContext('2d');
        chartPendapatanUtama = new Chart(ctxP, {
            type: 'doughnut',
            data: {
                labels: ['Arus Kas', 'Tunggakan'],
                datasets: [{
                    data: [totalMasuk, totalTunggakan],
                    backgroundColor: ['#10b981', '#f59e0b'], // Emerald untuk uang masuk, Amber untuk peringatan
                    borderRadius: 10,
                    borderWidth: 0,
                    spacing: 5
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '75%', // Ukuran lubang yang sama dengan chart Okupansi agar simetris
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });

        // 2. Chart Okupansi (Doughnut Chart)
        const ctxO = document.getElementById('chartOkupansi').getContext('2d');
        chartOkupansiStatus = new Chart(ctxO, {
            type: 'doughnut',
            data: {
                labels: d.okupansi.labels,
                datasets: [{ 
                    data: d.okupansi.jumlah, 
                    // Warna: Tersedia (Biru), Tersewa (Hijau), Perbaikan (Abu-abu)
                    backgroundColor: ['#3b82f6', '#10b981', '#94a3b8'],
                    borderWidth: 0,
                    borderRadius: 10, // Ditambahkan agar serasi dengan chart keuangan
                    spacing: 5        // Ditambahkan agar serasi dengan chart keuangan
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '75%', // Memperbesar lubang tengah agar terlihat lebih elegan (High Fidelity)
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true, // Menyamakan gaya legend dengan chart keuangan
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });

        // 3. Chart Tren Kontrak (Line Chart Baru)
        const ctxT = document.getElementById('chartTrenKontrak').getContext('2d');
        chartTrenKontrak = new Chart(ctxT, {
            type: 'line',
            data: {
                labels: d.kontrak.labels, // Tanggal kontrak
                datasets: [{
                    label: 'Jumlah Kontrak Baru',
                    data: d.kontrak.jumlahKontrak,
                    borderColor: '#2563eb', // Warna garis utama (Primary Blue)
                    backgroundColor: 'rgba(37, 99, 235, 0.1)', // Warna area di bawah garis
                    borderWidth: 3,
                    tension: 0.4, // Memberikan efek kurva yang melengkung halus (tidak kaku)
                    fill: true,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 5, // PERBAIKAN: Memaksa batas atas minimal 5 agar garis tidak mentok di atap
                        ticks: {
                            stepSize: 1 // Memaksa sumbu Y menggunakan angka bulat
                        }
                    }
                },
                plugins: {
                    legend: { display: false } // Disembunyikan karena judul grafik di views.js sudah menjelaskan
                }
            }
        });

    } catch (e) { console.error("Chart Error:", e); }
}