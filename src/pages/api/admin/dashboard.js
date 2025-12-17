import db from "../../../../lib/Db";
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; 

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // --- GÜVENLİK KONTROLÜ: Header'dan Bearer Token Okuma ---
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid authorization header." });
    }

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN_BURADA" -> TOKEN_BURADA kısmını alır

    try {
        const decoded = verify(token, JWT_SECRET);
        
        // Token içindeki isAdmin kontrolü
        if (!decoded.isAdmin) { 
            return res.status(403).json({ error: "Admin privileges required." });
        }
        
        // --- DATA FETCHING ---

        // 1. General Metrics
        const [userCounts] = await db.execute(`
            SELECT 
                COUNT(DISTINCT u.id) AS total_users,
                COUNT(DISTINCT CASE WHEN up.package_type = 'guest' OR up.package_type IS NULL THEN u.id END) AS guest_users,
                COUNT(DISTINCT CASE WHEN up.package_type IN ('pro', 'premium') THEN u.id END) AS paid_users
            FROM users u
            LEFT JOIN user_packages up ON u.id = up.user_id;
        `);
        
        // 2. Package & Subscription Details
        const [packageData] = await db.execute(`
            SELECT 
                u.id as user_id, 
                u.email,
                u.created_at, 
                up.package_type, 
                up.Package_Status,
                up.End_Date, 
                s.channel_id,
                s.id as subscription_id,
                s.telegram_chat_id,
                s.whatsapp_phone,
                s.notification_email
            FROM user_packages up
            JOIN users u ON up.user_id = u.id
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE up.package_type IN ('pro', 'premium') 
            ORDER BY up.package_type DESC, u.email ASC
        `);
        
        // 3. Transform Data (Reducer)
        const summaryByPackage = packageData.reduce((acc, row) => {
            const pkg = row.package_type || 'unknown';
            if (!acc[pkg]) {
                acc[pkg] = {
                    count: 0,
                    users: {},
                    total_subscriptions: 0
                };
            }

            if (!acc[pkg].users[row.email]) {
                 acc[pkg].count += 1;
                 acc[pkg].users[row.email] = {
                    id: row.user_id,
                    email: row.email,
                    createdAt: row.created_at,
                    endDate: row.End_Date,
                    status: row.Package_Status === 1 ? 'Aktif' : 'Pasif',
                    subscriptions: []
                 };
            }
            
            if (row.channel_id) {
                acc[pkg].users[row.email].subscriptions.push({
                    channel_id: row.channel_id,
                    subscription_id: row.subscription_id,
                    notifications: {
                        telegram: !!row.telegram_chat_id,
                        whatsapp: !!row.whatsapp_phone,
                        email: !!row.notification_email
                    }
                });
                acc[pkg].total_subscriptions += 1;
            }

            return acc;
        }, {});

        // 4. Return Response
        return res.status(200).json({
            general_metrics: {
                total_users: userCounts[0].total_users || 0,
                guest_users: userCounts[0].guest_users || 0,
                paid_users: userCounts[0].paid_users || 0,
            },
            package_details: summaryByPackage,
        });

    } catch (error) {
        console.error("JWT Verify/Fetch Error:", error.message);
        return res.status(401).json({ error: "Invalid or expired session." });
    }
}