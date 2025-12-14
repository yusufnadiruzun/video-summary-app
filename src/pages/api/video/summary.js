// src/pages/api/video/summary.js

// Kütüphane bağımlılıkları
import db from "../../../../lib/Db"; 
import { authenticate } from "../../../../lib/authMiddleware"; 
// Express'ten bağımsız iş mantığı fonksiyonları
import { getTranscriptSafe } from "../../../../lib/services/getTranscript"; 
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript"; 

// Guest günlük limit sabitini burada tanımlayın
const GUEST_DAILY_LIMIT = 4;

export default async function handler(req, res) {
  // Sadece POST isteğini kabul et
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. Kimlik Doğrulama (authMiddleware karşılığı)
  const isAuthenticated = authenticate(req, res);
  console.log("Authentication result (Next.js API):", isAuthenticated, req.userId, req.isGuest);
  if (!isAuthenticated) {
    return; // Yanıt zaten gönderildi
  }
  
  const userId = req.userId;
  const isGuest = req.isGuest;
  const { videoId, summaryType, channelId, title, language, durationSeconds } = req.body;

  try {
    console.log("Summary request received (Next.js API):", req.body);

    // 2. Kullanıcı/paket bilgisi al
    const [rows] = await db.query("SELECT * FROM user_packages WHERE user_id = ?", [userId]);

    if (!rows.length) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    let user = rows[0];
    const today = new Date();

    // ------------------- 📌 Paket Durum Kontrol (Aynı Kod) -------------------
    // Eğer paketin bitiş tarihi geçmişse -> guest moda düşür ve kayıtla
    if (user.End_Date && new Date(user.End_Date) < today) {
      console.log(`User package expired. Converting to guest mode.`);
      await db.execute(
        `UPDATE user_packages SET package_type='guest', Package_Status=0 WHERE user_id=?`,
        [userId]
      );
      user.package_type = "guest";
      user.Package_Status = 0;
    }

    if (user.Start_Date && new Date(user.Start_Date) > today) {
      return res.status(403).json({ error: "Paketiniz henüz başlamamış görünüyor." });
    }

    if (user.Package_Status === 0 && !isGuest) {
      return res.status(403).json({ error: "Paketiniz aktif değil. Lütfen yenileyin." });
    }

    // ------------------- 👤 Guest Limit Kontrol (Aynı Kod) -------------------
    if (isGuest) {
      console.log(`Guest usage: ${user.daily_used}/${GUEST_DAILY_LIMIT}`);

      if (user.daily_used >= GUEST_DAILY_LIMIT) {
        return res.status(403).json({ error: "Daily usage limit reached. Please upgrade to continue." });
      }
    }

    // -------------------- ▶ Transcript Fetch & Summary (Aynı Kod) --------------------
    let transcript = await getTranscriptSafe(videoId, user.package_type);

    if (user.package_type === "guest" && transcript === undefined) {
      return res.status(403).json({ error: "Bu video altyazısız. Paket yükseltmelisiniz." });
    }

    if (isGuest && transcript === undefined) transcript = "";

    const summaryText = await summarizeTranscript(transcript, summaryType, req.body.keywords);

    // -------------------- 📊 Günlük sayaç güncellemesi (Aynı Kod) --------------------
    await db.execute(`
      UPDATE user_packages SET
        daily_used = CASE
          WHEN last_reset = CURDATE() THEN daily_used + 1
          ELSE 1
        END,
        last_reset = CURDATE()
      WHERE user_id = ?
    `, [userId]);

    // -------------------- 📁 Kullanım & abonelik kaydı (Aynı Kod) --------------------
    await db.execute(
      `INSERT INTO summaries (user_id, video_id, channel_id, title, language, summary, duration_seconds, used_transcription)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, videoId, channelId || null, title || null, language || null, summaryText, durationSeconds || 0, transcript ? 1 : 0]
    );

    if (channelId) {
      const [subRows] = await db.query(
        "SELECT * FROM subscriptions WHERE user_id = ? AND channel_id = ?",
        [userId, channelId]
      );

      if (!subRows.length) {
        await db.execute(
          `INSERT INTO subscriptions (user_id, channel_id, notify_email, notify_telegram, notify_whatsapp)
            VALUES (?, ?, 0, 0, 0)`,
          [userId, channelId]
        );
      }
    }

    return res.json({ summary: summaryText });

  } catch (err) {
    console.error("Summary Error (Next.js API):", err);
    return res.status(500).json({ error: "Özet oluşturulamadı" });
  }
}