// pages/api/user/package.js (veya ilgili API dosyan)
import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";

export default async function handler(req, res) {
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;
  const userId = req.userId;

  try {
    switch (req.method) {
      case "GET":
        const [pkg] = await db.execute(
          `SELECT * FROM user_packages where user_id = ?`,
          [userId]
        );

        if (!pkg.length) return res.status(404).json({ error: "Paket bulunamadı" });

        const data = pkg[0];
        // Süre dolmuşsa status reset (Paketi Free'ye yani ID 1'e çekiyoruz)
        if (data.End_Date && new Date(data.End_Date) < new Date()) {
          await db.execute(
            `UPDATE user_packages SET packageId=1, package_status_id=1, daily_limit=1 WHERE user_id=?`,
            [userId]
          );
          data.package_status_id = 1;
          data.packageId = 1;
          data.daily_limit = 1;
        }
        return res.json(data);

      case "POST":
        const { action } = req.query;
        const { packageId, deliveryChannel, deliveryId } = req.body; 

        switch (action) {
          case "select":
            await db.execute(
              `UPDATE user_packages SET selected_package_id=?, package_status_id=1 WHERE user_id=?`,
              [packageId, userId]
            );
            return res.json({ message: "Paket seçildi", status: 1 });

          case "pay-success":
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // 30 günlük abonelik

            // 1. Mevcut seçili paketi veya gelen paket ID'sini belirle
            const [row] = await db.execute(
              "SELECT selected_package_id FROM user_packages WHERE user_id=?",
              [userId]
            );
            const finalId = Number(packageId || row[0]?.selected_package_id);

            // 2. Paket Limitini Belirle (Senin planlarına göre)
            // Plan 1: Free (Limit 1)
            // Plan 2, 3, 4: Starter, Pro, Premium (Sınırsız yani -1)
            let dailyLimit = 1; 
            if (finalId >= 2) {
              dailyLimit = -1; // Unlimited summaries
            }

            // 3. user_packages tablosunu güncelle (Limit ve Kullanım dahil)
            await db.execute(
              `UPDATE user_packages 
               SET packageId=?, 
                   package_status_id=2, 
                   Start_Date=?, 
                   End_Date=?, 
                   daily_limit=?, 
                   daily_used=0 
               WHERE user_id=?`,
              [finalId, startDate, endDate, dailyLimit, userId]
            );

            // 4. BİLDİRİM BİLGİLERİNİ notifications TABLOSUNA YAZ
            if (deliveryChannel && deliveryId) {
              let emailVal = deliveryChannel === "Email" ? deliveryId : null;
              let tgIdVal = deliveryChannel === "Telegram" ? deliveryId : null;

              try {
                await db.execute(
                  `INSERT INTO notifications (user_id, notification_email, telegram_chat_id) 
                   VALUES (?, ?, ?)
                   ON DUPLICATE KEY UPDATE 
                   notification_email = COALESCE(?, notification_email), 
                   telegram_chat_id = COALESCE(?, telegram_chat_id)`,
                  [userId, emailVal, tgIdVal, emailVal, tgIdVal]
                );
                console.log(`Bildirim ayarları kaydedildi: User ${userId}`);
              } catch (err) {
                console.error("Notifications kayıt hatası:", err);
              }
            }

            return res.json({ message: "Ödeme başarılı ✅", status: 2, dailyLimit });

          case "pay-failed":
            await db.execute(
              `UPDATE user_packages SET package_status_id=3 WHERE user_id=?`,
              [userId]
            );
            return res.json({ message: "Ödeme başarısız ❌", status: 3 });

          default:
            return res.status(404).json({ error: "Geçersiz işlem." });
        }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error("Paket/Abonelik API Hatası:", e);
    return res.status(500).json({ error: "Sunucu hatası." });
  }
}