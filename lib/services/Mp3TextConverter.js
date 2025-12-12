// src/lib/services/Mp3TextConverter.js

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
// 'dotenv/config' kaldırıldı.

const execAsync = promisify(exec);

/**
 * MP3 dosyasını alır, Python scripti ile transkripti çıkarır.
 * @param {string} mp3FilePath - İndirilen MP3 dosyasının yolu
 * @returns {Promise<string>} transcript
 */
export async function mp3ToTranscript(mp3FilePath) {
    // ❗ ÖNEMLİ: Bu fonksiyonun çalışması için 
    // "transcribe.py" dosyasının ve gerektirdiği Python kütüphanelerinin 
    // (örneğin Whisper) sunucu ortamında (Next.js'in çalıştığı yerde)
    // erişilebilir olması gerekir. transcribe.py'ı Next.js projesinin 
    // kök dizinine veya başka bir erişilebilir konuma taşıyın.
    
    if (!fs.existsSync(mp3FilePath)) {
        throw new Error("MP3 dosyası bulunamadı: " + mp3FilePath);
    }

    try {
        // Python scriptini çalıştır
        const safePath = mp3FilePath.replace(/\\/g, "/"); // Windows uyumluluğu
        
        // transcribe.py'ın doğru yolu belirlenmeli. Varsayılan olarak projenin kök dizininde olduğunu varsayalım.
        const pythonCmd = `python transcribe.py "${safePath}"`; 

        const { stdout } = await execAsync(pythonCmd, {
            timeout: 0,
            maxBuffer: 1024 * 1024 * 50, // 50MB buffer
        });

        // JSON parse
        const jsonStart = stdout.indexOf("{");
        if (jsonStart === -1) throw new Error("Python çıktısı JSON değil! Çıktı: " + stdout);
        
        const result = JSON.parse(stdout.slice(jsonStart).trim());

        return result.text; // Python scripti JSON içinde "text" alanı dönmeli
    } catch (err) {
        console.error("mp3ToTranscript hatası:", err);
        throw err;
    } finally {
        // Temp MP3 dosyasını sil (Temizlik her zaman iyidir)
        if (fs.existsSync(mp3FilePath)) {
            fs.unlinkSync(mp3FilePath);
        }
    }
}