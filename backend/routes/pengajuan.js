const express = require('express');
const router = express.Router();
const db = require('../database'); 
const { authenticate } = require('../middleware/auth'); 
const { z } = require('zod'); 

const pengajuanSchema = z.object({
    id_properti: z.number().int().positive("ID Properti tidak valid")
});

// Endpoint untuk mengajukan sewa (Tenant)
router.post('/buat', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'tenant') {
            return res.status(403).json({ success: false, message: 'Hanya tenant yang bisa mengajukan sewa.' });
        }

        const validData = pengajuanSchema.parse(req.body);
        const id_properti = validData.id_properti;
        const id_tenant = req.user.tenantId; 

        const [properti] = await db.execute('SELECT status_properti FROM properti WHERE id_properti = ?', [id_properti]);
        
        if (properti.length === 0) {
            return res.status(404).json({ success: false, message: 'Properti tidak ditemukan.' });
        }
        if (properti[0].status_properti !== 'tersedia') {
            return res.status(400).json({ success: false, message: 'Maaf, properti ini sudah disewa atau tidak tersedia.' });
        }

        const queryInsert = `INSERT INTO pengajuan_sewa (id_properti, id_tenant, status) VALUES (?, ?, 'menunggu')`;
        await db.execute(queryInsert, [id_properti, id_tenant]);

        res.status(201).json({
            success: true,
            message: 'Pengajuan sewa berhasil dikirim dan menunggu persetujuan Admin.'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        next(error); 
    }
});

// Endpoint untuk Admin melihat daftar pengajuan (menunggu)
router.get('/daftar', authenticate, async (req, res, next) => {
    try {
        if (req.user.role === 'tenant') {
            return res.status(403).json({ success: false, message: 'Akses ditolak.' });
        }

        const query = `
            SELECT p.id_ajukan, p.status, p.id_tenant, p.id_properti, 
                   t.nama_lengkap as nama_tenant, pr.nama_properti
            FROM pengajuan_sewa p
            JOIN tenant t ON p.id_tenant = t.id_tenant
            JOIN properti pr ON p.id_properti = pr.id_properti
            WHERE p.status = 'menunggu'
        `;
        const [data] = await db.execute(query);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// Endpoint untuk Admin melihat SEMUA pengajuan (termasuk status)
router.get('/semua', authenticate, async (req, res, next) => {
    try {
        if (req.user.role === 'tenant') {
            return res.status(403).json({ success: false, message: 'Akses ditolak.' });
        }

        const query = `
            SELECT p.id_ajukan, p.status, p.id_tenant, p.id_properti, 
                   t.nama_lengkap as nama_tenant, pr.nama_properti
            FROM pengajuan_sewa p
            JOIN tenant t ON p.id_tenant = t.id_tenant
            JOIN properti pr ON p.id_properti = pr.id_properti
            ORDER BY p.id_ajukan DESC
        `;
        const [data] = await db.execute(query);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// Endpoint untuk mengambil detail spesifik untuk autofill kontrak
router.get('/detail', authenticate, async (req, res, next) => {
    try {
        const { id } = req.query; // ID dari id_ajukan
        if (!id) return res.status(400).json({ success: false, message: 'ID pengajuan tidak disertakan' });

        const sql = `
            SELECT p.*, t.nama_lengkap as nama_tenant, pr.nama_properti, pr.hargasewa_standar
            FROM pengajuan_sewa p 
            JOIN tenant t ON p.id_tenant = t.id_tenant 
            JOIN properti pr ON p.id_properti = pr.id_properti 
            WHERE p.id_ajukan = ?
        `;
        const [results] = await db.execute(sql, [id]);
        
        if (results.length > 0) {
            res.json({ success: true, data: results[0] });
        } else {
            res.status(404).json({ success: false, message: "Data tidak ditemukan" });
        }
    } catch (error) {
        next(error);
    }
});

// Endpoint untuk Tenant melihat status pengajuan mereka sendiri
router.get('/status-saya', authenticate, async (req, res, next) => {
    try {
        const id_tenant = req.user.tenantId; 

        const query = `
            SELECT p.status, pr.nama_properti 
            FROM pengajuan_sewa p 
            JOIN properti pr ON p.id_properti = pr.id_properti 
            WHERE p.id_tenant = ? 
            ORDER BY p.id_ajukan DESC LIMIT 1
        `;
        
        const [rows] = await db.execute(query, [id_tenant]);

        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.json({ success: false, message: "Belum ada pengajuan" });
        }
    } catch (error) {
        next(error);
    }
});

// Tambahkan route ini untuk update status (Tolak/Setujui manual)
router.put('/update-status/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'disetujui' atau 'ditolak'

        // Validasi status
        if (!['disetujui', 'ditolak'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status tidak valid' });
        }

        const query = `UPDATE pengajuan_sewa SET status = ? WHERE id_ajukan = ?`;
        await db.execute(query, [status, id]);

        res.json({ success: true, message: `Pengajuan berhasil ${status}` });
    } catch (error) {
        next(error);
    }
});

module.exports = router;