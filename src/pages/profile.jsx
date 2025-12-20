import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap, Mail, Send, Youtube, History, Calendar, 
  CheckCircle, PlusCircle, User, ArrowLeft, Trash2, Smartphone
} from "lucide-react";
import Link from "next/link";
import Navbar from "../components/Navbar"; 

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

 const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.error("Token bulunamadı");
      return;
    }

    const res = await fetch("/api/user/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "authorization": `Bearer ${token}`, // Header isminin küçük/büyük harf uyumuna dikkat
      },
    }); 
    
    const json = await res.json();
    
    // BURASI KRİTİK: Backend 'profile' olarak dönüyorsa profile, 'data' dönüyorsa data yazmalısın.
    if (json.success) {
      setUserData(json.profile || json.data); 
    } else {
      console.error("API Hatası:", json.msg);
    }
  } catch (err) {
    console.error("Yükleme hatası:", err);
  } finally {
    setLoading(false);
  }
};

  const handleAddChannel = async () => {
  if (!channelId) return;
  
  try {
    const res = await fetch("/api/user/channels", {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "authorization": `Bearer ${localStorage.getItem("auth_token")}`
      },
      body: JSON.stringify({ channelId: channelId })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setChannelId("");
      fetchProfile(); // Listeyi yenilemek için profil verisini tekrar çek
      alert("Kanal başarıyla eklendi!");
    } else {
      alert(data.msg || "Kanal eklenemedi.");
    }
  } catch (err) {
    alert("Bir bağlantı hatası oluştu.");
  }
};
const handleDeleteChannel = async (subId) => {
  if (!confirm("Bu kanalı takibi bırakmak istediğinize emin misiniz?")) return;

  try {
    const res = await fetch(`/api/user/channels?id=${subId}`, {
      method: "DELETE",
      headers: { 
          "authorization": `Bearer ${localStorage.getItem("auth_token")}`
      }
    });

    if (res.ok) {
      fetchProfile(); // Listeyi güncelle
    }
  } catch (err) {
    alert("Kanal silinemedi.");
  }
};

// JSX içinde kullanım:
// <Trash2 onClick={() => handleDeleteChannel(ch.id)} ... />
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} navOpen={navOpen} setNavOpen={setNavOpen} />

      <main className="pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard'a Dön
        </Link>

        {/* ÜST PANEL: PAKET VE BİLDİRİM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="w-32 h-32 text-yellow-400" /></div>
            <div className="relative z-10">
              <p className="text-cyan-400 font-bold tracking-widest text-sm uppercase mb-2">Abonelik Durumu</p>
              <h2 className="text-5xl font-black mb-4">{userData?.package} Plan</h2>
              <div className="flex items-center gap-4 text-gray-300">
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 text-sm">
                  <Calendar className="w-4 h-4 text-purple-400" /> Bitiş: {userData?.endDate}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6">Bildirim Kanalları</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-400" />
                <span className="text-sm">{userData?.notifications.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-blue-400" />
                <span className="text-sm">{userData?.notifications.telegram}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ALT PANEL: KANALLAR VE GEÇMİŞ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kanal Yönetimi */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Youtube className="w-8 h-8 text-red-500" />
              <h3 className="text-2xl font-bold">Takip Edilen Kanallar</h3>
            </div>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="YouTube Channel ID..." 
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition"
              />
              <button onClick={handleAddChannel} className="bg-cyan-600 hover:bg-cyan-500 px-6 rounded-xl font-bold transition">Ekle</button>
            </div>
            <div className="space-y-2">
              {userData?.activeChannels.map((ch) => (
                <div key={ch.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition">
                  <span className="text-sm font-medium">{ch.channelId}</span>
                  <Trash2 onClick={() => handleDeleteChannel(ch.id)} className="w-4 h-4 text-gray-500 hover:text-red-500 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          {/* Özet Geçmişi */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-8 h-8 text-cyan-400" />
              <h3 className="text-2xl font-bold">Özet Geçmişi</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {userData?.history.map((item) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition group">
                  <h4 className="font-bold text-sm group-hover:text-cyan-400">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.channel} • {item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Profile;