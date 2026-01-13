// pages/insights.jsx
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import { Search, BarChart3, Loader2, Youtube } from "lucide-react";
import { motion } from "framer-motion";

const ChannelInsights = () => {
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    // 1. Temel Kontrol: Boş mu?
    const trimmedInput = channelUrl.trim();
    if (!trimmedInput) return;

    setLoading(true);
    setError("");
    setResult(null);

    // 2. "@" Kontrolü: Eğer başında @ yoksa biz ekliyoruz
    const formattedChannelId = trimmedInput.startsWith("@") 
      ? trimmedInput 
      : `@${trimmedInput}`;

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/channel/summary", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        // Düzenlenmiş kanal ismini gönderiyoruz
        body: JSON.stringify({ channelId: formattedChannelId })
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Channel not found. Please check the name.");
      }
    } catch (err) {
      setError("Failed to fetch data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Navbar Props güncellendi */}
      <Navbar 
        isAuthenticated={true} 
        setIsAuthenticated={() => {}} 
        setShowModal={() => {}} 
        setNavOpen={() => {}} 
        navOpen={false} 
      />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">AI Channel Analyst</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">Analyze Any <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">YouTube Channel</span></h1>
            <p className="text-gray-400 text-lg mb-10">Enter the channel handle to get deep insights into content strategy.</p>
          </motion.div>

          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-2">
              <div className="flex items-center pl-4 text-gray-400">
                <span className="text-xl font-medium text-cyan-500/50">@</span>
              </div>
              <input
                type="text"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                // Placeholder'ı güncelledik
                placeholder="mrbeast or @mkbhd"
                className="w-full bg-transparent px-2 py-4 focus:outline-none text-white placeholder:text-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Analyze
              </button>
            </div>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="mt-4 text-red-400 flex items-center justify-center gap-2"
            >
               {error}
            </motion.p>
          )}
        </div>

        {/* Sonuç Alanı aynı kalıyor */}
        {result && (
          <div className="space-y-8 max-w-5xl mx-auto">
             <SummaryCard summary={result.summary} />
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.videos?.map((vid, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition group">
                        <p className="text-[10px] uppercase tracking-widest text-cyan-400/60 mb-3 font-bold">Recent Video {idx + 1}</p>
                        <h4 className="text-sm font-medium line-clamp-2 text-gray-200 group-hover:text-white transition">{vid.title}</h4>
                    </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChannelInsights;