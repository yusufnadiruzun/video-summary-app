import jwt from 'jsonwebtoken';
import db from "../../../lib/Db";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, verificationToken, userId } = req.body;

  try {
    // 1. Token geçerli mi? (Süresi dolmuşsa burası hata fırlatır)
    const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);

    // 2. Kullanıcının girdiği kod, token içindekiyle aynı mı?
    if (decoded.code !== code) {
      return res.status(400).json({ success: false, msg: "Hatalı kod girdiniz." });
    }

    // 3. Kod doğru! Şimdi bildirim mailini veritabanına işle
    // (Burada sadece bildirim mailini güncelliyoruz)
    await db.execute(
      `INSERT INTO notifications (user_id, notification_email) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE notification_email = VALUES(notification_email)`,
      [userId, decoded.email]
    );

    return res.status(200).json({ success: true, msg: "Email doğrulandı!" });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Kodun süresi dolmuş veya geçersiz." });
  }
}