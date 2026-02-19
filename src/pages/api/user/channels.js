import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";
import { checkChannelExists } from "../../../../lib/services/youtubeService";

export default async function handler(req, res) {
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;

  const userId = req.userId;

  if (req.method === "POST") {
    const { channelId: userInput } = req.body;

    if (!userInput) {
      return res
        .status(400)
        .json({ success: false, msg: "Kanal bilgisi gerekli." });
    }

    try {
      // 1. YouTube Kontrolü - Gerçek adı ve ID'yi alıyoruz
      const youtubeCheck = await checkChannelExists(userInput);

      if (!youtubeCheck.exists) {
        return res.status(404).json({
          success: false,
          msg: "Böyle bir kanal bulunamadı.",
        });
      }

      // 2. Paket ve Limit Kontrolü
      const [userPkg] = await db.execute(
        `SELECT packageId FROM user_packages WHERE user_id = ?`,
        [userId],
      );
      const [currentSubs] = await db.execute(
        `SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?`,
        [userId],
      );

      const packageId = userPkg[0]?.packageId || 1;
      const subCount = currentSubs[0].count;

      let limit = 0;
      let packageName = "Free";
      if (packageId === 2) {
        limit = 1;
        packageName = "Starter";
      } else if (packageId === 3) {
        limit = 5;
        packageName = "Pro";
      } else if (packageId === 4) {
        limit = 100;
        packageName = "Premium";
      }

      if (packageId !== 4 && subCount >= limit) {
        return res.status(403).json({
          success: false,
          msg: `Limit doldu. ${packageName} paketi için sınır ${limit}.`,
        });
      }

      // 3. KAYIT AŞAMASI
      // Not: Eğer tablanda 'channel_name' kolonu yoksa sadece youtubeCheck.title'ı
      // channel_id yerine de yazabilirsin ama tavsiyem teknik ID'yi saklamandır.
      // Burada 'channel_id' yerine doğrudan görünen adı kaydediyoruz:
      await db.execute(
        `INSERT INTO subscriptions (user_id, channel_id) VALUES (?, ?)`,
        [userId, `@${youtubeCheck.title.replace(/\s+/g, "")}`],
      );

      return res.status(200).json({
        success: true,
        msg: `${youtubeCheck.title} eklendi.`,
      });
    } catch (error) {
      console.error(error);
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ success: false, msg: "Bu kanal zaten ekli." });
      }
      return res.status(500).json({ success: false, msg: "Hata oluştu." });
    }
  }

  // DELETE kısmı aynı kalabilir...
  // --- KANAL SİLME (DELETE) ---
  if (req.method === "DELETE") {
    const { id } = req.query; // URL'den gelen ?id=... değerini alır

    if (!id) {
      return res
        .status(400)
        .json({ success: false, msg: "Silinecek ID bulunamadı." });
    }

    try {
      const [result] = await db.execute(
        `DELETE FROM subscriptions WHERE id = ? AND user_id = ?`,
        [id, userId],
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, msg: "Kanal bulunamadı veya yetkiniz yok." });
      }

      return res
        .status(200)
        .json({ success: true, msg: "Kanal başarıyla silindi." });
    } catch (error) {
      console.error("Silme Hatası:", error);
      return res
        .status(500)
        .json({ success: false, msg: "Silme işlemi başarısız." });
    }
  }
}
