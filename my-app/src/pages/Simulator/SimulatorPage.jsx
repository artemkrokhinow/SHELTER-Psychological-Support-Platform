import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../infrastructure/api/api";
import CharacterCompanion from "../../components/characterCompanion/CharacterCompanion";
import "./simulatorPage.css";

export default function SimulatorPage({ isEmbedded, embeddedId, onBack, applyResilienceChange, onComplete }) {
    const params = useParams();
    const id = isEmbedded ? embeddedId : params.id;
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const [scenario, setScenario] = useState(null);
    const [history, setHistory] = useState([]);
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [progress, setProgress] = useState(5);
    const [showCompletionMenu, setShowCompletionMenu] = useState(false);
    const [sessionScore, setSessionScore] = useState(0);
    const [choicesCount, setChoicesCount] = useState(0);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        api.getScenarioById(id)
            .then((data) => {
                if (data && data.nodes) {
                    setScenario(data);
                    const startId = data.nodes["start"] ? "start" : Object.keys(data.nodes)[0];
                    setCurrentNodeId(startId);
                    setHistory([{ role: "bot", text: data.nodes[startId].text }]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [history, isFinished]);

    const handleOption = (option) => {
        const nextId = option.next;
        const newHistory = [...history, { role: "user", text: option.text }];
        const weight = option.weight || 0;
        const currentTotalScore = sessionScore + weight;
        const currentTotalChoices = choicesCount + 1;

        setSessionScore(currentTotalScore);
        setChoicesCount(currentTotalChoices);

        
        if (applyResilienceChange) {
            applyResilienceChange('simulator_choice', { weight, name: scenario.name });
        } else {
            
            if (weight < 0) {
                const userId = localStorage.getItem("userId");
                if (userId) api.updateResilience(userId, "wrong_answer", { weight }, scenario.name);
            }
        }

        if (option.text.toLowerCase().includes("ні")) {
            setHistory([...newHistory, { 
                role: "bot", 
                text: "Бажаєш спробувати інший сценарій чи продовжити цей?",
                isChoice: true
            }]);
            return;
        }

        if (!nextId || !scenario.nodes[nextId]) {
            finishSession(newHistory, currentTotalScore, currentTotalChoices);
            return;
        }

        const nextNode = scenario.nodes[nextId];
        setHistory([...newHistory, { role: "bot", text: nextNode.text }]);
        setCurrentNodeId(nextId);

        if (nextNode.options && nextNode.options.length === 0 || nextNode.isFinal || nextNode.score !== undefined) {
            finishSession([...newHistory, { role: "bot", text: nextNode.text }], currentTotalScore, currentTotalChoices, nextNode.score);
        } else {
            setProgress((prev) => Math.min(prev + 15, 90));
        }
    };

    const handleChoice = (choice) => {
        if (choice === 'other') {
            if (isEmbedded && onBack) onBack();
            else navigate("/exercises");
        } else {
            const availableNodes = Object.keys(scenario.nodes).filter(id => id !== currentNodeId && !scenario.nodes[id].isFinal);
            if (availableNodes.length > 0) {
                const nextId = availableNodes[0];
                const nextNode = scenario.nodes[nextId];
                setHistory(prev => [...prev.slice(0, -1), { role: "bot", text: nextNode.text }]);
                setCurrentNodeId(nextId);
            } else {
                finishSession(history, sessionScore, choicesCount);
            }
        }
    };

    const finishSession = async (finalHistory, totalPoints, totalChoices, forcedScore) => {
        setHistory(finalHistory);
        setIsFinished(true);
        setProgress(100);
        
        const calculatedScore = totalChoices > 0 ? Math.round((totalPoints / totalChoices) * 100) : 0;
        const score = forcedScore !== undefined ? forcedScore : calculatedScore;
        
        setSessionScore(score); 

        const isSuccess = score >= 50;
        const finalImpact = isSuccess ? 4 : -4;
        
        try {
            await api.completeScenario(id, score);
        } catch (error) {
            console.error('❌ FRONTEND (SimulatorPage): api.completeScenario failed!', error);
        }

        if (applyResilienceChange) {
            applyResilienceChange('exercise_finish', { score, delta: finalImpact, name: scenario.name });
        } else {
            const userId = localStorage.getItem("userId");
            if (userId) {
                try {
                    await api.updateResilience(userId, "exercise", { score }, scenario.name);
                } catch(e) {}
            }
        }
        
        if (onComplete) {
            onComplete(id);
        }

        setTimeout(() => setShowCompletionMenu(true), 1500);
    };

    if (loading) return <div className="dr-new-layout dr-st-center"><h2>Завантаження...</h2></div>;

    const currentNode = scenario.nodes[currentNodeId];

    return (
        <div className="dr-new-layout dr-sim-page">
            <div className="dr-trainer-progress-track">
                <div className="dr-trainer-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>

            {!isFinished && (
                <aside className="dr-sorting-sidebar">
                    <h2 className="dr-sorting-title">Психологічний тренажер</h2>
                    <p className="dr-sorting-desc">
                        Обирай варіанти відповідей, щоб навчитися конструктивно виходити з ситуацій.
                    </p>
                </aside>
            )}

            <header className="dr-trainer-header">
                <button className="dr-back-btn" onClick={() => isEmbedded && onBack ? onBack() : navigate("/exercises")}>← Вийти</button>
                <span className="dr-trainer-title">{scenario.name}</span>
                <div style={{ width: "80px" }}></div>
            </header>

            <main className="dr-chat-area">
                <div className="dr-message-column">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`dr-bubble ${msg.role}`}>
                            {msg.text}
                        </div>
                    ))}
                    {isFinished && (
                        <div className="dr-feedback-block">
                            <div className="dr-feedback-icon">🌟</div>
                            <h3>Вправа завершена!</h3>
                            <p>Дякуємо за практику. Твій рівень стійкості оновлено.</p>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </main>

            <footer className="dr-choice-panel">
                <div className="dr-options-stack">
                    {!isFinished && (
                        history[history.length - 1]?.isChoice ? (
                            <>
                                <button className="dr-choice-btn" onClick={() => handleChoice('other')}>Спробувати інший сценарій</button>
                                <button className="dr-choice-btn" onClick={() => handleChoice('continue')}>Продовжити цей</button>
                            </>
                        ) : (
                            currentNode?.options?.map((opt, idx) => {
                            const colors = ['#4d7cfe', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                            const btnColor = opt.next === 'explosion' || opt.next === 'angry_end' ? '#ef4444' : colors[idx % colors.length];
                            return (
                                <button 
                                    key={idx} 
                                    className="dr-choice-btn" 
                                    style={{ 
                                        '--tile-color': btnColor,
                                        borderColor: btnColor,
                                        color: btnColor
                                    }}
                                    onClick={() => handleOption(opt)}
                                >
                                    {opt.text}
                                </button>
                            );
                        })
                        )
                    )}
                </div>
            </footer>

            <button className="dr-sos-fab-trainer" onClick={() => isEmbedded && onBack ? onBack() : navigate("/sos")}>SOS</button>
            {}

            {showCompletionMenu && (
                <div className="dr-completion-overlay">
                    <div className="dr-completion-menu">
                        <h2>{sessionScore < 30 ? "😟 Потрібна пауза" : "🌟 Вправа завершена!"}</h2>
                        <p className="dr-card-description">
                            {sessionScore < 30 
                                ? "Схоже, цей діалог був складним. Давай відновимо спокій?" 
                                : "Кожна практика робить тебе сильнішим."}
                        </p>
                        <div className="dr-completion-buttons grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                            {sessionScore < 30 ? (
                                <>
                                    <button className="dr-completion-btn primary pulse" onClick={() => navigate("/breathing")}>Заспокоїтися</button>
                                    <button className="dr-completion-btn secondary" onClick={() => navigate("/main")}>На головну</button>
                                    <button className="dr-completion-btn secondary" onClick={() => window.location.reload()}>Спробувати ще раз</button>
                                </>
                            ) : (
                                <>
                                    <button className="dr-completion-btn secondary" onClick={() => isEmbedded && onBack ? onBack() : navigate("/exercises")}>Вийти</button>
                                    <button className="dr-completion-btn primary pulse" onClick={() => navigate("/main")}>Прогрес</button>
                                    <button className="dr-completion-btn secondary" onClick={() => window.location.reload()}>Ще раз</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}