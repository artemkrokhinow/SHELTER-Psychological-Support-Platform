import React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    LabelList
} from 'recharts';
import { TreeDeciduous, Zap, Sprout, Shrub, Trees } from 'lucide-react';
import { api } from '../../../infrastructure/api/api';

const translateActivity = (actType, actName) => {
    const raw = (actName || actType || '').toLowerCase();
    if (raw.includes('mood_select')) return 'Трекер настрою';
    if (raw.includes('diagnostic')) return 'Діагностика стану';
    if (raw.includes('quest_completed')) return 'Квест пройдено';
    if (raw.includes('breathing')) return 'Дихальна практика';
    if (raw.includes('material')) return 'Перегляд матеріалів';
    if (raw.includes('diary')) return 'Запис у щоденнику';
    if (raw.includes('sos')) return 'Екстрена допомога';
    return raw.replace(/_/g, ' ') || 'Активність';
};

const StatsView = ({ userId, userStats, resilience = 50, resilienceMultiplier = 1.0, completedCount = 0, isVisible, onRefresh }) => {
    console.log("=== StatsView Data ===", {
        userStats,
        resilience,
        resilienceMultiplier,
        completedCount,
        activitiesList: userStats?.activities || userStats?.history || []
    });


    
    const getTreeIcon = () => {
        if (resilience <= 30) {
            return <Sprout size={160} className="text-emerald-500" />;
        } else if (resilience <= 60) {
            return <Shrub size={160} className="text-emerald-500 animate-in zoom-in duration-500" />;
        } else if (resilience <= 85) {
            return <TreeDeciduous size={160} className="text-emerald-500 animate-in zoom-in duration-500" />;
        } else {
            return <Trees size={160} className="text-emerald-500 animate-in zoom-in duration-500" />;
        }
    };
    
    const historyData = React.useMemo(() => {
        let rawHistory = [];
        if (userStats?.resilience?.history) {
            rawHistory = userStats.resilience.history.map(h => ({ date: h.date, val: Math.round(h.value) }));
        } else if (userStats?.history) {
            rawHistory = userStats.history.map(h => ({ date: h.date, val: Math.round(h.newScore || h.value) }));
        }
        
        return (rawHistory.length > 0) 
            ? [...rawHistory].slice().reverse().slice(0, 10).reverse().map(h => ({
                date: h.date,
                val: h.val
            })) 
            : [{ date: new Date().toISOString(), val: Math.round(resilience) }]; 
    }, [userStats, resilience]);

    const treeScale = 0.5 + (resilience / 100) * 0.5;
    const leafCount = Math.max(0, completedCount); 

    const handleEraseData = async () => {
        if (window.confirm("Ви впевнені, що хочете безповоротно видалити всі свої дані? Цю дію неможливо скасувати.")) {
            try {
                await api.deletePersonalData(userId);
                localStorage.removeItem("dr_token");
                window.location.href = '/';
            } catch (err) {
                console.error("Error erasing data:", err);
            }
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
           <style>{`
               .recharts-cartesian-grid-horizontal line { stroke: #1e293b; }
               .recharts-cartesian-grid-vertical line { display: none; }
           `}</style>
           {}
           <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Сад Стійкості</h2>
                </div>
                
                <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-12 rounded-3xl md:rounded-[48px] relative overflow-hidden flex flex-col md:flex-row items-center gap-4 md:gap-12 text-center md:text-left">
                    <div className="relative flex items-center justify-center w-32 h-32 md:w-64 md:h-64 bg-emerald-500/5 rounded-full border border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] shrink-0">
                        <div 
                            className="transition-all duration-1000 ease-out flex items-center justify-center"
                            style={{ transform: `scale(${treeScale})` }}
                        >
                            {getTreeIcon()}
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6 flex-1 w-full flex flex-col items-center md:items-start">
                        <div>
                            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Ваше дерево росте</h3>
                            <p className="text-slate-400 max-w-md text-sm md:text-base">Ваша стійкість — це живий організм. Чим частіше ви практикуєте, тим міцнішим стає коріння вашого ментального здоров'я.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                            <div className="bg-slate-800/50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-700/30">
                                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Рівень стійкості</p>
                                <p className="text-2xl md:text-3xl font-black text-white">{Math.round(resilience)}%</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-700/30">
                                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Виконано завдань</p>
                                <p className="text-2xl md:text-3xl font-black text-white">{leafCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
           </section>


            <section className="space-y-6 pb-12">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Аналітика прогресу</h2>
                </div>
                <div className="bg-slate-900/30 border-y md:border border-slate-800 py-4 px-2 md:p-10 -mx-4 md:mx-0 rounded-none md:rounded-[48px] shadow-2xl h-64 md:h-96 min-h-[250px] md:min-h-[400px]">
                    {isVisible ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={historyData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                                <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#475569" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(str) => {
                                        try {
                                            const d = new Date(str);
                                            return isNaN(d.getTime()) ? '?' : d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
                                        } catch (e) {
                                            return '?';
                                        }
                                    }}
                                />
                                <YAxis 
                                    domain={[0, 100]} 
                                    stroke="#475569" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: '#0f172a', 
                                        border: 'none', 
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#10b981' }}
                                    labelFormatter={(label) => {
                                        try {
                                            const d = new Date(label);
                                            if (isNaN(d.getTime())) return label;
                                            const time = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                                            const date = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
                                            return `${time} ${date}`;
                                        } catch (e) {
                                            return label;
                                        }
                                    }}
                                    formatter={(value) => [`${value}%`, 'Стійкість']}
                                />
                                <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" isAnimationActive={false}>
                                    <LabelList 
                                        dataKey="val" 
                                        position="top" 
                                        offset={12} 
                                        style={{ fill: '#10b981', fontSize: 11, fontWeight: 'bold' }} 
                                        formatter={(val) => `${val}%`}
                                    />
                                </Area>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
           </section>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Історія активності</h2>
                </div>
                
                <div className="space-y-4">
                    {(userStats?.activities || userStats?.history || [])
                        .slice()
                        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
                        .slice(0, 5)
                        .map((act, i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 md:p-6 rounded-[20px] md:rounded-[32px] flex items-center justify-between animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-2xl flex items-center justify-center shrink-0 ${act.change > 0 ? 'bg-emerald-500/10 text-emerald-500' : act.change < 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                    <Zap size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">{translateActivity(act.type || act.activityType, act.name || act.activityName)}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                        {new Date(act.date || act.createdAt || Date.now()).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end text-right shrink-0">
                                <div className={`text-lg md:text-xl font-black ${act.change > 0 ? 'text-emerald-500' : act.change < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                    {act.change > 0 ? `+${Math.round(act.change)}` : act.change < 0 ? `-${Math.abs(Math.round(act.change))}` : '0'}
                                </div>
                                {Math.round(act.change || 0) === 0 && (act.type === 'material_view' || act.activityType === 'material_view') && (
                                    <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5 md:mt-1 max-w-[100px] md:max-w-[150px] leading-tight">
                                        Не підтверджено прочитання
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {!(userStats?.activities || userStats?.history || []).length && (
                        <div className="p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Історія поки порожня</p>
                        </div>
                    )}
                </div>
           </section>

           <section className="pt-12 text-center">
                <button 
                    onClick={handleEraseData}
                    className="text-xs text-slate-500 hover:text-rose-500 underline decoration-slate-500 hover:decoration-rose-500 transition-colors uppercase tracking-widest font-bold"
                >
                    Стерти всі персональні дані
                </button>
           </section>

        </div>
    );
};

export default StatsView;
