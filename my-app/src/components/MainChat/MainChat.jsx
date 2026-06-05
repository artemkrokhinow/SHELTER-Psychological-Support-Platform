import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../infrastructure/api/api';
import CharacterCompanion from '../../components/characterCompanion/CharacterCompanion';
import { Bot, User, MessageSquare, Sparkles, ChevronRight, Play, LayoutGrid, ChevronLeft, Clock, Zap, Target, AlertCircle } from 'lucide-react';
import './mainChat.css';

const limitWords = (str, limit = 6) => {
    if (!str) return '';
    const words = str.split(/\s+/);
    if (words.length <= limit) return str;
    return words.slice(0, limit).join(' ') + '...';
};

const getFourOptions = (options, nodeId) => {
    if (!options) return [];
    let result = [...options];
    const genericOptions = [
        { text: "Розумію твої почуття.", next: options[0]?.next || nodeId },
        { text: "Давай знайдемо вихід.", next: options[0]?.next || nodeId },
        { text: "Це дійсно важливо.", next: options[0]?.next || nodeId },
        { text: "Давай рухатися далі.", next: options[0]?.next || nodeId }
    ];
    while (result.length < 4) {
        const filler = genericOptions[result.length % genericOptions.length];
        result.push({
            ...filler,
            next: options[0]?.next || filler.next
        });
    }
    return result.slice(0, 4);
};



export default function MainChat({ onBack, username, resilience, onComplete, onMistakesSuggested, onStartMistakesAnalysis, initialScenarioId }) {
    const [chatView, setChatView] = useState(initialScenarioId ? "loading" : "selection"); 
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [scenario, setScenario] = useState(null);
    const [scenariosList, setScenariosList] = useState([]);
    const [currentNodeId, setCurrentNodeId] = useState('start');
    const [isChatMode, setIsChatMode] = useState('scenario'); 
    const [loading, setLoading] = useState(false);
    const [flyingMessage, setFlyingMessage] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [showCompletionMenu, setShowCompletionMenu] = useState(false);
    const [particles, setParticles] = useState([]);
    const [choiceStats, setChoiceStats] = useState({ positive: 0, negative: 0, neutral: 0 });
    const [finalScore, setFinalScore] = useState(100);
    const [userPath, setUserPath] = useState([]);
    
    const messagesEndRef = useRef(null);

    const triggerCompletion = (delay, scoreVal) => {
        setTimeout(() => {
            setShowCompletionMenu(true);
            const isPositive = scoreVal >= 50;
            const pts = [];
            if (isPositive) {
                for (let i = 0; i < 40; i++) {
                    pts.push({
                        id: i,
                        dx: `${(Math.random() - 0.5) * 800}px`,
                        dy: `${-Math.random() * 500 - 150}px`,
                        delay: `${Math.random() * 0.4}s`,
                        color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
                        size: `${Math.random() * 10 + 6}px`
                    });
                }
            } else {
                for (let i = 0; i < 15; i++) {
                    pts.push({
                        id: i,
                        dx: `${(Math.random() - 0.5) * 400}px`,
                        dy: `${-Math.random() * 300 - 100}px`,
                        delay: `${Math.random() * 0.5}s`,
                        color: ['#f43f5e', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 3)],
                        size: `${Math.random() * 8 + 4}px`
                    });
                }
            }
            setParticles(pts);
        }, delay);
    };

    const finishDialogue = (finalScoreValue) => {
        setIsFinished(true);
        setFinalScore(finalScoreValue);

        const scenarioIdForApi = scenario?.scenarioId || scenario?._id || 'ai-chat';
        
        if (onComplete) {
            onComplete(scenarioIdForApi);
        }
        
        api.completeScenario(scenarioIdForApi, finalScoreValue)
            .then(() => {})
            .catch(err => console.error("❌ [DEBUG] Failed to save chat progress:", err));

        triggerCompletion(1200, finalScoreValue);
    };

    const selectScenario = (s) => {
        if (!s || !s.nodes) {
            console.error("Scenario has no nodes:", s);
            return;
        }
        setScenario(s);
        setIsChatMode('scenario');
        const startId = s.nodes["start"] ? "start" : (Object.keys(s.nodes)[0] || 'start');
        setCurrentNodeId(startId);
        setChoiceStats({ positive: 0, negative: 0, neutral: 0 });
        setMessages([
            {
                id: 1,
                text: s.nodes[startId]?.text || "Помилка завантаження вмісту сценарію",
                sender: 'bot',
                timestamp: new Date(),
                isScenario: true
            }
        ]);
        setChatView("chat");
    };

    useEffect(() => {
        api.getScenarios().then(data => {
            if (Array.isArray(data)) {
                const dialogues = data.filter(s => s.type === 'dialogue' || !s.type);
                setScenariosList(dialogues);
                
                if (initialScenarioId) {
                    const target = dialogues.find(s => (s.scenarioId || s._id) === initialScenarioId);
                    if (target) {
                        selectScenario(target);
                    } else {
                        setChatView("selection");
                    }
                }
            }
        });
    }, [initialScenarioId]);

    useEffect(() => {
        if (chatView === "chat") {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, chatView]);


    const handleOptionSelect = (option, e) => {
        if (isTyping || flyingMessage) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const targetRect = messagesEndRef.current.getBoundingClientRect();

        const startPos = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        };

        const targetPos = {
            top: targetRect.top - 100,
            left: targetRect.right - (rect.width / 2) - 80 
        };

        setFlyingMessage({
            text: option.text,
            startPos,
            targetPos
        });

        
        setTimeout(() => {
            const nextId = option.next;
            const weight = option.weight || 0;
            
            const stepRecord = {
                nodeId: currentNodeId,
                chosenOption: option,
                availableOptions: scenario?.nodes[currentNodeId]?.options || []
            };
            
            setChoiceStats(prev => ({
                ...prev,
                positive: prev.positive + (weight > 0 ? 1 : 0),
                negative: prev.negative + (weight < 0 ? 1 : 0),
                neutral: prev.neutral + (weight === 0 ? 1 : 0)
            }));
            
            setUserPath(prev => [...prev, stepRecord]);

            const userMessage = {
                id: messages.length + 1,
                text: option.text,
                sender: 'user',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMessage]);
            setFlyingMessage(null);
            setIsTyping(true);

            setTimeout(() => {
                setIsTyping(false);
                let nextNode = scenario?.nodes?.[nextId];

                if (!nextNode) {
                    const endText = "🌟 Вправу завершено! Дякую за практику.";
                    
                    setMessages(prev => [...prev, {
                        id: prev.length + 1,
                        text: endText,
                        sender: 'bot',
                        timestamp: new Date()
                    }]);
                    finishDialogue(100);
                    return;
                }

                setCurrentNodeId(nextId);
                setMessages(prev => [...prev, {
                    id: prev.length + 1,
                    text: nextNode.text,
                    sender: 'bot',
                    timestamp: new Date(),
                    isScenario: true
                }]);

                const hasOptions = nextNode.options && nextNode.options.length > 0;
                if (!hasOptions) {
                    const score = nextNode.score !== undefined ? nextNode.score : 100;
                    finishDialogue(score);
                }
            }, 350); 
        }, 150); 
    };

    if (chatView === "selection") {
        return (
            <div className="dr-main-chat selection-view">
                <header className="dr-chat-header">
                    <div className="dr-chat-header-content">
                        <div className="dr-chat-title-section">
                            <div className="dr-chat-icon">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="dr-chat-title">Чат-тренажери</h2>
                                <p className="dr-chat-subtitle">Оберіть тему розмови</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dr-chat-selection-container p-8 overflow-y-auto max-h-[calc(100vh-96px)] flex flex-col gap-6">
                    <div className="dr-chat-hero bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] flex items-center justify-between gap-6 max-w-[1200px] mx-auto w-full">
                        <div className="max-w-2xl">
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Інтерактивні чат-тренажери</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Відпрацюйте складні життєві та робочі ситуації у безпечному середовищі. Оберіть один із сценаріїв, щоб навчитися розпізнавати когнітивні спотворення, виражати емпатію та знаходити конструктивний вихід із конфліктів разом із помічником.
                            </p>
                        </div>
                        <div className="dr-hero-stats bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-center min-w-[160px]">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1">Доступно тем</span>
                            <span className="text-4xl font-black text-emerald-500 italic block">{scenariosList.length}</span>
                        </div>
                    </div>

                    <div className="dr-chat-selection-grid">
                        {scenariosList.map((s) => (
                            <div 
                                key={s._id} 
                                className="dr-scenario-card"
                                onClick={() => selectScenario(s)}
                            >
                                <div className="dr-card-icon"><Target size={24} /></div>
                                <h3>{s.name}</h3>
                                <p>Відпрацюйте конкретну ситуацію: {s.category || 'загальне'}</p>
                                <div className="dr-card-footer">
                                    <span className="tag"><Clock size={12} className="inline mr-1" /> {s.duration || '5 хв'}</span>
                                    <span className="tag"><Zap size={12} className="inline mr-1 text-amber-500" /> {s.difficulty || 50}%</span>
                                    <button className="start-btn">Тренуватись <Play size={14} fill="currentColor" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dr-main-chat">
            <header className="dr-chat-header">
                <div className="dr-chat-header-content">
                    <div className="dr-chat-title-section">
                        {!initialScenarioId && (
                            <button onClick={() => setChatView("selection")} className="mr-4 text-slate-500 hover:text-white transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <div className="dr-chat-icon">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="dr-chat-title">{scenario?.name}</h2>
                            <p className="dr-chat-subtitle">Сценарій тренування</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dr-chat-messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`dr-message ${message.sender === 'user' ? 'user' : 'bot'} ${message.isSystem ? 'system' : ''}`}
                    >
                        <div className="dr-message-header">
                            {message.sender === 'bot' ? 'Помічник' : username}
                        </div>
                        <div className="dr-message-content">
                            {message.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="dr-message bot">
                        <div className="dr-message-header">ШІ-помічник</div>
                        <div className="dr-message-content">
                            <div className="dr-typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="dr-chat-footer">
                <div className="dr-scenario-options">
                    {currentNodeId && getFourOptions(scenario?.nodes?.[currentNodeId]?.options, currentNodeId).map((option, index) => (
                        <button
                            key={index}
                            className="dr-option-btn"
                            onClick={(e) => handleOptionSelect(option, e)}
                            disabled={isTyping || flyingMessage}
                        >
                            {option.text}
                        </button>
                    ))}
                </div>
            </div>

            {}
            
            {flyingMessage && (
                <div 
                    className="dr-flying-element"
                    style={{
                        position: 'fixed',
                        top: flyingMessage.startPos.top,
                        left: flyingMessage.startPos.left,
                        width: flyingMessage.startPos.width,
                        height: flyingMessage.startPos.height,
                        '--target-x': `${flyingMessage.targetPos.left - flyingMessage.startPos.left - (flyingMessage.startPos.width / 2)}px`,
                        '--target-y': `${flyingMessage.targetPos.top - flyingMessage.startPos.top}px`,
                    }}
                >
                    {flyingMessage.text}
                </div>
            )}
            {showCompletionMenu && (() => {
                const isPositive = finalScore >= 50;
                const classes = isPositive 
                  ? {
                      iconBg: "bg-emerald-500/20",
                      iconText: "text-emerald-500",
                      badgeBg: "bg-emerald-500/10",
                      badgeBorder: "border-emerald-500/30",
                      badgeText: "text-emerald-500",
                      btnBg: "bg-emerald-500",
                      btnHover: "hover:bg-emerald-400",
                      btnShadow: "shadow-emerald-500/20"
                    }
                  : {
                      iconBg: "bg-rose-500/20",
                      iconText: "text-rose-500",
                      badgeBg: "bg-rose-500/10",
                      badgeBorder: "border-rose-500/30",
                      badgeText: "text-rose-500",
                      btnBg: "bg-rose-500",
                      btnHover: "hover:bg-rose-400",
                      btnShadow: "shadow-rose-500/20"
                    };

                const Icon = isPositive ? Sparkles : AlertCircle;
                const titleText = isPositive ? "Чудова розмова!" : "Складний фінал";
                const badgeText = isPositive ? "+4 Стійкості нараховано" : "-4 Стійкості нараховано";

                return (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b0f1a]/95 backdrop-blur-sm animate-in fade-in duration-500 overflow-hidden">
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className="dr-confetti-particle"
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: '40%',
                                width: p.size,
                                height: p.size,
                                borderRadius: '50%',
                                background: p.color,
                                '--dx': p.dx,
                                '--dy': p.dy,
                                animation: 'confettiFall 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
                                animationDelay: p.delay,
                                pointerEvents: 'none',
                                zIndex: 101
                            }}
                        />
                    ))}

                    <div className="bg-slate-900/80 border border-slate-800 p-10 rounded-[48px] max-w-lg w-full text-center shadow-3xl transform animate-in zoom-in-95 duration-500 relative z-10">
                        <div className={`w-20 h-20 ${classes.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 ${classes.iconText}`}>
                            <Icon size={40} />
                        </div>
                        
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">{titleText}</h2>
                        
                        <div className={`inline-flex items-center gap-2 ${classes.badgeBg} border ${classes.badgeBorder} ${classes.badgeText} px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-6`}>
                            <Zap size={14} className="fill-current" />
                            {badgeText}
                        </div>

                        <div className="flex justify-center gap-4 mb-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-emerald-500">
                                <span className="block text-[10px] uppercase tracking-widest font-black mb-1">Позитивні</span>
                                <span className="block text-2xl font-black">{choiceStats.positive}</span>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 text-rose-500">
                                <span className="block text-[10px] uppercase tracking-widest font-black mb-1">Негативні</span>
                                <span className="block text-2xl font-black">{choiceStats.negative}</span>
                            </div>
                            <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl px-4 py-2 text-slate-400">
                                <span className="block text-[10px] uppercase tracking-widest font-black mb-1">Нейтральні</span>
                                <span className="block text-2xl font-black">{choiceStats.neutral}</span>
                            </div>
                        </div>

                        <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest font-bold">
                            {isPositive 
                                ? "Ваші емпатичні відповіді допомогли вирішити ситуацію." 
                                : "Спробуйте ще раз, обираючи більш конструктивні відповіді."}
                        </p>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={() => {
                                    setShowCompletionMenu(false);
                                    setChatView("selection");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all"
                            >
                                Вийти
                            </button>
                            {isPositive && (
                                <button 
                                    onClick={() => onBack()} 
                                    className={`${classes.btnBg} ${classes.btnHover} text-[#0b0f1a] py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${classes.btnShadow}`}
                                >
                                    До прогресу
                                </button>
                            )}
                            {!isPositive && (
                                <button 
                                    onClick={() => onStartMistakesAnalysis && onStartMistakesAnalysis(scenario, userPath)}
                                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 border border-rose-500/50 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-rose-500/10"
                                >
                                    Робота над помилками
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setIsFinished(false);
                                    setShowCompletionMenu(false);
                                    selectScenario(scenario);
                                }}
                                className={`bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all ${!isPositive ? 'border border-rose-500/50' : ''}`}
                            >
                                Почати знову
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}
        </div>
    );
}
