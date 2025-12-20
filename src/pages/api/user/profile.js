import db from "../../../../lib/Db"; 
import { authenticate } from "../../../../lib/authMiddleware";

export default async function handler(req, res) {
  // 1. Kimlik Doğrulama
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;
  
  const userId = req.userId;

  if (req.method !== "GET") return res.status(405).json({ msg: "Method not allowed" });

  try {
    // 2. Kullanıcı Temel Bilgilerini Çek (users tablosu)
    const [userBase] = await db.execute(
      `SELECT email, name, avatar FROM users WHERE id = ?`,
      [userId]
    );

    if (userBase.length === 0) {
      return res.status(404).json({ success: false, msg: "Kullanıcı bulunamadı" });
    }

    // 3. Paket Bilgilerini Çek (user_packages tablosu)
    const [packages] = await db.execute(
      `SELECT selected_package_id, Start_Date, End_Date, daily_limit, daily_used 
       FROM user_packages WHERE user_id = ?`,
      [userId]
    );

    // 4. İletişim Bilgilerini Çek (YENİ notifications TABLOSUNDAN)
    const [notifSettings] = await db.execute(
      `SELECT notification_email, telegram_chat_id, whatsapp_phone 
       FROM notifications WHERE user_id = ?`,
      [userId]
    );

    // 5. Takip Edilen Kanalları Çek (subscriptions tablosu)
    const [subscriptions] = await db.execute(
      `SELECT id, channel_id FROM subscriptions WHERE user_id = ?`,
      [userId]
    );

    // 6. Özet Geçmişini Çek (summaries tablosu)
    const [history] = await db.execute(
      `SELECT id, video_id, channel_id, title, created_at 
       FROM summaries 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    const userPkg = packages[0] || {};
    const userNotif = notifSettings[0] || {};
    
    // Paket İsmi Belirleme Logic'i
    let packageName = "Free";
    if (userPkg.selected_package_id === 2) packageName = "Starter";
    if (userPkg.selected_package_id === 3) packageName = "Pro";
    if (userPkg.selected_package_id === 4) packageName = "Premium";

    res.status(200).json({
      success: true,
      data: {
        name: userBase[0].name,
        email: userBase[0].email,
        avatar: userBase[0].avatar,
        package: packageName,
        usage: {
            limit: userPkg.daily_limit || 3,
            used: userPkg.daily_used || 0
        },
        startDate: userPkg.Start_Date ? new Date(userPkg.Start_Date).toLocaleDateString('tr-TR') : null,
        endDate: userPkg.End_Date ? new Date(userPkg.End_Date).toLocaleDateString('tr-TR') : "Süresiz",
        
        // Bildirim bilgileri artık merkezi notifications tablosundan geliyor
        notifications: {
            email: userNotif.notification_email || userBase[0].email,
            telegram: userNotif.telegram_chat_id || "Bağlı Değil",
            whatsapp: userNotif.whatsapp_phone || "Bağlı Değil"
        },

        // Takip edilen gerçek kanallar (artık filter yapmana gerek kalmadı çünkü 'default'lar temizlendi)
        activeChannels: subscriptions
          .filter(s => s.channel_id && !['default', 'default_channel'].includes(s.channel_id))
          .map(s => ({
            id: s.id,
            channelId: s.channel_id
          })),

        history: history.map(h => ({
            id: h.id,
            title: h.title || "İsimsiz Video",
            channel: h.channel_id,
            date: new Date(h.created_at).toLocaleDateString('tr-TR'),
            videoId: h.video_id
        }))
      }
    });

  } catch (error) {
    console.error("Profile API Error:", error);
    res.status(500).json({ success: false, msg: "Sunucu hatası", error: error.message });
  }
}