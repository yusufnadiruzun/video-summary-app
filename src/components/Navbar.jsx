import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, X, Menu, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router"; // Router eklendi

const Navbar = ({
  isAuthenticated,
  setIsAuthenticated,
  setNavOpen,
  navOpen,
  setShowModal,
}) => {
  const router = useRouter(); // Router'ı tanımladık
  const isProfilePage = router.pathname === "/profile"; // Sayfa kontrolü

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3"> {/* Logoya link eklendi */}
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              SummarizeAI
            </h1>
          </Link>
        </div>
      
        <nav className="hidden md:flex items-center space-x-8">
          {isAuthenticated ? (
            <>
              {/* Sadece profil sayfasında değilsek Profil linkini göster */}
              {!isProfilePage && (
                <Link href="/profile" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20 transition">
                  <User className="w-4 h-4" /> My Profile
                </Link>
              )}
              
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("guest_token");
                  router.push("/"); // Çıkış yapınca ana sayfaya at
                }}
                className="text-gray-400 hover:text-red-400 transition text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            // Giriş yapılmamışsa ve profil sayfasında değilsek göster
            !isProfilePage && (
              <>
                <Link href="/signin" className="text-gray-300 hover:text-white transition">Sign In</Link>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition transform hover:scale-105 text-sm"
                >
                  Upgrade <Zap className="w-4 h-4 inline ml-1" />
                </button>
              </>
            )
          )}
        </nav>

        <button onClick={() => setNavOpen(!navOpen)} className="md:hidden p-2">
          {navOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-6 py-8 space-y-6 text-center">
              <Link href="/" onClick={() => setNavOpen(false)} className="block text-lg text-gray-300 hover:text-white">Home</Link>
              <Link href="/pricing" onClick={() => setNavOpen(false)} className="block text-lg text-gray-300 hover:text-white">Pricing</Link>
              
              {/* Profil sayfasında değilsek mobilde de Upgrade'i göster */}
              {!isProfilePage && (
                <button
                  onClick={() => {
                    setShowModal(true);
                    setNavOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 py-3 rounded-full font-semibold"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;