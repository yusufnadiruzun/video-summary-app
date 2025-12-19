import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';

const SuccessPage = () => {
    const router = useRouter();
    // URL'den hem 'plan' (görsel için) hem 'packageId' (API için) alıyoruz
    const { plan, packageId } = router.query; 

    const [countdown, setCountdown] = useState(5);
    const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
    
    // 1. Ödeme Onaylama İşlemi (API İsteği)
    useEffect(() => {
        // query parametreleri hazır olduğunda çalıştır
        if (!router.isReady || !packageId) return;

        const confirmPayment = async () => {
            try {
                const response = await fetch('/api/user/package?action=pay-success', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ package_id: packageId })
                });

                if (response.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error("Ödeme onay hatası:", error);
                setStatus('error');
            }
        };

        confirmPayment();
    }, [router.isReady, packageId]);


    // 2. Geri sayım ve yönlendirme (Sadece başarı durumunda çalışır)
    useEffect(() => {
        if (status === 'success') {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                router.replace('/'); 
            }
        }
    }, [countdown, status, router]);

    // Dinamik Görsel Ayarlar
    const packageName = plan ? String(plan) : 'Planınız';
    const planColor = packageName === 'Starter' ? 'text-purple-400' 
                    : packageName === 'Pro' ? 'text-cyan-400' 
                    : packageName === 'Premium' ? 'text-pink-400' 
                    : 'text-white';
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans flex items-center justify-center p-6">
            <div className={`max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border ${status === 'error' ? 'border-red-500' : 'border-green-500/50'} text-center space-y-6`}>
                
                {status === 'processing' && (
                    <>
                        <Clock className="w-16 h-16 text-yellow-400 mx-auto animate-spin" />
                        <h1 className="text-3xl font-bold text-white">Ödeme Doğrulanıyor...</h1>
                        <p className="text-gray-300">
                            Ödemeniz alındı, hesabınız <span className={`${planColor} font-semibold`}>{packageName}</span> paketine yükseltiliyor. Lütfen bekleyin...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h1 className="text-4xl font-extrabold text-white">İşlem Tamam!</h1>
                        <p className="text-lg text-gray-300">
                            Tebrikler! <span className={`${planColor} font-semibold`}>{packageName}</span> paketiniz başarıyla tanımlandı.
                        </p>
                        <div className="pt-4 border-t border-gray-700">
                            <p className="text-gray-400">
                                <span className="font-bold text-green-400">{countdown}</span> saniye içinde yönlendiriliyorsunuz.
                            </p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <h1 className="text-3xl font-bold text-white">Bir Sorun Oluştu</h1>
                        <p className="text-gray-300">
                            Ödemeniz başarılı görünüyor ancak paketiniz tanımlanırken bir hata oluştu. Lütfen destek ile iletişime geçin.
                        </p>
                    </>
                )}
                
                <button 
                    onClick={() => router.replace('/')} 
                    className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                    {status === 'error' ? 'Ana Sayfaya Dön' : 'Hemen Başla'} <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default SuccessPage;