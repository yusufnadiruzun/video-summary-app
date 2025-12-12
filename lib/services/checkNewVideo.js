// src/lib/services/checkNewVideo.js
import fs from 'fs';
import { google } from 'googleapis';

// Diğer servis fonksiyonlarının doğru yolları
import { getTranscriptSafe } from './getTranscript.js';
import { summarizeTranscript } from './summarizeTranscript.js';
import { sendMessage } from './SendMessage.js'; 

// Next.js .env.local dosyasını otomatik yükler, 'dotenv/config' gerekmez
// process.env doğrudan kullanılabilir.
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
let lastVideoId = process.env.LAST_VIDEO_ID || ''; // process.env'den çekilen değer.

if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
    console.error("YOUTUBE_API_KEY veya CHANNEL_ID çevresel değişkenleri eksik!");
}

const youtube = google.youtube({ version: 'v3', auth: YOUTUBE_API_KEY });

export async function checkNewVideo() {
  // Bu fonksiyonun sadece sunucu tarafında çalıştığından emin olun.
  // Frontend bileşenlerinde çağrılmamalıdır.
  try {
    const channelRes = await youtube.channels.list({
      part: 'contentDetails',
      id: CHANNEL_ID,
    });
    const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

    const playlistRes = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });
    const latestVideo = playlistRes.data.items[0].snippet;
    const latestVideoId = latestVideo.resourceId.videoId;

    if (latestVideoId !== lastVideoId) {

      // Transkript çıkar
      console.log("getTranscriptSafe çalıştı, videoId:", latestVideoId);
      // Misafir veya varsayılan paket için null paket türü gönderebiliriz.
      const transcriptText = await getTranscriptSafe(latestVideoId, null); 
      console.log('Transkript alındı, uzunluk:', transcriptText.length);

      // Özetle
      const summary = await summarizeTranscript(transcriptText);
      

      // Telegram gönder
      await sendMessage(latestVideo, latestVideoId, summary);
      console.log('Yeni video işlendi ve özet gönderildi.');

      // .env güncelleme mantığı (Next.js'te .env.local kullanılır)
      // DİKKAT: Vercel/Netlify gibi dağıtım ortamlarında dosya sistemine yazma (fs.writeFileSync)
      // işlemi başarılı OLMAYABİLİR veya önerilmeyebilir.
      // Eğer Vercel kullanıyorsanız, bu değeri bir veritabanında saklamanız daha güvenlidir.
      try {
        const envPath = '.env.local'; // Next.js'in kullandığı dosya
        let envContent = '';
        if (fs.existsSync(envPath)) envContent = fs.readFileSync(envPath, 'utf8');
        const re = /^LAST_VIDEO_ID=.*$/m;
        if (re.test(envContent)) {
          envContent = envContent.replace(re, `LAST_VIDEO_ID=${latestVideoId}`);
        } else {
          envContent = envContent + `\nLAST_VIDEO_ID=${latestVideoId}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        lastVideoId = latestVideoId;
      } catch (e) {
        console.warn('ENV güncellenemedi (yerel geliştirme hariç tavsiye edilmez):', e.message);
      }

    } else {
      console.log('Yeni video yok.');
    }
  } catch (error) {
    console.error('Hata:', error);
    // Hata durumunda lastVideoId'yi güncelleme
  }
}