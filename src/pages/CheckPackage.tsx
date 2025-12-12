// pages/checkout.tsx (veya checkout.tsx)
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Check, Truck, Zap, Mail, MessageSquare, ArrowLeft } from "lucide-react";
// Paddle İçe Aktarmaları
import { initializePaddle, Paddle } from "@paddle/paddle-js";


// 1. Paket Verileri için TypeScript Arayüzü (Interface) Tanımlama
interface Package {
    name: "Starter" | "Pro" | "Premium"; // Sadece bu üç değeri kabul et
    price: string;
    period: string;
    features: string[];
    color: string;
    paddlePriceId: string;
}

// 2. Paket Verilerine Fiyat Kimliklerini Ekle ve Package Arayüzünü Kullan
const packagesData: Package[] = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      features: ["30 video summaries", "1 channel tracking", "Basic AI summaries", "Email support"],
      color: "purple-400",
      paddlePriceId: "pri_01kbtkd3t807vvqwb9hyyfsnhg" 
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      features: ["Unlimited summaries", "5 channel tracking", "Real-time notifications", "Detailed analytics", "Priority support"],
      color: "cyan-400",
      paddlePriceId: "pri_01kc6kkzwvyp827gqqk9c03pfm" 
    },
    {
      name: "Premium",
      price: "$39",
      period: "/month",
      features: ["Everything in Pro +", "Telegram & Email delivery", "Custom reports", "API access", "24/7 priority support"],
      color: "pink-400",
      paddlePriceId: "pri_01kc6kpzep455azesd4s7ga25m" 
    },
];

// Bileşen Tanımı ve Tipi
const CheckPackage: React.FC = () => {
    const router = useRouter();
    
    // State'ler - Açık Tip Tanımlamaları
    const [selectedPackageName, setSelectedPackageName] = useState<Package['name'] | null>(null);
    const [deliveryChannel, setDeliveryChannel] = useState<"Email" | "Telegram">("Email");
    const [customReportActive, setCustomReportActive] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(true);
    // Paddle State'i - Paddle tipini veya null/undefined kabul et
    const [paddle, setPaddle] = useState<Paddle>(); 


    // 1. useEffect: localStorage'dan paketi ve auth durumunu oku
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedPlan = localStorage.getItem("selectedPackage");
            const authToken = localStorage.getItem("auth_token");
            
            // a) Authentication kontrolü
            if (!authToken) {
                 // setIsUserAuthenticated(false); 
            } else {
                 setIsUserAuthenticated(true);
            }

            // b) Paket kontrolü:
            if (storedPlan) {
                // Tipi doğrula
                if (packagesData.map(p => p.name).includes(storedPlan as Package['name'])) {
                    setSelectedPackageName(storedPlan as Package['name']);
                }
            } else {
                // Paket seçilmemişse ana sayfaya yönlendir
                 // router.push('/');
            }
            
            setLoading(false);
        }
    }, [router]);
    
    // 2. useEffect: Paddle'ı Başlat
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
            initializePaddle({
                environment: "sandbox",
                token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
            }).then((paddleInstance) => {
                // initializePaddle bazen null dönebilir
                if (paddleInstance) {
                    setPaddle(paddleInstance);
                    console.log("Paddle initialized.");
                } else {
                    console.error("Paddle initialization failed.");
                }
            });
        }
    }, []);


    // Seçilen paketi bul
    const pkg = packagesData.find((p) => p.name === selectedPackageName) || null;

    // Yükleme Durumu ve Hata Kontrolü
    if (loading || !pkg || !isUserAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans flex items-center justify-center p-6">
                {loading ? (
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <p className="text-xl text-red-400">Loading error or authentication failed. Redirecting...</p>
                )}
            </div>
        );
    }

    const isPremium = pkg.name === "Premium";
    const featureColor = `text-${pkg.color}`;

    // Ödemeye Geçme Fonksiyonu - Paddle Entegrasyonu
    const handleProceedToPayment = () => {
        // Tip kontrolü: paddle'ın varlığını kontrol et
        if (!paddle) {
            alert("Paddle is not initialized yet. Please try again.");
            console.error("Paddle object is null.");
            return;
        }

        localStorage.removeItem("selectedPackage");
        
        // Custom Data, Paddle'a gönderilecek ek bilgiler
        const customData = isPremium
            ? { deliveryChannel, customReportActive: customReportActive ? 'Yes' : 'No' }
            : {};
        
        console.log(`Starting Paddle Checkout for: ${pkg.name} (${pkg.price}). Options:`, customData, pkg.paddlePriceId);

        // Paddle Checkout Pop-up'ını Aç
        paddle.Checkout.open({
            // items: Price ID'yi kullan
            items: [{ priceId: pkg.paddlePriceId, quantity: 1 }], 
            
            settings: {
                displayMode: "overlay",
                theme: "dark",
                successUrl: `${window.location.origin}/success?plan=${pkg.name}`,
                
                // Custom data'nın Record<string, any> tipinde olduğunu belirt
            },
        });
        
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 to-gray-800 text-white font-sans py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                
                <button 
                    onClick={() => router.push('/')} 
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5 mr-2"/> Back to Home
                </button>

                <div className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
                        Confirm <span className={`${featureColor}`}>{pkg.name}</span> Subscription
                    </h1>
                    <p className="mt-4 text-2xl sm:text-3xl font-bold text-gray-300">
                        Total: {pkg.price}
                        <span className="text-gray-400 ml-1 font-medium text-xl">{pkg.period}</span>
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10 bg-gray-900/50 p-8 rounded-2xl border border-white/10 shadow-2xl">
                    
                    {/* 1. Paket Özellikleri (Sol Taraf) */}
                    <div className="p-4 rounded-xl">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-white">
                            <Zap className={`w-6 h-6 ${featureColor}`} /> Plan Features
                        </h2>
                        <ul className="space-y-4 text-base">
                            {pkg.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className={`w-5 h-5 ${featureColor} flex-shrink-0 mt-0.5`} />
                                    <span className="text-gray-300">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 2. Özelleştirme ve Ödeme Bilgisi (Sağ Taraf) */}
                    <div className="space-y-8 p-4">

                        {/* Premium Özelleştirme Alanı */}
                        {isPremium && (
                            <div className="bg-purple-800/30 p-6 rounded-xl border border-purple-500/50">
                                <h3 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                                    <Truck className="w-5 h-5" /> Delivery Preferences
                                </h3>
                                
                                <div className="space-y-4">
                                    <label className="block text-gray-300 font-medium">Select Channel:</label>
                                    <div className="flex space-x-4">
                                        <button 
                                            onClick={() => setDeliveryChannel("Email")}
                                            className={`flex items-center gap-2 py-2 px-4 rounded-lg transition ${deliveryChannel === "Email" ? "bg-cyan-600 text-black font-bold" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                                        >
                                            <Mail className="w-4 h-4" /> Email
                                        </button>
                                        <button 
                                            onClick={() => setDeliveryChannel("Telegram")}
                                            className={`flex items-center gap-2 py-2 px-4 rounded-lg transition ${deliveryChannel === "Telegram" ? "bg-cyan-600 text-black font-bold" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                                        >
                                            <MessageSquare className="w-4 h-4" /> Telegram
                                        </button>
                                    </div>
                                    
                                    <div className="pt-4 flex items-center justify-between border-t border-white/10">
                                        <span className="text-gray-300">Custom Reports:</span>
                                        <button
                                            onClick={() => setCustomReportActive(!customReportActive)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${customReportActive ? "bg-green-500" : "bg-gray-500"}`}
                                        >
                                            <span
                                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${customReportActive ? "translate-x-6" : "translate-x-1"}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Ödeme Bilgisi */}
                        <div className="mt-4 bg-gray-800 p-5 rounded-xl border border-white/20">
                            <h3 className="text-xl font-semibold mb-3 text-white">Payment Summary</h3>
                            <div className="flex justify-between text-gray-400">
                                <span>Plan Price:</span>
                                <span>{pkg.price} {pkg.period}</span>
                            </div>
                            <div className="border-t border-white/20 mt-3 pt-3 flex justify-between font-bold text-lg text-white">
                                <span>Total Due:</span>
                                <span className={`${featureColor}`}>{pkg.price}</span>
                            </div>
                        </div>

                        {/* Ödeme Butonu */}
                        <button
                            onClick={handleProceedToPayment}
                            // Paddle başlatılmamışsa butonu devre dışı bırak
                            disabled={!paddle} 
                            className={`w-full py-4 rounded-xl font-bold text-lg transition transform hover:scale-[1.01] shadow-xl text-black 
                                ${paddle 
                                    ? "bg-gradient-to-r from-green-500 to-cyan-600" 
                                    : "bg-gray-500 cursor-not-allowed opacity-70"}`
                            }
                        >
                            {/* Paddle başlatılana kadar loading göster */}
                            {paddle ? "Proceed to Secure Payment with Paddle" : "Loading Payment Gateway..."}
                        </button>
                        {!paddle && (
                            <p className="text-center text-sm text-yellow-400 mt-2">
                                Initializing Paddle...
                            </p>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckPackage;