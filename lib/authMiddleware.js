// src/lib/authMiddleware.js
import jwt from 'jsonwebtoken';

/**
 * Next.js API Yolları için kimlik doğrulama işlemini yapar.
 * Başarılı olursa 'req' nesnesine userId, isGuest ve isAdmin (YENİ) ekler.
 * Başarısız olursa HTTP yanıtını (response) gönderir ve 'false' döndürür.
 * * @param {object} req - Next.js Request nesnesi
 * @param {object} res - Next.js Response nesnesi
 * @returns {boolean} Doğrulama başarılıysa true, başarısızsa false.
 */
export const authenticate = (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        res.status(401).json({ error: 'Token yok' });
        return false; // Başarısız
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token eksik' });
        return false; // Başarısız
    }

    try {
        // JWT_SECRET'ın .env.local dosyanızda tanımlandığından emin olun.
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        // req nesnesine kullanıcı bilgilerini ekleme
        req.userId = decoded.userId || null; 
        req.isGuest = decoded.guest ?? false;
        req.isAdmin = decoded.isAdmin ?? false; // 🚨 YENİ: isAdmin bilgisini ekledik
        
        return true; // Başarılı
    } catch (err) {
        res.status(403).json({ error: 'Geçersiz token' });
        return false; // Başarısız
    }
};