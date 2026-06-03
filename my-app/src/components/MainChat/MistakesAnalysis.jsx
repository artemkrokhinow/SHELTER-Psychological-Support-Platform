import React, { useState } from 'react';
import { Sparkles, AlertCircle, BookOpen, ChevronLeft, Target, BarChart3, Flame, ShieldCheck, AlertTriangle } from 'lucide-react';


function getSeverity(weight) {
    if (weight <= -30) return { label: 'Критична помилка', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🔴' };
    if (weight <= -15) return { label: 'Серйозна помилка', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: '🟠' };
    return { label: 'Незначна помилка', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '🟡' };
}

function getOptionTag(weight) {
    if (weight > 0) return { label: 'Емпатія', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (weight < 0) return { label: 'Агресія', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
    return { label: 'Нейтрально', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' };
}

export default function MistakesAnalysis({ data, onBack }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [expandedTrapIndex, setExpandedTrapIndex] = useState(null);

    if (!data || !data.scenario || !data.path) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-xs">Немає даних для аналізу помилок.</p>
                <button onClick={onBack} className="mt-6 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest">Повернутися</button>
            </div>
        );
    }

    const { scenario, path } = data;

    const visitedNodeIds = new Set(path.map(step => step.nodeId));
    const mistakes = path.filter(step => (step.chosenOption.weight || 0) < 0);
    const positives = path.filter(step => (step.chosenOption.weight || 0) > 0);
    const neutrals = path.filter(step => (step.chosenOption.weight || 0) === 0);
    const totalSteps = path.length;
    const positiveRate = totalSteps > 0 ? Math.round((positives.length / totalSteps) * 100) : 0;
    const totalWeightLost = mistakes.reduce((sum, s) => sum + Math.abs(s.chosenOption.weight || 0), 0);

    
    const mostCritical = [...mistakes].sort((a, b) => (a.chosenOption.weight || 0) - (b.chosenOption.weight || 0))[0];

    
    const unvisitedTraps = [];
    Object.entries(scenario.nodes || {}).forEach(([nodeId, node]) => {
        if (!visitedNodeIds.has(nodeId) && node.options && node.options.length > 0) {
            const badOptions = node.options.filter(o => (o.weight || 0) <= -20);
            if (badOptions.length > 0) {
                
                const worstOption = [...badOptions].sort((a, b) => (a.weight || 0) - (b.weight || 0))[0];
                
                const bestOption = node.options.find(o => (o.weight || 0) === Math.max(...node.options.map(o2 => o2.weight || 0)));
                unvisitedTraps.push({
                    nodeId,
                    botPhrase: node.text,
                    badOption: worstOption,
                    bestOption: bestOption,
                    allOptions: node.options
                });
            }
        }
    });

    
    const sampleTraps = unvisitedTraps
        .sort((a, b) => (a.badOption.weight || 0) - (b.badOption.weight || 0))
        .slice(0, 2);

    return (
        <div className="flex flex-col h-full bg-[#0b0f1a] overflow-hidden">
            {}
            <div className="flex items-center gap-4 p-5 border-b border-slate-800/50 bg-[#0f1423] shrink-0">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors shadow-lg"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase italic tracking-tighter">
                        <BookOpen className="text-amber-500 shrink-0" size={20} />
                        Розширений аналіз
                    </h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold truncate">{scenario.name}</p>
                </div>
                <div className="shrink-0 text-right">
                    <div className="text-2xl font-black text-white">{positiveRate}%</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Емпатія</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto w-full p-5 space-y-6 pb-20">

                    {}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-emerald-400">{positives.length}</div>
                            <div className="text-[9px] uppercase tracking-widest text-emerald-500/70 font-black mt-1">Правильних</div>
                        </div>
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-rose-400">{mistakes.length}</div>
                            <div className="text-[9px] uppercase tracking-widest text-rose-500/70 font-black mt-1">Помилок</div>
                        </div>
                        <div className="bg-slate-500/5 border border-slate-700 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-slate-300">{neutrals.length}</div>
                            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-black mt-1">Нейтральних</div>
                        </div>
                    </div>

                    {mistakes.length === 0 ? (
                        <div className="flex flex-col items-center text-center py-12 animate-in fade-in duration-500 border border-emerald-500/20 rounded-3xl bg-emerald-500/5">
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-5">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Ідеальне проходження!</h3>
                            <p className="text-slate-400 max-w-sm text-xs uppercase tracking-widest font-bold leading-relaxed">У вашій розмові не було агресивних або конфліктних відповідей.</p>
                        </div>
                    ) : (
                        <>
                            {}
                            {mostCritical && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start shadow-lg shadow-red-500/5">
                                    <Flame size={20} className="text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Ваша найкритичніша помилка</div>
                                        <p className="text-slate-300 text-xs font-semibold">"{mostCritical.chosenOption.text}"</p>
                                        <p className="text-slate-500 text-[10px] mt-1">Ця відповідь завдала найбільшої шкоди діалогу ({mostCritical.chosenOption.weight} балів)</p>
                                    </div>
                                </div>
                            )}

                            {}
                            <div className="space-y-4">
                                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                    <Target size={12} />
                                    Аналіз ваших хибних кроків
                                </div>

                                {mistakes.map((mistake, index) => {
                                    const severity = getSeverity(mistake.chosenOption.weight || 0);
                                    const botPhrase = scenario.nodes[mistake.nodeId]?.text;
                                    const isExpanded = expandedIndex === index;
                                    const bestOption = mistake.availableOptions.find(o => (o.weight || 0) === Math.max(...mistake.availableOptions.map(o2 => o2.weight || 0)));

                                    return (
                                        <div key={index} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${severity.border} bg-slate-900/40`}>
                                            <button
                                                className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/5 transition-colors"
                                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs ${severity.bg} ${severity.color} border ${severity.border}`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-[9px] uppercase font-black tracking-widest mb-1 ${severity.color}`}>
                                                        {severity.icon} {severity.label} · {mistake.chosenOption.weight} балів
                                                    </div>
                                                    <p className="text-slate-300 text-sm font-semibold truncate">"{mistake.chosenOption.text}"</p>
                                                    <p className="text-slate-500 text-[10px] mt-1 truncate">Співрозмовник: "{botPhrase}"</p>
                                                </div>
                                                <div className={`text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="px-5 pb-5 space-y-4 border-t border-slate-800/50 pt-4 animate-in slide-in-from-top-2 duration-200">
                                                    <div>
                                                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2">Що сказав співрозмовник</div>
                                                        <p className="text-slate-200 bg-[#0b0f1a] px-4 py-3 rounded-xl border border-slate-800 text-sm leading-relaxed">
                                                            "{botPhrase}"
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2">Всі варіанти відповіді</div>
                                                        <div className="space-y-2">
                                                            {mistake.availableOptions.map((opt, i) => {
                                                                const tag = getOptionTag(opt.weight || 0);
                                                                const isChosen = opt.text === mistake.chosenOption.text;
                                                                const isBest = opt.text === bestOption?.text;
                                                                return (
                                                                    <div key={i} className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-start gap-3 ${
                                                                        isChosen
                                                                            ? 'bg-rose-500/10 border-rose-500/30 text-slate-300'
                                                                            : isBest
                                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                                                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                                                                    }`}>
                                                                        <div className="shrink-0 mt-0.5 text-base leading-none">
                                                                            {isChosen ? '❌' : isBest ? '✅' : '⬜'}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p>{opt.text}</p>
                                                                            <span className={`text-[9px] font-black uppercase tracking-wider border rounded px-1.5 py-0.5 mt-1.5 inline-block ${tag.bg} ${tag.color}`}>
                                                                                {tag.label} ({opt.weight > 0 ? '+' : ''}{opt.weight})
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-3 items-start">
                                                        <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                                        <p className="text-blue-300/80 text-[11px] font-semibold leading-relaxed">
                                                            {(mistake.chosenOption.weight || 0) <= -20
                                                                ? 'Ця відповідь може зруйнувати довіру. Краще спершу визнати почуття людини.'
                                                                : 'Ця відповідь відштовхує. Спробуйте показати підтримку.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Other Traps Section (The user's specific request) */}
                    {sampleTraps.length > 0 && (
                        <div className="space-y-4 mt-8 pt-8 border-t border-slate-800/50">
                            <div className="text-[10px] uppercase font-black text-amber-500 tracking-widest flex items-center gap-2">
                                <AlertTriangle size={12} />
                                Інші пастки у цьому чаті (яких ви уникнули)
                            </div>
                            <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
                                У цьому сценарії були й інші гілки розмови, куди ви не потрапили. Ось приклади критичних помилок, які можна було зробити в інших ситуаціях цього ж чату.
                            </p>

                            {sampleTraps.map((trap, index) => {
                                const severity = getSeverity(trap.badOption.weight || 0);
                                const isExpanded = expandedTrapIndex === index;

                                return (
                                    <div key={`trap-${index}`} className={`border rounded-2xl overflow-hidden transition-all duration-300 border-amber-500/20 bg-amber-500/5`}>
                                        <button
                                            className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/5 transition-colors"
                                            onClick={() => setExpandedTrapIndex(isExpanded ? null : index)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[9px] uppercase font-black tracking-widest mb-1 text-amber-500`}>
                                                    Прихована пастка · {trap.badOption.weight} балів
                                                </div>
                                                <p className="text-slate-300 text-sm font-semibold truncate">"{trap.badOption.text}"</p>
                                                <p className="text-slate-500 text-[10px] mt-1 truncate">Співрозмовник: "{trap.botPhrase}"</p>
                                            </div>
                                            <div className={`text-amber-500 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-5 pb-5 space-y-4 border-t border-amber-500/10 pt-4 animate-in slide-in-from-top-2 duration-200">
                                                <div>
                                                    <div className="text-[9px] uppercase font-black text-amber-500/60 tracking-widest mb-2">Можлива ситуація</div>
                                                    <p className="text-slate-200 bg-[#0b0f1a] px-4 py-3 rounded-xl border border-amber-500/10 text-sm leading-relaxed">
                                                        "{trap.botPhrase}"
                                                    </p>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                                        <div className="text-[9px] uppercase font-black text-rose-400 tracking-widest mb-2 flex items-center gap-2">
                                                            ❌ Погана відповідь
                                                        </div>
                                                        <p className="text-slate-300 text-sm">{trap.badOption.text}</p>
                                                    </div>
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                                        <div className="text-[9px] uppercase font-black text-emerald-400 tracking-widest mb-2 flex items-center gap-2">
                                                            ✅ Як треба було відповісти
                                                        </div>
                                                        <p className="text-slate-300 text-sm">{trap.bestOption.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                            <BarChart3 size={12} />
                            Загальний підсумок
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-semibold">Втрачено балів через помилки</span>
                                <span className="text-rose-400 font-black">−{totalWeightLost}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-semibold">Частка емпатичних відповідей</span>
                                <span className={`font-black ${positiveRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{positiveRate}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-semibold">Кроків у діалозі</span>
                                <span className="text-slate-300 font-black">{totalSteps}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {positiveRate >= 60
                                    ? '💪 Ви показали хорошу емпатію у більшості моментів. Попрацюйте над кількома ключовими відповідями.'
                                    : positiveRate >= 30
                                    ? '📚 Є що покращити. Зверніть увагу на моменти, де ви обирали агресивні відповіді замість підтримки.'
                                    : '🔄 Спробуйте пройти діалог знову, фокусуючись на тому, щоб спочатку визнати почуття співрозмовника.'}
                            </p>
                        </div>
                    </div>

                    {}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onBack}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all"
                        >
                            Завершити аналіз
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
