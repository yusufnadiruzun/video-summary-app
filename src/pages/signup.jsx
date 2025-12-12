// pages/signup.jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

// ❌ KALDIRILDI: Next.js API yolları aynı domain üzerinde çalıştığı için artık gerekli değildir.
// const API_URL = process.env.NEXT_PUBLIC_API_URL; 

export default function SignUp() {
  const router = useRouter();
  
  // Google Auth Durumları
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Email/Password Auth Durumları
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Genel Hata Durumu
  const [error, setError] = useState("");

  // Eğer token varsa → direkt ödeme ekranına (kayıt olmaya gerek yok)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
      router.replace("/payment"); // NOT: checkPackage yerine payment kullanmışsınız, bunu korudum.
    }
  }, [router]); // router dependency'si eklendi.

  // Google script DOM'a ekleniyor
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.body.appendChild(script);
    // Cleanup fonksiyonu eklenmedi, genellikle sayfa yüklemesinde bir kez yapılır.
  }, []);

  // Google Login button render
  useEffect(() => {
    if (!googleLoaded || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // 👈 .env'den geliyor
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignUpBtn"), // ID Sign In sayfasından farklı
      { theme: "outline", size: "large", width: "100%" }
    );
  }, [googleLoaded]);

  /** 🔥 Google Auth backend doğrulama (Sign Up/In için) */
  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError("");

    try {
      // ✅ DÜZELTME: API_URL kaldırıldı, '/api/auth/google' göreli yolu kullanıldı.
      const res = await fetch(`/api/auth/google`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError("Google ile kayıt başarısız. " + (data.message || ""));
  	   setGoogleLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token); // token saklanıyor
      router.push("/checkPackage"); // Başarılı kayıt/giriş → ödeme ekranı
    } catch (err) {
      console.error(err);
      setError("Google kayıt sırasında beklenmeyen bir hata oluştu.");
      setGoogleLoading(false);
    }
  };
  
  /** 📧 E-posta/Şifre ile KAYIT backend doğrulama */
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    console.log('Email Sign Up initiated with:', { email, password });
    try {
      // ✅ KONTROL: Burası zaten göreliydi ve doğru çalışacaktır.
      // API dosyanızın src/pages/api/auth/register.js konumunda olduğunu varsayıyoruz.
      const res = await fetch(`/api/auth/register`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log('Backend response status:', res.status);

      const data = await res.json();

      if (!res.ok || !data.token) { // Status 200 kontrolü yerine res.ok kontrolü daha güvenlidir.
        setError(data.message || "Kayıt başarısız. Lütfen farklı bir e-posta deneyin.");
        setIsSubmitting(false);
        return
      }

      console.log(data);
      localStorage.setItem("auth_token", data.token); // token saklanıyor
      router.push("/checkPackage"); // Başarılı kayıt → ödeme ekranı
      
    } catch (err) {
      console.error(err);
      setError("Kayıt işlemi sırasında beklenmeyen bir hata oluştu.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Your Account ✨
        </h2>

        {/* 🔥 GOOGLE SIGN UP BUTONU */}
        <div id="googleSignUpBtn" className="w-full flex justify-center mb-6" />

        {googleLoading && <p className="text-center text-green-600 mb-3">Google ile Kayıt yapılıyor...</p>}

        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300"/>
          <span className="px-3 text-gray-500 text-sm">veya e-posta ile kayıt ol</span>
          <hr className="flex-1 border-gray-300" />
        </div>
        
        {/* 📧 E-POSTA VE ŞİFRE KAYIT FORMU */}
        <form onSubmit={handleEmailSignUp}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="En az 6 karakter"
              disabled={isSubmitting || googleLoading}
            />
          </div>

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out font-semibold disabled:bg-green-400"
            disabled={isSubmitting || googleLoading}
          >
            {isSubmitting ? "Kayıt Yapılıyor..." : "Hesap Oluştur"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Zaten bir hesabın var mı?
          <a href="/signin" className="text-indigo-600 font-medium ml-1">Giriş Yap</a>
        </p>
      </div>
    </div>
  );
}