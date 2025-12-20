import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
    const router = useRouter();
    const { plan, packageId, deliveryChannel, deliveryId } = router.query; 
    console.log(plan, packageId, deliveryChannel, deliveryId );
    const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'

    useEffect(() => {
        if (!router.isReady || !packageId) return;

        const finalizeTransaction = async () => {
            try {
                // 1. Ödeme Onayı ve Paket Tanımlama + Bildirim Bilgilerini Kaydetme
                const response = await fetch('/api/user/package?action=pay-success', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        authorization: `Bearer ${localStorage.getItem("auth_token")}` 
                    },
                    body: JSON.stringify({ 
                        packageId: packageId,
                        // URL'den gelen verileri gövdeye ekledik
                        deliveryChannel: deliveryChannel, 
                        deliveryId: deliveryId 
                    })
                });

                if (response.ok) {
                    setStatus('success');
                    // 3 saniye sonra profile yönlendir
                    setTimeout(() => router.replace('/profile'), 3000);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error("İşlem hatası:", error);
                setStatus('error');
            }
        };

        finalizeTransaction();
    }, [router.isReady, packageId, deliveryChannel, deliveryId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 text-center space-y-6">
                
                {status === 'processing' && (
                    <div className="animate-pulse">
                        <Clock className="w-16 h-16 text-cyan-400 mx-auto animate-spin mb-4" />
                        <h1 className="text-2xl font-bold">Hesabınız Yapılandırılıyor...</h1>
                        <p className="text-gray-400 text-sm mt-2">Ödemeniz onaylandı, ayarlarınız kaydediliyor.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-2" />
                        <h1 className="text-3xl font-black tracking-tight">HER ŞEY HAZIR!</h1>
                        <p className="text-gray-300">
                            <span className="text-cyan-400 font-bold">{plan}</span> paketiniz ve bildirim tercihleriniz başarıyla tanımlandı.
                        </p>
                        <div className="text-xs text-gray-500 pt-4">
                            Profil sayfanıza yönlendiriliyorsunuz...
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <h1 className="text-2xl font-bold">Bir Hata Oluştu</h1>
                        <p className="text-gray-400 text-sm">Paketiniz tanımlanırken bir sorun çıktı. Lütfen destekle iletişime geçin.</p>
                        <button onClick={() => router.replace('/')} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">Ana Sayfa</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SuccessPage;