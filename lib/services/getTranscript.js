import fs from "fs";
import path from "path";
import { fetchTranscript } from "youtube-transcript-plus";

// Diğer servis fonksiyonları
import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js";

/**
 * Video transkriptini:
 * 1) Proxy + Cookies ile YouTube Transcript API
 * 2) Paket uygunsa MP3 fallback
 *
 * @param {string} videoId
 * @param {string|number} packageLevel
 * @returns {string}
 */
export async function getTranscriptSafe(videoId, packageLevel) {
  console.log(`🎬 Transcript başlıyor | Video=${videoId} | Paket=${packageLevel}`);

  const cookiesPath = path.resolve(process.cwd(), "cookies.txt");
  let cookies = null;

  if (fs.existsSync(cookiesPath)) {
    cookies = fs.readFileSync(cookiesPath, "utf8");
    console.log("🍪 cookies.txt yüklendi");
  } else {
    console.warn("⚠️ cookies.txt bulunamadı");
  }

  // 1️⃣ YOUTUBE TRANSCRIPT API (PROXY + COOKIES)
  try {
    console.log("🔎 YouTube Transcript API deneniyor...");

    const result = await fetchTranscript(videoId, {
      lang: "tr",

      // 🍪 Cookies (login gibi görünmek için)
      cookies,

      // 🌍 Residential Proxy (AWS IP engeli için)
      proxy: {
        host: "brd.superproxy.io",
        port: 22225,
        username: "brd-customer-XXX-zone-residential",
        password: "YYYY",
        protocol: "http",
      },
    });

    console.log("✅ API sonucu alındı");

    if (typeof result === "string") return result;

    if (Array.isArray(result)) {
      return result.map((t) => t.text || "").join(" ").trim();
    }

    return String(result);
  } catch (error) {
    console.error(
      "❌ Transcript API başarısız:",
      error?.message || error
    );
  }

  // 2️⃣ FREE / GUEST paketlerde fallback YOK
  if (
    packageLevel === "free" ||
    packageLevel === "guest" ||
    packageLevel === 0
  ) {
    return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
  }

  // 3️⃣ MP3 FALLBACK (PRO / PREMIUM)
  try {
    console.log("🎧 MP3 fallback başlatılıyor...");

    const downloadResult = await DownloadVideoMp3(videoId);
    const mp3Path =
      downloadResult?.file || `./audioFile/${videoId}.mp3`;

    console.log("🎵 MP3 indirildi:", mp3Path);

    const transcriptText = await mp3ToTranscript(mp3Path);

    if (!transcriptText || transcriptText.length < 10) {
      throw new Error("MP3 transcript boş");
    }

    console.log("📝 MP3 transcript başarıyla çıkarıldı");

    // 🔥 İstersen temizle
    // fs.unlinkSync(mp3Path);

    return transcriptText;
  } catch (error) {
    console.error(
      "❌ MP3 fallback başarısız:",
      error?.message || error
    );
    return "TRANSCRIPT_NOT_AVAILABLE";
  }
}
