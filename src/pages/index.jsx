// pages/index.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router"; // Next.js yönlendirme için eklendi

// Diğer bileşen importlarınız
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SummaryCard from "../components/SummaryCard";
import PricingModal from "../components/PricingModal";

// Örnek Paket Verisi (Sizin gerçek packages dizinizle aynı olmalı)
const packages = [
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    features: [
      "30 video summaries",
      "1 channel tracking",
      "Basic AI summaries",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited summaries",
      "5 channel tracking",
      "Real-time notifications",
      "Detailed analytics",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$39",
    period: "/month",
    features: [
      "Everything in Pro +",
      "Telegram & Email delivery",
      "Custom reports",
      "API access",
      "24/7 priority support",
    ],
    popular: false,
  },
];

const Home = () => {
  // YÖNLENDİRME HOOK'U TANIMLANDI
  const router = useRouter();

  const [videoId, setVideoId] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  // Yeni state: Anahtar kelimeler
  const [keywords, setKeywords] = useState("");

  // --- useEffect ve Helper Fonksiyonlar ---

  // GÜNCELLENMİŞ useEffect: auth_token kontrolü eklendi
  useEffect(() => {
    // Gerçek kullanıcının giriş yapıp yapmadığını kontrol etmek için auth_token'i kontrol et.
    const authToken =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const guestToken =
      typeof window !== "undefined"
        ? localStorage.getItem("guest_token")
        : null;

    // Eğer auth_token veya guest_token varsa, isAuthenticated true olur.
    if (authToken || guestToken) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const extractYouTubeId = (url) => {
    const match =
      url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/) ||
      url.match(/^([a-zA-Z0-9_-]{11})$/);
    return match ? match[1] : null;
  };

  const getGuestToken = async () => {
    setIsGuestLoading(true);

    try {
      const response = await fetch("/api/auth/auth?action=guest", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      localStorage.setItem("guest_token", data.token);
      // Başarılı olursa isAuthenticated true yapılır.
      setIsAuthenticated(true);
      setShowModal(false);
    } catch (error) {
      console.error("Guest API çağrısında hata:", error);
      setError("Failed to start guest session.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleGetSummary = useCallback(
    async (override) => {
      if (!isAuthenticated && !override) {
        return setShowModal(true);
      }

      setError("");
      setSummary("");

      const id = extractYouTubeId(videoId);
      if (!videoId.trim()) return setError("Please enter a YouTube link.");
      if (!id) return setError("Invalid YouTube link or ID.");

      setLoading(true);

      const apiRoute = "/api/video/summary";
      const guest_token =
        typeof window !== "undefined"
          ? localStorage.getItem("guest_token")
          : null;
      // Auth token'ı kontrol et (eğer varsa, guest_token yerine onu kullanmak isteyebilirsiniz)
      const auth_token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const tokenToUse = auth_token || guest_token;

      try {
        const response = await fetch(apiRoute, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
          },
          body: JSON.stringify({
            videoId: id,
            summaryType: "short",
            keywords: keywords.trim(),
          }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            setShowModal(true);
            return;
          }

          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown server error." }));
          throw new Error(errorData.error || `Failed: ${response.status}`);
        }

        const data = await response.json();
        setSummary(data.summary || JSON.stringify(data, null, 2));
      } catch (error) {
        console.error("API çağrısında hata:", error.message);
        setError(error.message);
        setSummary("");
      } finally {
        setLoading(false);
      }
    },
    [videoId, isAuthenticated, keywords]
  );

 
  // --- GÜNCELLENMİŞ PAKET SEÇME FONKSİYONU ---
  const handleSelectPackage = (pkgName) => {
    if (typeof window !== "undefined") {
      setShowModal(false);
      const authToken = localStorage.getItem("auth_token");

      // Seçilen paketi hala localStorage'da tutabiliriz çünkü Checkout sayfası bunu okuyacak
      localStorage.setItem("selectedPackage", pkgName.name);

      if (authToken) {
        
        router.push("/CheckPackage");
      } else {
        // 🚨 DEĞİŞİKLİK: Hedefi URL parametresi olarak gönderiyoruz
        router.push("/signin?callbackUrl=/CheckPackage");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      <Navbar
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        setShowModal={setShowModal}
      />

      <main>
        <Hero
          videoId={videoId}
          setVideoId={setVideoId}
          keywords={keywords}
          setKeywords={setKeywords}
          handleGetSummary={handleGetSummary}
          loading={loading}
          error={error}
        />

        <SummaryCard summary={summary} />
      </main>

      <PricingModal
        showModal={showModal}
        setShowModal={setShowModal}
        isAuthenticated={isAuthenticated}
        isGuestLoading={isGuestLoading}
        getGuestToken={getGuestToken}
        handleSelectPackage={handleSelectPackage} // GÜNCELLENDİ
        packages={packages}
      />
    </div>
  );
};

export default Home;
