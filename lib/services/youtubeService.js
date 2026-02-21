import { google } from "googleapis";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

/**
 * En az kota harcayacak şekilde videoları getirir.
 * search.list (100 birim) yerine playlistItems.list (1 birim) kullanır.
 */
export async function getRecentVideos(identifier, limit = 1) {
  try {
    let channelId = identifier;

    // 1. Eğer input @handle ise ID'ye çevir (Mecbur kalmadıkça UC... kullanın)
    if (identifier.startsWith("@")) {
      const searchRes = await youtube.channels.list({
        part: "id",
        forHandle: identifier,
      });
      channelId = searchRes.data.items?.[0]?.id;
    }

    if (!channelId) {
      console.warn(`Kanal ID tespit edilemedi: ${identifier}`);
      return [];
    }

    // 2. Kanal ID'sini (UC...) doğrudan Uploads Playlist ID'sine (UU...) çevir.
    // Bu işlem KOTA HARCAMAZ, sadece string manipülasyonudur.
    const uploadsPlaylistId = channelId.startsWith("UC")
      ? "UU" + channelId.substring(2)
      : channelId;

    // 3. Videoları PlaylistItems üzerinden çek (Sadece 1 birim kota harcar!)
    const playlistRes = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: limit,
    });

    const items = playlistRes.data.items || [];

    return items.map((item) => ({
      id: item.contentDetails?.videoId || item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    }));

  } catch (error) {
    const errorData = error.response?.data?.error;
    console.error("YouTube API Detaylı Hata:", errorData || error.message);
    
    // Kota aşımı kontrolü için log
    if (errorData?.errors?.[0]?.reason === "quotaExceeded") {
      console.error("KRİTİK: YouTube API Kotası tükendi!");
    }
    
    return []; 
  }
}

/**
 * Kanalın varlığını kontrol eder ve teknik bilgilerini döner.
 */
export async function checkChannelExists(identifier) {
  try {
    let cleanId = identifier.trim();
    let params = { part: "snippet" };

    if (!cleanId.startsWith("UC") && !cleanId.startsWith("@")) {
      cleanId = "@" + cleanId;
    }

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
        channelId: channel.id, // UC... formatındaki ID
        title: channel.snippet.title,
        handle: channel.snippet.customUrl 
      };
    }

    return { exists: false };
  } catch (error) {
    console.error("YouTube API Error:", error.message);
    return { exists: false };
  }
}