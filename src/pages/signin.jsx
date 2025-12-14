// pages/signin.jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

// ❌ KALDIRILDI: Next.js API yolları aynı domain üzerinde çalıştığı için artık gerekli değildir.
// const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SignIn() {
  const router = useRouter(); // Google Auth Durumları
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); // Email/Password Auth Durumları
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Genel Hata Durumu
  const [error, setError] = useState(""); // Eğer token varsa → direkt ödeme ekranına

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
      router.replace("/CheckPackage"); // NOT: Sizin kodunuzda /payment yerine /checkPackage vardı, onu korudum.
    }
  }, [router]); // ✅ router dependency'sini ekledim. // Google script DOM'a ekleniyor

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.body.appendChild(script); // Cleanup fonksiyonu (ihtiyaç duyulursa) // return () => { document.body.removeChild(script); };
  }, []); // Google Login button render

  useEffect(() => {
    if (!googleLoaded || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // 👈 Burası .env'den geliyor
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleLoginBtn"),
      { theme: "outline", size: "large", width: "100%" }
    );
  }, [googleLoaded]); /** 🔥 Google Auth backend doğrulama */ // ✅ dependency listesi doğru

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError("");

    try {
      // ✅ DÜZELTME: API_URL kaldırıldı, '/api/auth/google' göreli yolu kullanıldı.
      const res = await fetch(`/api/auth/auth?action=google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError("Google doğrulama başarısız. " + (data.message || ""));
        setGoogleLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token); // token saklanıyor
      router.push("/CheckPackage"); // Başarılı login → ödeme ekranı
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during Google login.");
      setGoogleLoading(false);
    }
  }; /** 📧 E-posta/Şifre Auth backend doğrulama */
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(""); // Hem Google hem de Email formunun aynı anda gönderilmesini engelle

    if (googleLoading) return;

    try {
      // ✅ KONTROL: Burası zaten göreliydi, bu haliyle doğru çalışacaktır.
      // API dosyanızın src/pages/api/auth/login.js konumunda olduğunu varsayıyoruz.
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(
          data.message || "Login failed. Please check your information."
        );
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem("auth_token", data.token); // token saklanıyor
      router.push("/CheckPackage"); // Başarılı login → ödeme ekranı
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during the login process.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome Back 👋
        </h2>

        {/* 🔥 GOOGLE SIGN IN BUTONU */}
        <div id="googleLoginBtn" className="w-full flex justify-center mb-6" />

        {/* Google yükleniyorsa bu mesajı göster */}
        {googleLoading && (
          <p className="text-center text-green-600 mb-3">
            Google ile Giriş yapılıyor...
          </p>
        )}

        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-gray-500 text-sm">
            veya e-posta ile giriş yap
          </span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* 📧 E-POSTA VE ŞİFRE GİRİŞ FORMU */}
        <form onSubmit={handleEmailSignIn}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-posta Adresi
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="email@example.com"
              disabled={isSubmitting || googleLoading}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
              disabled={isSubmitting || googleLoading}
            />
          </div>

          {/* Hata mesajını hem Google hem de Email formu için ortak göster */}
          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out font-semibold disabled:bg-indigo-400"
            disabled={isSubmitting || googleLoading}
          >
            {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Hesabın yok mu?
          <a href="/signup" className="text-indigo-600 font-medium ml-1">
            Bir hesap oluştur
          </a>
        </p>
      </div>
    </div>
  );
}
