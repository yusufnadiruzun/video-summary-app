import db from "../../../../lib/Db";

export default async function handler(req, res) {
  // Sadece POST isteklerini kabul et (Telegram Webhook POST atar)
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body;

  // Telegram bazen boş veya mesaj içermeyen (update) paketler atabilir, güvenli çıkış yapalım
  if (!message || !message.text) {
    return res.status(200).send('ok');
  }

  const chatId = message.chat.id; // Telegram Kullanıcı ID'si
  const text = message.text;     // Gelen mesaj: Örn: "/start 5"

  try {
    let userId = null;

    // "/start" komutunu ve yanındaki ID'yi kontrol et
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length >= 2) {
        // ID'yi al, boşlukları temizle ve sayıya çevir (DB hatasını önlemek için kritik)
        userId = parseInt(parts[1].trim(), 10);
      }
    }

    // Eğer geçerli bir userId ayıklandıysa işlemleri yap
    if (userId && !isNaN(userId)) {
      
      // 1. Veritabanı Kaydı (Upsert Mantığı)
      // notifications tablosunda bu user_id yoksa ekler, varsa telegram_chat_id'yi günceller.
      await db.execute(
        `INSERT INTO notifications (user_id, telegram_chat_id) 
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE telegram_chat_id = VALUES(telegram_chat_id)`,
        [userId, chatId]
      );

      // 2. Telegram Botu Üzerinden Onay Mesajı Gönder
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const responseMsg = `Your Telegram ID is: ${chatId}.\n\nYour ID has been successfully registered to the system. Thank you!`;
      
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseMsg
        })
      });

      console.log(`Success: User ${userId} linked to Telegram ${chatId}`);
    } else {
      console.log("No valid UserID found in message:", text);
    }

    // Telegram'a işlemin başarılı olduğunu (200 OK) her zaman dönmeliyiz 
    // yoksa mesajı tekrar tekrar gönderir.
    return res.status(200).json({ success: true });

  } catch (error) {
    // Hata olsa bile 200 dönüyoruz ki Telegram döngüye girmesin, ama hatayı logluyoruz.
    console.error("Telegram Webhook Error:", error);
    return res.status(200).send('ok');
  }
}