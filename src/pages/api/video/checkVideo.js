import db from "../../../../lib/Db";
import { getRecentVideos } from "../../../../lib/services/youtubeService";
import { getTranscript } from "../../../../lib/services/getTranscript";
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript";
import { sendMessage } from "../../../../lib/services/SendMessage";

const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
  // 1. Güvenlik ve Metot Kontrolleri
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (req.query.secret !== CRON_SECRET) {
    return res.status(401).json({ error: "Yetkisiz erişim." });
  }

  console.log("-> Video Kontrol Görevi Başladı.");

  try {
    // 2. Abonelikleri ve Aktif Paket Bilgilerini Çek
    const [subscriptions] = await db.execute(`
      SELECT 
        s.id as subscription_id, 
        s.user_id, 
        s.channel_id, 
        s.last_video_id, 
        n.telegram_chat_id, 
        up.packageId 
      FROM subscriptions s
      LEFT JOIN notifications n ON s.user_id = n.user_id
      LEFT JOIN user_packages up ON s.user_id = up.user_id AND up.package_status_id = 2
      WHERE s.channel_id != 'default_channel'
    `);

    if (subscriptions.length === 0) {
      return res.status(200).json({ message: "Kontrol edilecek aktif abonelik yok." });
    }

    console.log(`Toplam ${subscriptions.length} abonelik taranıyor...`);
    let updatedCount = 0;

    // 3. Her bir abonelik için döngü
    for (const sub of subscriptions) {
      try {
        // Yeni servisi çağır (Dizi döner)
        const latestVideos = await getRecentVideos(sub.channel_id, 1);

        // Video bulunamadıysa veya hata döndüyse (boş dizi) bu kullanıcıyı atla
        if (!latestVideos || latestVideos.length === 0) {
          console.log(`[USER ${sub.user_id}] Video bulunamadı veya kota dolu: ${sub.channel_id}`);
          continue;
        }

        const latestVideo = latestVideos[0];

        // 4. Yeni Video Kontrolü
        if (latestVideo.id !== sub.last_video_id) {
          console.log(`[YENİ VİDEO TESPİTİ] User: ${sub.user_id} - Video: ${latestVideo.title}`);

          // Transkript ve Özetleme İşlemi
          const packageType = sub.packageId || 'guest';
          const transcriptText = await getTranscript(latestVideo.id, packageType);
          
          if (!transcriptText) {
            console.warn(`[USER ${sub.user_id}] Transkript alınamadı, bildirim iptal.`);
            continue;
          }

          const summary = await summarizeTranscript(transcriptText);

          // 5. Bildirim Gönderme (Telegram)
          if (sub.telegram_chat_id) {
            await sendMessage(
              latestVideo,
              latestVideo.id,
              summary,
              sub.telegram_chat_id
            );
          }

          // 6. Veritabanını Güncelle (Anlık güncelleme en güvenlisidir)
          await db.execute(
            `UPDATE subscriptions SET last_video_id = ? WHERE id = ?`,
            [latestVideo.id, sub.subscription_id]
          );
          
          updatedCount++;
        }
      } catch (loopError) {
        // Döngü içi hata: Bir kullanıcıdaki hata diğerlerini durdurmaz
        console.error(`[USER ${sub.user_id}] İşlem sırasında hata:`, loopError.message);
      }
    }

    return res.status(200).json({
      message: "Kontrol tamamlandı.",
      updatedCount: updatedCount
    });

  } catch (error) {
    console.error("Kritik Sistem Hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
}