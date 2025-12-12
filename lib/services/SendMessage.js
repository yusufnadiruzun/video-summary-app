// src/lib/services/SendMessage.js

// import 'dotenv/config'; // Next.js API Yollarında gereksiz
import { Telegraf } from 'telegraf';

// Çevresel değişkenleri Next.js .env.local dosyasından doğrudan alıyoruz.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Bot nesnesini burada oluşturuyoruz
const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;

/**
 * Yeni video özetini Telegram'a gönderir.
 * @param {object} latestVideo - Video snippet bilgileri (title içerir)
 * @param {string} latestVideoId - Video ID'si
 * @param {string} summary - Video özeti
 */
export const sendMessage = async (latestVideo, latestVideoId, summary) => {
    // Bot nesnesinin ve gerekli değişkenlerin varlığını kontrol et
    if (!bot || !TELEGRAM_CHAT_ID) {
        console.warn("Telegram bot tokenı veya Chat ID'si ayarlanmadığı için mesaj gönderilemedi.");
        return;
    }

    try {
        await bot.telegram.sendMessage(
            TELEGRAM_CHAT_ID,
            `Yeni Video: ${latestVideo.title}\nhttps://www.youtube.com/watch?v=${latestVideoId}\n\nÖzet:\n${summary}`
        );
        console.log("Telegram mesajı başarıyla gönderildi.");
    } catch (error) {
        console.error("Telegram mesajı gönderme hatası:", error.message);
    }
};

// Bu dosyayı bir modül olarak dışa aktarmak için:
// Tek bir fonksiyon olduğu için doğrudan export edebiliriz.
// export { sendMessage }; // Veya yukarıdaki gibi doğrudan 'export const' kullanabilirsiniz.