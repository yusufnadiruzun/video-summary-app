import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchTranscript } from "youtube-transcript-plus";

import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js";

// 🔒 ESM için __dirname tanımı
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🍪 cookies.txt → aynı klasörde
const cookiesPath = path.join(__dirname, "cookies.txt");
console.log("🍪 cookies.txt yolu:", cookiesPath);

let cookies = null;
if (fs.existsSync(cookiesPath)) {
  cookies = fs.readFileSync(cookiesPath, "utf8");
  console.log("✅ cookies.txt bulundu");
} else {
  console.warn("⚠️ cookies.txt bulunamadı");
}

/**
 * Güvenli transcript alma
 */
export async function getTranscriptSafe(videoId, packageLevel) {
  console.log(`🎬 Transcript başlıyor | Video=${videoId} | Paket=${packageLevel}`);

  // 1️⃣ API + PROXY + COOKIES
  try {
    const result = await fetchTranscript(videoId, {
      lang: "tr",
      cookies,
      proxy: {
        host: "brd.superproxy.io",
        port: 22225,
        username: "brd-customer-XXX-zone-residential",
        password: "YYYY",
        protocol: "http",
      },
    });

    if (Array.isArray(result)) {
      return result.map(t => t.text).join(" ");
    }

    if (typeof result === "string") return result;

  } catch (err) {
    console.error("❌ API transcript alınamadı:", err?.message || err);
  }

  // 2️⃣ FREE / GUEST
  if (
    packageLevel === "free" ||
    packageLevel === "guest" ||
    packageLevel === 0
  ) {
    return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
  }

  // 3️⃣ MP3 FALLBACK
  try {
    const download = await DownloadVideoMp3(videoId);
    const mp3Path = download?.file ?? `./lib/audioFile/${videoId}.mp3`;

    const text = await mp3ToTranscript(mp3Path);
    return text;

  } catch (err) {
    console.error("❌ MP3 fallback başarısız:", err?.message || err);
    return "TRANSCRIPT_NOT_AVAILABLE";
  }
}
