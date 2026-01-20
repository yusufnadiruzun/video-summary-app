const RE_YOUTUBE = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// MP3 Fallback şimdilik devre dışı (Yoruma alındı)
/*
import { DownloadVideoMp3 } from "./DownloadVideoMp3.js";
import { mp3ToTranscript } from "./Mp3TextConverter.js";
*/

/**
 * URL'den Video ID'sini temizler
 */
function retrieveVideoId(videoId) {
    if (videoId.length === 11) return videoId;
    const matchId = videoId.match(RE_YOUTUBE);
    if (matchId && matchId.length) return matchId[1];
    throw new Error("Geçersiz YouTube Video ID");
}

/**
 * YouTube Innertube API üzerinden altyazı çeker
 */
async function fetchTranscriptInnertube(videoId, lang = 'tr') {
    const identifier = retrieveVideoId(videoId);
    const watchUrl = `https://www.youtube.com/watch?v=${identifier}`;

    // 1. Sayfadan INNERTUBE_API_KEY'i çek
    const videoPageRes = await fetch(watchUrl, {
        headers: { 
            'User-Agent': DEFAULT_USER_AGENT,
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7' 
        }
    });
    const body = await videoPageRes.text();

    if (body.includes('class="g-recaptcha"')) throw new Error("BOT_ENGELI: YouTube bot olduğunuzu düşünüyor.");

    const apiKeyMatch = body.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || body.match(/INNERTUBE_API_KEY\\":\\"([^\\"]+)\\"/);
    if (!apiKeyMatch) throw new Error("API_KEY_BULUNAMADI");
    const apiKey = apiKeyMatch[1];

    // 2. Player API'sine istek at (WEB istemcisi üzerinden)
    const playerEndpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
    const playerRes = await fetch(playerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': DEFAULT_USER_AGENT },
        body: JSON.stringify({
            context: { 
                client: { 
                    clientName: 'WEB', 
                    clientVersion: '2.20240210.01.00' 
                } 
            },
            videoId: identifier
        })
    });

    const playerJson = await playerRes.json();
    const tracks = playerJson?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
        throw new Error("ALTYAZI_YOK: YouTube bu istek için altyazı listesi döndürmedi.");
    }

    // Dil seçimi: Önce istenen dil (tr), yoksa İngilizce, o da yoksa ilk dil
    const selectedTrack = tracks.find(t => t.languageCode === lang) || 
                          tracks.find(t => t.languageCode === 'en') || 
                          tracks[0];
    
    // 3. Altyazıyı .json3 formatında (daha modern) çek ve işle
    const transcriptRes = await fetch(`${selectedTrack.baseUrl}&fmt=json3`);
    const transcriptData = await transcriptRes.json();

    if (!transcriptData.events) throw new Error("ALTYAZI_VERISI_BOS");

    return transcriptData.events
        .filter(e => e.segs)
        .map(e => e.segs.map(s => s.utf8).join(""))
        .join(" ")
        .replace(/\n/g, " ")
        .trim();
}

/**
 * Ana fonksiyon
 */
export async function getTranscriptSafe(videoId, packageLevel, requestedLang = 'tr') {
    console.log(`🎬 İşlem Başladı | Video: ${videoId} | Paket: ${packageLevel} | Dil: ${requestedLang}`);

    // 1️⃣ YÖNTEM: INNERTUBE API
    try {
        const text = await fetchTranscriptInnertube(videoId, requestedLang);
        if (text) {
            console.log("✅ Innertube ile başarıyla çekildi.");
            return text;
        }
    } catch (err) {
        console.error("❌ Innertube Hatası:", err.message);
    }

    // 2️⃣ ÜCRETSİZ KULLANICI KONTROLÜ
    if (packageLevel === "free" || packageLevel === "guest" || packageLevel === 0) {
        return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
    }

    // 3️⃣ ÜCRETLİ KULLANICI İÇİN MP3 FALLBACK (Şimdilik Yoruma Alındı)
    /*
    try {
        console.log("🔄 MP3 Fallback (Whisper) Başlatılıyor...");
        const download = await DownloadVideoMp3(videoId);
        const mp3Path = download?.file ?? `./lib/audioFile/${videoId}.mp3`;
        return await mp3ToTranscript(mp3Path);
    } catch (err) {
        console.error("❌ MP3 Fallback Hatası:", err.message);
        return 'TRANSCRIPT_NOT_AVAILABLE';
    }
    */

    // Eğer hiçbir şey çalışmazsa
    return 'TRANSCRIPT_NOT_AVAILABLE';
}