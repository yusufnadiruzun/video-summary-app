// src/lib/services/SendMessage.js

import { Telegraf } from 'telegraf';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Bot nesnesini burada oluşturuyoruz
const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;

/**
 * Yeni video özetini Telegram'a gönderir.
 * @param {object} latestVideo - Video snippet bilgileri (title, channelTitle içerir)
 * @param {string} latestVideoId - Video ID'si
 * @param {string} summary - Video özeti
 * @param {string} chatId - Mesajın gönderileceği kullanıcının özel Telegram Chat ID'si
 */
export const sendMessage = async (latestVideo, latestVideoId, summary, chatId) => {
    // Bot nesnesinin ve gerekli chatId'nin varlığını kontrol et
    if (!bot || !chatId) {
        console.warn("Telegram bot tokenı veya kullanıcı Chat ID'si eksik olduğu için mesaj gönderilemedi.");
        return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${latestVideoId}`;
    
    // Mesaj içeriğini HTML formatında daha okunaklı yapalım
    const message = `
        <b>🤖 Yeni Video Özeti (Yapay Zeka)</b>

        Kanal: ${latestVideo.channelTitle}
        Video: <a href="${videoUrl}">${latestVideo.title}</a>
        
        ➖➖➖➖➖➖➖➖➖➖➖➖
        
        <b>Özet:</b>
        ${summary}
        
        ➖➖➖➖➖➖➖➖➖➖➖➖
        <a href="${videoUrl}">Videoyu İzle</a>
    `;

    try {
        await bot.telegram.sendMessage(
            chatId, // Artık dinamik chatId kullanıyoruz
            message,
            { parse_mode: 'HTML' } // HTML etiketlerini kullanabilmek için
        );
        console.log(`Telegram mesajı başarıyla gönderildi: Chat ID ${chatId}`);
    } catch (error) {
        console.error(`Telegram mesajı gönderme hatası (${chatId}):`, error.message);
    }
};