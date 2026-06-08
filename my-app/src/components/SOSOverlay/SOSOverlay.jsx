import React, { useState } from 'react';
import { AlertCircle, X, ChevronLeft, Wind } from 'lucide-react';

export default function SOSOverlay({ onClose, onPracticeClick }) {
    const [showSOSPhones, setShowSOSPhones] = useState(false);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 " onClick={onClose}></div>
          <div className="relative bg-[#0f1423] p-8 sm:p-10 rounded-[36px] w-full max-w-lg shadow-[0_0_80px_rgba(16,185,129,0.15)] text-left animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-[20px] flex items-center justify-center">
                <AlertCircle size={32} className="text-emerald-500" />
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 -mr-2 -mt-2">
                <X size={28} />
              </button>
            </div>

            {!showSOSPhones ? (
                <>
                    <h2 className="text-3xl sm:text-[32px] font-black text-white uppercase mb-4 tracking-tight">Екстрена допомога</h2>
                    <p className="text-slate-400 mb-10 text-[17px] leading-relaxed font-medium">
                        Зараз ми проведемо коротку практику «Квадратне дихання». Це допоможе вашій нервовій системі повернутися до стану спокою.
                    </p>
                    
                    <div className="flex flex-col gap-4">
                    <button 
                        onClick={onPracticeClick} 
                        className="w-full bg-white text-black py-5 rounded-[20px] font-bold text-[17px] hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                    >
                        <Wind size={22} />
                        Почати дихання (4-4-4)
                    </button>
                    <button 
                        onClick={() => setShowSOSPhones(true)}
                        className="w-full bg-[#1b2336] text-white py-5 rounded-[20px] font-bold text-[17px] hover:bg-[#252f48] transition-all"
                    >
                        Зв'язатися з фахівцем
                    </button>
                    </div>
                </>
            ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-4 -mt-4">
                        <button onClick={() => setShowSOSPhones(false)} className="text-slate-500 hover:text-white transition-colors -ml-2 p-2">
                            <ChevronLeft size={28} />
                        </button>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Гарячі лінії</h2>
                    </div>
                    <p className="text-slate-400 mb-8 text-[15px] leading-relaxed font-medium">
                        Ці служби працюють безкоштовно та анонімно. Оберіть потрібну лінію:
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <a href="tel:7333" className="w-full bg-[#1b2336] border border-slate-800 text-white p-5 rounded-[20px] hover:bg-[#252f48] transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-[17px] mb-1">Lifeline Ukraine</p>
                                <p className="text-slate-400 text-sm">Психологічна підтримка</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 font-black px-4 py-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">7333</span>
                        </a>
                        <a href="tel:1558" className="w-full bg-[#1b2336] border border-slate-800 text-white p-5 rounded-[20px] hover:bg-[#252f48] transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-[17px] mb-1">Лінія підтримки</p>
                                <p className="text-slate-400 text-sm">Ветеран Хаб</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 font-black px-4 py-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">1558</span>
                        </a>
                        <a href="tel:0800501701" className="w-full bg-[#1b2336] border border-slate-800 text-white p-5 rounded-[20px] hover:bg-[#252f48] transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-[17px] mb-1">Телефон довіри</p>
                                <p className="text-slate-400 text-sm">Всеукраїнська лінія</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 font-black px-4 py-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">0 800 501 701</span>
                        </a>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
}
