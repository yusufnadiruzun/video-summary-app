import db from "../../../../lib/Db";
import { getRecentVideos } from "../../../../lib/services/youtubeService";
import { getTranscript } from "../../../../lib/services/getTranscript";
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript";
import { sendMessage } from "../../../../lib/services/SendMessage";

const CRON_SECRET = process.env.CRON_SECRET;

function isShortsVideo(duration) {
  if (!duration) return false;
  return !duration.includes('M') && !duration.includes('H');
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (req.query.secret !== CRON_SECRET) return res.status(401).json({ error: "Yetkisiz" });

  console.log("-> Video Kontrol Görevi Başladı.");

  try {
    const [subscriptions] = await db.execute(`
      SELECT s.id as subscription_id, s.user_id, s.channel_id, s.last_video_id, n.telegram_chat_id, up.packageId 
      FROM subscriptions s
      LEFT JOIN notifications n ON s.user_id = n.user_id
      LEFT JOIN user_packages up ON s.user_id = up.user_id AND up.package_status_id = 2
      WHERE s.channel_id != 'default_channel'
    `);

    if (subscriptions.length === 0) return res.status(200).json({ message: "Aktif abonelik yok." });

    let updatedCount = 0;

    for (const sub of subscriptions) {
      try {
        const latestVideos = await getRecentVideos(sub.channel_id, 1);
        if (!latestVideos || latestVideos.length === 0) continue;

        const latestVideo = latestVideos[0];

        // 1. Yeni video mu kontrolü
        if (latestVideo.id !== sub.last_video_id) {
          
          // 2. Canlı Yayın veya Shorts Filtresi
          if (latestVideo.isLive || isShortsVideo(latestVideo.duration)) {
            console.log(`[ATLANDI] Canlı/Shorts: ${latestVideo.title}`);
            await db.execute(`UPDATE subscriptions SET last_video_id = ? WHERE id = ?`, [latestVideo.id, sub.subscription_id]);
            continue;
          }

          // 3. Transkript Çekme
          const packageType = sub.packageId || 'guest';
          const transcriptText = await getTranscript(latestVideo.id, packageType);
          
          const isInvalid = !transcriptText || 
                            transcriptText.length < 150 || 
                            transcriptText.toLowerCase().includes("not available") ||
                            transcriptText.toLowerCase().includes("hata");

          if (isInvalid) {
            console.warn(`[ATLANDI] Transkript yok: ${latestVideo.title}`);
            await db.execute(`UPDATE subscriptions SET last_video_id = ? WHERE id = ?`, [latestVideo.id, sub.subscription_id]);
            continue;
          }

          // 4. Özetleme
          const summary = await summarizeTranscript(transcriptText);
          const isErrorSummary = !summary || summary.includes("Transkripti vermediniz") || summary.length < 20;

          if (!isErrorSummary) {
            // --- EKLEME: Özet Geçmişine Kaydet (Summaries Tablosu) ---
            await db.execute(
              `INSERT INTO summaries (user_id, video_id, channel_id, title, language, summary, duration_seconds, used_transcription)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sub.user_id,
                latestVideo.id,
                latestVideo.channelTitle || sub.channel_id,
                latestVideo.title,
                'tr', // veya videonun dili
                summary,
                0, // video süresi saniye cinsinden elinizde varsa buraya yazabilirsiniz
                1
              ]
            );

            // --- EKLEME: Kullanım Kotasını Güncelle ---
            await db.execute(
              `UPDATE user_packages SET daily_used = daily_used + 1, last_reset = CURDATE() WHERE user_id = ?`,
              [sub.user_id]
            );

            // 5. Telegram Bildirimi
            if (sub.telegram_chat_id) {
              await sendMessage(latestVideo, latestVideo.id, summary, sub.telegram_chat_id);
            }
          }

          // 6. DB Güncelleme (Abonelik takibi için)
          await db.execute(`UPDATE subscriptions SET last_video_id = ? WHERE id = ?`, [latestVideo.id, sub.subscription_id]);
          updatedCount++;
        }
      } catch (loopError) {
        console.error(`[USER ${sub.user_id}] Hata:`, loopError.message);
      }
    }

    return res.status(200).json({ message: "Kontrol tamamlandı.", updatedCount });

  } catch (error) {
    console.error("Kritik Hata:", error);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}