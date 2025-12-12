// components/Hero.jsx
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = ({ videoId, setVideoId, keywords, setKeywords, handleGetSummary, loading, error }) => {
  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-4xl mx-auto">
        {/* ... (Başlık ve Açıklama kısmı aynı kalacak) ... */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
            Summarize Videos
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              in 30 Seconds
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed">
            Instantly summarize YouTube videos. Save time, focus on knowledge.
          </p>
        </motion.div>

        {/* Input Bölümü */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-10 sm:mt-12 max-w-3xl mx-auto"
        >
          {/* Video Linki Input'u */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 sm:p-3 shadow-2xl">
            <input
              type="text"
              placeholder="Paste YouTube link here..."
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGetSummary()}
              className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-transparent text-white placeholder-gray-400 outline-none text-base sm:text-lg"
            />
            <button
              onClick={() => handleGetSummary()}
              disabled={loading}
              className="px-6 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-purple-500/40 transition transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Summarize <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </div>

          {/* Yeni Anahtar Kelime Input'u */}
          <input
            type="text"
            placeholder="Optional: Key topics (e.g., 'marketing strategies, AI ethics')"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGetSummary()}
            className="mt-4 w-full px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 outline-none text-sm focus:border-cyan-500 transition"
          />

          {error && (
            <p className="mt-4 text-red-400 text-center font-medium text-sm sm:text-base">
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;