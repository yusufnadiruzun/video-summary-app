import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Check, Lock } from "lucide-react";

const packagesData = [
    {
      id:2,
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
      id:3,
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
      id:4,
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

const PricingModal = ({
  showModal,
  setShowModal,
  isAuthenticated,
  isGuestLoading,
  getGuestToken,
  handleSelectPackage,
}) => {
  const [userPkg, setUserPkg] = useState(null);

  // Kullanıcının mevcut paketini çek
 // Kullanıcının mevcut paketini çek ve çıkış yapıldığında temizle
  useEffect(() => {
    // 1. Eğer kullanıcı giriş yapmışsa ve modal açıksa veriyi çek
    if (showModal && isAuthenticated) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        fetch("/api/user/package", {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setUserPkg(data))
          .catch(err => {
            console.error("Paket yüklenemedi", err);
            setUserPkg(null); // Hata durumunda state'i temizle
          });
      }
    } 
    
    // 2. KRİTİK NOKTA: Eğer giriş yapılmamışsa (isAuthenticated false ise) state'i temizle
    if (!isAuthenticated) {
      setUserPkg(null);
    }

  }, [showModal, isAuthenticated]);
  // Ücretli bir paketi var mı kontrolü (packageId: 1 = Free varsayımıyla)
  const hasActivePaidPlan = userPkg && userPkg.packageId > 1;

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            className="max-w-6xl w-full bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl p-6 md:p-12 shadow-2xl border border-white/10 overflow-y-auto max-h-[90vh]"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="float-right text-gray-400 hover:text-white p-2"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            <div className="text-center mb-8 md:mb-12 pt-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {hasActivePaidPlan ? "Your Active Plan" : "Unlock Unlimited Power"}
              </h2>
              <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-gray-300">
                {hasActivePaidPlan 
                  ? `You are currently using the ${userPkg.packageName} plan.` 
                  : "Trusted by thousands of users"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Free Trial / Guest Plan */}
              {/* Free Trial / Guest Plan */}
<motion.div
  whileHover={!isAuthenticated ? { y: -5 } : {}}
  className={`relative rounded-3xl p-6 sm:p-8 border border-green-500 shadow-2xl shadow-green-500/20 bg-white/5 backdrop-blur-xl ${
    isAuthenticated ? "opacity-60" : "opacity-100"
  }`}
>
  <div className="text-center">
    <h3 className="text-xl sm:text-2xl font-bold">Free Trial</h3>
    <div className="mt-4 sm:mt-6">
      <span className="text-4xl sm:text-5xl font-black">Free</span>
    </div>
  </div>

  <ul className="mt-6 space-y-3 text-sm">
    <li className="flex items-start gap-3">
      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
      <span className="text-gray-300">5 video summaries</span>
    </li>
    <li className="flex items-start gap-3">
      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
      <span className="text-gray-300">No credit card required</span>
    </li>
  </ul>

  <button
    onClick={() => {
      if (!isAuthenticated) {
        getGuestToken(); // Guest girişini başlatır
        setShowModal(false); // Modalı kapatır
      }
    }}
    disabled={isAuthenticated}
    className={`mt-8 w-full py-3 rounded-xl font-bold transition ${
      isAuthenticated
        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
        : "bg-green-500 text-black hover:bg-green-400 shadow-lg shadow-green-500/20"
    }`}
  >
    {isAuthenticated ? "Included" : "Get Started"}
  </button>
</motion.div>

             {packagesData.map((pkg) => {
  const isMyPlan = userPkg?.packageId === pkg.id;
  
  // Sadece şu anki paketi seçili olan pakete tıklayamasın.
  // Diğer tüm paketler (üst veya alt) seçilebilir olmalı.
  const isButtonDisabled = isMyPlan;

  return (
    <motion.div
      key={pkg.name}
      whileHover={!isMyPlan ? { y: -5 } : {}}
      className={`relative rounded-3xl p-6 sm:p-8 border ${
        isMyPlan ? "border-green-400 shadow-green-500/20" : 
        pkg.popular ? "border-cyan-500 shadow-cyan-500/20" : "border-white/20"
      } bg-white/5 backdrop-blur-xl ${isMyPlan ? "" : "opacity-90"}`}
    >
      {isMyPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-4 py-1.5 rounded-full z-10">
          YOUR PLAN
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold">{pkg.name}</h3>
        <div className="mt-4 sm:mt-6">
          <span className="text-4xl sm:text-5xl font-black">{pkg.price}</span>
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-sm min-h-[150px]">
        {pkg.features.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="text-gray-300">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          if (!isMyPlan) handleSelectPackage(pkg);
        }}
        disabled={isButtonDisabled}
        className={`mt-8 w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
          isMyPlan 
            ? "bg-green-500 text-black cursor-default" 
            : "bg-gradient-to-r from-cyan-400 to-purple-600 text-black hover:shadow-lg hover:shadow-cyan-500/30"
        }`}
      >
        {isMyPlan ? (
          <>Current Plan</>
        ) : (
          <>Choose {pkg.name}</>
        )}
      </button>
    </motion.div>
  );
})}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;