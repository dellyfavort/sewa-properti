// server.js - Entry Point Aplikasi (Versi Updated & Anti-Crash)
const express = require('express');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();

const apiRoutes = require('./api');
const db = require('./database');

// 1. Import route pengajuan yang baru dibuat
const pengajuanRoutes = require('./routes/pengajuan');

const app = express();

// ── MIDDLEWARE (WAJIB PALING ATAS) ─────────
app.use(cors());
app.use(express.json()); // Membaca body request format JSON
app.use(express.urlencoded({ extended: true }));

/**
 * ── SERVE STATIC FILES ──────────────────────
 * Bagian ini sangat penting agar folder 'uploads' bisa diakses browser.
 * Contoh: http://localhost:3000/uploads/payments/nama-file.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MOUNT API ROUTES ───────────────────────
// 2. Pasang jalurnya DI SINI (setelah middleware body parser)
app.use('/api/pengajuan', pengajuanRoutes);
app.use('/api', apiRoutes);

// Root endpoint (Halaman Utama)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sewa Properti API',
    version: '1.0.0',
    docs: 'Gunakan /api/properti, /api/kontrak, /api/pembayaran'
  });
});

// ── PENCEGAH SPAM TERMINAL ─────────────────
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ── GLOBAL ERROR HANDLER ───────────────────

// 1. Handler untuk Route yang tidak ditemukan (404)
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} dengan method ${req.method} tidak ditemukan`);
  error.statusCode = 404;
  next(error);
};

// 2. Centralized Error Handler (Anti-Crash)
const errorHandler = (err, req, res, next) => {
  // Log error lengkap ke terminal VS Code kamu untuk debug
  console.error(' [SERVER ERROR LOG]:', err);

  // --- A. Handling Error Validasi (Zod atau sejenisnya) ---
  const issues = err.issues || err.errors; 
  
  if (err.name === 'ZodError' || issues) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal',
      errors: Array.isArray(issues) ? issues.map(e => ({
        field: e.path?.join('.') || e.field || 'input',
        message: e.message
      })) : [{ field: 'general', message: err.message }]
    });
  }

  // --- B. Handling Error Database (Duplicate, Foreign Key, dll) ---
  if (err.code) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada database',
      error: process.env.NODE_ENV === 'development' ? err.sqlMessage || err.message : 'DB_ERROR'
    });
  }

  // --- C. Generic Error ---
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

app.use(notFound);
app.use(errorHandler);

// ── START SERVER ────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server API berjalan di http://localhost:${PORT}`);
  console.log(`Folder static 'uploads' telah aktif.`);
  console.log(`Pastikan folder 'uploads/payments' sudah kamu buat secara manual.`);
});

module.exports = app;