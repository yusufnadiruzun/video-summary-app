import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterPackage, setFilterPackage] = useState('all');

    useEffect(() => {
        // Sayfa yüklendiğinde bir kez çalışır
        const fetchData = async () => {
            const token = localStorage.getItem('auth_token');

            // 1. Token yoksa direkt signin'e gönder ve işlemi bitir
            if (!token) {
                router.replace(`/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
                return;
            }

            try {
                const response = await fetch('/api/admin/dashboard', {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                // 2. Yetki Hatası Kontrolü (Sayfadan atma kararı sadece BURADA verilmeli)
                if (!response.ok) {
                    if (response.status === 403 || response.status === 401) {
                        console.error("Authorization failed. Redirecting to home.");
                        router.replace('/'); 
                        return;
                    }
                    throw new Error(`System Error: ${response.status}`);
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error("Dashboard Error:", err);
                setError(err.message);
            } finally {
                // Her durumda loading'i kapat
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Bağımlılık dizisini boş bıraktık ki sürekli tetiklenmesin

    // --- Görünüm Katmanı ---

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Verifying Admin Access...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-10 text-center text-red-600">
            <h2 className="text-2xl font-bold">Error</h2>
            <p>{error}</p>
        </div>
    );

    if (!data) return null; // Veri yoksa ve hata yoksa hiçbir şey gösterme (yönlendirme bekliyor)

    // Metrics ve render fonksiyonları (Önceki kodun aynısı)
    const metrics = data?.general_metrics || {};
    const packageDetails = data?.package_details || {};
    const packages = Object.keys(packageDetails);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="flex justify-between items-center mb-10 border-b pb-5">
                <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Admin Panel</h1>
                <button 
                    onClick={() => { localStorage.removeItem('auth_token'); router.push('/signin'); }}
                    className="bg-gray-200 hover:bg-red-100 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                    LOGOUT
                </button>
            </header>

            {/* Metrikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Total Users</p>
                    <p className="text-3xl font-black">{metrics.total_users || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-orange-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Guests</p>
                    <p className="text-3xl font-black">{metrics.guest_users || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Paid Subs</p>
                    <p className="text-3xl font-black">{metrics.paid_users || 0}</p>
                </div>
            </div>

            {/* Paket Listesi */}
            <div className="space-y-6">
                {packages.map(pkg => (
                    <div key={pkg} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-700">
                            📦 {pkg.toUpperCase()} PACKAGE ({packageDetails[pkg].count} Users)
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-400 uppercase text-[10px] tracking-widest border-b">
                                        <th className="pb-3">User Email</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {Object.values(packageDetails[pkg].users).map(user => (
                                        <tr key={user.email} className="hover:bg-gray-50">
                                            <td className="py-3 font-medium">{user.email}</td>
                                            <td className="py-3 text-xs">
                                                <span className={`px-2 py-1 rounded-full ${user.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-500">{new Date(user.endDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminDashboard;