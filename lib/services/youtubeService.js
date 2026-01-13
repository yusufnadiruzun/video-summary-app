// src/lib/services/youtubeService.js
import { google } from "googleapis";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

export async function getRecentVideos(identifier, limit = 1) {
  try {
    let channelId = identifier;

    // 1. Eğer input @ ile başlıyorsa (Handle ise) ID'ye çevir
    if (identifier.startsWith("@")) {
      const searchRes = await youtube.search.list({
        part: "snippet",
        q: identifier,
        type: "channel",
        maxResults: 1,
      });

      channelId = searchRes.data.items?.[0]?.id?.channelId;
    }

    if (!channelId) throw new Error("Kanal bulunamadı.");

    // 2. Kanalın "uploads" playlist ID'sini al
    const channelRes = await youtube.channels.list({
      part: "contentDetails",
      id: channelId, // Artık sadece id gönderiyoruz, filtre hatası çözüldü
    });

    const uploadsId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];

    // 3. Videoları çek
    const playlistRes = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: uploadsId,
      maxResults: limit,
    });

    const items = playlistRes.data.items || [];
    
    // Her zaman bir dizi (array) döndürdüğümüzden emin oluyoruz
    return items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    }));

  } catch (error) {
    console.error("YouTube API Detaylı Hata:", error.response?.data?.error || error.message);
    return []; // Hata durumunda boş dizi dön ki .filter() patlamasın
  }
}

export async function checkChannelExists(identifier) {
  try {
    let cleanId = identifier.trim();
    let params = { part: "snippet" };

    // 1. Eğer UC ile başlamıyorsa ve @ yoksa, handle olduğunu varsayıp @ ekle
    if (!cleanId.startsWith("UC") && !cleanId.startsWith("@")) {
      cleanId = "@" + cleanId;
    }

    // 2. Parametreleri ayarla
    if (cleanId.startsWith("@")) {
      params.forHandle = cleanId;
    } else {
      params.id = cleanId;
    }

    const res = await youtube.channels.list(params);

    if (res.data.items && res.data.items.length > 0) {
      const channel = res.data.items[0];
      return {
        exists: true,
        channelId: channel.id, // Teknik ID (UC...)
        title: channel.snippet.title, // Görünen Ad (Örn: Barış Özcan)
        handle: channel.snippet.customUrl // @handle adı
      };
    }

    return { exists: false };
  } catch (error) {
    console.error("YouTube API Error:", error.message);
    return { exists: false };
  }
}