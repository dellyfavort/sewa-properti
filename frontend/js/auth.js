/**

 * js/auth.js

 * Logika khusus untuk proses Autentikasi (Login & Register).

 */



// 1. Logika untuk menampilkan/menyembunyikan input KTP pada form Register

window.toggleKTP = (show) => {

    const container = document.getElementById('ktp-container');

    if (!container) return;

   

    if (show) {

        container.classList.remove('hidden');

    } else {

        container.classList.add('hidden');

        const inputKTP = document.getElementById('reg-ktp');

        if (inputKTP) inputKTP.value = "";

    }

};



// 2. Integrasi API Login (Menangkap Profil Lengkap untuk State)

function attachLoginLogic() {

    const form = document.getElementById('formLogin');

    if (!form) return;



    form.onsubmit = async (e) => {

        e.preventDefault();

        const email = document.getElementById('email').value;

        const password = document.getElementById('password').value;

        const err = document.getElementById('login-error');

        const btnSubmit = form.querySelector('button[type="submit"]');

        const originalBtnText = btnSubmit.innerHTML;



        // Indikator Loading

        btnSubmit.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Memproses...';

        btnSubmit.disabled = true;

        err.innerText = '';



        try {

            const res = await fetch('http://127.0.0.1:3000/api/auth/login', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ email, password })

            });

            const data = await res.json();

           

            if (data.success) {

                // Simpan data profil lengkap ke dalam State

                State.user = {

                    id: data.data.id_user,

                    role: data.data.role,

                    email: data.data.email,

                    tenantId: data.data.id_tenant,

                    nama: data.data.nama_lengkap,

                    telepon: data.data.telepon,

                    alamat_domisili: data.data.alamat_domisili,

                    status_verifikasi: data.data.status_verifikasi,

                    token: data.token

                };



                // Sinkronisasi dengan localStorage melalui State

                if(typeof State.updateAuth === 'function') {

                    State.updateAuth(data.token, data.role, data.tenantId);

                }

               

                // Navigasi ke dashboard

                if(typeof changePage === 'function') {

                    changePage('dashboard');

                }

            } else {

                err.innerText = data.message;

                btnSubmit.innerHTML = originalBtnText;

                btnSubmit.disabled = false;

            }

        } catch (error) {

            err.innerText = "Koneksi ke backend gagal! Pastikan server menyala.";

            console.error("Login Error:", error);

            btnSubmit.innerHTML = originalBtnText;

            btnSubmit.disabled = false;

        }

    };

}



// 3. Integrasi API Register (Mendukung role Tenant, Manager, dan Admin)

function attachRegisterLogic() {

    const form = document.getElementById('formRegister');

    if (!form) return;



    form.onsubmit = async (e) => {

        e.preventDefault();

       

        // Mengambil nilai role yang dipilih (tenant, manager, atau admin)

        const role = document.querySelector('input[name="role"]:checked').value;

        const errElement = document.getElementById('reg-error');

        const btnSubmit = form.querySelector('button[type="submit"]');

        const originalBtnText = btnSubmit.innerHTML;



        // Indikator Loading

        btnSubmit.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Mendaftarkan...';

        btnSubmit.disabled = true;

        if(errElement) errElement.innerText = '';



        const payload = {

            nama_lengkap: document.getElementById('reg-nama').value,

            email: document.getElementById('reg-email').value,

            password: document.getElementById('reg-pass').value,

            telepon: document.getElementById('reg-telp').value,

            role: role,

            // Hanya menyertakan KTP jika role adalah tenant

            no_ktp: role === 'tenant' ? document.getElementById('reg-ktp').value : null

        };



        try {

            const res = await fetch('http://127.0.0.1:3000/api/auth/register', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify(payload)

            });

            const data = await res.json();

           

            if (data.success) {

                alert("Berhasil mendaftar sebagai " + role + "! Silakan Login.");

                // Kembali ke halaman login

                changePage('login');

            } else {

                if (errElement) errElement.innerText = data.message;

                btnSubmit.innerHTML = originalBtnText;

                btnSubmit.disabled = false;

            }

        } catch (error) {

            alert("Gagal mendaftar. Periksa koneksi backend.");

            console.error("Register Error:", error);

            btnSubmit.innerHTML = originalBtnText;

            btnSubmit.disabled = false;

        }

    };

}