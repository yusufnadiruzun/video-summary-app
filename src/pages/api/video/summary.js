// pages/api/summarize.js
import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1. Kimlik Doğrulama
  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;

  const userId = req.userId;
  let {
    videoId,
    summaryType,
    channelId,
    title,
    language,
    durationSeconds,
    keywords
  } = req.body;

  try {
    // 2. Kullanıcı Paket ve Limit Bilgileri
    const [rows] = await db.query(
      "SELECT packageId, daily_limit, daily_used FROM user_packages WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User package record not found." });
    }

    const userPkg = rows[0];
    const pkgId = Number(userPkg.packageId);
    const dailyLimit = Number(userPkg.daily_limit);
    const dailyUsed = Number(userPkg.daily_used);

    // 3. Günlük Limit Kontrolü
    if (dailyLimit !== -1 && dailyUsed >= dailyLimit) {
      return res.status(429).json({
        error: "Daily limit reached.",
        message: `You have used all ${dailyLimit} summaries for today. Please upgrade for more.`,
      });
    }

    // 4. Video Meta Bilgilerini Otomatik Çek (eksikse)
    if (!title || !channelId || channelId === "Unknown Channel") {
      try {
        const metaRes = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
        );
        const metaData = await metaRes.json();

        if (metaData.title) {
          title = metaData.title;
          channelId = metaData.author_name;
        }
      } catch (e) {
        console.error("Meta fetch error (Non-blocking):", e);
      }
    }

    // 🔥 5. ARTIK TRANSKRİPT YOK
    // Direkt YouTube linki ile özetleme
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const summaryText = await summarizeTranscript(
      youtubeUrl,
      summaryType,
      keywords
    );

    // 6. Kullanım Sayacını Güncelle
    await db.execute(
      `UPDATE user_packages 
       SET daily_used = daily_used + 1,
           last_reset = CURDATE()
       WHERE user_id = ?`,
      [userId]
    );

    // 7. Özet Geçmişini Kaydet
    const finalTitle = title || `Video ${videoId}`;
    const finalChannel = channelId || "YouTube Channel";

    await db.execute(
      `INSERT INTO summaries 
       (user_id, video_id, channel_id, title, language, summary, duration_seconds, used_transcription)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        videoId,
        finalChannel,
        finalTitle,
        language || "en",
        summaryText,
        durationSeconds || 0,
        0 // ❗️used_transcription artık FALSE
      ]
    );

    // 8. Başarılı Yanıt
    return res.json({
      summary: summaryText,
      title: finalTitle,
      remaining: dailyLimit !== -1
        ? dailyLimit - (dailyUsed + 1)
        : "Unlimited",
    });

  } catch (err) {
    console.error("Summary API Error:", err);
    return res.status(500).json({
      error: "An error occurred while processing the summary.",
    });
  }
}
