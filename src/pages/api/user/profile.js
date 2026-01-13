import db from "../../../../lib/Db"; 
import { authenticate } from "../../../../lib/authMiddleware";

export default async function handler(req, res) {
  
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;
  
  const userId = req.userId;
  if (req.method !== "GET") return res.status(405).json({ msg: "Method not allowed" });

  try {
    // 1. Kullanıcı Temel Bilgileri
    const [userBase] = await db.execute(`SELECT email, name, avatar FROM users WHERE id = ?`, [userId]);
    if (userBase.length === 0) return res.status(404).json({ success: false, msg: "User not found" });

    // 2. Paket Bilgileri (package_id kullanıldı)
    const [packages] = await db.execute(
      `SELECT packageId, Start_Date, End_Date, daily_limit, daily_used 
       FROM user_packages WHERE user_id = ?`, [userId]
    );

    // 3. İletişim (notifications tablosu)
    const [notifSettings] = await db.execute(
      `SELECT notification_email, telegram_chat_id FROM notifications WHERE user_id = ?`, [userId]
    );

    // 4. Takip Edilen Kanallar
    const [subscriptions] = await db.execute(
      `SELECT id, channel_id FROM subscriptions WHERE user_id = ?`, [userId]
    );

    // 5. Özet Geçmişi
    const [history] = await db.execute(
  `SELECT id, video_id, channel_id, title, summary, created_at FROM summaries 
   WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [userId]
);

    const userPkg = packages[0] || {};
    const userNotif = notifSettings[0] || {};
    
    // Paket İsmi Logic (Kalıcı package_id üzerinden)
    const pkgId = Number(userPkg.packageId);
    const packageMap = { 1: "Free", 2: "Starter", 3: "Pro", 4: "Premium" };
    const packageName = packageMap[pkgId] || "Free";

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
        startDate: userPkg.Start_Date ? new Date(userPkg.Start_Date).toLocaleDateString('en-US') : null,
        endDate: (userPkg.End_Date && userPkg.End_Date !== "Süresiz") ? new Date(userPkg.End_Date).toLocaleDateString('en-US') : "Unlimited",
        notifications: {
            email: userNotif.notification_email || userBase[0].email,
            telegram: userNotif.telegram_chat_id || ""
        },
        activeChannels: subscriptions
          .filter(s => s.channel_id && !['default', 'default_channel', ''].includes(s.channel_id))
          .map(s => ({ id: s.id, channelId: s.channel_id })),
        // ... (Diğer kısımlar aynı)
history: history.map(h => ({
    id: h.id,
    title: h.title || `Video ${h.video_id}`,
    channel: h.channel_id,
    videoId: h.video_id,
    summary: h.summary, // BU ALAN MODAL İÇİN ŞART
    date: new Date(h.created_at).toLocaleDateString('en-US')
}))// ...
      }
    });
  } catch (error) {
    console.error("Profile API Error:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
}