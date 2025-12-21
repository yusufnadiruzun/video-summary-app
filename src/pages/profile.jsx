"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Youtube,
  History,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Trash2,
  Save,
  Edit2,
  Lock,
  X,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

// Özet İçeriğini Gösteren Modal
const SummaryModal = ({ isOpen, onClose, summary }) => {
  if (!isOpen || !summary) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-slate-900 border border-white/10 rounded-[2rem] max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <FileText className="text-cyan-400" />
            {/* Burada ID yerine Video İsmi Yazıyor */}
            <h3 className="text-lg font-bold text-white leading-tight">{summary.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar text-gray-300 leading-relaxed">
          <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Source Channel</p>
              <p className="text-white text-sm font-medium">{summary.channel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Video ID</p>
              <p className="text-gray-400 text-xs font-mono">{summary.videoId}</p>
            </div>
          </div>

          {/* Özet metni burada 'summary.summary' olarak basılıyor */}
          <div className="whitespace-pre-wrap text-sm md:text-base">
            {summary.summary || "Summary content not found."}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-center">
            <button onClick={onClose} className="px-10 py-3 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition shadow-lg">
              Close
            </button>
        </div>
      </motion.div>
    </div>
  );
};

const LimitModal = ({ isOpen, onClose, plan, limit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full text-center"
      >
        <Zap className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h3 className="text-3xl font-black mb-3 text-white">Limit Reached!</h3>
        <p className="text-gray-400 mb-8">
          On <span className="text-cyan-400">{plan}</span> plan, you can follow
          up to <span className="text-white">{limit} channel(s)</span>.
        </p>
        <Link
          href="/pricing"
          className="block w-full bg-white text-black py-4 rounded-2xl font-bold mb-2 transition hover:bg-cyan-400"
        >
          Upgrade Now
        </Link>
        <button
          onClick={onClose}
          className="text-gray-500 text-sm hover:text-white transition"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [isEditingNotif, setIsEditingNotif] = useState(false);
  const [tempNotif, setTempNotif] = useState({ email: "", telegram: "" });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null); // Pop-up için
  const [modalData, setModalData] = useState({ plan: "", limit: 0 });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/signin");
        return;
      }
      const res = await fetch("/api/user/profile", {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setUserData(json.data);
        setTempNotif({
          email: json.data.notifications.email || "",
          telegram: json.data.notifications.telegram || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    const hasTelegramAccess =
      userData?.package === "Pro" || userData?.package === "Premium";
    const payload = { email: tempNotif.email };
    if (hasTelegramAccess) payload.telegram = tempNotif.telegram;

    try {
      const res = await fetch("/api/user/update-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsEditingNotif(false);
        fetchProfile();
      } else {
        alert("Update failed.");
      }
    } catch (err) {
      alert("Connection error.");
    }
  };

  const handleAddChannel = async () => {
    if (!channelId) return;
    const plan = userData?.package;
    const currentCount = userData?.activeChannels?.length || 0;
    if (plan === "Free") {
      setModalData({ plan: "Free", limit: 0 });
      setShowLimitModal(true);
      return;
    }
    if (plan === "Starter" && currentCount >= 1) {
      setModalData({ plan: "Starter", limit: 1 });
      setShowLimitModal(true);
      return;
    }

    try {
      const res = await fetch("/api/user/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ channelId }),
      });
      if (res.ok) {
        setChannelId("");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white italic">
        Loading Profile...
      </div>
    );
  const isStarterOrFree =
    userData?.package === "Starter" || userData?.package === "Free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans pb-20">
      <Navbar isAuthenticated={true} />

      <LimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        plan={modalData.plan}
        limit={modalData.limit}
      />
      <SummaryModal
        isOpen={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        summary={selectedSummary}
      />

      <main className="pt-32 px-4 max-w-6xl mx-auto space-y-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition group mb-4"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Dashboard
        </Link>

        {/* Status and Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={100} />
            </div>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-2">
              Account Status
            </p>
            <h2 className="text-5xl font-black mb-4">
              {userData?.package} Plan
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span className="bg-white/5 px-4 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <Calendar size={14} className="text-purple-400" /> Status:{" "}
                {userData?.endDate}
              </span>
              <span className="text-cyan-400 font-medium">
                Limits: {userData?.activeChannels.length} /{" "}
                {isStarterOrFree ? "1" : "Unlimited"}
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle size={20} className="text-green-400" /> Settings
              </h3>
              <button
                onClick={() =>
                  isEditingNotif
                    ? handleUpdateNotifications()
                    : setIsEditingNotif(true)
                }
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-cyan-400"
              >
                {isEditingNotif ? <Save size={18} /> : <Edit2 size={18} />}
              </button>
            </div>
            <div className="space-y-4 text-left">
              <label className="text-gray-400 text-[10px] font-bold uppercase">
                Email
              </label>
              <input
                disabled={!isEditingNotif}
                value={tempNotif.email}
                onChange={(e) =>
                  setTempNotif({ ...tempNotif, email: e.target.value })
                }
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm"
              />

              <label className="text-gray-400 text-[10px] font-bold uppercase block mt-2">
                Telegram
              </label>
              <div className="relative">
                <input
                  disabled={!isEditingNotif || isStarterOrFree}
                  value={tempNotif.telegram || ""}
                  onChange={(e) =>
                    setTempNotif({ ...tempNotif, telegram: e.target.value })
                  }
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm disabled:opacity-30"
                />
                {isStarterOrFree && (
                  <Lock
                    className="absolute right-3 top-2 text-gray-500"
                    size={14}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Channels Section */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-500">
              <Youtube /> Followed Channels
            </h3>
            <div className="flex gap-2 mb-6">
              <input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Channel ID..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <button
                onClick={handleAddChannel}
                className="bg-white text-black px-6 rounded-xl font-bold hover:bg-cyan-400"
              >
                Add
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {userData?.activeChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10"
                >
                  <span className="text-sm font-medium truncate max-w-[80%]">
                    {ch.channelId}
                  </span>
                  <button
                    onClick={async () => {
                      if (confirm("Remove?")) {
                        await fetch(`/api/user/channels?id=${ch.id}`, {
                          method: "DELETE",
                          headers: {
                            authorization: `Bearer ${localStorage.getItem(
                              "auth_token"
                            )}`,
                          },
                        });
                        fetchProfile();
                      }
                    }}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
              <History /> Recent Summaries
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
              {userData?.history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSummary(item)}
                  className="w-full text-left p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 hover:bg-white/10 transition group"
                >
                  {/* ÖNCELİKLE item.title'ı göster, eğer o "YouTube Video..." formatındaysa veya boşsa fallback yap */}
                  <h4 className="font-bold text-sm truncate group-hover:text-cyan-400 transition">
                    {item.title}
                  </h4>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-500 uppercase">
                    <span className="text-cyan-500/70 font-bold">
                      {item.channel}
                    </span>
                    <span>{item.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Profile;
