import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;

  const userId = req.userId;
  const { email, telegram } = req.body;

  try {
    // Paket bilgisini çek (1: Free, 2: Starter, 3: Pro, 4: Premium varsayımıyla)
    const [uPkg] = await db.execute(
      "SELECT packageId FROM user_packages WHERE user_id = ?",
      [userId]
    );

    const currentPkgId = uPkg[0]?.packageId || 1;

    // YENİ MANTIK: Sadece Pro (3) ve Premium (4) paketleri Telegram güncelleyebilir.
    // Eğer paket 3'ten küçükse (Free/Starter) ve telegram verisi gönderilmişse engelle.
    if (currentPkgId < 3 && telegram !== undefined && telegram !== null && telegram !== "") {
      return res.status(403).json({ 
        success: false, 
        msg: "Telegram alerts are only available for Pro and Premium plans." 
      });
    }

    // Upsert işlemi
    // Eğer paket yetersizse telegram_chat_id'ye dokunma veya null set et (güvenlik için)
    const finalTelegram = currentPkgId >= 3 ? telegram : null;

    await db.execute(
      `INSERT INTO notifications (user_id, notification_email, telegram_chat_id) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       notification_email = VALUES(notification_email), 
       telegram_chat_id = VALUES(telegram_chat_id)`,
      [userId, email, finalTelegram || null]
    );

    return res.status(200).json({ success: true, msg: "Updated successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Database error." });
  }
}