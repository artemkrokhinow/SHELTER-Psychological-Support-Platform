import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../../infrastructure/api/api";
import { getDiagnosticConfig } from "../../../infrastructure/utils/diagnosticLogic";
import { Check, Lock, Play, MapPin, Grid3X3, Trophy, Sparkles } from 'lucide-react';
import "./QuestsView.css";

const thoughts = [
    "Кожна велика подорож починається з одного вдиху.",
    "Коли світ хитається, шукай опору під ногами.",
    "Емоції — це хвилі. Ти не можеш їх зупинити, але можеш навчитися серфити.",
    "Фокусуйся лише на тому, що можеш контролювати.",
    "Навіть у найтемніші дні є місце для світла.",
    "Ти сильніший, ніж думаєш.",
    "Кожен крок, навіть маленький, — це прогрес.",
    "Дозволь собі бути неідеальним.",
    "Сьогоднішні зусилля — це завтрашній результат.",
    "Ти не самотній у цій подорожі."
];

const QuestsView = ({ 
    navigateTo, 
    resilience,
    setSimulatorScenarioId,
    setIsSimulatorMode,
    setIsFindDifferencesMode,
    setIsSortingMode,
    simulatorScenariosList,
    onStartQuestTask,
    tourStep = '0',
    onMaterialComplete,
    lastCompletedActivity
}) => {
    const [pageType, setPageType] = useState("default");
    const [quests, setQuests] = useState([]);
    const [currentDay, setCurrentDay] = useState(1);
    const [expandedQuestId, setExpandedQuestId] = useState(null);





    const createMixedQuests = useCallback((scenarios, materials) => {
        const questsList = [];
        let dayCounter = 1;
        
        const filteredMaterials = materials.filter(m => {
            if (m.type === 'dialogue' || m.materialId === 'anxiety-dialogue-1') return false; 
            if (pageType === "default") return m.category === "general";
            return m.category === pageType || m.category === "general";
        });

        const typeLabels = {
            'video': 'відео-сценарій',
            'audio': 'аудіо-практика',
            'sorting': 'тренажер',
            'dialogue': 'чат-тренажер'
        };

        const allScenarios = [
            { scenarioId: 'hardcoded-sorting-1', type: 'sorting', title: 'Сортування думок', duration: 3 },
            { scenarioId: 'hardcoded-sorting-2', type: 'sorting', title: 'Коло контролю', duration: 3 },
            { scenarioId: 'hardcoded-sorting-3', type: 'sorting', title: 'Звички', duration: 3 },
            ...scenarios.filter(s => s.type !== 'sorting' || !s.scenarioId?.startsWith('hardcoded-sorting'))
        ];

        const maxLength = Math.max(allScenarios.length, filteredMaterials.length, 5); 
        
        for (let i = 0; i < maxLength; i++) {
            
            if (i < allScenarios.length) {
                const scenario = allScenarios[i];
                const questType = scenario.type === 'sorting' ? 'sorting' : 'exercise';
                questsList.push({
                    id: `exercise-${scenario._id || scenario.scenarioId || i}`,
                    day: dayCounter++,
                    title: scenario.name || scenario.title || `Вправа дня ${dayCounter}`,
                    thought: thoughts[(dayCounter - 2) % thoughts.length],
                    task: `${typeLabels[scenario.type] || 'вправа'} \u2022 ${scenario.duration || "5"} хв`,
                    scenarioId: scenario.scenarioId || scenario._id,
                    type: scenario.type,
                    questType,
                    status: "locked"
                });
            }
            
            if (dayCounter % 3 === 0) {
                const isDiary = i % 2 === 0;
                questsList.push({
                    id: isDiary ? `task-diary-${i}` : `task-breath-${i}`,
                    day: dayCounter++,
                    title: isDiary ? "Рефлексія дня" : "Хвилина спокою",
                    thought: isDiary ? "Записане слово має силу звільнення." : "Твій подих — твій якір.",
                    task: isDiary ? "запис у щоденнику" : "дихальна вправа",
                    questType: isDiary ? "diary_task" : "breathing_task",
                    status: "locked"
                });
            }

            if (i < filteredMaterials.length) {
                const material = filteredMaterials[i];
                questsList.push({
                    id: `material-${material._id || i}`,
                    day: dayCounter++,
                    title: material.title || `Матеріал дня ${dayCounter}`,
                    thought: thoughts[(dayCounter - 2) % thoughts.length],
                    task: `${material.type === 'video' ? 'відео' : material.type === 'audio' ? 'аудіо' : 'стаття'} \u2022 ${material.duration || "5 хв"}`,
                    materialId: material?.materialId || material?._id,
                    questType: "material",
                    material: material,
                    status: "locked"
                });
            }
        }
        
        return questsList;
    }, [pageType]);


    const updateQuestStatuses = useCallback((compScenarios, compMaterials, initialQuests, profile) => {
        const updatedQuests = [...initialQuests];
        let foundCurrent = false;

        updatedQuests.forEach((quest, index) => {
            let isCompleted = false;

            if (quest.questType === "exercise") {
                
                isCompleted = compScenarios.some(c => 
                    (c.scenarioId && c.scenarioId === quest.scenarioId) || 
                    (c.id && c.id === quest.scenarioId) ||
                    (c._id && c._id === quest.scenarioId)
                );
            } else if (quest.questType === "material") {
                
                isCompleted = compMaterials.some(m => {
                    if (typeof m === 'string') return m === quest.materialId;
                    return (m.materialId && m.materialId === quest.materialId) || 
                           (m.id && m.id === quest.materialId) ||
                           (m._id && m._id === quest.materialId);
                });
            } else if (quest.questType === "sorting") {
                if (quest.scenarioId && quest.scenarioId.startsWith('hardcoded-sorting')) {
                    isCompleted = compScenarios.some(c => c.scenarioId === quest.scenarioId || c.id === quest.scenarioId);
                } else {
                    const sortingScenario = simulatorScenariosList.find(s => s.type === "sorting");
                    isCompleted = sortingScenario 
                        ? compScenarios.some(c => 
                            c.scenarioId === sortingScenario.scenarioId ||
                            c.scenarioId === sortingScenario._id
                        )
                        : false;
                }
            } else if (quest.questType === "diary_task") {
                isCompleted = profile.diaryEntries && profile.diaryEntries.length > 0;
            } else if (quest.questType === "breathing_task") {
                isCompleted = (profile.history && profile.history.some(h => h.activityType === 'breathing')) || (resilience > 70);
            }

            if (isCompleted) {
                quest.status = "completed";
            } else if (!foundCurrent) {
                quest.status = "current";
                foundCurrent = true;
                setCurrentDay(index + 1);
            } else {
                quest.status = "locked";
            }
        });

        return updatedQuests;
    }, []);

    const loadData = useCallback(() => {
        const savedData = JSON.parse(localStorage.getItem("dr_test_results"));
        const config = getDiagnosticConfig(savedData?.answers);
        setPageType(config?.type || "default");

        Promise.all([
            api.getScenarios().catch(() => []),
            api.getMaterials().catch(() => []),
            api.getProfile().catch(() => ({ completedScenarios: [], completedMaterials: [], history: [], diaryEntries: [] }))
        ]).then(([scenariosData, materialsData, profile]) => {
            const mixedQuests = createMixedQuests(scenariosData, materialsData);
            const updated = updateQuestStatuses(
                profile.completedScenarios || [], 
                profile.completedMaterials || [], 
                mixedQuests,
                profile
            );
            setQuests(updated);
        });
    }, [createMixedQuests, updateQuestStatuses]);

    useEffect(() => {
        loadData();
        
        
        window.addEventListener('focus', loadData);
        return () => window.removeEventListener('focus', loadData);
    }, [resilience, lastCompletedActivity, loadData]);

    const handleQuestAction = (quest) => {
        if (onStartQuestTask) {
            onStartQuestTask(quest);
        }
        if (quest.questType === "sorting") {
            if (quest.scenarioId) {
                setSimulatorScenarioId(quest.scenarioId);
                setIsSortingMode(true);
            } else {
                const sortingScenarios = simulatorScenariosList.filter(s => s.type === "sorting");
                const randomScenario = sortingScenarios.length > 0 
                    ? sortingScenarios[Math.floor(Math.random() * sortingScenarios.length)]
                    : null;
                
                setSimulatorScenarioId(randomScenario?.scenarioId || randomScenario?._id || null);
                if (randomScenario) {
                    setIsSortingMode(true);
                } else {
                    console.warn('No sorting scenario found in DB');
                }
            }
        } else if (quest.questType === "exercise") {
            if (quest.type === "find-differences" || quest.type === "findDifferences") {
                setSimulatorScenarioId(quest.scenarioId);
                setIsFindDifferencesMode(true);
            } else {
                setSimulatorScenarioId(quest.scenarioId);
                setIsSimulatorMode(true);
            }
        } else if (quest.questType === "material") {
            const mat = quest.material;
            const content = mat?.content || mat?.text || '';
            const isShortText = content.length < 500;
            
            if (mat && mat.type !== 'video' && mat.type !== 'audio' && isShortText) {
                setExpandedQuestId(expandedQuestId === quest.id ? null : quest.id);
            } else {
                navigateTo('material', quest.materialId);
            }
        } else if (quest.questType === "diary_task") {
            navigateTo('diary');
        } else if (quest.questType === "breathing_task") {
            navigateTo('practice');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-12">
                <div className="space-y-3 md:space-y-4 w-full md:w-auto flex-1">
                    <h2 className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Квести Стійкості</h2>
                    
                    <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Прогрес місій</span>
                            <span className="text-amber-500">{quests.filter(q => q.status === 'completed').length} / {quests.length} виконано</span>
                        </div>
                        <div className="h-2 md:h-3 w-full bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-amber-500 transition-all duration-1000 ease-out rounded-full relative overflow-hidden" 
                                style={{ width: `${quests.length > 0 ? (quests.filter(q => q.status === 'completed').length / quests.length) * 100 : 0}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20 shrink-0">
                    <Trophy className="text-amber-500" size={20} />
                    <p className="text-amber-500 font-bold text-xs uppercase tracking-widest">Один день — один маленький крок.</p>
                </div>
            </div>

            <div className="relative max-w-4xl mx-auto space-y-4 md:space-y-12 before:absolute before:left-[19px] md:before:left-[27px] before:top-4 before:bottom-4 before:w-1 before:bg-slate-800 before:rounded-full">
                {React.useMemo(() => {
                    return quests.map((quest) => (
                        <div key={quest.id} className={`relative pl-12 md:pl-20 transition-all duration-500 ${quest.status === 'locked' ? 'opacity-50' : 'opacity-100'}`}>
                        {/* Current Quest Indicator */}
                        {quest.status === "current" && (
                            <div className="absolute -left-2 md:-left-4 -top-4 md:-top-8 text-2xl md:text-4xl animate-bounce z-20">🦊</div>
                        )}

                        {}
                        {(() => {
                            const isHighlighted = (tourStep === '4_do_sorting' && quest.questType === 'sorting') ||
                                                  (tourStep === '5_do_chat' && quest.type === 'dialogue');
                            return (
                                <>
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-2xl md:rounded-3xl flex items-center justify-center border-2 md:border-4 transition-all duration-500 z-10 ${
                                        quest.status === 'completed' ? 'bg-emerald-500 border-emerald-400 text-white' :
                                        quest.status === 'current' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110' :
                                        'bg-slate-900 border-slate-700 text-slate-500'
                                    }`}>
                                        {quest.status === 'completed' ? <Check className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} /> : 
                                         quest.status === 'current' ? (quest.questType === 'sorting' ? <Grid3X3 className="w-5 h-5 md:w-6 md:h-6" /> : <MapPin className="w-5 h-5 md:w-6 md:h-6" />) : 
                                         <Lock className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                    <div className={`p-3 md:p-8 rounded-2xl md:rounded-[40px] border transition-all duration-500 ${
                                        isHighlighted ? 'bg-slate-900/90 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-[1.05] z-[9999] relative ring-4 ring-emerald-500 animate-pulse pointer-events-auto' :
                                        quest.status === 'current' ? 'bg-slate-900/60 border-blue-500/50 shadow-2xl md:scale-[1.02]' :
                                        'bg-slate-900/40 border-slate-800'
                                    }`}>
                                        <div className="flex flex-row items-center gap-3 md:gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full mb-1 md:mb-2">
                                                    <span className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 md:py-1 rounded-md md:rounded-lg shrink-0">Д {quest.day}</span>
                                                    <h3 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter truncate leading-none">{quest.title}</h3>
                                                </div>
                                                
                                                <div className="hidden md:block bg-slate-950/50 p-4 rounded-2xl border-l-4 border-slate-700 mt-2">
                                                    <p className="text-slate-400 text-sm">"{quest.thought}"</p>
                                                </div>
                                                <p className="md:hidden text-[10px] text-slate-400 line-clamp-1 italic leading-tight px-1">"{quest.thought}"</p>

                                                <div className="hidden md:flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wide mt-2">
                                                    <Sparkles size={12} className="text-amber-500" />
                                                    Завдання: {quest.task}
                                                </div>
                                            </div>
                                            
                                            <div className="shrink-0 flex items-center justify-center">
                                                {quest.status !== 'locked' && (
                                                    <button 
                                                        onClick={() => handleQuestAction(quest)}
                                                        className={`flex items-center justify-center w-10 h-10 md:w-auto md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                                            quest.status === 'current' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {quest.status === 'completed' ? <Check className="w-5 h-5 md:hidden" strokeWidth={3} /> : <Play className="w-4 h-4 md:hidden ml-1" />}
                                                        <span className="hidden md:flex items-center gap-2">
                                                            {quest.status === 'completed' ? <><Check className="w-5 h-5" /> Пройдено</> : <><Play className="w-5 h-5" /> Почати</>}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {expandedQuestId === quest.id && quest.material && (
                                            <div className="mt-6 pt-6 border-t border-slate-800 animate-in slide-in-from-top-4 duration-300">
                                                <div 
                                                    className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed mb-6" 
                                                    dangerouslySetInnerHTML={{ __html: quest.material.content || quest.material.text || '' }} 
                                                />
                                                {quest.status !== 'completed' && (
                                                    <button 
                                                        onClick={async () => {
                                                            setExpandedQuestId(null);
                                                            
                                                            // Save the material progress
                                                            const userId = localStorage.getItem("userId");
                                                            if (userId) {
                                                                try {
                                                                    await api.updateUserProgress(userId, quest.materialId, 'material');
                                                                    await api.updateResilience(userId, 'material_feedback', { delta: 2 }, quest.material?.title || 'Матеріал');
                                                                } catch (error) {
                                                                    console.error('Error saving material progress:', error);
                                                                }
                                                            }
                                                            
                                                            // Also trigger the quest complete action if needed
                                                            if (onMaterialComplete) onMaterialComplete(quest.materialId);
                                                            
                                                            const savedData = JSON.parse(localStorage.getItem("dr_test_results"));
                                                            const config = getDiagnosticConfig(savedData?.answers);
                                                            setPageType(config?.type || "default");
                                                            
                                                            Promise.all([
                                                                api.getScenarios().catch(() => []),
                                                                api.getMaterials().catch(() => []),
                                                                api.getProfile().catch(() => ({ completedScenarios: [], completedMaterials: [], history: [], diaryEntries: [] }))
                                                            ]).then(([scenariosData, materialsData, profile]) => {
                                                                const mixedQuests = createMixedQuests(scenariosData, materialsData);
                                                                const updated = updateQuestStatuses(
                                                                    profile.completedScenarios || [], 
                                                                    profile.completedMaterials || [], 
                                                                    mixedQuests,
                                                                    profile
                                                                );
                                                                setQuests(updated);
                                                            });
                                                        }}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0b0f1a] py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Завершити ознайомлення
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                ));
            }, [quests, expandedQuestId, tourStep])}
            </div>
        </div>
    );
};

export default QuestsView;
