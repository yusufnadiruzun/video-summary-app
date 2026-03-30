import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

const resend = new Resend(process.env.RESEND_API_KEY);

// BURASI KRİTİK: "export default async function handler..." şeklinde olmalı
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const verificationToken = jwt.sign(
      { email, code }, 
      process.env.JWT_SECRET, 
      { expiresIn: '5m' }
    );

    await resend.emails.send({
      from: 'SummarizeAI noreply@kdemir.com', // Kendi domainini bağlayınca burayı güncelle
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: white; border-radius: 20px;">
          <h2 style="color: #06b6d4;">SummarizeAI</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px; color: #22d3ee;">${code}</h1>
          <p style="font-size: 12px; color: #94a3b8;">This code will expire in 5 minutes.</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, verificationToken });
  } catch (error) {
    console.error("Resend Error:", error);
    return res.status(500).json({ success: false, msg: "Failed to send email." });
  }
}