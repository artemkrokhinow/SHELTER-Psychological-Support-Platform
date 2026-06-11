import React, { useState, useEffect } from 'react';
import { ChevronLeft, Wind, Pause, Play, RotateCcw, Heart, CheckCircle2 } from 'lucide-react';

const PHASES = [
    { label: "Вдих", duration: 4, color: "rgba(16,185,129,0.4)", scale: 1.55 },
    { label: "Затримка", duration: 4, color: "rgba(16,185,129,0.2)", scale: 1.55 },
    { label: "Видих", duration: 6, color: "rgba(16,185,129,0.08)", scale: 1.0 },
    { label: "Пауза", duration: 2, color: "rgba(16,185,129,0.04)", scale: 1.0 },
];

const HINTS = [
    "Повільно вдихайте через ніс, наповнюйте живіт...",
    "Затримайте дихання, відчуйте тишу всередині...",
    "Повільно видихайте через рот, відпускайте напругу...",
    "Відпочиньте перед наступним вдихом...",
];

export default function BreathingExercise({
    onExit,
    onFinishSession,
    autoStart = false,
    showControls = true,
    requireCycles = 0, 
    onCyclesComplete,
    title = "Техніка дихання"
}) {
    const [isActive, setIsActive] = useState(autoStart);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [seconds, setSeconds] = useState(PHASES[0].duration);
    const [cycles, setCycles] = useState(0);
    const [startTime, setStartTime] = useState(autoStart ? Date.now() : null);
    const [showFinishPrompt, setShowFinishPrompt] = useState(false);

    const phase = PHASES[phaseIndex];

    useEffect(() => {
        if (!isActive) return;

        if (seconds <= 0) {
            const nextIndex = (phaseIndex + 1) % PHASES.length;
            if (nextIndex === 0) {
                const newCycles = cycles + 1;
                setCycles(newCycles);
                if (requireCycles > 0 && newCycles >= requireCycles) {
                    setShowFinishPrompt(true);
                }
            }
            setPhaseIndex(nextIndex);
            setSeconds(PHASES[nextIndex].duration);
            return;
        }

        const t = setTimeout(() => setSeconds(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [isActive, seconds, phaseIndex, cycles, requireCycles]);

    const handleStart = async () => {
        setIsActive(true);
        if (!startTime) setStartTime(Date.now());
    };

    const handlePause = () => setIsActive(false);

    const handleReset = () => {
        setIsActive(false);
        setPhaseIndex(0);
        setSeconds(PHASES[0].duration);
        setCycles(0);
        setStartTime(null);
        setShowFinishPrompt(false);
    };

    const handleComplete = () => {
        const mins = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 60000)) : 0;
        if (onFinishSession) onFinishSession(mins, cycles);
        if (onExit) onExit();
    };

    const scale = isActive && (phaseIndex === 0 || phaseIndex === 1) ? phase.scale : 1.0;
    const progress = ((phase.duration - seconds) / phase.duration) * 100;

    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-[#070a12] flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
                {}
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
                    <button
                        onClick={onExit}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-300 font-bold uppercase text-xs tracking-widest transition-all"
                    >
                        <ChevronLeft size={18} /> Назад
                    </button>
                    <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-widest">
                        <Heart size={14} className="text-rose-500" />
                        Цикл {cycles + 1}
                    </div>
                </div>

                {}
                <div className="flex flex-col items-center gap-6 md:gap-12 z-10 w-full max-w-sm px-4">
                    <div className="text-center">
                        <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-2 md:mb-3">Тиша та спокій</p>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">{title}</h1>
                    </div>

                    {}
                    <div className="relative flex items-center justify-center w-60 h-60 md:w-80 md:h-80 my-4 md:my-8">
                        {}
                        <div
                            className="absolute inset-0 rounded-full transition-all ease-in-out m-auto"
                            style={{
                                width: '100%',
                                height: '100%',
                                maxWidth: '260px',
                                maxHeight: '260px',
                                background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 80%)',
                                border: '2px solid rgba(16,185,129,0.4)',
                                boxShadow: isActive ? `0 0 80px ${phase.color}` : 'none',
                                transform: `scale(${scale})`,
                                transitionDuration: isActive ? `${phase.duration * 1000}ms` : '300ms',
                            }}
                        ></div>

                        {}
                        <div className="relative z-10 flex flex-col items-center justify-center w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#0b0f1a]/40 border border-emerald-500/10  shadow-2xl">
                            <Wind size={28} className="text-emerald-400 mb-2 md:mb-4 opacity-80 md:w-9 md:h-9" />
                            <span className="text-[70px] md:text-[100px] font-black text-white italic leading-none drop-shadow-2xl">{seconds}</span>
                            <span
                                key={phaseIndex}
                                className="text-sm md:text-lg font-black text-emerald-400 uppercase tracking-[0.2em] mt-1 md:mt-2"
                                style={{ animation: 'fadeUp 0.4s ease-out' }}
                            >
                                {phase.label}
                            </span>
                        </div>
                    </div>

                    {}
                    <div className="h-10 md:h-12 flex items-center justify-center">
                        <p
                            key={phaseIndex}
                            className="text-slate-500 text-xs md:text-sm text-center max-w-xs leading-relaxed"
                            style={{ animation: 'fadeUp 0.5s ease-out' }}
                        >
                            {isActive ? HINTS[phaseIndex] : "Натисніть кнопку, щоб розпочати сесію"}
                        </p>
                    </div>

                    {}
                    <div className="flex items-center gap-6">
                        {showControls && (
                            <>
                                {!isActive ? (
                                    <button
                                        onClick={handleStart}
                                        className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center text-[#0b0f1a] shadow-2xl hover:scale-105 transition-all group"
                                    >
                                        <Play size={32} className="ml-1 group-hover:fill-current" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePause}
                                        className="w-20 h-20 bg-slate-800 rounded-[28px] flex items-center justify-center text-white shadow-2xl hover:bg-slate-700 transition-all"
                                    >
                                        <Pause size={32} />
                                    </button>
                                )}
                                <button
                                    onClick={handleReset}
                                    title="Скинути"
                                    className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[28px] flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all"
                                >
                                    <RotateCcw size={28} />
                                </button>
                            </>
                        )}

                        {isActive && (
                            <button
                                onClick={handleComplete}
                                className="px-8 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-[28px] text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                            >
                                Завершити
                            </button>
                        )}
                    </div>
                </div>

                {}
                {showFinishPrompt && (
                    <div className="absolute inset-0 bg-[#070a12]/80  flex items-center justify-center z-[110] animate-in fade-in duration-500">
                        <div className="bg-slate-900/90 border border-slate-700 rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                <Heart size={40} className="text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Як ви почуваєтесь?</h2>
                            <p className="text-slate-400 mb-10 leading-relaxed font-medium">Ви пройшли необхідну кількість циклів. Чи стало вам легше?</p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleComplete}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0b0f1a] py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-xl shadow-emerald-500/20"
                                >
                                    Так, стало краще 🌱
                                </button>
                                <button
                                    onClick={() => setShowFinishPrompt(false)}
                                    className="w-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all"
                                >
                                    Продовжити вправу
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            </div>
        </>
    );
}
