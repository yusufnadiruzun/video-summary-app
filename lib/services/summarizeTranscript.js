// src/lib/services/summarizeTranscript.js

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY çevresel değişkeni eksik. Özetleme çalışmayacaktır.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * YouTube videosunu Google Gemini API kullanarak özetler.
 * @param {string} youtubeUrl - YouTube video linki
 * @param {string} summaryType - (Şimdilik kullanılmıyor)
 * @param {string} keywords - Kullanıcının girdiği özel talimatlar
 * @returns {Promise<string>} Oluşturulan özet metni
 */
export async function summarizeTranscript(youtubeUrl, summaryType, keywords) {
    if (!genAI) {
        return 'Özetleme servisi kullanılamıyor (API Anahtarı eksik).';
    }

    try {
        if (!youtubeUrl || !youtubeUrl.includes('youtube.com')) {
            return 'Geçerli bir YouTube linki girilmedi.';
        }

        console.log('Özetlenecek YouTube Linki:', youtubeUrl);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });

        let instruction = `
Aşağıda verdiğim YouTube videosunun içeriğini izle, anla ve kısa, net bir özet çıkar.
Önemli noktaları madde işaretleriyle belirt.
`;

        if (keywords && keywords.length > 0) {
            instruction += `
Kullanıcının özel isteğini de dikkate al:
"${keywords}"
`;
        }

        const prompt = `
${instruction}

YouTube Video Linki:
${youtubeUrl}
`;

        console.log('Kullanılan Prompt:', prompt);

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        return summary;
    } catch (error) {
        console.error('Gemini API hatası:', error.message);

        if (error.message.includes('404')) {
            return 'Model bulunamadı. Model adını kontrol edin.';
        }
        if (error.message.includes('429')) {
            return 'Kota aşıldı. Lütfen daha sonra tekrar deneyin.';
        }

        return 'Video özetlenemedi (Gemini API hatası).';
    }
}
