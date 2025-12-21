import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";
import { getLatestVideo } from "../../../../lib/services/youtubeService";

export default async function handler(req, res) {
  // 1. Kimlik Doğrulama
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;

  const userId = req.userId;

  // --- KANAL EKLEME (POST) ---
  if (req.method === "POST") {
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ success: false, msg: "Kanal ID gerekli." });
    }

    try {
      // A. Kullanıcının paket bilgisini çek
      const [userPkg] = await db.execute(
        `SELECT selected_package_id FROM user_packages WHERE user_id = ?`,
        [userId]
      );

      // B. Mevcut aktif kanal sayısını say (default_channel'ları hariç tutuyoruz)
      const [currentSubs] = await db.execute(
        `SELECT COUNT(*) as count FROM subscriptions 
         WHERE user_id = ? AND channel_id NOT IN ('default', 'default_channel')`,
        [userId]
      );

      const packageId = userPkg[0]?.selected_package_id || 1; // Default 1 (Free)
      const subCount = currentSubs[0].count;

      // C. KESİN LİMİT KONTROLÜ
      // Paket ID'leri: 1: Free (0 kanal), 2: Starter (1 kanal), 3: Pro (5 kanal), 4: Premium (Sınırsız/100)
      let limit = 0;
      if (packageId === 2) limit = 1;
      else if (packageId === 3) limit = 5;
      else if (packageId === 4) limit = 100; // Premium için yüksek bir sınır

      if (subCount >= limit && packageId !== 4) {
        return res.status(403).json({ 
          success: false, 
          msg: `Paket limitine ulaştınız. ${packageId === 2 ? 'Starter (1)' : 'Pro (5)'} kanal hakkınız doldu.` 
        });
      }

    
      await db.execute(
        `INSERT INTO subscriptions (user_id, channel_id) VALUES (?, ?)`,
        [userId, channelId]
      );

      return res.status(200).json({ 
        success: true, 
        msg: "Kanal başarıyla takibe alındı." 
      });

    } catch (error) {
      console.error("Kanal Ekleme Hatası:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ success: false, msg: "Bu kanal zaten listenizde bulunuyor." });
      }
      return res.status(500).json({ success: false, msg: "Sunucu hatası: Kanal eklenemedi." });
    }
  }

  // --- KANAL SİLME (DELETE) ---
  if (req.method === "DELETE") {
    const { id } = req.query; // URL'den gelen subscription id

    if (!id) {
      return res.status(400).json({ success: false, msg: "Silinecek abonelik ID'si gerekli." });
    }

    try {
      const [result] = await db.execute(
        `DELETE FROM subscriptions WHERE id = ? AND user_id = ?`,
        [id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, msg: "Kanal bulunamadı veya yetkiniz yok." });
      }

      return res.status(200).json({ success: true, msg: "Kanal takibi başarıyla bırakıldı." });
    } catch (error) {
      console.error("Kanal Silme Hatası:", error);
      return res.status(500).json({ success: false, msg: "Silme işlemi sırasında hata oluştu." });
    }
  }

  // Yanlış metod isteği
  return res.status(405).json({ msg: "Metod izin verilmedi." });
}