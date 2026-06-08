// js/tenant.js

async function initTenantData() {
    if (!document.getElementById('unit-list')) return;

    try {
        const response = await fetch('http://127.0.0.1:3000/api/tenant/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
        if (result.success) {
            // 1. Update Kartu Kanan (Menampilkan yang paling mendesak)
            document.getElementById('kontrak-periode').innerText = result.data.periode_terdekat;
            document.getElementById('sisa-hari').innerText = result.data.sisa_hari_terdekat + " Hari";
            
            // Ubah teks statis di DOM agar tenant paham ini adalah kontrak terdekat
            const labelPeriode = document.getElementById('kontrak-periode').previousElementSibling;
            if(labelPeriode) labelPeriode.innerText = "Kontrak Terdekat";
            
            document.getElementById('total-tagihan').innerText = new Intl.NumberFormat('id-ID', { 
                style: 'currency', currency: 'IDR', maximumFractionDigits: 0
            }).format(result.data.tagihan);
            
            // 2. Render List Properti (Menampilkan sisa hari per unit)
            const list = document.getElementById('unit-list');
            list.innerHTML = result.data.properti.map(p => `
                <div class="unit-card bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h3 class="font-black text-lg text-slate-800">${p.nama}</h3>
                    <p class="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">${p.kode}</p>
                    
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Periode Sewa</p>
                        <p class="text-xs font-bold text-slate-700">${p.periode}</p>
                        <p class="text-xs font-black ${p.sisa_hari < 30 ? 'text-amber-500' : 'text-emerald-500'} mt-1">Sisa: ${p.sisa_hari} Hari</p>
                    </div>
                </div>
            `).join('');

            // 3. Logika Tombol Bayar
            const btnUpload = document.getElementById('btn-upload');
            if (btnUpload) {
                if (result.data.tagihan > 0) {
                    btnUpload.innerText = "BAYAR SEKARANG";
                    btnUpload.disabled = false;
                    btnUpload.onclick = () => { window.location.href = 'pembayaran.html'; };
                } else {
                    btnUpload.innerText = "SEMUA TAGIHAN LUNAS";
                    btnUpload.className = "w-full mt-6 bg-slate-200 text-slate-500 py-4 rounded-xl font-black text-xs cursor-not-allowed";
                    btnUpload.disabled = true;
                }
            }

            // 4. Logika Tombol WA
            const waLink = document.getElementById('wa-link');
            if (waLink && result.data.admin_phone) {
                let noHp = result.data.admin_phone;
                if (noHp.startsWith('0')) noHp = '62' + noHp.substring(1);
                waLink.href = `https://wa.me/${noHp}?text=Halo%20Admin,%20saya%20butuh%20bantuan%20terkait%20sewa%20unit%20saya.`;
                waLink.target = "_blank"; 
            }
        }
    } catch (err) {
        console.error("Gagal load data tenant:", err);
    }
}// Fungsi untuk fitur pencarian (Search Bar)
window.filterUnits = () => {
    const searchInput = document.getElementById('search-unit');
    if (!searchInput) return;

    // Ambil kata kunci pencarian dan ubah ke huruf kecil
    const query = searchInput.value.toLowerCase();
    
    // Ambil semua elemen kartu properti
    const unitCards = document.querySelectorAll('.unit-card');

    unitCards.forEach(card => {
        // Cari elemen H3 di dalam kartu (yang berisi nama properti)
        const titleElement = card.querySelector('h3');
        
        if (titleElement) {
            const title = titleElement.innerText.toLowerCase();
            
            // Cocokkan teks pencarian dengan nama properti
            if (title.includes(query)) {
                // Tampilkan kartu (gunakan 'flex' karena di class HTML-mu menggunakan flex flex-col)
                card.style.display = 'flex';
            } else {
                // Sembunyikan kartu jika tidak cocok
                card.style.display = 'none';
            }
        }
    });
};