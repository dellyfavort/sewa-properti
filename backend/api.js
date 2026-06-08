const express = require('express');
const router = express.Router();
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { authenticate, authorize } = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * ==========================================
 * 0. KONFIGURASI UPLOAD (MULTER)
 * ==========================================
 */

const storagePayments = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/payments/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'PAY-' + Date.now() + path.extname(file.originalname));
    }
});

const storageProperti = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'PROP-' + Date.now() + path.extname(file.originalname));
    }
});

const uploadPayments = multer({ storage: storagePayments });
const uploadProperti = multer({ storage: storageProperti });

/**
 * ==========================================
 * 1. SKEMA VALIDASI (ZOD)
 * ==========================================
 */
const propertiSchema = z.object({
    kode_properti: z.string().min(1),
    nama_properti: z.string().min(1),
    tipe_properti: z.string().min(1),
    alamat: z.string().min(5),
    hargasewa_standar: z.preprocess((val) => parseFloat(val), z.number()),
    status_properti: z.enum(['tersedia', 'tersewa', 'perbaikan']),
});

const paymentSchema = z.object({
    id_kontrak: z.preprocess((val) => parseInt(val), z.number()),
    tanggal_jatuh_tempo: z.string(),
    custom_tagihan: z.preprocess((val) => parseFloat(val), z.number()).optional(),
    jumlah_tagihan: z.preprocess((val) => parseFloat(val), z.number()),
    jumlah_dibayar: z.preprocess((val) => parseFloat(val || 0), z.number()).optional(),
    status_bayar: z.enum(['menunggu', 'terverifikasi', 'ditolak']),
    catatan: z.string().optional().nullable()
});

const kontrakSchema = z.object({
    id_tenant: z.number(),
    id_properti: z.number(),
    tanggal_mulai: z.string(),
    tanggal_selesai: z.string(),
    total_nilai_kontrak: z.number(),
    status_kontrak: z.string().optional()
});

/**
 * ==========================================
 * 2. AUTHENTICATION ROUTES
 * ==========================================
 */

router.post('/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.execute(`
            SELECT u.*, t.nama_lengkap, t.telepon as telepon_tenant, t.alamat_domisili, t.status_verifikasi 
            FROM users u 
            LEFT JOIN tenant t ON u.id_tenant = t.id_tenant 
            WHERE u.email = ?
        `, [email]);
        
        if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
            return res.status(401).json({ success: false, message: 'Email atau Password salah' });
        }

        const user = users[0];
        const token = jwt.sign(
            { id: user.id_user, role: user.role, tenantId: user.id_tenant }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({ 
            success: true, 
            token, 
            role: user.role, 
            tenantId: user.id_tenant,
            data: {
                id_user: user.id_user,
                email: user.email,
                role: user.role,
                id_tenant: user.id_tenant,
                nama_lengkap: user.nama_lengkap || null, 
                telepon: user.telepon_tenant || user.telepon_pengelola || null,
                alamat_domisili: user.alamat_domisili || null,
                status_verifikasi: user.status_verifikasi || null
            }
        });
    } catch (e) { next(e); }
});

router.post('/auth/register', async (req, res, next) => {
    try {
        const { nama_lengkap, email, password, telepon, role, no_ktp } = req.body;

        const [existingUser] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (role === 'tenant') {
            const [existingTenant] = await db.execute('SELECT no_ktp FROM tenant WHERE no_ktp = ?', [no_ktp]);
            if (existingTenant.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'NIK (KTP) ini sudah terdaftar. Gunakan akun yang sudah ada.' 
                });
            }

            const kodeOtomatis = 'TNT-' + Date.now().toString().slice(-6);
            const [tenantResult] = await db.execute(
                'INSERT INTO tenant (kode_tenant, nama_lengkap, no_ktp, telepon, alamat_domisili, status_verifikasi) VALUES (?, ?, ?, ?, ?, ?)',
                [kodeOtomatis, nama_lengkap, no_ktp, telepon, '-', 'pending']
            );
            const idTenantBaru = tenantResult.insertId;

            await db.execute(
                'INSERT INTO users (email, password_hash, role, id_tenant) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, role, idTenantBaru]
            );
        } else if (role === 'manager' || role === 'admin') {
            await db.execute(
                'INSERT INTO users (email, password_hash, role, telepon_pengelola) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, role, telepon]
            );
        } else {
            return res.status(400).json({ success: false, message: 'Role pendaftaran tidak valid.' });
        }

        res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
    } catch (e) { 
        console.error("Error Registrasi:", e);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

/**
 * ==========================================
 * 2.5. PROFILE UPDATE ROUTE
 * ==========================================
 */
router.put('/profile/update', authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?.id_user || req.userId;
        const role = req.user?.role || req.role;
        const tenantId = req.user?.tenantId || req.user?.id_tenant || req.tenantId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Gagal: Sesi token tidak valid atau ID tidak terbaca.' });
        }

        if (role === 'tenant') {
            const { nama_lengkap, telepon, alamat_domisili } = req.body;
            const [rows] = await db.execute('SELECT status_verifikasi FROM tenant WHERE id_tenant = ?', [tenantId]);
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tenant tidak ditemukan.' });
            
            if (rows[0].status_verifikasi === 'verified') {
                return res.status(403).json({ success: false, message: 'Profil Anda sudah terverifikasi dan tidak dapat diubah lagi.' });
            }

            const [result] = await db.execute(
                'UPDATE tenant SET nama_lengkap = ?, telepon = ?, alamat_domisili = ? WHERE id_tenant = ?',
                [nama_lengkap, telepon, alamat_domisili, tenantId]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Gagal menyimpan: Data tenant tidak terupdate di database.' });
            }
            return res.json({ success: true, message: 'Data diri tenant berhasil diperbarui.' });
            
        } else {
            const { telepon_pengelola } = req.body;
            if (!telepon_pengelola) {
                return res.status(400).json({ success: false, message: 'Gagal: Nomor telepon tidak boleh kosong.' });
            }

            const [result] = await db.execute(
                'UPDATE users SET telepon_pengelola = ? WHERE id_user = ?',
                [telepon_pengelola, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Gagal menyimpan: Akun pengelola tidak ditemukan di database.' });
            }
            return res.json({ success: true, message: 'Profil pengelola berhasil diperbarui.' });
        }
    } catch (e) { 
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada database: ' + e.message });
    }
});

/**
 * ==========================================
 * 3. PROPERTI MODULE
 * ==========================================
 */

router.get('/properti', authenticate, async (req, res, next) => {
    try {
        let sql = 'SELECT * FROM properti';
        if (req.user.role === 'tenant') sql += ' WHERE status_properti = "tersedia"';
        const [data] = await db.execute(sql);
        res.json({ success: true, data });
    } catch (e) { next(e); }
});

router.get('/properti-tersedia', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        const [data] = await db.execute(
            'SELECT id_properti, nama_properti, kode_properti, hargasewa_standar FROM properti WHERE status_properti = "tersedia"'
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
});

router.post('/properti', authenticate, authorize('manager', 'admin'), uploadProperti.single('gambar_properti'), async (req, res, next) => {
    try {
        const d = propertiSchema.parse(req.body);
        const fileName = req.file ? req.file.filename : 'default.jpg';

        await db.execute(
            `INSERT INTO properti (kode_properti, nama_properti, tipe_properti, alamat, hargasewa_standar, status_properti, gambar_properti) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [d.kode_properti, d.nama_properti, d.tipe_properti, d.alamat, d.hargasewa_standar, d.status_properti, fileName]
        );
        res.status(201).json({ success: true, message: 'Unit properti berhasil didaftarkan' });
    } catch (e) { next(e); }
});

router.put('/properti/:id', authenticate, authorize('manager', 'admin'), uploadProperti.single('gambar_properti'), async (req, res, next) => {
    try {
        const d = propertiSchema.parse(req.body);
        let fileName;
        if (req.file) {
            fileName = req.file.filename;
        } else {
            const [current] = await db.execute('SELECT gambar_properti FROM properti WHERE id_properti = ?', [req.params.id]);
            fileName = current.length > 0 ? current[0].gambar_properti : 'default.jpg';
        }

        await db.execute(
            `UPDATE properti SET kode_properti=?, nama_properti=?, tipe_properti=?, alamat=?, hargasewa_standar=?, status_properti=?, gambar_properti=? WHERE id_properti=?`,
            [d.kode_properti, d.nama_properti, d.tipe_properti, d.alamat, d.hargasewa_standar, d.status_properti, fileName, req.params.id]
        );
        res.json({ success: true, message: 'Data properti berhasil diperbarui' });
    } catch (e) { next(e); }
});

router.delete('/properti/:id', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        await db.execute('DELETE FROM properti WHERE id_properti = ?', [req.params.id]);
        res.json({ success: true, message: 'Aset properti dihapus secara permanen' });
    } catch (e) { next(e); }
});

/**
 * ==========================================
 * 4. KONTRAK MODULE (UPDATED & SINKRON)
 * ==========================================
 */

router.get('/kontrak', authenticate, async (req, res, next) => {
    try {
        let sql = `
            SELECT k.*, t.nama_lengkap as nama_tenant, p.nama_properti, p.kode_properti, p.gambar_properti, p.hargasewa_standar 
            FROM kontrak k
            JOIN tenant t ON k.id_tenant = t.id_tenant
            JOIN properti p ON k.id_properti = p.id_properti
        `;
        const params = [];
        if (req.user.role === 'tenant') {
            sql += ' WHERE k.id_tenant = ?';
            params.push(req.user.tenantId);
        }
        const [data] = await db.execute(sql, params);
        res.json({ success: true, data });
    } catch (e) { next(e); }
});

router.post('/kontrak', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    const connection = await db.getConnection(); 
    try {
        await connection.beginTransaction();
        const d = kontrakSchema.parse(req.body);
        const { id_ajukan } = req.body; // Ambil id_ajukan dari body

        // 1. Simpan Kontrak
        const [kontrakResult] = await connection.execute(
            `INSERT INTO kontrak (id_properti, id_tenant, tanggal_mulai, tanggal_selesai, total_nilai_kontrak, status_kontrak) 
             VALUES (?, ?, ?, ?, ?, 'aktif')`,
            [d.id_properti, d.id_tenant, d.tanggal_mulai, d.tanggal_selesai, d.total_nilai_kontrak]
        );
        const newKontrakId = kontrakResult.insertId;

        // 2. Buat Tagihan
        await connection.execute(
            `INSERT INTO pembayaran (id_kontrak, tanggal_jatuh_tempo, jumlah_tagihan, jumlah_dibayar, status_bayar) 
             VALUES (?, ?, ?, 0, 'menunggu')`,
            [newKontrakId, d.tanggal_mulai, d.total_nilai_kontrak]
        );

        // 3. Update Properti jadi 'tersewa'
        await connection.execute('UPDATE properti SET status_properti = "tersewa" WHERE id_properti = ?', [d.id_properti]);

        // 4. Update status pengajuan jika ada id_ajukan (otomatis disetujui)
        if (id_ajukan) {
            await connection.execute('UPDATE pengajuan_sewa SET status = "disetujui" WHERE id_ajukan = ?', [id_ajukan]);
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Kontrak diterbitkan & pengajuan disetujui.' });
    } catch (e) {
        await connection.rollback();
        next(e);
    } finally {
        connection.release();
    }
});

router.put('/kontrak/:id', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const id_kontrak = req.params.id;
        const d = kontrakSchema.parse(req.body);
        const status_kontrak = req.body.status_kontrak || 'aktif';

        const [oldContract] = await connection.execute('SELECT id_properti FROM kontrak WHERE id_kontrak = ?', [id_kontrak]);
        if (!oldContract.length) {
            return res.status(404).json({ success: false, message: 'Data kontrak tidak ditemukan.' });
        }
        const oldPropertiId = oldContract[0].id_properti;

        await connection.execute(
            `UPDATE kontrak SET id_properti = ?, id_tenant = ?, tanggal_mulai = ?, tanggal_selesai = ?, total_nilai_kontrak = ?, status_kontrak = ? 
             WHERE id_kontrak = ?`,
            [d.id_properti, d.id_tenant, d.tanggal_mulai, d.tanggal_selesai, d.total_nilai_kontrak, status_kontrak, id_kontrak]
        );

        await connection.execute(
            `UPDATE pembayaran SET jumlah_tagihan = ?, tanggal_jatuh_tempo = ? 
             WHERE id_kontrak = ? AND status_bayar != 'terverifikasi'`,
            [d.total_nilai_kontrak, d.tanggal_mulai, id_kontrak]
        );

        if (parseInt(oldPropertiId) !== parseInt(d.id_properti)) {
            await connection.execute('UPDATE properti SET status_properti = "tersedia" WHERE id_properti = ?', [oldPropertiId]);
            await connection.execute('UPDATE properti SET status_properti = "tersewa" WHERE id_properti = ?', [d.id_properti]);
        }

        if (status_kontrak === 'selesai' || status_kontrak === 'dibatalkan') {
            await connection.execute('UPDATE properti SET status_properti = "tersedia" WHERE id_properti = ?', [d.id_properti]);
            
            if (status_kontrak === 'dibatalkan') {
                await connection.execute(
                    `UPDATE pembayaran SET status_bayar = 'ditolak', catatan = 'Sistem: Kontrak ini telah dibatalkan.' WHERE id_kontrak = ? AND status_bayar != 'terverifikasi'`, 
                    [id_kontrak]
                );
            }
        } else if (status_kontrak === 'aktif') {
            await connection.execute('UPDATE properti SET status_properti = "tersewa" WHERE id_properti = ?', [d.id_properti]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Data kontrak dan tagihan pembayaran berhasil diperbarui secara sinkron' });
    } catch (e) {
        await connection.rollback();
        next(e);
    } finally {
        connection.release();
    }
});

router.delete('/kontrak/:id', authenticate, authorize('manager'), async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const id_kontrak = req.params.id;

        const [kontrak] = await connection.execute('SELECT id_properti FROM kontrak WHERE id_kontrak = ?', [id_kontrak]);
        
        if (kontrak.length > 0) {
            const id_properti = kontrak[0].id_properti;
            await connection.execute('UPDATE properti SET status_properti = "tersedia" WHERE id_properti = ?', [id_properti]);
        }

        await connection.execute('DELETE FROM pembayaran WHERE id_kontrak = ?', [id_kontrak]);
        await connection.execute('DELETE FROM kontrak WHERE id_kontrak = ?', [id_kontrak]);

        await connection.commit();
        res.json({ success: true, message: 'Kontrak sukses dihapus dan unit properti ruko otomatis kembali tersedia' });
    } catch (e) {
        await connection.rollback();
        next(e);
    } finally {
        connection.release();
    }
});

/**
 * ==========================================
 * PENGAJUAN MODULE (BARU)
 * ==========================================
 */
router.put('/pengajuan/update-status/:id', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        const { status } = req.body; // 'disetujui' atau 'ditolak'
        await db.execute('UPDATE pengajuan_sewa SET status = ? WHERE id_ajukan = ?', [status, req.params.id]);
        res.json({ success: true, message: `Status pengajuan berhasil diubah menjadi ${status}` });
    } catch (e) { next(e); }
});

/**
 * ==========================================
 * 5. TENANT MODULE
 * ==========================================
 */
// 🔥 RUTE TENANT DASHBOARD (UPDATED: Logika Multi-Kontrak Cerdas)
router.get('/tenant/dashboard', authenticate, async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;

        const [rows] = await db.execute(`
            SELECT 
                k.id_kontrak, k.tanggal_mulai, k.tanggal_selesai, 
                p.nama_properti as nama, p.kode_properti as kode,
                (SELECT (jumlah_tagihan - jumlah_dibayar) FROM pembayaran WHERE id_kontrak = k.id_kontrak AND status_bayar != 'terverifikasi' ORDER BY id_pembayaran DESC LIMIT 1) as sisa_tagihan,
                (SELECT status_bayar FROM pembayaran WHERE id_kontrak = k.id_kontrak ORDER BY id_pembayaran DESC LIMIT 1) as status_bayar
            FROM kontrak k
            JOIN properti p ON k.id_properti = p.id_properti
            WHERE k.id_tenant = ? AND k.status_kontrak = 'aktif'
        `, [tenantId]);

        const [adminRows] = await db.execute(`
            SELECT telepon_pengelola FROM users WHERE (role = 'admin' OR role = 'manager') AND telepon_pengelola IS NOT NULL ORDER BY role ASC LIMIT 1
        `);
        const adminPhone = adminRows.length > 0 ? adminRows[0].telepon_pengelola : '';

        if (rows.length === 0) {
            return res.json({ 
                success: true, 
                data: { periode_terdekat: "-", sisa_hari_terdekat: 0, tagihan: 0, status_bayar: 'LUNAS', properti: [], admin_phone: adminPhone } 
            });
        }

        let totalTagihan = 0;
        let minSisaHari = null;
        let periodeTerdekat = "-";
        let propertiList = [];
        let statusPrioritas = 'LUNAS';

        const hariIni = new Date();
        const formatTgl = (tglStr) => new Date(tglStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        rows.forEach(row => {
            // Hitung sisa hari per unit
            const tglSelesai = new Date(row.tanggal_selesai);
            const sisa = Math.ceil((tglSelesai - hariIni) / (1000 * 60 * 60 * 24));
            const periodeIni = `${formatTgl(row.tanggal_mulai)} - ${formatTgl(row.tanggal_selesai)}`;

            // Masukkan data spesifik tiap unit ke array
            propertiList.push({ 
                nama: row.nama, 
                kode: row.kode,
                periode: periodeIni,
                sisa_hari: sisa > 0 ? sisa : 0
            });

            if (row.sisa_tagihan > 0) {
                totalTagihan += parseFloat(row.sisa_tagihan);
                statusPrioritas = 'MENUNGGU'; 
            }

            // Cari mana yang paling mendesak (paling sedikit sisa harinya)
            if (minSisaHari === null || sisa < minSisaHari) {
                minSisaHari = sisa;
                periodeTerdekat = periodeIni;
            }
        });

        res.json({
            success: true,
            data: {
                periode_terdekat: periodeTerdekat,
                sisa_hari_terdekat: minSisaHari > 0 ? minSisaHari : 0,
                tagihan: totalTagihan,
                status_bayar: statusPrioritas,
                properti: propertiList, 
                admin_phone: adminPhone 
            }
        });

    } catch (e) { next(e); }
});

router.get('/tenant', authenticate, async (req, res, next) => {
    try {
        let sql = 'SELECT * FROM tenant';
        const params = [];
        if (req.user.role === 'tenant') {
            sql += ' WHERE id_tenant = ?';
            params.push(req.user.tenantId);
        }
        const [data] = await db.execute(sql, params);
        res.json({ success: true, data });
    } catch (e) { next(e); }
});

router.get('/tenant/list', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        const [data] = await db.execute('SELECT id_tenant, nama_lengkap FROM tenant');
        res.json({ success: true, data });
    } catch (e) { next(e); }
});

router.get('/admin-contact', authenticate, async (req, res, next) => {
    try {
        const [admins] = await db.execute(
            'SELECT email, telepon_pengelola FROM users WHERE role = "admin" AND telepon_pengelola IS NOT NULL'
        );
        res.json({ success: true, admins });
    } catch (e) { next(e); }
});

router.put('/tenant/:id', authenticate, async (req, res, next) => {
    try {
        const [rows] = await db.execute('SELECT status_verifikasi FROM tenant WHERE id_tenant = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant tidak ditemukan.' });
        
        const currentStatus = rows[0].status_verifikasi;
        if (req.user.role === 'tenant' && currentStatus === 'verified') {
            return res.status(403).json({ success: false, message: 'Profil sudah terverifikasi dan dikunci.' });
        }

        if (req.user.role === 'tenant' && req.user.tenantId !== parseInt(req.params.id)) {
            return res.status(403).json({ success: false, message: 'Akses ditolak!' });
        }

        const { nama_tenant, no_ktp, telepon, alamat_domisili, status_verifikasi } = req.body;
        let finalStatus = (req.user.role === 'manager' || req.user.role === 'admin') ? status_verifikasi : currentStatus;

        await db.execute(
            'UPDATE tenant SET nama_lengkap = ?, no_ktp = ?, telepon = ?, alamat_domisili = ?, status_verifikasi = ? WHERE id_tenant = ?',
            [nama_tenant, no_ktp, telepon, alamat_domisili, finalStatus, req.params.id]
        );
        res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } catch (e) { next(e); }
});

router.delete('/tenant/:id', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        await db.execute('DELETE FROM tenant WHERE id_tenant = ?', [req.params.id]);
        res.json({ success: true, message: 'Data penyewa dihapus.' });
    } catch (e) { next(e); }
});

/**
 * ==========================================
 * 6. PEMBAYARAN MODULE
 * ==========================================
 */

router.get('/pembayaran', authenticate, async (req, res, next) => {
    try {
        let query = `
            SELECT p.*, prop.nama_properti, prop.kode_properti
            FROM pembayaran p
            JOIN kontrak k ON p.id_kontrak = k.id_kontrak
            JOIN properti prop ON k.id_properti = prop.id_properti
        `;
        let params = [];

        if (req.user.role === 'tenant') {
            query += " WHERE k.id_tenant = ?";
            params.push(req.user.tenantId);
        }
        
        query += " ORDER BY p.tanggal_jatuh_tempo DESC";

        const [rows] = await db.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (e) { next(e); }
});

router.post('/pembayaran/upload-bukti/:id', authenticate, authorize('tenant'), uploadPayments.single('bukti_transfer'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'File bukti transfer wajib diunggah.' });

        const [check] = await db.execute(
            `SELECT p.id_pembayaran FROM pembayaran p 
             JOIN kontrak k ON p.id_kontrak = k.id_kontrak 
             WHERE p.id_pembayaran = ? AND k.id_tenant = ?`,
            [req.params.id, req.user.tenantId]
        );

        if (!check.length) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

        await db.execute(
            'UPDATE pembayaran SET bukti_bayar = ?, status_bayar = "menunggu", tanggal_bayar = NOW() WHERE id_pembayaran = ?',
            [req.file.filename, req.params.id]
        );

        res.json({ success: true, message: 'Bukti transfer berhasil dikirim. Menunggu verifikasi.' });
    } catch (e) { next(e); }
});

router.put('/pembayaran/:id', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        const { jumlah_dibayar, status_bayar, catatan } = req.body;
        await db.execute(
            'UPDATE pembayaran SET jumlah_dibayar = ?, status_bayar = ?, catatan = ?, tanggal_bayar = NOW() WHERE id_pembayaran = ?',
            [jumlah_dibayar, status_bayar, catatan, req.params.id]
        );
        res.json({ success: true, message: 'Data pembayaran berhasil divalidasi/direvisi.' });
    } catch (e) { next(e); }
});

/**
 * ==========================================
 * 7. USERS MODULE
 * ==========================================
 */

router.get('/users', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        const [data] = await db.execute('SELECT id_user, email, role, id_tenant, telepon_pengelola, created_at FROM users');
        res.json({ success: true, data });
    } catch (e) { next(e); }
});

router.delete('/users/:id', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        await db.execute('DELETE FROM users WHERE id_user = ?', [req.params.id]);
        res.json({ success: true, message: 'Akun berhasil dihapus' });
    } catch (e) { next(e); }
});

/**
 * ==========================================
 * 8. DASHBOARD ANALITIK MODULE
 * ==========================================
 */

router.get('/dashboard/stats', authenticate, authorize('manager', 'admin'), async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let dateFilterPayment = "";
        let dateFilterContract = "";
        const paramsPayment = [];
        const paramsContract = [];

        if (start && end) {
            dateFilterPayment = " AND tanggal_jatuh_tempo BETWEEN ? AND ?";
            dateFilterContract = " AND tanggal_mulai BETWEEN ? AND ?";
            paramsPayment.push(start, end);
            paramsContract.push(start, end);
        }

        const [rawOkupansi] = await db.execute(`
            SELECT p.status_properti, COUNT(DISTINCT p.id_properti) as jumlah 
            FROM properti p
            LEFT JOIN kontrak k ON p.id_properti = k.id_properti ${dateFilterContract}
            GROUP BY p.status_properti
        `, paramsContract);
        
        let totalUnit = 0;
        let totalTersewa = 0;
        const labelsOkupansi = [];
        const dataOkupansi = [];
        
        rawOkupansi.forEach(row => {
            totalUnit += row.jumlah;
            if (row.status_properti === 'tersewa') totalTersewa += row.jumlah;
            labelsOkupansi.push(row.status_properti.charAt(0).toUpperCase() + row.status_properti.slice(1));
            dataOkupansi.push(row.jumlah);
        });

        const paramsTunggakan = start && end ? [start, end] : [];
        const [tunggakanTotal] = await db.execute(`
            SELECT SUM(jumlah_tagihan - jumlah_dibayar) as total_tunggakan, COUNT(*) as total_nota
            FROM pembayaran
            WHERE status_bayar IN ('menunggu', 'ditolak') AND tanggal_jatuh_tempo < NOW()
            ${dateFilterPayment}
        `, paramsTunggakan);

        const [kontrakHabis] = await db.execute(`
            SELECT COUNT(*) as jumlah_tenant
            FROM kontrak 
            WHERE status_kontrak = 'aktif' 
            ${dateFilterContract}
        `, paramsContract);

        const [rawKeuangan] = await db.execute(`
            SELECT 
                DATE_FORMAT(tanggal_jatuh_tempo, '%Y-%m') as bulan,
                SUM(jumlah_dibayar) as dibayar,
                SUM(CASE WHEN status_bayar IN ('menunggu', 'ditolak') THEN (jumlah_tagihan - jumlah_dibayar) ELSE 0 END) as tunggakan
            FROM pembayaran
            WHERE 1=1 ${dateFilterPayment}
            GROUP BY bulan
            ORDER BY bulan ASC
            LIMIT 6
        `, paramsPayment);

        const labelsKeuangan = [];
        const dataDibayar = [];
        const dataTunggakan = [];
        rawKeuangan.forEach(row => {
            labelsKeuangan.push(row.bulan);
            dataDibayar.push(row.dibayar || 0);
            dataTunggakan.push(row.tunggakan || 0);
        });

        const [rawTrenKontrak] = await db.execute(`
            SELECT 
                DATE_FORMAT(tanggal_mulai, '%Y-%m-%d') as tanggal,
                COUNT(*) as jumlah_kontrak
            FROM kontrak
            WHERE 1=1 ${dateFilterContract}
            GROUP BY tanggal
            ORDER BY tanggal ASC
            LIMIT 10
        `, paramsContract);

        const labelsTrenKontrak = [];
        const dataTrenKontrak = [];
        rawTrenKontrak.forEach(row => {
            labelsTrenKontrak.push(row.tanggal);
            dataTrenKontrak.push(row.jumlah_kontrak);
        });

        res.json({
            success: true,
            data: {
                kpi: {
                    okupansi_persen: totalUnit > 0 ? Math.round((totalTersewa / totalUnit) * 100) : 0,
                    okupansi_teks: `${totalTersewa} dari ${totalUnit} Unit Terisi`,
                    tunggakan_rp: tunggakanTotal[0].total_tunggakan || 0,
                    tunggakan_nota: tunggakanTotal[0].total_nota || 0,
                    kontrak_kritis: kontrakHabis[0].jumlah_tenant || 0
                },
                okupansi: {
                    labels: labelsOkupansi,
                    jumlah: dataOkupansi
                },
                keuangan: {
                    labels: labelsKeuangan,
                    dibayar: dataDibayar,
                    tunggakan: dataTunggakan
                },
                kontrak: {
                    labels: labelsTrenKontrak,
                    jumlahKontrak: dataTrenKontrak
                }
            }
        });

    } catch (e) {
        next(e);
    }
}); 

module.exports = router;