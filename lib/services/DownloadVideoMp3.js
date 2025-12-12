// src/lib/services/DownloadVideoMp3.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// import 'dotenv/config'; // Next.js API Yollarında gereksiz

// ❗ ÖNEMLİ NOT: 'yt-dlp-exec' paketini package.json dosyanıza eklediğinizden
// ve doğru şekilde import ettiğinizden emin olun.
// Paket import'u CommonJS veya ESM'ye göre değişebilir.
// Aşağıdaki satırı, paketi kurduktan sonra aktif hale getirmeniz gerekir.

// import pkg from 'yt-dlp-exec';
// const youtube_dl = pkg.youtube_dl || pkg.default || pkg; 
const youtube_dl = null; // Placeholder: Gerçek import kodunu buraya ekleyin.


// ----------------------------------------------------------------------
// ESM UYUMLULUĞU İÇİN YAPILANDIRMA (Next.js Server-side için korunmalı)
// ----------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function DownloadVideoMp3(videoId) {
    if (!youtube_dl) {
        throw new Error("youtube_dl paketi doğru yüklenemedi. Lütfen 'yt-dlp-exec' importunu kontrol edin.");
    }
    
    // Klasör yolu, Next.js uygulamanızın çalıştığı sunucu ortamında olacaktır.
    // 'audioFile' klasörü, bu dosyanın yanında, src/lib/services/audioFile olarak oluşacaktır.
    const outputDir = path.resolve(__dirname, 'audioFile'); 
    
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const template = path.join(outputDir, `${videoId}.%(ext)s`);

    // Çıktı klasörünün var olduğundan emin olun
    if (!fs.existsSync(outputDir)) {
        // Not: Dağıtım (Deployment) ortamlarında (Vercel gibi), dosya sistemine yazma işlemi kısıtlı olabilir.
        // Kalıcı depolama (persistent storage) için AWS S3 gibi çözümler önerilir.
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const result = await youtube_dl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            progress: true, 
            output: template,
        });
        
        const finalPath = path.join(outputDir, `${videoId}.mp3`);
        
        console.log(`\n✅ MP3 indirme ve dönüştürme tamamlandı: ${finalPath}`);
        return { file: finalPath, videoId: videoId, logs: result };

    } catch (error) {
        console.error('YT-DLP Hata:', error.message);
        throw error;
    }
}