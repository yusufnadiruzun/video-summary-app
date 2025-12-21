// src/pages/api/checkVideo.js (CRON Job tarafından çağrılan ana API rotası)

import db from "../../../../lib/Db"; // Veritabanı bağlantısı
import { getLatestVideo } from "../../../../lib/services/youtubeService"; // YouTube Servisi (Önceki adımda tanımlandı)
import { getTranscriptSafe } from "../../../../lib/services/getTranscript"; // Transkript Servisi (Mevcut olmalı)
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript"; // Özet Servisi (Mevcut olmalı)
import { sendMessage } from "../../../../lib/services/SendMessage"; // Telegram Servisi (Güncellendi)
// Çevresel Değişkenler
const CRON_SECRET = process.env.CRON_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error("YOUTUBE_API_KEY çevresel değişkeni eksik!");
}

//---------------------------------------------------------------------------------
// 📌 ANA HANDLER
//---------------------------------------------------------------------------------

export default async function handler(req, res) {
  // ... (Metot ve Güvenlik Kontrolleri aynı) ...
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (req.query.secret !== CRON_SECRET) {
    return res
      .status(401)
      .json({ error: "Yetkisiz erişim. Geçerli secret key gerekiyor." });
  }

  console.log("-> Yeni Video Çoklu Kontrol Görevi Başladı.");

  try {
    // 2. Tablo yapılarınıza %100 uyumlu NİHAİ SQL Sorgusu
    const [subscriptions] = await db.execute(`
    SELECT 
        s.id as subscription_id, 
        s.user_id, 
        s.channel_id, 
        s.last_video_id, 
        n.notification_email, 
        n.telegram_chat_id, 
        n.whatsapp_phone,
        (SELECT packageId FROM user_packages WHERE user_id = s.user_id AND package_status_id = 1 LIMIT 1) as packageId
    FROM subscriptions s
    LEFT JOIN notifications n ON s.user_id = n.user_id
    WHERE s.channel_id != 'default_channel'
`);

    if (subscriptions.length === 0) {
      console.log("Kontrol edilecek aktif abonelik bulunamadı.");
      return res
        .status(200)
        .json({ message: "Kontrol edilecek aktif abonelik bulunamadı." });
    }

    const updatePromises = [];
    console.log(`Toplam ${subscriptions.length} abonelik kontrol edilecek.`);
    // 3. Her bir abonelik kaydını kontrol et
    for (const sub of subscriptions) {
      console.log(
        `[USER ${sub.user_id}] Abonelik kontrolü başlatıldı. Kanal ID: ${sub.channel_id}`
      );
      const latestVideo = await getLatestVideo(sub.channel_id);
      console.log(
        `[USER ${sub.user_id}] Kanal ID: ${sub.channel_id} için en son video kontrol ediliyor...`,
        latestVideo
      );
      // Yeni video var mı ve daha önce bildirilmemiş mi kontrol et
      if (latestVideo && latestVideo.id !== sub.last_video_id) {
        console.log(
          `[USER ${sub.user_id}] Yeni Video Bulundu: ${latestVideo.title} - ${latestVideo.id}`
        );

        // --- 4. VİDEO İŞLEME VE ÖZETLEME ---
        const packageType = sub.packageId; // Varsayılan paket 'guest'
        const transcriptText = await getTranscriptSafe(
          latestVideo.id,
          packageType
        );
        const summary = await summarizeTranscript(transcriptText);

        // --- 5. KOŞULLU BİLDİRİM GÖNDERME ---
        const sendPromises = [];
        
        // A) TELEGRAM BİLDİRİMİ (telegram_chat_id değeri varsa)
        if (sub.telegram_chat_id) {
          console.log(
            `[USER ${sub.user_id}] Telegram bildirimi gönderiliyor... Chat ID: ${sub.telegram_chat_id}`
          );
          sendPromises.push(
            sendMessage(
              latestVideo,
              latestVideo.id,
              summary,
              sub.telegram_chat_id
            )
          );
        }

        // // B) E-POSTA BİLDİRİMİ (notification_email değeri varsa)
        // if (sub.notification_email) {
        //   sendPromises.push(
        //     sendEmail(
        //       latestVideo,
        //       latestVideo.id,
        //       summary,
        //       sub.notification_email
        //     )
        //   );
        // }

        // C) WHATSAPP BİLDİRİMİ (whatsapp_phone değeri varsa)
        if (sub.whatsapp_phone) {
          sendPromises.push(
            sendWhatsapp(
              latestVideo,
              latestVideo.id,
              summary,
              sub.whatsapp_phone
            )
          );
        }

        await Promise.all(sendPromises);

        // D) Veritabanını Güncelle
        updatePromises.push(
          db.execute(
            `UPDATE subscriptions SET last_video_id = ? WHERE id = ?`,
            [latestVideo.id, sub.subscription_id]
          )
        );
      }
    }

    // 6. Tüm veritabanı güncellemelerini toplu olarak bekle
    await Promise.all(updatePromises);

    return res.status(200).json({
      message: `Çok Kanallı Video kontrol görevi tamamlandı. ${updatePromises.length} adet abonelik güncellendi.`,
      updatedCount: updatePromises.length,
    });
  } catch (error) {
    console.error("Kritik Video Kontrol Hatası:", error);
    return res
      .status(500)
      .json({ error: "Sunucu hatası. Görev tamamlanamadı." });
  }
}
