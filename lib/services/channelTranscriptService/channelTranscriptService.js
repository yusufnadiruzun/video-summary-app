// src/lib/services/channelTranscriptService.js

import { getRecentVideos } from "../youtubeService.js"; // Daha önce yazdığımız metadata servisi
import { getTranscriptSafe } from "../getTranscript.js"; // Senin paylaştığın güvenli transkript fonksiyonu

/** 
 * Kanalın son 3 videosunun transkriptlerini toplar.
 * @param {string} channelId - Kanal ID
 * @param {string} packageLevel - Kullanıcı paketi ('free', 'pro' vb.)
 * @returns {Promise<Array>} Video bilgileri ve transkriptlerini içeren liste
 */
export async function getRecentVideosTranscripts(channelId, packageLevel) {
    // 1. Önce son 3 videonun ID ve başlık bilgilerini al
    const videos = await getRecentVideos(channelId, 3);
    
    if (!videos || videos.length === 0) return [];

    const results = [];
    console.log(`Kanal için ${videos.length} video bulundu. Transkriptler çekiliyor...`);
    console.log(videos);
    // 2. Her bir video için transkript çek (Sırayla veya Promise.all ile)
    for (const video of videos) {
        console.log(`İşleniyor: ${video.title} (${video.id})`);
        
        // Senin 'getTranscriptSafe' fonksiyonunu çağırıyoruz
        const transcript = await getTranscriptSafe(video.id, packageLevel);
        
        results.push({
            videoId: video.videoId,
            title: video.title,
            transcript: transcript // Başarılıysa metin, değilse hata kodu döner
        });
    }

    return results;
}