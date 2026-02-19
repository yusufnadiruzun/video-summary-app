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
  AlertCircle,
  Info,
  Download,
  Share2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

// --- 1. NOTIFICATION TOAST COMPONENT ---
const NotificationPopup = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-10 left-1/2 -translate-x-1/2 z-[250] w-full max-w-sm px-4"
    >
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-4 ${
        type === "error" 
          ? "bg-red-500/20 border-red-500/50 text-red-200" 
          : "bg-cyan-500/20 border-cyan-500/50 text-cyan-100"
      }`}>
        {type === "error" ? <AlertCircle className="text-red-500" /> : <Info className="text-cyan-400" />}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition"><X size={16} /></button>
      </div>
    </motion.div>
  );
};

// --- 2. CUSTOM DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, channelName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 className="text-red-500" size={30} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">Are you sure?</h3>
        <p className="text-gray-400 mb-8 text-sm">
          You are about to unfollow <span className="text-white font-semibold">{channelName}</span>. This action cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition text-gray-300">Cancel</button>
          <button onClick={onConfirm} className="py-4 rounded-2xl font-bold bg-red-600 hover:bg-red-500 transition text-white">Yes, Delete</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- 3. LIMIT REACHED MODAL ---
const LimitModal = ({ isOpen, onClose, plan, limit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-md w-full text-center shadow-2xl">
        <Zap className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h3 className="text-3xl font-black mb-3 text-white">Limit Reached!</h3>
        <p className="text-gray-400 mb-8">With the {plan} plan, you can follow up to {limit} channels.</p>
        <Link href="/pricing" className="block w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-cyan-400 transition text-center">Upgrade Plan</Link>
        <button onClick={onClose} className="text-gray-500 text-sm mt-4 hover:text-white transition">Close</button>
      </motion.div>
    </div>
  );
};

// --- 4. SUMMARY MODAL ---
const SummaryModal = ({ isOpen, onClose, summary }) => {
  if (!isOpen || !summary) return null;

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([summary.summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${summary.title.replace(/\s+/g, '_')}_Summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: summary.title, text: summary.summary });
      } catch (err) { console.log("Share failed:", err); }
    } else {
      navigator.clipboard.writeText(summary.summary);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-white/10 rounded-[2rem] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="text-cyan-400 shrink-0" />
            <h3 className="text-lg font-bold text-white truncate">{summary.title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition text-cyan-400"><Download size={14} /> Download</button>
            <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition text-purple-400"><Share2 size={14} /> Share</button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400"><X size={20} /></button>
          </div>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">{summary.summary}</div>
        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/5 text-[10px] text-gray-500 font-bold uppercase">
            <span>Channel: {summary.channel}</span>
            <span>Date: {summary.date}</span>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PROFILE PAGE ---
const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [tempNotif, setTempNotif] = useState({ email: "", telegram: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Düzenleme modları
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);

  const [notification, setNotification] = useState({ message: "", type: "" });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, channelId: null, channelName: "" });

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: "", type: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) { router.push("/signin"); return; }
      setIsAuthenticated(true);
      const res = await fetch("/api/user/profile", { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        setUserData(json.data);
        setTempNotif({ 
          email: json.data.notifications?.email || json.data.email || "", 
          telegram: json.data.notifications?.telegram || "" 
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempNotif(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/user/update-notifications", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          authorization: `Bearer ${localStorage.getItem("auth_token")}` 
        },
        body: JSON.stringify({ 
          email: tempNotif.email,
          telegram: tempNotif.telegram 
        }),
      });
      if (res.ok) {
        setNotification({ message: "Settings updated successfully!", type: "success" });
        setIsEditingEmail(false);
        setIsEditingTelegram(false);
        fetchProfile();
      } else {
        const data = await res.json();
        setNotification({ message: data.msg || "Update failed.", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Connection error.", type: "error" });
    }
  };

  const handleAddChannel = async () => {
    if (!channelId.trim()) return;
    try {
      const res = await fetch("/api/user/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({ channelId: channelId.trim() }), 
      });
      const data = await res.json();
      if (res.status === 200) {
        setNotification({ message: data.msg, type: "success" });
        setChannelId("");
        fetchProfile();
      } else if (res.status === 403) { setShowLimitModal(true); } 
      else { setNotification({ message: data.msg || "Error", type: "error" }); }
    } catch (err) { setNotification({ message: "Connection error.", type: "error" }); }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/user/channels?id=${deleteModal.channelId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });
      if (res.ok) {
        setNotification({ message: "Channel removed.", type: "success" });
        setDeleteModal({ isOpen: false, channelId: null, channelName: "" });
        fetchProfile();
      }
    } catch (err) { setNotification({ message: "Failed to remove.", type: "error" }); }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white italic">Loading Profile...</div>;

  const hasTelegramAccess = userData?.package === "Pro" || userData?.package === "Premium";
  const isAnyFieldEditing = isEditingEmail || isEditingTelegram;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans pb-20">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <AnimatePresence>{notification.message && <NotificationPopup message={notification.message} type={notification.type} onClose={() => setNotification({ message: "", type: "" })} />}</AnimatePresence>
      <LimitModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} plan={userData?.package} limit={userData?.package === "Pro" ? 5 : 1} />
      <SummaryModal isOpen={!!selectedSummary} onClose={() => setSelectedSummary(null)} summary={selectedSummary} />
      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={confirmDelete} channelName={deleteModal.channelName} />

      <main className="pt-32 px-4 max-w-6xl mx-auto space-y-8">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition group mb-4 w-fit">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} /></div>
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Account Status</p>
            <h2 className="text-5xl font-black mb-4">{userData?.package} Plan</h2>
            <div className="flex gap-4 text-sm text-gray-300">
              <span className="bg-white/5 px-4 py-1 rounded-full border border-white/10 flex items-center gap-2 font-medium"><Calendar size={14} className="text-purple-400" /> Ends: {userData?.endDate}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem]">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-green-400"><CheckCircle size={20} /> Settings</h3>
            <div className="space-y-4">
              
              {/* Email Section */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Notification Email</label>
                <div className="relative group">
                  <input 
                    type="email"
                    name="email"
                    disabled={!isEditingEmail}
                    value={tempNotif.email} 
                    onChange={handleInputChange}
                    className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm outline-none transition ${isEditingEmail ? "border-cyan-500/50 bg-black/50" : "opacity-70 cursor-not-allowed"}`} 
                  />
                  <button 
                    onClick={() => setIsEditingEmail(!isEditingEmail)}
                    className={`absolute right-3 top-2.5 transition-colors ${isEditingEmail ? "text-cyan-400" : "text-gray-500 hover:text-white"}`}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>

              {/* Telegram Section */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Telegram Username</label>
                <div className="relative group">
                  <input 
                    name="telegram"
                    disabled={!isEditingTelegram || !hasTelegramAccess} 
                    value={tempNotif.telegram} 
                    onChange={handleInputChange}
                    placeholder={hasTelegramAccess ? "@username" : "Upgrade to Pro"} 
                    className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm outline-none transition ${isEditingTelegram && hasTelegramAccess ? "border-cyan-500/50 bg-black/50" : "opacity-70 cursor-not-allowed"}`} 
                  />
                  {hasTelegramAccess ? (
                    <button 
                      onClick={() => setIsEditingTelegram(!isEditingTelegram)}
                      className={`absolute right-3 top-2.5 transition-colors ${isEditingTelegram ? "text-cyan-400" : "text-gray-500 hover:text-white"}`}
                    >
                      <Edit2 size={16} />
                    </button>
                  ) : (
                    <div className="absolute right-3 top-2.5 text-amber-500">
                      <Lock size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button - Sadece bir şey düzenleniyorsa çıkar */}
              <AnimatePresence>
                {isAnyFieldEditing && (
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={handleSaveSettings}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white hover:bg-cyan-400 rounded-xl py-3 text-sm font-bold transition shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2"
                  >
                    <Save size={16} /> Save Changes
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-500"><Youtube /> Channels</h3>
            <div className="flex gap-2 mb-6">
              <input value={channelId} onChange={(e) => setChannelId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()} placeholder="e.g. @mrbeast" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50" />
              <button onClick={handleAddChannel} className="bg-white text-black px-6 rounded-xl font-bold hover:bg-cyan-400 transition">Add</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {userData?.activeChannels.map((ch) => (
                <div key={ch.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition group">
                  <span className="text-sm font-medium">{ch.channelId}</span>
                  <button onClick={() => setDeleteModal({ isOpen: true, channelId: ch.id, channelName: ch.channelId })} className="text-gray-500 hover:text-red-500 transition p-2"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400"><History /> History</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {userData?.history.map((item) => (
                <button key={item.id} onClick={() => setSelectedSummary(item)} className="w-full text-left p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 hover:bg-white/10 transition group">
                  <h4 className="font-bold text-sm truncate group-hover:text-cyan-400">{item.title}</h4>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-500 uppercase font-bold">
                    <span className="text-cyan-500/70">{item.channel}</span>
                    <span>{item.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; } `}</style>
    </div>
  );
};

export default Profile;