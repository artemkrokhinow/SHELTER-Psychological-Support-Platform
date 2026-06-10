import React, { useState, useEffect } from 'react';
import { 
    Wind, Brain, Lightbulb, PenLine, MessageCircle, Search, Layout, Activity,
    CheckCircle, Sparkles, TrendingUp, Clock, Trophy, Grid3X3
} from 'lucide-react';
import { api } from '../../../infrastructure/api/api';

const getDaysWord = (count) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return 'днів';
    }

    if (lastDigit === 1) {
        return 'день';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'дні';
    }

    return 'днів';
};
const HomeView = ({ 
    searchTerm, 
    navigateTo, 
    simulatorScenariosList, 
    setSimulatorScenarioId, 
    setIsFindDifferencesMode, 
    setIsSortingMode, 
    setIsSimulatorMode,
    username,
    resilience,
    setResilience,
    streak,
    currentMood,
    setCurrentMood,
    mediaLibraryData,
    showStabilizationHint
}) => {
    
    const catTranslations = {
        'anxiety': 'Тривога',
        'stress': 'Стрес',
        'apathy': 'Апатія',
        'depression': 'Депресія',
        'resilience': 'Стійкість',
        'general': 'Загальне',
        'support': 'Підтримка',
        'sleep': 'Сон'
    };

    const moods = [
        { id: 'anxiety', label: 'Тривога', emoji: '😰', color: 'from-blue-400 to-blue-600', resilienceMod: -5 },
        { id: 'stress', label: 'Стрес', emoji: '😫', color: 'from-emerald-400 to-emerald-600', resilienceMod: -2 },
        { id: 'calm', label: 'Спокій', emoji: '😌', color: 'from-purple-400 to-purple-600', resilienceMod: 5 },
        { id: 'happy', label: 'Радість', emoji: '😊', color: 'from-amber-400 to-amber-600', resilienceMod: 10 },
        { id: 'exhausted', label: 'Втома', emoji: '😴', color: 'from-indigo-400 to-indigo-600', resilienceMod: -3 },
    ];
    
    

    const handleMoodSelect = (mood) => {
        setCurrentMood(mood.id);
    };

    
    const getRecommendations = () => {
        if (!currentMood) return [];
        
        let filtered = [];
        const allMedia = [...mediaLibraryData];
        const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());
        
        if (currentMood === 'anxiety') {
            filtered = allMedia.filter(m => 
                m.title.toLowerCase().match(/дихан|заземлення|шок|панічн|вагус|птахів|голоси/)
            );
        } else if (currentMood === 'stress') {
            filtered = allMedia.filter(m => 
                m.title.toLowerCase().match(/релаксац|йога|кортизол|трясіння|пляжі|хвиль/)
            );
        } else if (currentMood === 'exhausted') {
            filtered = allMedia.filter(m => 
                m.title.toLowerCase().match(/дощу|дощ|сну|ліжка|аудіо|медитац|цвіркуни|ліс/)
            );
        } else if (currentMood === 'calm') {
            filtered = allMedia.filter(m => 
                m.title.toLowerCase().match(/інтелект|стійкість|щоденник|прокрастинуємо|гігієна|багаття|райська|атмосфера/)
            );
        } else if (currentMood === 'happy') {
            filtered = allMedia.filter(m => 
                m.title.toLowerCase().match(/зарядка|діагностика|інтелект|рефлекс|птахів|райська/)
            );
        }
        
        if (filtered.length < 3) {
            const fallback = shuffle(allMedia.filter(m => !filtered.some(f => f.id === m.id)));
            filtered = [...filtered, ...fallback];
        }
        
        return filtered.slice(0, 3);
    };

    const recommendations = getRecommendations();

    const baseCards = [
      { title: "Дихання", cat: "Практика", icon: <Wind/>, color: "from-emerald-500 to-emerald-600", onClick: () => navigateTo('practice') },
      { title: "Діагностика", cat: "Тестування", icon: <Brain/>, color: "from-blue-500 to-blue-600", onClick: () => navigateTo('testing') },
      { title: "Поради", cat: "Корисні поради", icon: <Lightbulb/>, color: "from-orange-500 to-orange-600", onClick: () => navigateTo('advice') },
      { title: "Щоденник", cat: "Рефлексія", icon: <PenLine/>, color: "from-purple-500 to-purple-600", onClick: () => navigateTo('diary') },
      { title: "Чат-тренування", cat: "Практика", icon: <MessageCircle/>, color: "from-rose-500 to-rose-600", onClick: () => navigateTo('chat') }
    ];

    const simulatorCards = simulatorScenariosList
      .filter(s => s.type !== 'find-differences' && s.type !== 'findDifferences' && s.type !== 'dialogue' && s.type !== 'sorting')
      .filter(s => s.scenarioId !== 'anxiety-dialogue-1')
      .map((scenario, i) => {
      const colors = ["from-indigo-500 to-indigo-600", "from-violet-500 to-violet-600", "from-fuchsia-500 to-fuchsia-600", "from-cyan-500 to-cyan-600"];
      return {
        id: scenario._id,
        title: scenario.title || scenario.name || `Тренажер ${i + 1}`,
        cat: "Симулятор",
        icon: <Activity/>,
        color: colors[i % colors.length],
        minResilience: scenario.minResilience !== undefined ? scenario.minResilience : 0,
        maxResilience: scenario.maxResilience !== undefined ? scenario.maxResilience : 100,
        onClick: () => {
          setSimulatorScenarioId(scenario.scenarioId || scenario._id);
          if (scenario.type === 'sorting') {
              setIsSortingMode(true);
          } else {
              setIsSimulatorMode(true);
          }
        }
      };
    });

    
    const buildSortingCards = () => {
        const colors = [
            "from-cyan-500 to-cyan-600",
            "from-teal-500 to-teal-600",
            "from-sky-500 to-sky-600",
        ];

        return [
            {
                id: 'hardcoded-sorting-1',
                title: "Сортування думок",
                cat: "СОРТУВАННЯ",
                icon: <Grid3X3 />,
                color: colors[0],
                onClick: () => {
                    setSimulatorScenarioId('hardcoded-sorting-1');
                    setIsSortingMode(true);
                }
            },
            {
                id: 'hardcoded-sorting-2',
                title: "Коло контролю",
                cat: "СОРТУВАННЯ",
                icon: <Grid3X3 />,
                color: colors[1],
                onClick: () => {
                    setSimulatorScenarioId('hardcoded-sorting-2');
                    setIsSortingMode(true);
                }
            },
            {
                id: 'hardcoded-sorting-3',
                title: "Звички",
                cat: "СОРТУВАННЯ",
                icon: <Grid3X3 />,
                color: colors[2],
                onClick: () => {
                    setSimulatorScenarioId('hardcoded-sorting-3');
                    setIsSortingMode(true);
                }
            }
        ];
    };

    const getAdaptiveCards = () => {
        const sortingCards = buildSortingCards();

        const burnoutScenario = simulatorScenariosList.find(s => {
            const text = (s.name || s.title || "").toLowerCase();
            return (text.includes('вигоранн') || text.includes('вигорання')) && s.type === 'sorting';
        });
        const burnoutCard = burnoutScenario ? {
            id: burnoutScenario._id || burnoutScenario.id,
            title: burnoutScenario.title || burnoutScenario.name,
            cat: "ВІДНОВЛЕННЯ",
            icon: <MessageCircle />,
            color: "from-indigo-500 to-indigo-600",
            onClick: () => {
                setSimulatorScenarioId(burnoutScenario.scenarioId || burnoutScenario._id || burnoutScenario.id);
                setIsSortingMode(true);
            }
        } : null;

        const impostorScenario = simulatorScenariosList.find(s => {
            const text = (s.name || s.title || "").toLowerCase();
            return text.includes('самозванця') && s.type === 'sorting';
        });
        const impostorCard = impostorScenario ? {
            id: impostorScenario._id || impostorScenario.id,
            title: impostorScenario.title || impostorScenario.name,
            cat: "ПІДТРИМКА",
            icon: <MessageCircle />,
            color: "from-violet-500 to-violet-600",
            onClick: () => {
                setSimulatorScenarioId(impostorScenario.scenarioId || impostorScenario._id || impostorScenario.id);
                setIsSortingMode(true);
            }
        } : null;

        if (resilience < 40) {
            const cards = [
                { title: "Дихання", cat: "СТАБІЛІЗАЦІЯ", icon: <Wind/>, color: "from-rose-500 to-rose-600", onClick: () => navigateTo('practice') },
                { title: "Чат-підтримка", cat: "СТАБІЛІЗАЦІЯ", icon: <MessageCircle/>, color: "from-blue-500 to-blue-600", onClick: () => navigateTo('chat') },

                { title: "Звуки спокою", cat: "СТАБІЛІЗАЦІЯ", icon: <Activity/>, color: "from-emerald-500 to-emerald-600", onClick: () => navigateTo('library') }
            ];
            if (burnoutCard) cards.push(burnoutCard);
            return [...cards, ...simulatorCards.filter(s => resilience >= (s.minResilience || 0) && resilience <= (s.maxResilience || 100))];
        }

        if (resilience >= 40 && resilience <= 70) {
            const cards = [
                { title: "Щоденник", cat: "РЕФЛЕКСІЯ", icon: <PenLine/>, color: "from-purple-500 to-purple-600", onClick: () => navigateTo('diary') },

                { title: "Поради", cat: "КОРИСНО", icon: <Lightbulb/>, color: "from-orange-500 to-orange-600", onClick: () => navigateTo('advice') }
            ];
            if (impostorCard) cards.push(impostorCard);
            return [...cards, ...baseCards.filter(c => c.title === "Дихання"), ...simulatorCards.slice(0, 2)];
        }

        const cards = [
            { title: "Квести Стійкості", cat: "РОЗВИТОК", icon: <Trophy className="text-amber-400"/>, color: "from-amber-500 to-amber-600", onClick: () => navigateTo('quests') },

            { title: "Глибока діагностика", cat: "АНАЛІТИКА", icon: <Brain/>, color: "from-indigo-500 to-indigo-600", onClick: () => navigateTo('testing') },
            ...baseCards.filter(c => c.title !== "Діагностика")
        ];
        if (impostorCard) cards.push(impostorCard);
        if (burnoutCard) cards.push(burnoutCard);
        return [...cards, ...simulatorCards];
    };

    const cards = getAdaptiveCards().filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="p-4 md:p-8 flex flex-col min-h-[calc(100vh-14rem)] justify-between space-y-6 md:space-y-12 animate-in fade-in duration-1000 pb-8 md:pb-24">
        {}
        {showStabilizationHint && !searchTerm && (
            <div className="relative overflow-hidden bg-rose-500/10 border border-rose-500/20 p-5 md:p-8 rounded-3xl md:rounded-[48px] animate-in slide-in-from-top-10 duration-700 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-rose-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0">
                        <Activity size={28} />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">Потрібна підтримка?</h2>
                        <p className="text-rose-200/60 font-medium">Ваш рівень стійкості зараз низький. Рекомендуємо коротку практику заземлення для відновлення ресурсу.</p>
                    </div>
                    <button 
                        onClick={() => navigateTo('practice')}
                        className="px-6 py-4 md:px-10 md:py-5 bg-white text-rose-600 rounded-xl md:rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-50 transition-all shadow-xl whitespace-nowrap"
                    >
                        Почати зараз
                    </button>
                </div>
                {}
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-sm -mr-32 -mt-32"></div>
            </div>
        )}

        {}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
              {searchTerm ? `Пошук: "${searchTerm}"` : `Привіт, ${username}`}
            </h1>
            
          </div>
          
          <div className="flex w-full md:w-auto gap-3 md:gap-4 mt-2 md:mt-0">
            <div className="flex-1 md:w-[140px] bg-slate-900/40 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-800  text-center shrink-0">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">Серія</p>
                <p className="text-2xl md:text-3xl font-black text-white truncate">{streak} {getDaysWord(streak)}</p>
            </div>
            <div className="flex-1 md:w-[140px] bg-emerald-500/10 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-emerald-500/20  text-center shrink-0">
                <p className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 truncate">Стійкість</p>
                <p className="text-2xl md:text-3xl font-black text-emerald-400 truncate">{Math.round(resilience)}%</p>
            </div>
          </div>
        </section>

        {}
        {!searchTerm && (
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Як пройшов ваш ранок?</h2>
                </div>
                <div className="flex flex-wrap gap-4">
                    {moods.map((mood) => (
                        <button
                            key={mood.id}
                            onClick={() => handleMoodSelect(mood)}
                            className={`group relative flex flex-col items-center gap-1 md:gap-2 p-3 md:p-6 rounded-2xl md:rounded-[32px] transition-all duration-500 border ${
                                currentMood === mood.id 
                                ? `bg-gradient-to-br ${mood.color} border-white/20 scale-110 shadow-xl z-10` 
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:scale-105'
                            }`}
                        >
                            <span className="text-3xl md:text-4xl transition-transform duration-500 group-hover:scale-125">{mood.emoji}</span>
                            <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                                currentMood === mood.id ? 'text-white' : 'text-slate-500'
                            }`}>{mood.label}</span>
                            
                            {currentMood === mood.id && (
                                <div className="absolute -top-2 -right-2 bg-white text-black rounded-full p-1">
                                    <CheckCircle size={14} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </section>
        )}

        {}
        {!searchTerm && recommendations.length > 0 && (
            <section className="space-y-6 animate-in slide-in-from-left duration-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Рекомендовано для вас</h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                    {recommendations.map((rec, i) => (
                        <div 
                            key={rec.id}
                            onClick={() => navigateTo('material', rec.id)}
                            className="bg-slate-900/40 md:h-[220px] border border-slate-800 p-4 md:p-6 rounded-2xl md:rounded-[32px] hover:bg-slate-800/60 transition-all cursor-pointer group shadow-xl flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-0"
                        >
                            <div className="flex flex-col md:flex-row md:justify-between items-start md:mb-4 w-auto">
                                <div className={`p-3 rounded-xl md:rounded-2xl bg-gradient-to-br ${rec.color} text-white force-white shadow-lg`}>
                                    {React.cloneElement(rec.icon, { className: 'w-6 h-6' })}
                                </div>
                                <span className="hidden md:flex text-[10px] font-black text-slate-500 uppercase tracking-widest items-center gap-1">
                                    <Clock size={12} /> {rec.duration}
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter leading-tight mb-1 md:mb-2 group-hover:text-emerald-400 transition-colors">
                                    {rec.title}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{catTranslations[rec.cat] || rec.cat}</span>
                                    <span className="md:hidden flex text-[9px] font-black uppercase tracking-widest items-center gap-1">
                                        • <Clock size={10} /> {rec.duration}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {}
        <section className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                    {searchTerm ? 'Результати пошуку' : 'Всі практики'}
                </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {cards.map((card, i) => (
                <div 
                key={i} 
                onClick={card.onClick} 
                className="group relative h-32 md:h-80 robust-card cursor-pointer shadow-2xl overflow-hidden rounded-2xl md:rounded-[48px]"
                >
                <div className={`card-bg-layer bg-gradient-to-br ${card.color} opacity-90`}></div>
                
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500"></div>
                
                <div className="relative p-3 md:p-10 h-full flex flex-col items-center justify-center md:items-stretch md:justify-between text-center md:text-left text-white force-white z-10 gap-2 md:gap-0">
                    <div className="p-2 md:p-4 bg-white/20 rounded-xl md:rounded-2xl w-fit shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:bg-white/30 md:group-hover:rotate-12 mx-auto md:mx-0">
                        {React.cloneElement(card.icon, { className: 'w-5 h-5 md:w-8 md:h-8' })}
                    </div>
                    <div className="transition-all duration-500 md:group-hover:translate-x-2">
                        <p className="text-[8px] md:text-[10px] font-black uppercase mb-0 md:mb-1 opacity-70 tracking-widest force-white">{card.cat}</p>
                        <h4 className="text-sm md:text-3xl lg:text-lg xl:text-2xl font-black uppercase tracking-tighter leading-tight md:leading-none group-hover:text-white drop-shadow-md force-white line-clamp-2">
                        {card.title}
                        </h4>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
            ))}
            </div>
        </section>
      </div>
    );
};

export default HomeView;
