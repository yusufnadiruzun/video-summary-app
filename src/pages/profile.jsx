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
  Send,
  FileText,
  AlertCircle,
  Info,
  Download,
  Share2,
  Mail,
  ShieldCheck
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
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-4 ${type === "error" ? "bg-red-500/20 border-red-500/50 text-red-200" : "bg-cyan-500/20 border-cyan-500/50 text-cyan-100"}`}>
        {type === "error" ? <AlertCircle className="text-red-500" /> : <Info className="text-cyan-400" />}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition"><X size={16} /></button>
      </div>
    </motion.div>
  );
};

// --- 2. EMAIL VERIFICATION MODAL ---
const EmailVerifyModal = ({ isOpen, onClose, onVerify, email, loading }) => {
  console.log("Verification Modal State:", { isOpen, email, loading });
  const [code, setCode] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="text-cyan-400" size={30} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">Verify Your Email</h3>
        <p className="text-gray-400 mb-6 text-sm">Enter the 6-digit code sent to <br/><span className="text-white font-medium">{email}</span></p>
        
        <input 
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] text-cyan-400 outline-none focus:border-cyan-500/50 mb-6"
        />

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-4 rounded-2xl font-bold bg-white/5 text-gray-300 transition hover:bg-white/10">Cancel</button>
          <button 
            disabled={code.length !== 6 || loading}
            onClick={() => onVerify(code)} 
            className="py-4 rounded-2xl font-bold bg-cyan-600 hover:bg-cyan-500 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- 3. DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, channelName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="text-red-500" size={30} /></div>
        <h3 className="text-xl font-bold mb-2 text-white">Are you sure?</h3>
        <p className="text-gray-400 mb-8 text-sm">You are about to unfollow <span className="text-white font-semibold">{channelName}</span>.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-4 rounded-2xl font-bold bg-white/5 transition text-gray-300">Cancel</button>
          <button onClick={onConfirm} className="py-4 rounded-2xl font-bold bg-red-600 transition text-white">Delete</button>
        </div>
      </motion.div>
    </div>
  );
};

const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [tempNotif, setTempNotif] = useState({ email: "", telegram: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  
  // Verification States
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, channelId: null, channelName: "" });

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    const onFocus = () => fetchProfile();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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
          telegram: json.data.notifications?.telegram || "",
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // 1. ADIM: Mail Gönderimi (JWT Token Alımı)
  const handleSendCode = async () => {
    if (!tempNotif.email.includes("@")) {
      setNotification({ message: "Please enter a valid email.", type: "error" });
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/user/send-code", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            authorization: `Bearer ${localStorage.getItem("auth_token")}` 
        },
        body: JSON.stringify({ email: tempNotif.email }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationToken(data.verificationToken);
        setIsVerifyModalOpen(true);
        setNotification({ message: "Verification code sent to your email!", type: "success" });
      } else {
        setNotification({ message: data.msg || "Error sending code.", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Network error.", type: "error" });
    } finally {
      setVerifyLoading(false);
    }
  };

  // 2. ADIM: Kodu Doğrulama
  const handleVerifyCode = async (code) => {
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/user/verify-code", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            authorization: `Bearer ${localStorage.getItem("auth_token")}` 
        },
        body: JSON.stringify({ 
          code, 
          verificationToken,
          userId: userData.userId 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: "Email verified and saved!", type: "success" });
        setIsVerifyModalOpen(false);
        setIsEditingEmail(false);
        fetchProfile(); // Veriyi tazele
      } else {
        setNotification({ message: data.msg || "Invalid code.", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Verification failed.", type: "error" });
    } finally {
      setVerifyLoading(false);
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
      if (res.status === 200) {
        setNotification({ message: "Channel added!", type: "success" });
        setChannelId("");
        fetchProfile();
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white italic">Loading Profile...</div>;

  const currentUserId = userData?.userId; 
  const pkgName = userData?.package?.toLowerCase() || "";
  const hasTelegramAccess = pkgName.includes("pro") || pkgName.includes("premium");
  const telegramBotUrl = currentUserId ? `https://t.me/MyVideoSummaryBot?start=${currentUserId}` : "#";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans pb-20">
      <Navbar isAuthenticated={isAuthenticated} />
      
      <AnimatePresence>
        {notification.message && (
          <NotificationPopup message={notification.message} type={notification.type} onClose={() => setNotification({ message: "", type: "" })} />
        )}
      </AnimatePresence>

      <EmailVerifyModal 
        isOpen={isVerifyModalOpen} 
        onClose={() => setIsVerifyModalOpen(false)} 
        onVerify={handleVerifyCode} 
        email={tempNotif.email}
        loading={verifyLoading}
      />

      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={() => {}} channelName={deleteModal.channelName} />

      <main className="pt-32 px-4 max-w-6xl mx-auto space-y-8 text-left">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition group mb-4 w-fit">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] relative">
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Account Status</p>
            <h2 className="text-5xl font-black mb-4">{userData?.package} Plan</h2>
            <div className="flex gap-4 text-sm text-gray-300">
              <span className="bg-white/5 px-4 py-1 rounded-full border border-white/10 flex items-center gap-2"><Calendar size={14} /> Ends: {userData?.endDate}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem]">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-green-400"><CheckCircle size={20} /> Settings</h3>
            <div className="space-y-4">
              {/* Email Section */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Notification Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    disabled={!isEditingEmail} 
                    value={tempNotif.email} 
                    onChange={(e) => setTempNotif({...tempNotif, email: e.target.value})} 
                    className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none transition ${isEditingEmail ? "border-cyan-500/50 bg-black/50" : "opacity-70"}`} 
                  />
                  <button onClick={() => setIsEditingEmail(!isEditingEmail)} className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors">
                    {isEditingEmail ? <X size={16} /> : <Edit2 size={16} />}
                  </button>
                </div>
                
                {/* Email Save/Verify Button */}
                <AnimatePresence>
                  {isEditingEmail && (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      onClick={handleSendCode}
                      disabled={verifyLoading}
                      className="w-full mt-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/30 transition shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      {verifyLoading ? "Sending Code..." : <><Mail size={14}/> Send Verification Code</>}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Telegram Section */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Telegram Integration</label>
                <div className="space-y-3">
                  {tempNotif.telegram ? (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle size={16} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase text-left">Status</p>
                                <p className="text-xs text-green-400 font-bold">Bot Connected</p>
                            </div>
                        </div>
                        <button onClick={() => setTempNotif({...tempNotif, telegram: ""})} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition">
                            <Trash2 size={16} />
                        </button>
                    </div>
                  ) : (
                    <a
                      href={telegramBotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition ${currentUserId && hasTelegramAccess ? "bg-[#229ED9] hover:bg-[#229ED9]/80 text-white shadow-lg" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}
                    >
                      <Send size={16} /> {hasTelegramAccess ? "Connect Telegram Bot" : "Pro Feature Required"}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Channels & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-500"><Youtube /> Channels</h3>
            <div className="flex gap-2 mb-6">
                <input value={channelId} onChange={(e) => setChannelId(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleAddChannel()} placeholder="@mrbeast" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50" />
                <button onClick={handleAddChannel} className="bg-white text-black px-6 rounded-xl font-bold hover:bg-cyan-400 transition">Add</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {userData?.activeChannels?.map((ch) => (
                <div key={ch.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-sm font-medium">{ch.channelId}</span>
                  <button className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400"><History /> History</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar text-left">
              {userData?.history?.length > 0 ? userData.history.map((item) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-sm truncate">{item.title}</h4>
                </div>
              )) : <p className="text-gray-500 text-sm italic">No history found.</p>}
            </div>
          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Profile;