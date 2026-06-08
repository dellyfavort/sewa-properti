// models.js - Database Models (Fixed Version)
const db = require('./database');

// ─────────────────────────────────────────
// PROPERTI MODEL
// ─────────────────────────────────────────
const Properti = {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM properti ORDER BY id_properti DESC');
    return rows;
  },
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM properti WHERE id_properti = ?', [id]);
    return rows[0];
  },
  async create(data) {
    const { kode_properti, nama_properti, tipe_properti, alamat, hargasewa_standar, status_properti } = data;
    const [result] = await db.execute(
      `INSERT INTO properti (kode_properti, nama_properti, tipe_properti, alamat, hargasewa_standar, status_properti) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [kode_properti || null, nama_properti, tipe_properti, alamat, hargasewa_standar || 0, status_properti || 'tersedia']
    );
    return this.findById(result.insertId);
  },
  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Properti tidak ditemukan");
    
    const updated = { ...existing, ...data };
    await db.execute(
      `UPDATE properti SET kode_properti=?, nama_properti=?, tipe_properti=?, alamat=?, hargasewa_standar=?, status_properti=? 
       WHERE id_properti=?`,
      [updated.kode_properti, updated.nama_properti, updated.tipe_properti, updated.alamat, updated.hargasewa_standar, updated.status_properti, id]
    );
    return this.findById(id);
  },
  async delete(id) {
    await db.execute('DELETE FROM properti WHERE id_properti = ?', [id]);
    return true;
  }
};

// ─────────────────────────────────────────
// TENANT MODEL ✅ FIXED
// ─────────────────────────────────────────
const Tenant = {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM tenant ORDER BY id_tenant DESC');
    return rows;
  },
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM tenant WHERE id_tenant = ?', [id]);
    return rows[0];
  },
  async create(data) {
    const { kode_tenant, nama_lengkap, no_ktp, telepon, alamat_domisili, status_verifikasi } = data;
    const [result] = await db.execute(
      `INSERT INTO tenant (kode_tenant, nama_lengkap, no_ktp, telepon, alamat_domisili, status_verifikasi) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [kode_tenant, nama_lengkap, no_ktp, telepon, alamat_domisili, status_verifikasi || 'pending']
    );
    return this.findById(result.insertId);
  },
  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Tenant tidak ditemukan");
    
    const updated = { ...existing, ...data };
    // ✅ FIXED: UPDATE tenant, BUKAN properti!
    await db.execute(
      `UPDATE tenant SET 
         kode_tenant=?, nama_lengkap=?, no_ktp=?, telepon=?, 
         alamat_domisili=?, status_verifikasi=? 
       WHERE id_tenant=?`,
      [updated.kode_tenant, updated.nama_lengkap, updated.no_ktp, updated.telepon, updated.alamat_domisili, updated.status_verifikasi, id]
    );
    return this.findById(id);
  },
  async delete(id) {
    await db.execute('DELETE FROM tenant WHERE id_tenant = ?', [id]);
    return true;
  }
};

// ─────────────────────────────────────────
// KONTRAK MODEL (Support Transaction)
// ─────────────────────────────────────────
const Kontrak = {
  async findAll() {
    const [rows] = await db.execute(`
      SELECT k.*, p.nama_properti, t.nama_lengkap as nama_tenant
      FROM kontrak k
      LEFT JOIN properti p ON k.id_properti = p.id_properti
      LEFT JOIN tenant t ON k.id_tenant = t.id_tenant
      ORDER BY k.id_kontrak DESC
    `);
    return rows;
  },
  async findById(id) {
    const [rows] = await db.execute(`
      SELECT k.*, p.nama_properti, t.nama_lengkap as nama_tenant
      FROM kontrak k
      LEFT JOIN properti p ON k.id_properti = p.id_properti
      LEFT JOIN tenant t ON k.id_tenant = t.id_tenant
      WHERE k.id_kontrak = ?
    `, [id]);
    return rows[0];
  },
  // ✅ Support optional connection parameter untuk transaction
  async create(data, connection) {
    const { id_properti, id_tenant, tanggal_mulai, tanggal_selesai, harga_kontrak, status_kontrak } = data;
    const query = connection || db; // Pakai connection jika ada (untuk transaction)
    
    const [result] = await query.execute(
      `INSERT INTO kontrak (id_properti, id_tenant, tanggal_mulai, tanggal_selesai, harga_kontrak, status_kontrak) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_properti, id_tenant, tanggal_mulai, tanggal_selesai, harga_kontrak, status_kontrak || 'aktif']
    );
    return result.insertId; // Return ID saja
  },
  async update(id, data) {
    const { id_properti, id_tenant, tanggal_mulai, tanggal_selesai, harga_kontrak, status_kontrak } = data;
    await db.execute(
      `UPDATE kontrak SET id_properti=?, id_tenant=?, tanggal_mulai=?, tanggal_selesai=?, harga_kontrak=?, status_kontrak=? 
       WHERE id_kontrak=?`,
      [id_properti, id_tenant, tanggal_mulai, tanggal_selesai, harga_kontrak, status_kontrak, id]
    );
    return this.findById(id);
  },
  async delete(id) {
    await db.execute('DELETE FROM kontrak WHERE id_kontrak = ?', [id]);
    return true;
  },
  async getExpiringContracts(days = 30) {
    const [rows] = await db.execute(`
      SELECT k.*, p.nama_properti, t.nama_lengkap as nama_tenant,
             DATEDIFF(k.tanggal_selesai, CURDATE()) as hari_lagi
      FROM kontrak k
      LEFT JOIN properti p ON k.id_properti = p.id_properti
      LEFT JOIN tenant t ON k.id_tenant = t.id_tenant
      WHERE k.status_kontrak = 'aktif'
        AND k.tanggal_selesai BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY k.tanggal_selesai ASC
    `, [days]);
    return rows;
  }
};

// ─────────────────────────────────────────
// PEMBAYARAN MODEL
// ─────────────────────────────────────────
const Pembayaran = {
  async findAll() {
    const [rows] = await db.execute(`
      SELECT pb.*, k.harga_kontrak, t.nama_lengkap as nama_tenant, p.nama_properti
      FROM pembayaran pb
      LEFT JOIN kontrak k ON pb.id_kontrak = k.id_kontrak
      LEFT JOIN tenant t ON k.id_tenant = t.id_tenant
      LEFT JOIN properti p ON k.id_properti = p.id_properti
      ORDER BY pb.id_pembayaran DESC
    `);
    return rows;
  },
  async findById(id) {
    const [rows] = await db.execute(`
      SELECT pb.*, k.harga_kontrak, t.nama_lengkap as nama_tenant, p.nama_properti
      FROM pembayaran pb
      LEFT JOIN kontrak k ON pb.id_kontrak = k.id_kontrak
      LEFT JOIN tenant t ON k.id_tenant = t.id_tenant
      LEFT JOIN properti p ON k.id_properti = p.id_properti
      WHERE pb.id_pembayaran = ?
    `, [id]);
    return rows[0];
  },
  async create(data) {
    const { id_kontrak, tanggal_bayar, tanggal_jatuh_tempo, jumlah_tagihan, jumlah_dibayar, status_bayar } = data;
    const [result] = await db.execute(
      `INSERT INTO pembayaran (id_kontrak, tanggal_bayar, tanggal_jatuh_tempo, jumlah_tagihan, jumlah_dibayar, status_bayar) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_kontrak, tanggal_bayar || null, tanggal_jatuh_tempo, jumlah_tagihan, jumlah_dibayar || 0, status_bayar || 'belum_bayar']
    );
    return this.findById(result.insertId);
  },
  async update(id, data) {
    const { id_kontrak, tanggal_bayar, tanggal_jatuh_tempo, jumlah_tagihan, jumlah_dibayar, status_bayar } = data;
    await db.execute(
      `UPDATE pembayaran SET id_kontrak=?, tanggal_bayar=?, tanggal_jatuh_tempo=?, jumlah_tagihan=?, jumlah_dibayar=?, status_bayar=? 
       WHERE id_pembayaran=?`,
      [id_kontrak, tanggal_bayar, tanggal_jatuh_tempo, jumlah_tagihan, jumlah_dibayar, status_bayar, id]
    );
    return this.findById(id);
  },
  async delete(id) {
    await db.execute('DELETE FROM pembayaran WHERE id_pembayaran = ?', [id]);
    return true;
  },
  async getTotalTunggakan() {
    const [rows] = await db.execute(`
      SELECT COUNT(*) as jumlah_transaksi,
             SUM(jumlah_tagihan - jumlah_dibayar) as total_tunggakan
      FROM pembayaran
      WHERE status_bayar != 'lunas' AND tanggal_jatuh_tempo < CURDATE()
    `);
    return rows[0];
  }
};

module.exports = { Properti, Tenant, Kontrak, Pembayaran };