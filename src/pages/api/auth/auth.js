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
      // -------------------------------------------------------------------------
      // 📌 REGISTER
      // -------------------------------------------------------------------------
      case 'register':
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
          `INSERT INTO users (name, email, password_hash) VALUES (?,?,?)`,
          [name || null, email, hash]
        );

        await db.execute(`
          INSERT INTO user_packages (user_id, package_type, Package_Status, Start_Date, End_Date)
          VALUES (?, 'free', 1, CURDATE(), NULL)
        `, [result.insertId]);

        return res.status(201).json({ message: "Registration successful" });

      // -------------------------------------------------------------------------
      // 📌 LOGIN (Email & Password)
      // -------------------------------------------------------------------------
      case 'login':
        // 🔥 DÜZELTME: is_admin sütununu da seçiyoruz
        const [u] = await db.execute("SELECT id, password_hash, is_admin FROM users WHERE email=?", [email]);
        
        if (!u.length) {
          return res.status(404).json({ error: "User not found" });
        }

        const user = u[0];
        
        if (!user.password_hash) {
          return res.status(403).json({ error: "No password set for this account. Use Google Sign-In." });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
          return res.status(403).json({ error: "Invalid password" });
        }

        // 🔥 DÜZELTME: Token içine isAdmin eklendi
        const token = jwt.sign(
          { userId: user.id, isAdmin: user.is_admin === 1 }, 
          JWT_SECRET, 
          { expiresIn: "30d" }
        );
        return res.json({ token, isAdmin: user.is_admin === 1 });
        
      // -------------------------------------------------------------------------
      // 📌 GOOGLE LOGIN
      // -------------------------------------------------------------------------
      case 'google':
        const google = await axios.get(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${credential}`
        );

        const { email: googleEmail, name: googleName, picture, sub } = google.data;
        let userId;
        let isAdminStatus = false;

        // 🔥 DÜZELTME: is_admin sütununu da seçiyoruz
        const [existingUser] = await db.execute("SELECT id, is_admin FROM users WHERE email=?", [googleEmail]);

        if (existingUser.length) {
            userId = existingUser[0].id;
            isAdminStatus = existingUser[0].is_admin === 1;
        } 
        else {
            const [ins] = await db.execute(
                `INSERT INTO users (email,name,google_sub,avatar) VALUES (?,?,?,?)`,
                [googleEmail, googleName, sub, picture]
            );
            userId = ins.insertId;

            await db.execute(`
                INSERT INTO user_packages (user_id, package_type, Package_Status, Start_Date, End_Date)
                VALUES (?, 'free', 1, CURDATE(), NULL)
            `, [userId]);
        }

        // 🔥 DÜZELTME: Token içine isAdmin eklendi
        const googleToken = jwt.sign(
          { userId, isAdmin: isAdminStatus }, 
          JWT_SECRET, 
          { expiresIn: "30d" }
        );
        return res.json({ token: googleToken, isAdmin: isAdminStatus });

      // -------------------------------------------------------------------------
      // 📌 GUEST LOGIN
      // -------------------------------------------------------------------------
      case 'guest':
        const guestMail = `guest_${Date.now()}@local`;
        const [usr] = await db.execute(`INSERT INTO users (email) VALUES (?)`, [guestMail]);

        await db.execute(`
            INSERT INTO user_packages (user_id, package_type, Package_Status, Start_Date, End_Date)
            VALUES (?, 'guest', 1, CURDATE(), NULL)
        `, [usr.insertId]);

        const guestToken = jwt.sign({ userId: usr.insertId, guest: true, isAdmin: false }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token: guestToken });

      default:
        return res.status(404).json({ error: "Invalid auth action." });
    }
  } catch (err) {
    console.error("Auth Error:", err);
    if (action === 'register' && err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Email already registered." });
    }
    return res.status(500).json({ error: "Internal server error." });
  }
}