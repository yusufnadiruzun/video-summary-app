// src/lib/services/getTranscript.js

import { fetchTranscript } from "youtube-transcript-plus";
// Diğer servis fonksiyonlarının doğru yolları
import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js"; // Mp3TextConverter.js dosyasının da bu klasöre taşındığını varsayıyoruz.

/**
 * Video transkriptini önce API ile, başarısız olursa paket seviyesine bağlı olarak
 * MP3 indirip metne çevirerek güvenli bir şekilde çeker.
 * * @param {string} videoId - YouTube Video ID'si
 * @param {string} packageLevel - Kullanıcının paket seviyesi ('free', 'guest', 'pro' vb.)
 * @returns {string | undefined} Transkript metni veya hata kodu.
 */
export async function getTranscriptSafe(videoId, packageLevel) {
  console.log(`Transkript alınıyor: VideoID=${videoId}, Paket=${packageLevel}`);
  let transcriptResult = null;

  // 1. YouTube Transcript API ile deneme
  try {
    console.log("YouTube Transcript API ile transkript alınıyor...");
    console.log("result öncesi")
   const result = await fetchTranscript(videoId, {
  lang: "tr",
  proxy: {
    host: "brd.superproxy.io",
    port: 22225,
    username: "brd-customer-XXX-zone-residential",
    password: "YYYY",
    protocol: "http",
  },
});
console.log("result sonrası", result)
    if (result) {
      console.log("Transkript API ile başarıyla alındı.");
      // Transkripti temiz metne dönüştür
      if (typeof result === "string") return result;
      if (Array.isArray(result))
        return result.map((t) => t.text || t).join(" ");
      return String(result);
    }
    // Eğer API'den sonuç gelmezse (altyazı yoksa), catch'e düşmek yerine devam et.
    transcriptResult = "TRANSCRIPT_NOT_AVAILABLE";
  } catch (error) {
    console.error(
      "YouTube Transcript API hatası (API başarısız oldu, fallback deneniyor):",
      error?.message ?? error
    );
    transcriptResult = "TRANSCRIPT_API_FAILED";
  }

  // 2. API başarısız olduysa veya transkript yoksa, paket seviyesini kontrol et

  // 'free', 'guest' veya 0/düşük seviyeli paketler için MP3 indirme/çevirme yok.
  if (
    packageLevel === "free" ||
    packageLevel === "guest" ||
    packageLevel === 0
  ) {
    return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
  }

  // 3. Pro veya üst paketler mp3 ile transkrip yapabilir (Fallback mekanizması)
  // Bu mantık, 'pro' veya daha yüksek bir paket türü varsayar.
  try {
    console.log("API başarısız oldu. MP3 indirme ve dönüştürme deneniyor...");

    const downloadResult = await DownloadVideoMp3(videoId);
    const mp3path = downloadResult?.file ?? `./audioFile/${videoId}.mp3`;

    const transcriptText = await mp3ToTranscript(mp3path);

    // Not: İndirilen MP3 dosyasını diskten silme mantığı buraya eklenebilir.
    // fs.unlinkSync(mp3path);

    return transcriptText;
  } catch (e) {
    console.error("Mp3 -> transkript çıkarma hatası:", e?.message ?? e);
    return "TRANSCRIPT_NOT_AVAILABLE";
  }
}
