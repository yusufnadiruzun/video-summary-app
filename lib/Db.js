import mysql from "mysql2/promise";
// Eğer Next.js .env.local dosyasını otomatik yüklemezse bu satırı geri ekleyebilirsiniz:
// import "dotenv/config"; 

const pool = mysql.createPool({
  host: process.env.DB_HOST || "summaryapp.cpa68wemaim6.eu-north-1.rds.amazonaws.com",
  user: process.env.DB_USER || "tubeaiproject",
  port: process.env.DB_PORT || "3306",
  password: process.env.DB_PASSWORD || "summaryapp123",
  database: process.env.DB_NAME || "summaryapp",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
