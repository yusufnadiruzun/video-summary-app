import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
    const router = useRouter();
    // URL'den ödeme başarılı olduğunda gönderdiğimiz plan adını al
    const { plan } = router.query; 

    // Yönlendirme için sayacı tut
    const [countdown, setCountdown] = useState(5);
    const [isProcessing, setIsProcessing] = useState(true);

    // Başlangıçta 2 saniye "İşleniyor" göster, sonra geri sayımı başlat
    useEffect(() => {
        const processingTimer = setTimeout(() => {
            setIsProcessing(false);
        }, 2000); // 2 saniye işlem süresi simülasyonu (Webhook bekleniyor)

        return () => clearTimeout(processingTimer);
    }, []);


    // Geri sayım ve yönlendirme
    useEffect(() => {
        if (!isProcessing) {
            if (countdown > 0) {
                // Geri sayım
                const timer = setTimeout(() => {
                    setCountdown(c => c - 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                // Geri sayım bitti, ana sayfaya yönlendir
                router.replace('/'); 
            }
        }
    }, [countdown, isProcessing, router]);

    // Seçilen pakete göre renk ve plan adını düzenle
    const packageName = plan ? String(plan) : 'Planınız';
    const planColor = packageName === 'Starter' ? 'text-purple-400' 
                    : packageName === 'Pro' ? 'text-cyan-400' 
                    : packageName === 'Premium' ? 'text-pink-400' 
                    : 'text-white';
    
    // UI Render
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-green-500/50 text-center space-y-6">
                
                {isProcessing ? (
                    // İşleniyor Durumu (Backend Webhook'u Beklerken)
                    <>
                        <Clock className="w-16 h-16 text-yellow-400 mx-auto animate-spin-slow" />
                        <h1 className="text-3xl font-bold text-white">Ödeme İşleniyor...</h1>
                        <p className="text-gray-300">
                            İşleminiz başarılı oldu. Aboneliğiniz şu anda arka planda <span className={`${planColor} font-semibold`}>{packageName}</span> planına yükseltiliyor.
                        </p>
                    </>
                ) : (
                    // Başarı Durumu
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h1 className="text-4xl font-extrabold text-white">Ödeme Başarılı!</h1>
                        <p className="text-lg text-gray-300">
                            Tebrikler! Artık <span className={`${planColor} font-semibold`}>{packageName}</span> paketinin tüm özelliklerine sahipsiniz.
                        </p>
                        
                        <div className="pt-4 border-t border-gray-700">
                            <p className="text-gray-400">
                                Ana Sayfaya <span className="font-bold text-green-400">{countdown}</span> saniye içinde yönlendirileceksiniz.
                            </p>
                        </div>
                    </>
                )}
                
                <button 
                    onClick={() => router.replace('/')} 
                    className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                    Hemen Başla <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default SuccessPage;