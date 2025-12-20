import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";
import { getLatestVideo } from "../../../../lib/services/youtubeService";

export default async function handler(req, res) {
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;

  const userId = req.userId;

  if (req.method === "POST") {
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ success: false, msg: "Kanal ID gerekli." });
    }

    try {
      // 1. Kullanıcın paket limitini kontrol et (Kaç kanal ekleyebilir?)
      const [userPkg] = await db.execute(
        `SELECT selected_package_id FROM user_packages WHERE user_id = ?`,
        [userId]
      );

      const [currentSubs] = await db.execute(
        `SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ? AND channel_id != 'default_channel'`,
        [userId]
      );

      // Basit limit kontrolü (Örn: Starter: 1, Pro: 5, Premium: Sınırsız)
      const packageId = userPkg[0]?.selected_package_id;
      const subCount = currentSubs[0].count;

      if (packageId === 2 && subCount >= 1)
        return res
          .status(403)
          .json({ msg: "Starter paketi limitine ulaştınız (1 Kanal)." });
      if (packageId === 3 && subCount >= 5)
        return res
          .status(403)
          .json({ msg: "Pro paketi limitine ulaştınız (5 Kanal)." });

      // 2. Kanalın şu anki en son videosunu YouTube'dan çek (Sistemi tetiklemek için
      // 3. Kullanıcının ana bildirim ayarlarını al (Telegram/Email)
      // Yeni kanal kaydederken bildirimlerin nereye gideceğini bilmemiz lazım.
      const [mainSettings] = await db.execute(
        `SELECT notification_email, telegram_chat_id FROM subscriptions 
                 WHERE user_id = ? AND channel_id = 'default_channel' LIMIT 1`,
        [userId]
      );
      console.log("Kullanıcı ana bildirim ayarları:", mainSettings);
      // 4. Veritabanına yeni aboneliği ekle
      await db.execute(
        `INSERT INTO subscriptions (user_id, channel_id) 
     VALUES (?, ?)`,
        [
          userId,
          channelId,
           // getLatestVideo'dan gelen ID
        ]
      );

      return res
        .status(200)
        .json({ success: true, msg: "Kanal başarıyla takibe alındı." });
    } catch (error) {
      console.error("Kanal Ekleme Hatası:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ success: false, msg: "Bu kanal zaten takibinizde." });
      }
      return res.status(500).json({ success: false, msg: "Kanal eklenemedi." });
    }
  }

  // Kanal Silme (DELETE)
  if (req.method === "DELETE") {
    const { id } = req.query; // subscription_id
    try {
      await db.execute(
        `DELETE FROM subscriptions WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      return res
        .status(200)
        .json({ success: true, msg: "Kanal takibi bırakıldı." });
    } catch (error) {
      return res.status(500).json({ success: false, msg: "Silme hatası." });
    }
  }
}
