import db from "../../../../lib/Db";
import { authenticate } from "../../../../lib/authMiddleware";
import { getTranscript } from "../../../../lib/services/getTranscript";
import { summarizeTranscript } from "../../../../lib/services/summarizeTranscript";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const isAuthenticated = authenticate(req, res);
  if (!isAuthenticated) return;

  const userId = req.userId;
  let {
    videoId,
    transcript,
    summaryType,
    channelId,
    title,
    language,
    durationSeconds,
    keywords,
  } = req.body;

  try {
    // 1. Paket ve Limit Sorgulama
    const [rows] = await db.query(
      "SELECT packageId, daily_limit, daily_used FROM user_packages WHERE user_id = ?",
      [userId],
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "User package not found." });

    const userPkg = rows[0];
    if (
      userPkg.daily_limit !== -1 &&
      userPkg.daily_used >= userPkg.daily_limit
    ) {
      return res.status(429).json({ error: "Daily limit reached." });
    }

    // 2. Transkript Kontrolü
    let finalTranscript = transcript;

    // Frontend'den gelmediyse backend'de youtube-transcript-plus veya diğerlerini dene
    if (!finalTranscript || finalTranscript.length < 50) {
      console.log("⚠️ Frontend empty, using Backend getTranscriptWays...");
      finalTranscript = await getTranscript(videoId, Number(userPkg.packageId));
    }

    if (!finalTranscript || finalTranscript === "TRANSCRIPT_NOT_AVAILABLE") {
      return res
        .status(403)
        .json({ error: "Transcript is missing. Higher tier may be needed." });
    }

    // 3. Özetleme ve Veritabanı Kayıt (Hızlı Metadata ile)
    if (!title) {
      try {
        const meta = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
        ).then((r) => r.json());
        title = meta.title;
        channelId = meta.author_name;
      } catch (e) {
        title = `Video ${videoId}`;
      }
    }

    const summaryText = await summarizeTranscript(
      finalTranscript,
      summaryType,
      keywords,
    );

    // Sayaç ve Log Güncelleme
    await db.execute(
      "UPDATE user_packages SET daily_used = daily_used + 1, last_reset = CURDATE() WHERE user_id = ?",
      [userId],
    );

    await db.execute(
      `INSERT INTO summaries (user_id, video_id, channel_id, title, language, summary, duration_seconds, used_transcription)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        videoId,
        channelId || "YT",
        title,
        language || "tr",
        summaryText,
        durationSeconds || 0,
      ],
    );

    return res.json({
      summary: summaryText,
      title,
      remaining: userPkg.daily_limit - (userPkg.daily_used + 1),
    });
  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(500).json({ error: "An internal error occurred." });
  }
}
