import db from "../../../../lib/Db"; 
import { authenticate } from "../../../../lib/authMiddleware"; 
import { getTranscriptSafe } from "../../../../lib/services/getTranscript"; 
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return; 
  
  const userId = req.userId;
  let { videoId, summaryType, channelId, title, language, durationSeconds } = req.body;

  try {
    // --- YENİ: VİDEO BİLGİLERİNİ OTOMATİK ÇEKME (EĞER EKSİKSE) ---
    if (!title || !channelId || channelId === "Unknown Channel") {
      try {
        const metaRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const metaData = await metaRes.json();
        if (metaData.title) {
          title = metaData.title;
          channelId = metaData.author_name; // Kanal ismini author_name'den alıyoruz
        }
      } catch (e) {
        console.error("Meta fetch error:", e);
      }
    }

    // 2. Paket Bilgisini Al
    const [rows] = await db.query(
      "SELECT packageId, daily_limit, daily_used FROM user_packages WHERE user_id = ?", [userId]
    );
    const userPkg = rows[0];
    const pkgId = Number(userPkg?.packageId || 1);

    // 3. Transkript Al
    let transcript = await getTranscriptSafe(videoId, pkgId);

    if (transcript === 'TRANSCRIPT_NOT_AVAILABLE_FOR_FREE') {
      return res.status(403).json({ error: "Upgrade to Pro/Premium for this video's transcription." });
    }

    // 4. Özet Oluştur
    const summaryText = await summarizeTranscript(transcript, summaryType, req.body.keywords);

    // 5. Sayaç Güncelle
    await db.execute(`UPDATE user_packages SET daily_used = daily_used + 1, last_reset = CURDATE() WHERE user_id = ?`, [userId]);

    // 6. Özet Geçmişini Kaydet (BURASI DÜZELDİ)
    const finalTitle = title || `Video ${videoId}`;
    const finalChannel = channelId || "YouTube Channel";

    await db.execute(
      `INSERT INTO summaries (user_id, video_id, channel_id, title, language, summary, duration_seconds, used_transcription)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, videoId, finalChannel, finalTitle, language || 'en', summaryText, durationSeconds || 0, 1]
    );

    return res.json({ summary: summaryText, title: finalTitle });

  } catch (err) {
    console.error("Summary API Error:", err);
    return res.status(500).json({ error: "Error processing summary." });
  }
}