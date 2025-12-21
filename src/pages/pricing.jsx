"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Shield, Crown } from "lucide-react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/router";

const plans = [
  {
    id: 1,
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["1 summary per day", "No channel tracking", "Web access only"],
    color: "slate-400",
    icon: <Shield className="text-slate-400" />,
    buttonText: "Current Plan",
    current: true
  },
  {
    id: 2,
    name: "Starter",
    price: "$9",
    period: "/month",
    features: ["Unlimited summaries", "1 channel tracking", "Email notifications", "Standard support"],
    color: "purple-400",
    icon: <Zap className="text-purple-400" />,
    buttonText: "Upgrade",
  },
  {
    id: 3,
    name: "Pro",
    price: "$19",
    period: "/month",
    features: ["Unlimited summaries", "5 channel tracking", "Email + Telegram alerts", "Priority support"],
    color: "cyan-400",
    icon: <Star className="text-cyan-400" />,
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    id: 4,
    name: "Premium",
    price: "$39",
    period: "/month",
    features: ["Unlimited summaries", "Unlimited channels", "All alert channels", "24/7 VIP support"],
    color: "amber-400",
    icon: <Crown className="text-amber-400" />,
    buttonText: "Go Ultimate",
  }
];

const Pricing = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Giriş durumunu kontrol et
  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    setIsAuthenticated(!!authToken);
  }, []);

  // Paket Seçme Mantığı (Ana sayfadaki ile aynı)
  const handleSelectPackage = (plan) => {
    if (plan.name === "Free") return; // Free plan için bir şey yapma (zaten default)

    if (typeof window !== "undefined") {
      // Seçilen paketi sakla
      localStorage.setItem("selectedPackage", plan.name);

      const authToken = localStorage.getItem("auth_token");

      if (authToken) {
        // Giriş yapmışsa satın alma sayfasına
        router.push("/CheckPackage");
      } else {
        // Giriş yapmamışsa signin'e ve sonrasında geri dönmek üzere callbackUrl ekle
        router.push("/signin?callbackUrl=/CheckPackage");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans pb-20">
      <Navbar isAuthenticated={isAuthenticated} />

      <main className="pt-32 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
          >
            Upgrade Your Experience
          </motion.h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Choose the perfect plan to stay ahead with real-time YouTube insights and automated summaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group bg-white/5 backdrop-blur-xl border ${
                plan.popular ? "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]" : "border-white/10"
              } p-8 rounded-[2.5rem] flex flex-col hover:bg-white/10 transition-all duration-500`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                  Best Value
                </div>
              )}

              <div className="mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check size={16} className={`text-${plan.color}`} />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPackage(plan)}
                className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${
                  plan.popular 
                  ? "bg-cyan-500 text-black hover:bg-cyan-400" 
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                } ${plan.current ? "opacity-50 cursor-default" : "hover:scale-[1.02] active:scale-95"}`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;