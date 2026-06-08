const jwt = require('jsonwebtoken');

// 1. Cek keberadaan SECRET (Fail-Fast)
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET tidak terdefinisi di .env");
    process.exit(1);
}

// 2. Fungsi Authenticate (HANYA BOLEH ADA SATU)
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded; 
        next(); 
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
    }
};

// 3. Fungsi Authorize
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Akses ditolak untuk role ${req.user?.role || 'Guest'}` 
            });
        }
        next();
    };
};

// 4. Export (Pastikan ini di baris paling bawah)
// UPDATE: Menambahkan 'verifyToken' sebagai alias dari 'authenticate' agar terhubung dengan pengajuan.js
module.exports = { 
    authenticate, 
    authorize, 
    verifyToken: authenticate 
};