import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 🔥 FİLTRE DURUMU (all, registered, guest)
    const [userFilter, setUserFilter] = useState('all');

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                router.replace('/');
            }
            setLoading(false);
        };
        load();
    }, [router]);

    if (loading || !data) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        </div>
    );

    // Verileri Filtreleme Mantığı
    const paidUsers = data.users.filter(u => u.package_type === 'pro' || u.package_type === 'premium');
    
    const filteredUsers = data.users.filter(user => {
        const isGuest = user.email && user.email.includes('guest_');
        if (userFilter === 'registered') return !isGuest;
        if (userFilter === 'guest') return isGuest;
        return true; // 'all' durumu
    });

    return (
        <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto">
                
                {/* HEADER */}
                <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase">Control Center</h1>
                        <p className="text-gray-400 text-sm">Monitor user activities and plans.</p>
                    </div>
                    <button 
                        onClick={() => {localStorage.removeItem('auth_token'); router.push('/');}} 
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                        LOGOUT
                    </button>
                </header>

                {/* METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <MetricCard title="Total Users" value={data.metrics.total_users} sub="Cumulative" color="blue" />
                    <MetricCard title="Registered" value={data.metrics.registered_users} sub="Email Login" color="purple" />
                    <MetricCard title="Guest Users" value={data.metrics.guest_users} sub="Temporary" color="orange" />
                </div>

                {/* TABLE 1: PAID SUBSCRIPTIONS (HER ZAMAN GÖSTERİLİR) */}
                <div className="mb-12">
                    <h2 className="text-lg font-black mb-4 text-gray-700 uppercase tracking-widest">💎 Active Premium Users</h2>
                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold">
                                <tr>
                                    <th className="p-5">User Email</th>
                                    <th className="p-5">Plan</th>
                                    <th className="p-5">Expiry</th>
                                    <th className="p-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {paidUsers.map((user, i) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-5 font-bold text-gray-900">{user.email}</td>
                                        <td className="p-5 text-xs font-black text-purple-600 uppercase">{user.package_type}</td>
                                        <td className="p-5 text-gray-500">{new Date(user.End_Date).toLocaleDateString()}</td>
                                        <td className="p-5 text-center">
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">ACTIVE</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TABLE 2: ALL USERS WITH FILTERS */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                    <h2 className="text-lg font-black text-gray-700 uppercase tracking-widest">👥 User Logs & Activity</h2>
                    
                    {/* 🔥 FİLTRE BUTONLARI */}
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                        <FilterBtn label="All" active={userFilter === 'all'} onClick={() => setUserFilter('all')} />
                        <FilterBtn label="Registered" active={userFilter === 'registered'} onClick={() => setUserFilter('registered')} />
                        <FilterBtn label="Guests" active={userFilter === 'guest'} onClick={() => setUserFilter('guest')} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold">
                            <tr>
                                <th className="p-5">Identity</th>
                                <th className="p-5">Registration Date</th>
                                <th className="p-5 text-right">Integrations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredUsers.length > 0 ? filteredUsers.map((user, i) => {
                                const isGuest = user.email && user.email.includes('guest_');
                                return (
                                    <tr key={i} className={`hover:bg-gray-50/50 transition-colors ${isGuest ? 'opacity-75' : ''}`}>
                                        <td className="p-5">
                                            {isGuest ? (
                                                <div className="flex flex-col">
                                                    <span className="text-orange-500 font-bold text-xs uppercase italic tracking-tighter">Guest Session</span>
                                                    <span className="text-[10px] text-gray-400">Temporary ID: {user.id}</span>
                                                </div>
                                            ) : (
                                                <span className="font-semibold text-gray-800">{user.email}</span>
                                            )}
                                        </td>
                                        <td className="p-5 text-gray-500 font-mono text-xs">
                                            {new Date(user.signup_date).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.telegram_chat_id && <Badge label="TG" color="blue" />}
                                                {user.whatsapp_phone && <Badge label="WA" color="green" />}
                                                {!user.telegram_chat_id && !user.whatsapp_phone && <span className="text-gray-300 text-[10px]">None</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="3" className="p-10 text-center text-gray-400 italic">No users found for this filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// YARDIMCI BİLEŞENLER
function MetricCard({ title, value, sub, color }) {
    const colors = {
        blue: "border-blue-600",
        purple: "border-purple-600",
        orange: "border-orange-500"
    };
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-b-4 ${colors[color]}`}>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-gray-900">{value}</p>
                <span className="text-[10px] text-gray-400 font-medium">{sub}</span>
            </div>
        </div>
    );
}

function FilterBtn({ label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
            {label}
        </button>
    );
}

function Badge({ label, color }) {
    const styles = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100"
    };
    return <span className={`border text-[9px] font-black px-1.5 py-0.5 rounded ${styles[color]}`}>{label}</span>;
}