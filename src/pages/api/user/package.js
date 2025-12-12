// src/pages/api/user/package.js
import db from "../../../../lib/Db"; // Doğru yolu kontrol edin
import { authenticate } from "../../../../lib/authMiddleware"; // authMiddleware'den dönüştürdüğümüz fonksiyon

export default async function handler(req, res) {
  // 1. Kimlik Doğrulama (Middleware)
  // Express'teki 'authMiddleware' karşılığı:
  const isAuthenticated = authenticate(req, res);
  
  // Eğer doğrulama başarısızsa (authenticate false döndüyse ve yanıtı gönderdiyse), işlemi durdur.
  if (!isAuthenticated) {
    return;
  }
  
  // Kimlik doğrulandıktan sonra, req.userId kullanılabilir.
  const userId = req.userId; 

  try {
    switch (req.method) {
      
      // -------------------------------------------------------------------------
      // 📌 GET /api/user/package
      // -------------------------------------------------------------------------
      case 'GET':
        const [pkg] = await db.execute(
          `SELECT p.package_type, p.Name, p.Price, up.Package_Status, up.Start_Date, up.End_Date
            FROM user_packages up
            JOIN packages p ON up.package_type = p.package_type
            WHERE up.user_id = ?`,
          [userId]
        );

        if (!pkg.length) return res.status(404).json({ error: "Paket bulunamadı" });

        const data = pkg[0];

        // Süre dolmuşsa status reset
        if (data.End_Date && new Date(data.End_Date) < new Date()) {
          await db.execute(`UPDATE user_packages SET Package_Status=1 WHERE user_id=?`, [userId]);
          data.Package_Status = 1;
        }

        return res.json(data);
        
      // -------------------------------------------------------------------------
      // 📌 POST - Paket seçimi ve Ödeme akışı (URL'ye göre ayrım)
      // -------------------------------------------------------------------------
      case 'POST':
        // URL yolunu kontrol ediyoruz. Örn: /api/user/package?action=select
        const { action } = req.query; 
        const { packageId, package_id } = req.body;

        switch (action) {
          
          // POST /api/user/package?action=select
          case 'select':
            await db.execute(
              `UPDATE user_packages SET package_type=?, Package_Status=1 WHERE user_id=?`,
              [packageId, userId]
            );
            return res.json({ message: "Paket seçildi, ödeme bekleniyor", status: 1 });

          // POST /api/user/package?action=pay-success
          case 'pay-success':
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            const [pkgSuccess] = await db.execute(
              "SELECT * FROM user_packages WHERE user_id=?",
              [userId]
            );

            // ❗ KAYIT YOKSA → İLK KEZ SATIN ALIYOR
            if(pkgSuccess.length === 0){
              await db.execute(
                `INSERT INTO user_packages (user_id, package_type, Start_Date, End_Date, Package_Status)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, package_id, startDate, endDate, 2] // 2 = Payment Success
              );

              return res.json({msg:"İlk paket kaydı oluşturuldu", startDate, endDate});
            }

            // ✔ KAYIT VARSA → PAKET YENİLENİYOR
            await db.execute(
              `UPDATE user_packages SET package_type=?, Start_Date=?, End_Date=?, Package_Status=? WHERE user_id=?`,
              [package_id, startDate, endDate, 2, userId]
            );

            return res.json({msg:"Paket yenilendi", startDate, endDate});

          // POST /api/user/package?action=pay-failed
          case 'pay-failed':
            await db.execute(
              `UPDATE user_packages SET package_type=?, Package_Status=3 WHERE user_id=?`,
              [packageId, userId]
            );
            return res.json({ message:"Ödeme başarısız ❌", status:3 });
            
          default:
            return res.status(404).json({ error: "Geçersiz paket işlemi rotası." });
        }
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error("Paket API hatası:", e);
    return res.status(500).json({ error: "Sunucu hatası. İşlem tamamlanamadı." });
  }
}