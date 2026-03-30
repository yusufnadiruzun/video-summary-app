import { fetchTranscript } from "youtube-transcript-plus";
import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js";
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Transcript alma - youtube-transcript-plus + residential proxy + fallback
 */
export async function getTranscript(videoId, packageLevel) {
  console.log(`🎬 Transcript başlıyor | Video=${videoId} | Paket=${packageLevel}`);

  const proxyUrl = process.env.PROXY_URL;
  const proxyAgent = new HttpsProxyAgent(proxyUrl, {
    timeout: 30000,
    keepAlive: true,
  });

  const customFetch = async ({ url, method = 'GET', body, headers = {}, lang, userAgent }) => {
    const options = {
      method,
      headers: {
        ...headers,
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        ...(lang && { 'Accept-Language': lang }),
      },
      body,
      redirect: 'follow',
      agent: proxyAgent,
    };
    return await fetch(url, options);
  };

  // 1️⃣ Public transcript dene (DİL YEDEKLEMELİ)
  try {
    console.log("🔍 Public transcript deneniyor (Proxy aktif)...");

    let result;
    try {
      // ÖNCE TÜRKÇE DENE
      result = await fetchTranscript(videoId, {
        lang: 'tr',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        videoFetch: customFetch,
        playerFetch: customFetch,
        transcriptFetch: customFetch,
      });
    } catch (langErr) {
      // TÜRKÇE YOKSA DİL BELİRTMEDEN TEKRAR DENE (Videonun kendi dilini getirir)
      console.warn(`⚠️ [${videoId}] Türkçe altyazı bulunamadı, mevcut dillerden biri çekiliyor...`);
      result = await fetchTranscript(videoId, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        videoFetch: customFetch,
        playerFetch: customFetch,
        transcriptFetch: customFetch,
      });
    }

    let fullText = '';
    if (Array.isArray(result)) {
      fullText = result
        .map(item => item.text?.replace(/\n/g, ' ') || '')
        .filter(Boolean)
        .join(' ')
        .trim();
    } else if (typeof result === 'string') {
      fullText = result.trim();
    }

    if (fullText.length > 10) {
      console.log("✅ Public Transcript başarıyla alındı, uzunluk:", fullText.length);
      return fullText;
    }

  } catch (err) {
    console.error("❌ Public transcript tamamen başarısız:", err?.message || "Bilinmeyen Hata");
  }

  // 2️⃣ Free/guest için erken çıkış
  if (packageLevel === "free" || packageLevel === "guest" || packageLevel === 0) {
    console.log("🚫 Ücretsiz kullanıcı: MP3 Fallback atlanıyor.");
    return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
  }

  // 3️⃣ Paid → MP3 fallback (En sağlam yol)
  try {
    console.log("🔄 Public başarısız → MP3 fallback deneniyor...");

    const download = await DownloadVideoMp3(videoId);
    const mp3Path = download?.file ?? `./lib/audioFile/${videoId}.mp3`;

    if (!mp3Path) throw new Error("MP3 dosyası oluşturulamadı");

    const text = await mp3ToTranscript(mp3Path);

    if (text && text.trim().length > 0) {
      console.log("✅ MP3 fallback başarılı, uzunluk:", text.length);
      return text.trim();
    }

  } catch (err) {
    console.error("❌ MP3 fallback hatası:", err?.message || err);
  }

  return "TRANSCRIPT_NOT_AVAILABLE";
}