import { fetchTranscript } from "youtube-transcript-plus";
import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js";
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Transcript alma - youtube-transcript-plus + residential proxy + fallback
 * AWS blokunu aşmak için proxy kullanıyoruz.
 */
export async function getTranscript(videoId, packageLevel) {
  console.log(`🎬 Transcript başlıyor | Video=${videoId} | Paket=${packageLevel}`);

  // Proxy ayarları (senin son verdiğin PK- formatı, ülke kodunu değiştirerek dene)
  const proxyUrl = process.env.PROXY_URL;
  // Alternatifler dene eğer hata devam ederse:
  // const proxyUrl = 'http://TR-qnbvgysz-1:66jxbkf8h6cl@p.webshare.io:80';
  // const proxyUrl = 'http://US-qnbvgysz-1:66jxbkf8h6cl@p.webshare.io:80';
  // const proxyUrl = 'http://qnbvgysz-1:66jxbkf8h6cl@p.webshare.io:80'; // Ülke olmadan

  const proxyAgent = new HttpsProxyAgent(proxyUrl, {
    timeout: 30000,
    keepAlive: true,
  });

  // Custom fetch - kütüphanenin beklediği formatta
  const customFetch = async ({ url, method = 'GET', body, headers = {}, lang, userAgent }) => {
    console.log(`Custom fetch → URL: ${url} | Method: ${method}`);

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

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      console.log(`Hatalı response: Status ${response.status} | Body: ${text.substring(0, 300)}`);
    }

    return response;
  };

  // 1️⃣ Public transcript dene
  try {
    console.log("🔍 Public transcript deneniyor (proxy aktif)...");

    const result = await fetchTranscript(videoId, {
      lang: 'tr',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      videoFetch: customFetch,
      playerFetch: customFetch,
      transcriptFetch: customFetch,
    });

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

    if (fullText.length > 0) {
      console.log("✅ Transcript alındı, uzunluk:", fullText.length);
      return fullText;
    } else {
      console.log("Public transcript boş döndü");
    }

  } catch (err) {
    console.error("❌ Public transcript hatası:", err?.message || err);
    if (err.stack) console.error("Stack:", err.stack.substring(0, 500));
  }

  // 2️⃣ Free/guest için erken çıkış
  if (packageLevel === "free" || packageLevel === "guest" || packageLevel === 0) {
    return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
  }

  // 3️⃣ Paid → MP3 fallback (en sağlam yol, bunu ana yöntem yapabilirsin)
  try {
    console.log("🔄 Public başarısız → MP3 fallback deneniyor...");

    const download = await DownloadVideoMp3(videoId);
    const mp3Path = download?.file ?? `./lib/audioFile/${videoId}.mp3`;

    if (!mp3Path) throw new Error("MP3 oluşturulamadı");

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