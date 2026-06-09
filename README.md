# Sistem Pengelolaan Sewa dan Kontrak Properti

Aplikasi web full-stack untuk mengelola penyewaan properti, data tenant, kontrak sewa, dan pembayaran secara terintegrasi. Sistem ini membantu pemilik atau pengelola properti dalam melakukan administrasi penyewaan dengan lebih efisien, terstruktur, dan terdokumentasi.

## Fitur Utama

### 1. Role-Based Access Control (RBAC)

* Otentikasi dan otorisasi pengguna menggunakan JSON Web Token (JWT).
* Pembatasan akses berdasarkan peran pengguna, seperti Admin, Manajer, dan Tenant.

### 2. Manajemen Properti

* Menambah, mengubah, dan menghapus data properti.
* Upload gambar properti.
* Pemantauan status ketersediaan unit.

### 3. Manajemen Tenant dan Kontrak

* Pengelolaan data penyewa.
* Pembuatan dan pemantauan kontrak sewa.
* Pelacakan masa berlaku kontrak.

### 4. Pengelolaan Tagihan dan Pembayaran

* Pembuatan tagihan sewa.
* Upload bukti pembayaran.
* Monitoring status pembayaran tenant.

### 5. Validasi dan Keamanan Data

* Validasi data pada sisi backend.
* Proteksi endpoint menggunakan middleware autentikasi.

---

## Teknologi yang Digunakan

### Frontend

* HTML5
* CSS3
* Tailwind CSS
* Vanilla JavaScript
* Fetch API

### Backend

* Node.js
* Express.js
* MySQL
* JSON Web Token (JWT)

---

## Struktur Direktori

```text
sewa-properti/
├── backend/
│   ├── controller/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── api.js
│   ├── database.js
│   ├── models.js
│   └── server.js
│
├── frontend/
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── properti.html
│   ├── tenant.html
│   ├── kontrak.html
│   └── pembayaran.html
│
├── prompt/
│   └── Dokumentasi-Prompt-AI.pdf
│
├── sewa_properti.sql
├── .gitignore
└── README.md
```

---

## Instalasi

### Clone Repository

```bash
git clone https://github.com/dellyfavort/sewa-properti.git
cd sewa-properti
```

### Menjalankan Backend

```bash
cd backend
npm install
node server.js
```

Jika menggunakan Nodemon:

```bash
npm install -g nodemon
nodemon server.js
```

### Menjalankan Frontend

Buka folder `frontend` menggunakan Visual Studio Code, kemudian jalankan menggunakan ekstensi **Live Server** atau **Go Live**.

---

## Konfigurasi Environment

Buat file `.env` pada folder backend:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sewa_properti

JWT_SECRET=your_secret_key
```

> File `.env` tidak disertakan dalam repository GitHub untuk menjaga keamanan kredensial aplikasi.

---


