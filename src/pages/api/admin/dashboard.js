import db from "../../../../lib/Db";
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; 

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = verify(token, JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).json({ error: "Forbidden" });

        // 1. Genel Metrikler
        const [userCounts] = await db.execute(`
            SELECT 
                COUNT(*) AS total_users,
                SUM(CASE WHEN is_admin = 0 AND (email LIKE 'guest_%' OR email IS NULL) THEN 1 ELSE 0 END) AS guest_users,
                SUM(CASE WHEN is_admin = 0 AND email NOT LIKE 'guest_%' THEN 1 ELSE 0 END) AS registered_users
            FROM users
        `);

        // 2. Tüm Kullanıcılar ve Paket Bilgileri
        // LEFT JOIN kullanarak paketi olmasa bile tüm kullanıcıları çekiyoruz
        const [allData] = await db.execute(`
            SELECT 
                u.id, u.email, u.created_at as signup_date,
                up.package_type, up.Package_Status, up.Start_Date, up.End_Date,
                s.telegram_chat_id, s.whatsapp_phone
            FROM users u
            LEFT JOIN user_packages up ON u.id = up.user_id
            LEFT JOIN subscriptions s ON u.id = s.user_id
            ORDER BY u.created_at DESC
        `);

        return res.status(200).json({
            metrics: userCounts[0],
            users: allData
        });

    } catch (error) {
        return res.status(401).json({ error: "Session expired" });
    }
}