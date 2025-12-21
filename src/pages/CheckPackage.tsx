"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Check,
  Truck,
  Zap,
  Mail,
  MessageSquare,
  ArrowLeft,
  UserCircle,
  AlertCircle
} from "lucide-react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";

interface Package {
  id: number;
  name: "Starter" | "Pro" | "Premium";
  price: string;
  period: string;
  features: string[];
  color: string;
  paddlePriceId: string;
  allowedChannels: ("Email" | "Telegram")[]; // Paket izinlerini buraya ekledik
}

const packagesData: Package[] = [
  {
    id: 2,
    name: "Starter",
    price: "$9",
    period: "/month",
    features: ["30 video summaries", "1 channel tracking", "Basic AI summaries", "Email support"],
    color: "purple-400",
    paddlePriceId: "pri_01kbtkd3t807vvqwb9hyyfsnhg",
    allowedChannels: ["Email"] // Sadece Email
  },
  {
    id: 3,
    name: "Pro",
    price: "$19",
    period: "/month",
    features: ["Unlimited summaries", "5 channel tracking", "Real-time notifications", "Priority support"],
    color: "cyan-400",
    paddlePriceId: "pri_01kc6kkzwvyp827gqqk9c03pfm",
    allowedChannels: ["Email"] // Pro'da da sadece Email olduğunu varsayıyoruz (isteğe göre ekleyebilirsin)
  },
  {
    id: 4,
    name: "Premium",
    price: "$39",
    period: "/month",
    features: ["Everything in Pro +", "Telegram & Email delivery", "Custom reports", "API access"],
    color: "pink-400",
    paddlePriceId: "pri_01kc6kpzep455azesd4s7ga25m",
    allowedChannels: ["Email", "Telegram"] // Hem Email hem Telegram
  },
];

const CheckPackage: React.FC = () => {
  const router = useRouter();
  const [selectedPackageName, setSelectedPackageName] = useState<Package["name"] | null>(null);
  const [deliveryChannel, setDeliveryChannel] = useState<"Email" | "Telegram">("Email");
  const [channelDetail, setChannelDetail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [paddle, setPaddle] = useState<Paddle>();

  const pkg = packagesData.find((p) => p.name === selectedPackageName) || null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPlan = localStorage.getItem("selectedPackage") as Package["name"];
      if (storedPlan) {
        setSelectedPackageName(storedPlan);
        const found = packagesData.find(p => p.name === storedPlan);
        // Eğer paket Telegram desteklemiyorsa otomatik Email'e çek
        if (found && !found.allowedChannels.includes("Telegram")) {
          setDeliveryChannel("Email");
        }
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      initializePaddle({
        environment: "sandbox",
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      }).then((inst) => inst && setPaddle(inst));
    }
  }, []);

  const handleProceedToPayment = () => {
    if (!paddle || !pkg) return;

    if (!channelDetail.trim()) {
      alert(`Please enter your ${deliveryChannel} address/ID.`);
      return;
    }

    const deliveryParam = `&deliveryChannel=${deliveryChannel}&deliveryId=${channelDetail}`;
    
    paddle.Checkout.open({
      items: [{ priceId: pkg.paddlePriceId, quantity: 1 }],
      settings: {
        displayMode: "overlay",
        theme: "dark",
        successUrl: `${window.location.origin}/success?plan=${pkg.name}&packageId=${pkg.id}${deliveryParam}`,
      },
    });
  };

  if (loading || !pkg) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;

  const featureColor = `text-${pkg.color}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push("/")} className="flex items-center text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Pricing
        </button>

        <div className="grid md:grid-cols-2 gap-10 bg-gray-900/50 p-8 rounded-2xl border border-white/10 shadow-2xl">
          {/* Sol Kolon: Paket Özellikleri */}
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Confirm <span className={featureColor}>{pkg.name}</span></h1>
            <p className="text-2xl font-bold mb-6">{pkg.price}<span className="text-sm text-gray-400 font-normal">{pkg.period}</span></p>
            
            <ul className="space-y-4">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className={`w-4 h-4 ${featureColor} flex-shrink-0 mt-0.5`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Sağ Kolon: Teslimat Ayarları */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" /> Notification Delivery
              </h3>

              {/* Kanal Seçimi (Sadece paket izin veriyorsa göster) */}
              <div className="flex bg-black/20 p-1 rounded-lg mb-4">
                {pkg.allowedChannels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setDeliveryChannel(ch)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition text-sm ${
                      deliveryChannel === ch ? "bg-cyan-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {ch === "Email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    {ch}
                  </button>
                ))}
              </div>

              {/* Dinamik Input Alanı */}
              <div className="space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                  {deliveryChannel === "Email" ? "Your Email Address" : "Telegram ID / Username"}
                </label>
                <input
                  type="text"
                  value={channelDetail}
                  onChange={(e) => setChannelDetail(e.target.value)}
                  placeholder={deliveryChannel === "Email" ? "email@example.com" : "@username or ID"}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                />
                
                {/* Paket Kısıtlama Bilgisi */}
                {!pkg.allowedChannels.includes("Telegram") && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-200/70">
                    <AlertCircle className="w-3 h-3" />
                    Telegram delivery is only available in Premium plan.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Due</span>
                <span className={featureColor}>{pkg.price}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={!paddle}
              className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-xl text-black 
                ${paddle ? "bg-gradient-to-r from-green-400 to-cyan-500 hover:scale-[1.02] active:scale-95" : "bg-gray-600"}`}
            >
              {paddle ? "Pay Securely" : "Connecting..."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckPackage;