const getMilikSaya = async (req, res, next) => {
    try {
        // Gunakan nama yang sesuai dengan Payload JWT di api.js
        const idTenantLogin = req.user.tenantId; 

        // Proteksi: Jika bukan tenant, jangan jalankan query ini
        if (req.user.role !== 'tenant') {
            return res.status(403).json({ 
                success: false, 
                message: "Halaman ini khusus untuk akses Tenant." 
            });
        }

        const [tagihan] = await db.query(
            `SELECT p.*, k.kode_kontrak 
             FROM pembayaran p 
             JOIN kontrak k ON p.id_kontrak = k.id_kontrak 
             WHERE k.id_tenant = ?`, 
            [idTenantLogin]
        );

        res.status(200).json({ success: true, data: tagihan });
    } catch (error) {
        next(error);
    }
};