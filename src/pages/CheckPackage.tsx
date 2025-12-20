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
} from "lucide-react";
// Paddle İçe Aktarmaları
import { initializePaddle, Paddle } from "@paddle/paddle-js";

// 1. Paket Verileri için TypeScript Arayüzü
interface Package {
  id: number;
  name: "Starter" | "Pro" | "Premium";
  price: string;
  period: string;
  features: string[];
  color: string;
  paddlePriceId: string;
}

const packagesData: Package[] = [
  {
    id: 2,
    name: "Starter",
    price: "$9",
    period: "/month",
    features: [
      "30 video summaries",
      "1 channel tracking",
      "Basic AI summaries",
      "Email support",
    ],
    color: "purple-400",
    paddlePriceId: "pri_01kbtkd3t807vvqwb9hyyfsnhg",
  },
  {
    id: 3,
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
    color: "cyan-400",
    paddlePriceId: "pri_01kc6kkzwvyp827gqqk9c03pfm",
  },
  {
    id: 4,
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
    color: "pink-400",
    paddlePriceId: "pri_01kc6kpzep455azesd4s7ga25m",
  },
];

const CheckPackage: React.FC = () => {
  const router = useRouter();

  // State'ler
  const [selectedPackageId, setSelectedPackageId] = useState<
    Package["id"] | null
  >(null);
  const [selectedPackageName, setSelectedPackageName] = useState<
    Package["name"] | null
  >(null);
  const [deliveryChannel, setDeliveryChannel] = useState<"Email" | "Telegram">(
    "Email"
  );
  const [channelDetail, setChannelDetail] = useState<string>(""); // Yeni: Kullanıcı ID/Email Girişi
  const [customReportActive, setCustomReportActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(true);
  const [paddle, setPaddle] = useState<Paddle>();

  // API Seçim Bildirimi
  async function selectPackage(packageId: number): Promise<void> {
    try {
      await fetch("/api/user/package?action=select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ packageId: packageId }),
      });
    } catch (error) {
      console.error("Selection API Error:", error);
    }
  }

  // 1. useEffect: Auth ve Paket Kontrolü
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPlan = localStorage.getItem("selectedPackage");
      const authToken = localStorage.getItem("auth_token");

      const foundPkg = storedPlan
        ? packagesData.find((p) => p.name === storedPlan)
        : null;
      if (foundPkg) {
        setSelectedPackageName(foundPkg.name);
        selectPackage(foundPkg.id);
      }

      if (authToken) {
        setIsUserAuthenticated(true);
      }
      setLoading(false);
    }
  }, [router]);

  // 2. useEffect: Paddle Başlatma
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      initializePaddle({
        environment: "sandbox", // Canlıya geçerken "production" yapmayı unutmayın
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      }).then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      });
    }
  }, []);

  const pkg = packagesData.find((p) => p.name === selectedPackageName) || null;

  if (loading || !pkg || !isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = pkg.name === "Premium";
  const featureColor = `text-${pkg.color}`;

  // Ödemeye Geçiş
  const handleProceedToPayment = () => {
    if (!paddle) {
      alert("Payment system is loading, please wait.");
      return;
    }

    // Premium Validasyonu
    if (isPremium && !channelDetail.trim()) {
      alert(`Please enter your ${deliveryChannel} information.`);
      return;
    }

    localStorage.removeItem("selectedPackage");
const deliveryParam = isPremium ? `&deliveryChannel=${deliveryChannel}&deliveryId=${channelDetail}` : '';
    paddle.Checkout.open({
    items: [{ priceId: pkg.paddlePriceId, quantity: 1 }],
    settings: {
      displayMode: "overlay",
      theme: "dark",
      // Parametreleri URL'ye ekledik:
      successUrl: `${window.location.origin}/success?plan=${pkg.name}&packageId=${pkg.id}${deliveryParam}`,
    },
    // ... customData kısmı aynı kalabilir
  });
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Pricing
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold">
            Confirm <span className={`${featureColor}`}>{pkg.name}</span> Plan
          </h1>
          <p className="mt-4 text-2xl font-bold text-gray-300">
            {pkg.price}
            <span className="text-gray-400 ml-1 font-medium text-xl">
              {pkg.period}
            </span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 bg-gray-900/50 p-8 rounded-2xl border border-white/10 shadow-2xl">
          {/* Plan Özellikleri */}
          <div className="p-4">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Zap className={`w-6 h-6 ${featureColor}`} /> Plan Features
            </h2>
            <ul className="space-y-4">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <Check
                    className={`w-5 h-5 ${featureColor} flex-shrink-0 mt-0.5`}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Özelleştirme ve Ödeme */}
          <div className="space-y-6 p-4">
            {isPremium && (
              <div className="bg-purple-800/20 p-6 rounded-xl border border-purple-500/30">
                <h3 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Delivery Setup
                </h3>

                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setDeliveryChannel("Email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                        deliveryChannel === "Email"
                          ? "bg-cyan-600 text-white"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                      onClick={() => setDeliveryChannel("Telegram")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                        deliveryChannel === "Telegram"
                          ? "bg-cyan-600 text-white"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" /> Telegram
                    </button>
                  </div>

                  {/* Yeni: Dinamik ID/Email Giriş Alanı */}
                  {/* İpucu ve Giriş Alanı Bölümü */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      {deliveryChannel === "Email"
                        ? "Target Email Address"
                        : "Telegram Username or ID"}
                    </label>

                    <input
                      type="text"
                      value={channelDetail}
                      onChange={(e) => setChannelDetail(e.target.value)}
                      placeholder={
                        deliveryChannel === "Email"
                          ? "name@example.com"
                          : "@username or 12345678"
                      }
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    />

                    {/* Dinamik İpucu Metni (Help Text) */}
                    <p className="text-[11px] leading-relaxed text-gray-400 mt-1 italic">
                      {deliveryChannel === "Email" ? (
                        "💡 Tip: Enter your primary email for the best delivery reliability."
                      ) : (
                        <span>
                          💡 Tip: You can find your numeric ID via{" "}
                          <b>@userinfobot</b> on Telegram, or simply provide
                          your <b>@username</b>.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <span className="text-sm text-gray-400">
                      Custom AI Reports
                    </span>
                    <button
                      onClick={() => setCustomReportActive(!customReportActive)}
                      className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${
                        customReportActive ? "bg-green-500" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
                          customReportActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-800/50 p-5 rounded-xl border border-white/10">
              <div className="flex justify-between text-gray-400 text-sm mb-2">
                <span>Subtotal</span>
                <span>{pkg.price}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2">
                <span>Total</span>
                <span className={featureColor}>{pkg.price}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={!paddle}
              className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-xl text-black 
                                ${
                                  paddle
                                    ? "bg-gradient-to-r from-green-400 to-cyan-500 hover:scale-[1.02]"
                                    : "bg-gray-600 cursor-not-allowed"
                                }`}
            >
              {paddle ? "Secure Checkout with Paddle" : "Loading Payment..."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckPackage;
