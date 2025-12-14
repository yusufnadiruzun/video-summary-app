// src/lib/services/youtubeService.js

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
import { google } from "googleapis";
/**
 * YouTube kanalının en son videosunu çeker.
 * @param {string} CHANNEL_ID - Takip edilen YouTube kanalının ID'si.
 * @returns {object|null} En son video bilgisi {id, title, channelTitle, publishedAt} veya null.
 */
export async function getLatestVideo(CHANNEL_ID) {
    CHANNEL_ID = "UCGBytjbMXiF1nbe6HD7iORQ"
    console.log("getLatestVideo çağrıldı, CHANNEL_ID:", CHANNEL_ID);
  if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
    console.error(
      "YOUTUBE_API_KEY veya CHANNEL_ID çevresel değişkenleri eksik!"
    );
  }

  const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });
  // Bu fonksiyonun sadece sunucu tarafında çalıştığından emin olun.
  // Frontend bileşenlerinde çağrılmamalıdır.
  try {
    const channelRes = await youtube.channels.list({
      part: "contentDetails",
      id: CHANNEL_ID,
    });
    const uploadsPlaylistId =
      channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

    const playlistRes = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });
    const latestVideo = playlistRes.data.items[0].snippet;
    const latestVideoId = latestVideo.resourceId.videoId;
    console.log("Latest Video ID fetched:", latestVideoId);
    console.log("Latest Video Snippet fetched:", latestVideo);
      if (latestVideo) {
        return {
          id: latestVideo.resourceId.videoId,
          title: latestVideo.title,
          channelTitle: latestVideo.channelTitle,
          publishedAt: latestVideo.publishedAt,
        };
      }
      return null;
    
  } catch (error) {
    console.error(`YouTube API hatası (${CHANNEL_ID}):`, error.message);
    return null;
  }
}
