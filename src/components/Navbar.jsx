// components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, X, Menu, User, BarChart3, Youtube } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

const Navbar = ({ isAuthenticated, setIsAuthenticated, setNavOpen, navOpen, setShowModal }) => {
  const router = useRouter();
  const [userPkg, setUserPkg] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mevcut sayfa kontrolleri
  const isProfilePage = router.pathname === "/profile";
  const isInsightsPage = router.pathname === "/insights";

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      const guestToken = localStorage.getItem("guest_token");
      setIsGuest(!!guestToken);

      if (isAuthenticated) {
        const token = localStorage.getItem("auth_token");
        if (token) {
          fetch("/api/user/package", {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => setUserPkg(data))
            .catch(err => console.error("Paket yüklenemedi", err));
        }
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserPkg(null);
    }
  }, [isAuthenticated]);

  const hasAccessToInsights = userPkg?.packageId === 3 || userPkg?.packageId === 4;

  // --- YENİ: Upgrade Buton Mantığı ---
  const handleUpgradeClick = () => {
    if (isProfilePage) {
      // Eğer profil sayfasındaysak yönlendir
      router.push("/pricing");
    } else {
      // Değilsek modalı aç
      setShowModal(true);
    }
    // Mobil menü açıksa kapat
    if (navOpen) setNavOpen(false);
  };

  if (!mounted) {
    return <header className="fixed top-0 left-0 right-0 z-50 h-[73px] bg-black/50 backdrop-blur-xl border-b border-white/10" />;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo Bölümü */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              SummarizeAI
            </h1>
          </Link>
        </div>
      
        {/* Masaüstü Navigasyon */}
        <nav className="hidden md:flex items-center space-x-6">
          
          {isInsightsPage && (
            <Link href="/" className="text-gray-300 hover:text-cyan-400 transition flex items-center gap-2 text-sm">
              <Youtube className="w-4 h-4" /> Summarize Video
            </Link>
          )}

          {isAuthenticated && hasAccessToInsights && !isInsightsPage && (
            <Link href="/insights" className="text-gray-300 hover:text-cyan-400 transition flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" /> Channel Insights
            </Link>
          )}

          {/* Upgrade Butonu (Dinamik onClick eklendi) */}
          <button
            onClick={handleUpgradeClick}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition transform hover:scale-105 text-sm flex items-center gap-1 text-white"
          >
            Upgrade <Zap className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              {!isProfilePage && !isGuest && (
                <Link href="/profile" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20 transition text-sm">
                  <User className="w-4 h-4" /> My Profile
                </Link>
              )}
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  localStorage.clear();
                  router.push("/");
                }}
                className="text-gray-400 hover:text-red-400 transition text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            !isProfilePage && (
              <Link href="/signin" className="text-gray-300 hover:text-white transition text-sm font-medium">
                Sign In
              </Link>
            )
          )}
        </nav>

        {/* Mobil Menü Butonu */}
        <button onClick={() => setNavOpen(!navOpen)} className="md:hidden p-2 text-white">
          {navOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobil Menü İçeriği */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 p-6 md:hidden flex flex-col space-y-4"
          >
            {isInsightsPage && (
              <Link href="/" onClick={() => setNavOpen(false)} className="text-gray-300 flex items-center gap-2 py-2">
                <Youtube className="w-5 h-5" /> Summarize Video
              </Link>
            )}

            {isAuthenticated && hasAccessToInsights && !isInsightsPage && (
              <Link href="/insights" onClick={() => setNavOpen(false)} className="text-gray-300 flex items-center gap-2 py-2">
                <BarChart3 className="w-5 h-5" /> Channel Insights
              </Link>
            )}
            
            {/* Mobil Upgrade Butonu (Dinamik onClick eklendi) */}
            <button
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              Upgrade <Zap className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <>
                {!isGuest && (
                  <Link href="/profile" onClick={() => setNavOpen(false)} className="text-cyan-400 flex items-center gap-2 py-2">
                    <User className="w-5 h-5" /> My Profile
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    localStorage.clear();
                    setNavOpen(false);
                    router.push("/");
                  }}
                  className="text-red-400 text-left py-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/signin" onClick={() => setNavOpen(false)} className="text-gray-300 py-2 text-center border border-white/10 rounded-xl">
                Sign In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;