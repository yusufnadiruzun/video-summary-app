// pages/api/channel/summary.js - GÜNCEL HALİ

import { authenticate } from "../../../../lib/authMiddleware";
import { getRecentVideosTranscripts } from "../../../../lib/services/channelTranscriptService/channelTranscriptService";
import { analyzeChannelByTranscripts } from "../../../../lib/services/channelTranscriptService/aiChannelSummary";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return; // Auth hatası durumunda res.status middleware içinde verilmiş olmalı

  const { channelId } = req.body;
  if (!channelId) return res.status(400).json({ error: "Channel ID gerekli" });

  try {
    // 1. Videoları ve transkriptleri çek (Bu bir ARRAY döner)
    const videos = await getRecentVideosTranscripts(channelId, 3);
    
    // GÜVENLİK KONTROLÜ:
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(404).json({ error: "Kanal videoları çekilemedi." });
    }

    // 2. ANALİZ: analyzeChannelByTranscripts fonksiyonuna DİREKT 'videos' dizisini gönderiyoruz.
    // Artık context string'ini burada oluşturmuyoruz, çünkü servis içerde bunu yapacak.
    const analysis = await analyzeChannelByTranscripts(videos);

    return res.json({ 
      summary: analysis,
      videos: videos 
    });

  } catch (error) {
    console.log("Kanal özeti API hatası:", error);
    return res.status(500).json({ error: "Kanal analizi sırasında bir hata oluştu." });
  }
}