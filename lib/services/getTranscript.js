import { fetchTranscript } from "youtube-transcript-plus";
import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js";

/**
 * Güvenli transcript alma (cookies / proxy YOK)
 */
export async function getTranscriptSafe(videoId, packageLevel) {
  console.log(`🎬 Transcript başlıyor | Video=${videoId} | Paket=${packageLevel}`);

  // 1️⃣ SADECE PUBLIC YOUTUBE TRANSCRIPT
  try {
    const result = await fetchTranscript(videoId, {
      lang: "tr",
    });

    if (Array.isArray(result)) {
      return result.map(t => t.text).join(" ");
    }

    if (typeof result === "string") {
      return result;
    }

  } catch (err) {
    console.error("❌ Public transcript alınamadı:", err?.message || err);
  }

  // 2️⃣ FREE / GUEST → DUR
  if (
    packageLevel === "free" ||
    packageLevel === "guest" ||
    packageLevel === 0
  ) {
    return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
  }

  // 3️⃣ SADECE PAID → MP3 FALLBACK
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
