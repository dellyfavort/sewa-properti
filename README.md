# Sistem Pengelolaan Sewa dan Kontrak Properti

Aplikasi berbasis web full-stack untuk mengelola penyewaan properti, data tenant, serta pelacakan kontrak dan tagihan pembayaran secara efisien. Sistem ini dibangun dengan arsitektur pemisahan backend dan frontend, serta menerapkan *Role-Based Access Control* (RBAC) untuk keamanan hak akses.

##  Fitur Utama (Berdasarkan UC-01 hingga UC-10)
- **Role-Based Access Control (RBAC):** Otentikasi dan otorisasi terpusat untuk membatasi akses sesuai peran pengguna (misalnya: Admin, Manajer, Tenant).
- **Manajemen Properti:** Fitur pencatatan dan pemantauan status ketersediaan unit properti.
- **Manajemen Tenant & Kontrak:** Sistem pelacakan penyewa, pembuatan dokumen kontrak, dan pemantauan masa berlaku sewa.
- **Pengelolaan Tagihan (Billing):** Pembuatan tagihan bulanan dan validasi pembayaran.
- **Validasi Data Otomatis:** Pengamanan *endpoint* dan input pengguna menggunakan library validasi data (Zod / Joi).

##  Teknologi yang Digunakan

**Frontend:**
* HTML5
* Tailwind CSS
* Vanilla JavaScript (DOM Manipulation & Fetch API)

**Backend:**
* Node.js
* Express.js
* SQL Database (Sistem Relasional)
* JWT (JSON Web Token) untuk Autentikasi

##  Struktur Direktori Utama

```text
├── backend/
│   ├── controller/      # Logika bisnis (tagihanController, dll)
│   ├── middleware/      # Middleware autentikasi (auth.js)
│   ├── uploads/         # Menyimpan gambar upload dari properti & pembayaran
│   ├── routes/          # Definisi endpoint API (pengajuan.js)
│   ├── database.js      # Konfigurasi koneksi SQL
│   ├── server.js        # Entry point backend Express
│   └── .env             # Environment variables (TIDAK DI-PUSH)
│
├── frontend/
│   ├── assets/          # Gambar dan aset statis
│   ├── css/             # File CSS & Tailwind (main.css, component.css)
│   ├── js/              # Logika antarmuka (auth.js, dashboard.js, dll)
│   └── *.html           # Halaman antarmuka (index, properti, tenant, dll)
│   └── properti.html
│   └── tenant.html
│   └── kontrak.html
│   └── pembayaran.html
│
├── .gitignore
└── README.md


**Instalasi dengan Clone Repository** 
git clone https://github.com/dellyfavort/sewa-properti.git
cd sewa-properti

**Menjalankan Backend**
cd backend
npm install
npm start -g nodemon
node server.js

**Menjalankan Frontend**
Buka file HTML pada browser atau jalankan menggunakan web server lokal. (Gunakan ekstension Go Live untuk menjalankan web)


**Pembuat**
Gemini  AI
