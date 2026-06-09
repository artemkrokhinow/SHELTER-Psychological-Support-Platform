import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Wind, Play, Pause, Camera, Volume2, Music } from 'lucide-react';
import { api } from '../../../infrastructure/api/api';
import { useNavigate } from 'react-router-dom';


import grounding1 from '../../../infrastructure/assets/images/forVideo/grounding_1.png';
import grounding2 from '../../../infrastructure/assets/images/forVideo/grounding_2.jpg';
import grounding3 from '../../../infrastructure/assets/images/forVideo/grounding_3.png';
import grounding4 from '../../../infrastructure/assets/images/forVideo/grounding_4.jpg';
import grounding5 from '../../../infrastructure/assets/images/forVideo/grounding_5.jpg';
import grounding6 from '../../../infrastructure/assets/images/forVideo/grounding_6.png';

const LibraryView = ({ 
    mediaLibraryData, 
    libraryFilter, 
    setLibraryFilter, 
    searchTerm, 
    userId, 
    userStats, 
    setUserStats,
    tourStep = '0',
    currentMood,
    resilience
}) => {
    const navigate = useNavigate();
    const [activeNoise, setActiveNoise] = useState(null);
    const [isNoisePlaying, setIsNoisePlaying] = useState(false);
    const [volume, setVolume] = useState(0.1);
    const [expandedId, setExpandedId] = useState(null);
    
    
    const audioCtx = useRef(null);
    const noiseNode = useRef(null);
    const gainNode = useRef(null);

    const filteredMedia = mediaLibraryData.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = libraryFilter === 'Всі' || item.type === libraryFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        if (currentMood) {
            const getMoodScore = (m) => {
                const title = m.title.toLowerCase();
                if (currentMood === 'anxiety') return /дихан|заземлення|шок|панічн|вагус|птахів|голоси/.test(title) ? 1 : 0;
                if (currentMood === 'stress') return /релаксац|йога|кортизол|трясіння|пляжі|хвиль/.test(title) ? 1 : 0;
                if (currentMood === 'exhausted') return /дощу|дощ|сну|ліжка|аудіо|медитац|цвіркуни|ліс/.test(title) ? 1 : 0;
                if (currentMood === 'calm') return /інтелект|стійкість|щоденник|прокрастинуємо|гігієна|багаття|райська|атмосфера/.test(title) ? 1 : 0;
                if (currentMood === 'happy') return /зарядка|діагностика|інтелект|рефлекс|птахів|райська/.test(title) ? 1 : 0;
                return 0;
            };
            const scoreA = getMoodScore(a);
            const scoreB = getMoodScore(b);
            if (scoreA !== scoreB) return scoreB - scoreA;
        }

        const res = typeof resilience === 'number' ? resilience : 50;
        const isSuitable = (m) => {
            const min = m.minResilience != null ? m.minResilience : 0;
            const max = m.maxResilience != null ? m.maxResilience : 100;
            return res >= min && res <= max ? 1 : 0;
        };
        const suitA = isSuitable(a);
        const suitB = isSuitable(b);
        if (suitA !== suitB) return suitB - suitA;

        return 0;
    });

    
    const createNoiseBuffer = (type) => {
        if (!audioCtx.current) return null;
        const bufferSize = 2 * audioCtx.current.sampleRate;
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = buffer.getChannelData(0);

        if (type === 'Білий') {
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'Рожевий') {
            let b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; 
                b6 = white * 0.115926;
            }
        } else if (type === 'Коричневий') {
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.002;
                lastOut = output[i];
                output[i] *= 3.5; 
            }
        }
        return buffer;
    };

    const toggleNoise = (type) => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (isNoisePlaying && activeNoise === type) {
            
            stopNoise();
        } else {
            
            stopNoise();
            startNoise(type);
        }
    };

    const startNoise = (type) => {
        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
        }

        const buffer = createNoiseBuffer(type);
        const source = audioCtx.current.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gain = audioCtx.current.createGain();
        gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
        gain.gain.linearRampToValueAtTime(volume, audioCtx.current.currentTime + 0.5);

        source.connect(gain);
        gain.connect(audioCtx.current.destination);

        source.start();
        
        noiseNode.current = source;
        gainNode.current = gain;
        setActiveNoise(type);
        setIsNoisePlaying(true);
    };

    const stopNoise = () => {
        if (noiseNode.current) {
            const nodeToStop = noiseNode.current;
            const gainToFade = gainNode.current;
            
            gainToFade.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 0.3);
            setTimeout(() => {
                try {
                    nodeToStop.stop();
                    nodeToStop.disconnect();
                } catch(e) {}
            }, 300);
            
            noiseNode.current = null;
            gainNode.current = null;
        }
        setIsNoisePlaying(false);
    };

    useEffect(() => {
        if (gainNode.current && audioCtx.current) {
            gainNode.current.gain.setTargetAtTime(volume, audioCtx.current.currentTime, 0.1);
        }
    }, [volume]);

    useEffect(() => {
        return () => {
            if (noiseNode.current) {
                noiseNode.current.stop();
            }
        };
    }, []);

    const handleMaterialClick = (material) => {
      const mid = material.materialId || material.id || material._id;

      const contentLen = (material.content || '').replace(/<[^>]*>?/gm, '').length;
      const descLen = (material.desc || '').length;
      const isShortArticle = material.type === 'Стаття' && !material.url && (contentLen + descLen) < 250;
      if (isShortArticle) {
          if (expandedId === mid) {
              setExpandedId(null);
          } else {
              setExpandedId(mid);
              if (userId || api.isGuest()) {
                  api.recordMaterialView(userId, mid).catch(() => {});
                  api.updateUserProgress(userId, mid, 'material').catch(() => {});
              }
          }
          return;
      }

      if (userId || api.isGuest()) {
        api.recordMaterialView(userId, mid)
          .then(() => {
            if (userStats) {
              setUserStats({
                ...userStats,
                materialsViewed: {
                  ...userStats.materialsViewed,
                  count: (userStats.materialsViewed?.count || 0) + 1
                }
              });
            }
          })
          .catch((err) => console.error('Error recording material view:', err));
      }
      navigate(`/material/${mid}`);
    };

    const memoizedPhotos = React.useMemo(() => {
        return [
            { title: 'Ранковий вітер у травах', img: grounding6 },
            { title: 'Мерехтіння води', img: grounding5 },
            { title: 'Лісовий туман', img: grounding4 },
            { title: 'Гірський струмок', img: grounding2 },
            { title: 'Вечірнє багаття', img: grounding1 },
            { title: 'Дощ за склом', img: grounding3 }
        ].map((photo, i) => (
            <div key={i} className="relative aspect-[16/10] rounded-[32px] overflow-hidden group shadow-2xl border border-slate-800 bg-slate-900">
                <img 
                    src={photo.img} 
                    alt={photo.title}
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full text-left">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 opacity-80 flex items-center gap-2">
                        <Camera size={10} /> Фото-заземлення
                    </p>
                    <h5 className="text-lg font-black text-white force-white uppercase tracking-tight leading-none">{photo.title}</h5>
                </div>
            </div>
        ));
    }, []);

    const getDurationLabel = (item) => {
        let val = String(item.duration || '').trim();
        const textLen = (item.content || '').replace(/<[^>]*>?/gm, '').length + (item.desc || '').length;
        const isShortText = item.type === 'Стаття' && !item.url && textLen < 250;

        // If it's a short text, it must be in seconds
        if (isShortText) {
            const secMatch = val.match(/^(\d+)\s*с/i);
            if (secMatch) return `${secMatch[1]} сек`;

            if (/^\d+$/.test(val)) {
                const num = parseInt(val, 10);
                if (num >= 60) return `${Math.ceil(num/60)} хв`;
                return `${num} сек`;
            }

            const totalSeconds = Math.max(15, Math.ceil(textLen / 15));
            if (totalSeconds < 60) return `${Math.ceil(totalSeconds / 5) * 5} сек`;
        }

        const secMatch = val.match(/^(\d+)\s*с/i);
        if (secMatch) {
            const secs = parseInt(secMatch[1], 10);
            if (secs >= 60) return `${Math.ceil(secs / 60)} хв`;
            return `${secs} сек`;
        }

        if (/^\d+$/.test(val)) return `${val} хв`;

        if (val === '10 хв' && item.type === 'Стаття') {
            const rawMins = Math.ceil(textLen / 1000);
            const mins = Math.min(5, Math.max(3, rawMins));
            return `${mins} хв`;
        }

        return val;
    };

    const memoizedFilteredMedia = React.useMemo(() => {
        return filteredMedia.map((item) => {
            const isHighlighted = tourStep === '7_do_library';
            const durationLabel = getDurationLabel(item);
            const mid = item.materialId || item.id || item._id;
            const isExpanded = expandedId === mid;

            return (
                <div key={item.id} className="relative w-full h-full">
                    {/* Placeholder */}
                    <div className="border p-8 flex flex-col h-full robust-rounded-48 opacity-0 pointer-events-none">
                        <div className="flex justify-between items-start mb-10">
                            <div className="p-4 rounded-2xl w-14 h-14"></div>
                            <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase">{durationLabel}</div>
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest">{item.type}</p>
                                {item.type === 'Стаття' && !item.url && (
                                    <span className="text-[8px] font-black bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {(item.content || '').replace(/<[^>]*>?/gm, '').length + (item.desc || '').length < 250 ? 'Швидке читання' : 'Розгорнуто'}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-xl font-bold tracking-tight uppercase leading-snug">{item.title}</h4>
                            <div className="mt-auto pt-6 flex items-center gap-2 text-xs font-bold uppercase">Відкрити контент</div>
                        </div>
                    </div>

                    {/* Actual Card */}
                    <div 
                        onClick={() => handleMaterialClick(item)} 
                        className={`absolute top-0 left-0 w-full min-h-full group border p-8 flex flex-col robust-rounded-48 transition-all duration-500 cursor-pointer text-left 
                        ${isExpanded ? 'z-50 border-emerald-500/50 bg-slate-900 shadow-[0_24px_64px_rgba(0,0,0,0.75),0_0_0_1px_rgba(16,185,129,0.12)]' : 'z-10 hover:border-emerald-500/50 bg-slate-900/40 border-slate-800 shadow-xl'} 
                        ${isHighlighted ? 'bg-slate-900/90 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-[1.05] z-[9999] ring-4 ring-emerald-500 animate-pulse pointer-events-auto' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className={`p-4 rounded-2xl ${item.color} text-white shadow-lg`}>{item.icon}</div>
                            <div className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-400">{durationLabel}</div>
                        </div>
                        <div className="relative z-10 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.type}</p>
                                {item.type === 'Стаття' && !item.url && (
                                    <span className="text-[8px] font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {(item.content || '').replace(/<[^>]*>?/gm, '').length + (item.desc || '').length < 250 ? 'Швидке читання' : 'Розгорнуто'}
                                    </span>
                                )}
                            </div>
                            <h4 className={`text-xl font-bold tracking-tight uppercase leading-snug transition-colors ${isExpanded ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>{item.title}</h4>
                            
                            <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[1000px] opacity-100 mt-8 mb-4' : 'max-h-0 opacity-0 mt-0 mb-0'}`} onClick={(e) => e.stopPropagation()}>
                                {item.desc && <p className="mb-6 text-emerald-400/90 font-medium italic p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">{item.desc}</p>}
                                {item.content && item.content !== item.desc && (
                                    <div className="whitespace-pre-wrap space-y-4 text-slate-300 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: item.content }} />
                                )}
                            </div>

                            <div className={`mt-auto pt-6 flex items-center gap-2 text-xs font-bold uppercase transition-colors ${isExpanded ? 'text-emerald-500/55 hover:text-emerald-400' : 'text-slate-500 group-hover:gap-4 group-hover:text-slate-400'}`}>
                                {isExpanded ? 'Згорнути контент' : 'Відкрити контент'} 
                                <ChevronRight size={14} className={`transition-transform duration-300 ${isExpanded ? '-rotate-90' : ''}`} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    }, [filteredMedia, tourStep, handleMaterialClick, expandedId]);

    return (
      <div className="p-8 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        {}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Бібліотека спокою</h2>
          <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 ">
            {['Всі', 'Аудіо', 'Відео', 'Стаття'].map((f) => (
              <button key={f} onClick={() => setLibraryFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${libraryFilter === f ? 'bg-emerald-500 text-[#0b0f1a]' : 'text-slate-500 hover:text-white'}`}>{f}</button>
            ))}
          </div>
        </div>

        {}
        {libraryFilter === 'Всі' && (
            <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Звукові ландшафти</h3>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px]  relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wind size={120} className="text-blue-500" />
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
                        <div className="space-y-6 flex-1">
                            <div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Кольори шуму</h4>
                                <p className="text-slate-400 max-w-md">Оберіть частотний діапазон, який найкраще підходить для вашого стану.</p>
                            </div>
                            
                            <div className="flex flex-col xl:flex-row gap-10 items-center">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                                    {[
                                        { name: 'Білий', desc: 'Фокус та концентрація', color: 'bg-white/10', border: 'hover:border-white' },
                                        { name: 'Рожевий', desc: 'Заспокоєння та релакс', color: 'bg-rose-500/10', border: 'hover:border-rose-500' },
                                        { name: 'Коричневий', desc: 'Глибокий сон', color: 'bg-amber-900/20', border: 'hover:border-amber-700' }
                                    ].map((noise) => (
                                        <button 
                                            key={noise.name} 
                                            onClick={() => {
                                                toggleNoise(noise.name);
                                            }}
                                            className={`p-6 rounded-[32px] border transition-all ${activeNoise === noise.name && isNoisePlaying ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 ' + noise.color + ' ' + noise.border} text-left group`}
                                        >
                                            <p className="text-lg font-black text-white uppercase mb-1">{noise.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{noise.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                {}
                                <div className="relative flex flex-col items-center gap-4 py-2">
                                    <div 
                                        className="relative w-24 h-48 bg-[#0f172a] rounded-[44px] overflow-hidden cursor-pointer group shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05)] border-2 border-[#1e293b]"
                                        onMouseDown={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const updateVolume = (clientY) => {
                                                const val = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
                                                setVolume(val);
                                            };
                                            updateVolume(e.clientY);
                                            const onMouseMove = (moveEvent) => updateVolume(moveEvent.clientY);
                                            const onMouseUp = () => {
                                                window.removeEventListener('mousemove', onMouseMove);
                                                window.removeEventListener('mouseup', onMouseUp);
                                            };
                                            window.addEventListener('mousemove', onMouseMove);
                                            window.addEventListener('mouseup', onMouseUp);
                                        }}
                                        onTouchStart={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const updateVolume = (clientY) => {
                                                const val = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
                                                setVolume(val);
                                            };
                                            updateVolume(e.touches[0].clientY);
                                            const onTouchMove = (moveEvent) => updateVolume(moveEvent.touches[0].clientY);
                                            const onTouchEnd = () => {
                                                window.removeEventListener('touchmove', onTouchMove);
                                                window.removeEventListener('touchend', onTouchEnd);
                                            };
                                            window.addEventListener('touchmove', onTouchMove);
                                            window.addEventListener('touchend', onTouchEnd);
                                        }}
                                    >
                                        <div 
                                            className="absolute bottom-0 left-0 w-full bg-[#10b981] transition-all duration-75 ease-out"
                                            style={{ height: `${volume * 100}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                                        </div>
                                        <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
                                            <Music 
                                                size={24} 
                                                className={`${volume > 0.18 ? 'text-[#0f172a]' : 'text-slate-500'} transition-all duration-300`} 
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{Math.round(volume * 100)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 min-h-[192px] h-auto bg-slate-900/80 rounded-[32px] border border-slate-800 p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Visualizer</span>
                                <div className="flex gap-1">
                                    {isNoisePlaying ? (
                                        [1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }}></div>)
                                    ) : (
                                        <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-end justify-center gap-1.5 h-20">
                                {[...Array(12)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-1.5 rounded-full transition-all duration-500 ${isNoisePlaying ? 'bg-blue-500' : 'bg-slate-800 h-2'}`}
                                        style={isNoisePlaying ? { 
                                            height: `${20 + Math.random() * 80}%`,
                                            animation: 'visualizerScale 1s ease-in-out infinite alternate',
                                            animationDelay: `${i * 0.1}s`
                                        } : {}}
                                    ></div>
                                ))}
                            </div>

                            <button 
                                onClick={() => {
                                    if (activeNoise) {
                                        toggleNoise(activeNoise);
                                    } else {
                                        toggleNoise('Білий'); 
                                    }
                                }}
                                className={`w-full py-3 ${isNoisePlaying ? 'bg-rose-600' : 'bg-blue-600'} hover:opacity-90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
                            >
                                {isNoisePlaying ? <><Pause size={14} /> Вимкнути</> : <><Play size={14} /> Активувати звук</>}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        )}

        {}
        {libraryFilter === 'Всі' && (
            <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Фото заземлення</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memoizedPhotos}
                </div>
            </section>
        )}

        {}
        <section className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Всі матеріали</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {memoizedFilteredMedia}
            </div>
        </section>
      </div>
    );
};

export default LibraryView;

