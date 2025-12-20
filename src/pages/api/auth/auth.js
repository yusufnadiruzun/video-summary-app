import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import db from "../../../../lib/Db"; 

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { action } = req.query; 
  const { email, password, name, credential } = req.body;

  try {
    switch (action) {
      case 'register':
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
          `INSERT INTO users (name, email, password_hash) VALUES (?,?,?)`,
          [name || null, email, hash]
        );

        // Yeni şema: packageId=1 (Free), package_status_id=2 (Aktif)
        await db.execute(`
          INSERT INTO user_packages (user_id, packageId, package_status_id, Start_Date, End_Date)
          VALUES (?, 1, 2, CURDATE(), NULL)
        `, [result.insertId]);

        return res.status(201).json({ message: "Registration successful" });

      case 'login':
        const [u] = await db.execute("SELECT id, password_hash, is_admin FROM users WHERE email=?", [email]);
        if (!u.length) return res.status(404).json({ error: "User not found" });

        const user = u[0];
        if (!user.password_hash) return res.status(403).json({ error: "No password set. Use Google Sign-In." });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(403).json({ error: "Invalid password" });

        const token = jwt.sign(
          { userId: user.id, isAdmin: user.is_admin === 1 }, 
          JWT_SECRET, 
          { expiresIn: "30d" }
        );
        return res.json({ token, isAdmin: user.is_admin === 1 });
        
     case 'google':
        const google = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${credential}`);
        const { email: gEmail, name: gName, picture, sub } = google.data;
        let userId;
        let isAdminStatus = false;

        // 1. Kullanıcı var mı kontrol et
        const [existingUser] = await db.execute("SELECT id, is_admin FROM users WHERE email=?", [gEmail]);

        if (existingUser.length > 0) {
            userId = existingUser[0].id;
            isAdminStatus = existingUser[0].is_admin === 1;

            // ÖNEMLİ: Eğer kullanıcı users tablosunda var ama user_packages tablosunda yoksa diye 
            // burada bir kontrol/ekleme yapmak garantiye alır.
            const [hasPackage] = await db.execute("SELECT id FROM user_packages WHERE user_id=?", [userId]);
            if (hasPackage.length === 0) {
                await db.execute(`
                    INSERT INTO user_packages (user_id, packageId, package_status_id, Start_Date, End_Date, daily_limit, daily_used)
                    VALUES (?, 1, 2, CURDATE(), NULL, 3, 0)
                `, [userId]);
            }
        } 
        else {
            // 2. Yeni kullanıcı oluştur
            const [ins] = await db.execute(
                `INSERT INTO users (email, name, google_sub, avatar) VALUES (?,?,?,?)`,
                [gEmail, gName, sub, picture]
            );
            userId = ins.insertId;

            // 3. Paket kaydını hemen oluştur (Veri düşmüyorsa buradaki DEFAULT değerleri açıkça yazalım)
            await db.execute(`
                INSERT INTO user_packages (user_id, packageId, package_status_id, Start_Date, End_Date, daily_limit, daily_used)
                VALUES (?, 1, 2, CURDATE(), NULL, 3, 0)
            `, [userId]);
            
            console.log(`Yeni Google kullanıcısı ve paketi oluşturuldu. UserID: ${userId}`);
        }

        const gToken = jwt.sign({ userId, isAdmin: isAdminStatus }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token: gToken, isAdmin: isAdminStatus });

      // ... guest kısmı aynı ...
      case 'guest':
        const guestMail = `guest_${Date.now()}@local`;
        const [usr] = await db.execute(`INSERT INTO users (email) VALUES (?)`, [guestMail]);
        await db.execute(`
            INSERT INTO user_packages (user_id, packageId, package_status_id, Start_Date, End_Date, daily_limit, daily_used)
            VALUES (?, 1, 2, CURDATE(), NULL, 3, 0)
        `, [usr.insertId]);

        const guestToken = jwt.sign({ userId: usr.insertId, guest: true, isAdmin: false }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token: guestToken });

      default:
        return res.status(404).json({ error: "Invalid auth action." });
    }
  } catch (err) {
    console.error("Auth Error Detail:", err); // Hatayı terminalde daha detaylı gör
    return res.status(500).json({ error: "Internal server error." });
  }
}