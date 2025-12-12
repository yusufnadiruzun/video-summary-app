// src/pages/api/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

// db.js dosyasının doğru yolu
import db from "../../../../lib/Db"; 

// JWT_SECRET'ı doğrudan process.env'den alın, Next.js bunu otomatik olarak yükler.
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; 

export default async function handler(req, res) {
  // Sadece POST metotlarını kabul et (çünkü tüm rotalarınız POST)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Next.js'te Express Router yok, URL'ye göre işlem yapmalıyız.
  // URL'yi alıyoruz: Örn: /api/auth?action=register
  const { action } = req.query; 

  // Eğer bu dosyayı pages/api/auth/[action].js olarak adlandırırsanız, 
  // action değişkenini req.query.action olarak alabilirsiniz. 
  // Kolaylık için tek dosya ve query parametresi kullandım: /api/auth?action=login

  const { email, password, name, credential } = req.body;

  try {
    switch (action) {
      // -------------------------------------------------------------------------
      // 📌 /api/auth?action=register
      // -------------------------------------------------------------------------
      case 'register':
        const hash = await bcrypt.hash(password, 10);

        // Kullanıcı oluştur
        const [result] = await db.execute(
          `INSERT INTO users (name,email,password_hash) VALUES (?,?,?)`,
          [name || null, email, hash]
        );

        // Yeni kullanıcıya Default Ücretsiz Paket Ver
        await db.execute(`
          INSERT INTO user_packages (user_id, package_type, Package_Status, Start_Date, End_Date)
          VALUES (?, 'free', 1, CURDATE(), NULL)
        `, [result.insertId]);

        return res.status(201).json({ message: "Kayıt başarılı" }); // 201 Created

      // -------------------------------------------------------------------------
      // 📌 /api/auth?action=login
      // -------------------------------------------------------------------------
      case 'login':
        const [u] = await db.execute("SELECT id, password_hash FROM users WHERE email=?", [email]);
        
        if (!u.length) {
          return res.status(404).json({ error: "Kullanıcı bulunamadı" });
        }

        const user = u[0];
        
        if (!user.password_hash) {
          return res.status(403).json({ error: "Bu hesap için şifre ayarlanmamıştır. Lütfen Google ile veya şifre sıfırlama ile giriş yapın." });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
          return res.status(403).json({ error: "Şifre yanlış" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token });
        
      // -------------------------------------------------------------------------
      // 📌 /api/auth?action=google
      // -------------------------------------------------------------------------
      case 'google':
        const google = await axios.get(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${credential}`
        );

        const { email: googleEmail, name: googleName, picture, sub } = google.data;
        let userId;

        const [existingUser] = await db.execute("SELECT id FROM users WHERE email=?", [googleEmail]);

        if (existingUser.length) {
            userId = existingUser[0].id;
        } 
        else {
            // Yeni kullanıcı kaydı
            const [ins] = await db.execute(
                `INSERT INTO users (email,name,google_sub,avatar) VALUES (?,?,?,?)`,
                [googleEmail, googleName, sub, picture]
            );
            userId = ins.insertId;

            // Default free paket ata
            await db.execute(`
                INSERT INTO user_packages (user_id, package_type, Package_Status, Start_Date, End_Date)
                VALUES (?, 'free', 1, CURDATE(), NULL)
            `, [userId]);
        }

        const googleToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token: googleToken });

      // -------------------------------------------------------------------------
      // 📌 /api/auth?action=guest
      // -------------------------------------------------------------------------
      case 'guest':
        const guestMail = `guest_${Date.now()}@local`;

        // Kullanıcı oluştur
        const [usr] = await db.execute(`INSERT INTO users (email) VALUES (?)`, [guestMail]);

        // Misafir paketi ekle
        await db.execute(`
            INSERT INTO user_packages (user_id, package_type, Package_Status, Start_Date, End_Date)
            VALUES (?, 'guest', 1, CURDATE(), NULL)
        `, [usr.insertId]);

        const guestToken = jwt.sign({ userId: usr.insertId, guest: true }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token: guestToken });

      default:
        return res.status(404).json({ error: "Geçersiz kimlik doğrulama rotası." });
    }
  } catch (err) {
    console.error("Kimlik doğrulama hatası:", err);
    // Kayıt hatası (email zaten var) için özel durum
    if (action === 'register' && err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Bu email zaten kayıtlı." });
    }
    return res.status(500).json({ error: "Sunucu hatası. İşlem tamamlanamadı." });
  }
}