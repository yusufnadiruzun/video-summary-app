// src/lib/services/summarizeTranscript.js

// import 'dotenv/config'; // Next.js API Yollarında gereksiz
import { GoogleGenerativeAI } from '@google/generative-ai';

// Çevresel değişkeni Next.js .env.local dosyasından doğrudan alıyoruz.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// API Anahtarı mevcut değilse uyarı ver
if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY çevresel değişkeni eksik. Özetleme çalışmayacaktır.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Transkripti Google Gemini API kullanarak özetler.
 * @param {string} transcript - Özetlenecek video transkripti.
 * @param {string} summaryType - Özet türü (kullanılmıyor, ancak gelecekteki genişletme için korunabilir).
 * @param {string} keywords - Kullanıcının girdiği özel talimatlar/anahtar kelimeler.
 * @returns {Promise<string>} Oluşturulan özet metni.
 */
export async function summarizeTranscript(transcript, summaryType, keywords) {
    if (!genAI) {
        return 'Özetleme servisi kullanılamıyor (API Anahtarı eksik).';
    }

    try {
        if (!transcript || transcript.includes('Transkript çıkarılamadı')) {
            return 'Transkript yok, özet çıkarılamadı.';
        }
        
        console.log('Özetleme için transkript uzunluğu:', transcript.length);
        
        // Modeli sadece bir kez almak yerine, her çağrıda almak daha güvenli (örnek kodunuzdaki gibi)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Anahtar kelimeler varsa, prompt'u özelleştiriyoruz.
        // keywords parametresi bir string olduğu için (eski kullanımınız), boş olup olmadığını kontrol ediyoruz.
        let instruction = "Vereceğim transkripte içeriğini kısaca özetle.";
        if (keywords && keywords.length > 0) {
            instruction = `Youtube videosuna ait verdiğim transkriptin özetini çıkar. Kullanıcının girdiği şu komutuda dikkate al: **${keywords}** `;
        }

        const prompt = `${instruction}: ${transcript}`;
        
        console.log('Kullanılan Prompt:', instruction);
        
        const result = await model.generateContent(prompt);
        // Bu yapı, Gemini yanıtının metin içeriğini alır.
        const summary = result.response.text; 
        
        return summary;
    } catch (error) {
        console.error('Gemini API hatası:', error.message);
        
        // Hata durumunda daha bilgilendirici mesajlar döndürülebilir
        const errorMessage = error.message;

        if (errorMessage.includes('404')) {
            return 'Özetleme için model hatası. Lütfen model adını güncelleyin.';
        }
        if (errorMessage.includes('429')) {
            return 'Özetleme için kota aşımı.';
        }
        
        return 'Özet çıkarılamadı (Gemini API hatası).';
    }
}