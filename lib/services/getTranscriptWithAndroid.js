const RE_YOUTUBE = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)"[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/text>/g;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

function retrieveVideoId(videoId) {
    if (videoId.length === 11) return videoId;
    const matchId = videoId.match(RE_YOUTUBE);
    if (matchId && matchId.length) return matchId[1];
    throw new Error("Geçersiz YouTube Video ID");
}

async function fetchTranscriptInnertube(videoId, lang = 'tr') {
    const identifier = retrieveVideoId(videoId);
    const watchUrl = `https://www.youtube.com/watch?v=${identifier}`;

    // 1. Sayfadan API Key çek
    const videoPageRes = await fetch(watchUrl, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'tr-TR,tr' }
    });
    const body = await videoPageRes.text();
    if (body.includes('class="g-recaptcha"')) throw new Error("BOT_ENGELI");

    const apiKeyMatch = body.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || body.match(/INNERTUBE_API_KEY\\":\\"([^\\"]+)\\"/);
    if (!apiKeyMatch) throw new Error("API_KEY_BULUNAMADI");
    const apiKey = apiKeyMatch[1];

    // 2. Player API'sine istek at
    const playerEndpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
    const playerRes = await fetch(playerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
        body: JSON.stringify({
            context: { client: { clientName: 'WEB', clientVersion: '2.20240210.01.00' } },
            videoId: identifier
        })
    });

    const playerJson = await playerRes.json();
    const tracks = playerJson?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) throw new Error("ALTYAZI_YOK");

    const selectedTrack = tracks.find(t => t.languageCode === lang) || 
                          tracks.find(t => t.languageCode === 'en') || 
                          tracks[0];
    
    // 3. Altyazıyı çek (Burada format esnekliği sağlıyoruz)
    const transcriptRes = await fetch(selectedTrack.baseUrl);
    const transcriptRaw = await transcriptRes.text();

    // Veri JSON mı yoksa XML mi kontrol et
    if (transcriptRaw.trim().startsWith('{')) {
        // JSON Formatı (JSON3)
        const data = JSON.parse(transcriptRaw);
        return data.events
            .filter(e => e.segs)
            .map(e => e.segs.map(s => s.utf8).join(""))
            .join(" ")
            .replace(/\s+/g, " ").trim();
    } else {
        // XML Formatı
        const results = [...transcriptRaw.matchAll(RE_XML_TRANSCRIPT)];
        return results.map(m => m[3]
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        ).join(" ").replace(/\s+/g, " ").trim();
    }
}

export async function getTranscriptSafe(videoId, packageLevel, requestedLang = 'tr') {
    console.log(`🎬 İşlem Başladı | Video: ${videoId} | Paket: ${packageLevel}`);

    try {
        const text = await fetchTranscriptInnertube(videoId, requestedLang);
        if (text) {
            console.log("✅ Başarıyla çekildi (JSON/XML hibrit).");
            return text;
        }
    } catch (err) {
        console.error("❌ Hata:", err.message);
    }

    if (packageLevel === "free" || packageLevel === "guest" || packageLevel === 0) {
        return "TRANSCRIPT_NOT_AVAILABLE_FOR_FREE";
    }

    return 'TRANSCRIPT_NOT_AVAILABLE';
}