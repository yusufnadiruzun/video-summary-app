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
          `SELECT up.packageId, p.Name, p.Price, up.package_status_id, up.Start_Date, up.End_Date, up.selected_package_id
           FROM user_packages up
           LEFT JOIN packages p ON up.packageId = p.id
           WHERE up.user_id = ?`,
          [userId]
        );

        if (!pkg.length) return res.status(404).json({ error: "Paket bulunamadı" });

        const data = pkg[0];
        // Süre dolmuşsa status reset
        if (data.End_Date && new Date(data.End_Date) < new Date()) {
          await db.execute(
            `UPDATE user_packages SET package_status_id=1 WHERE user_id=?`,
            [userId]
          );
          data.package_status_id = 1;
        }
        return res.json(data);

      case "POST":
        const { action } = req.query;
        const { packageId } = req.body; 

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
            endDate.setDate(endDate.getDate() + 30);

            // 1. Mevcut seçili paketi bul
            const [row] = await db.execute(
              "SELECT selected_package_id FROM user_packages WHERE user_id=?",
              [userId]
            );
            const finalId = packageId || row[0]?.selected_package_id;

            // 2. user_packages tablosunu güncelle
            await db.execute(
              `UPDATE user_packages 
               SET packageId=?, package_status_id=2, Start_Date=?, End_Date=? 
               WHERE user_id=?`,
              [finalId, startDate, endDate, userId]
            );

            // 3. YENİ MANTIĞA GÖRE BİLDİRİM BİLGİLERİNİ notifications TABLOSUNA YAZ
            const { deliveryChannel, deliveryId } = req.body;

            if (deliveryChannel && deliveryId) {
              let emailVal = deliveryChannel === "Email" ? deliveryId : null;
              let tgIdVal = deliveryChannel === "Telegram" ? deliveryId : null;

              try {
                // NOTIFICATIONS tablosuna user_id UNIQUE olduğu için ON DUPLICATE KEY kullandık
                await db.execute(
                  `INSERT INTO notifications (user_id, notification_email, telegram_chat_id) 
                   VALUES (?, ?, ?)
                   ON DUPLICATE KEY UPDATE 
                   notification_email = COALESCE(?, notification_email), 
                   telegram_chat_id = COALESCE(?, telegram_chat_id)`,
                  [userId, emailVal, tgIdVal, emailVal, tgIdVal]
                );
                
                console.log(`Bildirim ayarları notifications tablosuna kaydedildi: User ${userId}`);
              } catch (err) {
                console.error("Notifications kayıt hatası:", err);
              }
            }

            return res.json({ message: "Ödeme başarılı ✅", status: 2 });

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