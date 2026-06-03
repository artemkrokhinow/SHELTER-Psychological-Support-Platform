import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../infrastructure/api/api";
import CharacterCompanion from "../../components/characterCompanion/CharacterCompanion";
import { ArrowLeft, Search, ZoomIn, ZoomOut, RotateCcw, Eye, Target, Trophy } from 'lucide-react';
import "./updatedFindDifferencesPage.css";

export default function UpdatedFindDifferencesPage({ isEmbedded, embeddedId, onBack, onComplete }) {
    const params = useParams();
    const id = isEmbedded ? embeddedId : params.id;
    const navigate = useNavigate();

    const handleClose = () => {
        if (isEmbedded && onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const [scenario, setScenario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [imageZoom, setImageZoom] = useState(1);
    const [score, setScore] = useState(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [sessionTime, setSessionTime] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const imageRef = useRef(null);
    const companionRef = useRef(null);
    const sessionStartTime = useRef(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setSessionTime(Math.floor((Date.now() - sessionStartTime.current) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!id || id === 'null') return;
        api.getScenarioById(id)
            .then((data) => {
                if (data && !data.message) {
                    setScenario(data);
                    setFoundDifferences([]);
                    setCurrentLevelIndex(0);
                    setScore(0);
                    setHintsUsed(0);
                } else {
                    setScenario(null);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('UpdatedFindDifferencesPage - error:', err);
                setLoading(false);
            });
    }, [id]);

    const handleImageClick = (e) => {
        if (isFinished || !imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const scaleX = imageRef.current.naturalWidth / rect.width;
        const scaleY = imageRef.current.naturalHeight / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const currentLevel = scenario.levels?.[currentLevelIndex];
        if (!currentLevel) return;

        const differences = currentLevel.differences || [];
        const clickedDifference = differences.find(diff => {
            const dx = x - diff.x;
            const dy = y - diff.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= (diff.radius || 20);
        });

        if (clickedDifference) {
            const diffId = `${currentLevelIndex}-${clickedDifference.x}-${clickedDifference.y}`;
            if (!foundDifferences.includes(diffId)) {
                const updatedFound = [...foundDifferences, diffId];
                setFoundDifferences(updatedFound);
                setScore(prev => prev + (clickedDifference.points || 10));

                const userId = localStorage.getItem("userId");
                if (userId) {
                    api.updateResilience(userId, "difference_found", { points: clickedDifference.points }, scenario.name);
                }

                
                const marker = document.querySelector(`[data-diff-id="${diffId}"]`);
                if (marker) {
                    marker.classList.add('found');
                }

                if (updatedFound.filter(fid => fid.startsWith(`${currentLevelIndex}-`)).length >= differences.length) {
                    setIsFinished(true);
                    const finalScore = score + (clickedDifference.points || 10);
                    if (userId) {
                        api.updateResilience(userId, "level_complete", {}, scenario.name);
                        api.completeScenario(id, 10);
                    }
                    if (onComplete) {
                        onComplete(id);
                    }

                    
                    if (companionRef.current && companionRef.current.speakAchievement) {
                        companionRef.current.speakAchievement();
                    }
                }
            }
        } else {
            
            const clickEffect = document.createElement('div');
            clickEffect.className = 'wrong-click';
            clickEffect.style.left = `${e.clientX - rect.left}px`;
            clickEffect.style.top = `${e.clientY - rect.top}px`;
            imageRef.current.parentElement.appendChild(clickEffect);

            setTimeout(() => {
                clickEffect.remove();
            }, 600);
        }
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const handleNextLevel = () => {
        if (currentLevelIndex + 1 < (scenario.levels?.length || 0)) {
            setCurrentLevelIndex(currentLevelIndex + 1);
            setFoundDifferences([]);
            setIsFinished(false);
            setImageZoom(1);
            setShowHint(false);
        } else {
            handleClose();
        }
    };

    const handleSosClick = async () => {
        const userId = localStorage.getItem("userId");
        if (userId) await api.updateResilience(userId, "sos", { panic: true }, "Натиснута кнопка SOS");
        navigate("/sos");
    };

    const useHint = () => {
        if (hintsUsed >= 3 || isFinished) return;

        const currentLevel = scenario.levels?.[currentLevelIndex];
        const differences = currentLevel?.differences || [];

        
        const unfoundDifference = differences.find((diff, index) => {
            const diffId = `${currentLevelIndex}-${diff.x}-${diff.y}`;
            return !foundDifferences.includes(diffId);
        });

        if (unfoundDifference) {
            setHintsUsed(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 5));
            setShowHint(true);

            
            setTimeout(() => {
                setShowHint(false);
            }, 3000);
        }
    };

    const resetZoom = () => {
        setImageZoom(1);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="dr-updated-find-layout">
            <div className="dr-loading-container">
                <div className="dr-loading-spinner"></div>
                <h2>Завантаження...</h2>
            </div>
        </div>
    );

    if (!scenario) return (
        <div className="dr-updated-find-layout">
            <div className="dr-error-container">
                <Search size={48} />
                <h2>Сценарій не знайдено</h2>
                <p>Перевірте правильність URL або спробуйте інший сценарій</p>
                <button onClick={handleClose} className="dr-back-btn">
                    Повернутися до вправ
                </button>
            </div>
        </div>
    );

    const currentLevel = scenario.levels?.[currentLevelIndex];
    if (!currentLevel) {
        return (
            <div className="dr-updated-find-layout">
                <div className="dr-error-container">
                    <Target size={48} />
                    <h2>Рівень не знайдено</h2>
                    <button onClick={handleClose} className="dr-back-btn">
                        Повернутися до вправ
                    </button>
                </div>
            </div>
        );
    }

    if (!currentLevel.image) {
        return (
            <div className="dr-updated-find-layout">
                <div className="dr-error-container">
                    <Eye size={48} />
                    <h2>Зображення не знайдено</h2>
                    <button onClick={handleClose} className="dr-back-btn">
                        Повернутися до вправ
                    </button>
                </div>
            </div>
        );
    }

    const differences = currentLevel?.differences || [];
    const foundCount = foundDifferences.filter(id => id.startsWith(`${currentLevelIndex}-`)).length;

    return (
        <div className="dr-updated-find-layout">
            {}
            <header className="dr-find-header">
                <div className="dr-header-content">
                    <button className="dr-back-btn" onClick={handleClose}>
                        <ArrowLeft size={20} />
                        <span>До вправ</span>
                    </button>

                    <div className="dr-header-info">
                        <h1 className="dr-scenario-title">{scenario.name}</h1>
                        <p className="dr-level-info">Рівень {currentLevelIndex + 1} з {scenario.levels?.length || 1}</p>
                    </div>

                    <div className="dr-header-stats">
                        <div className="dr-stat-item">
                            <Target size={16} />
                            <span>{foundCount}/{differences.length}</span>
                        </div>
                        <div className="dr-stat-item">
                            <Trophy size={16} />
                            <span>{score}</span>
                        </div>
                        <div className="dr-stat-item">
                            <Search size={16} />
                            <span>{formatTime(sessionTime)}</span>
                        </div>
                    </div>
                </div>
            </header>

            {}
            <main className="dr-find-main">
                {isFinished ? (
                    <div className="dr-completion-overlay">
                        <div className="dr-completion-card">
                            <div className="dr-completion-header">
                                <div className="dr-completion-icon">🎉</div>
                                <h2>Рівень завершено!</h2>
                                <p>Ти знайшов всі відмінності!</p>
                            </div>
                            <div className="dr-completion-stats">
                                <div className="dr-stat-row">
                                    <span>Час:</span>
                                    <span>{formatTime(sessionTime)}</span>
                                </div>
                                <div className="dr-stat-row">
                                    <span>Результат:</span>
                                    <span>{score} очок</span>
                                </div>
                                <div className="dr-stat-row">
                                    <span>Підказки:</span>
                                    <span>{hintsUsed}</span>
                                </div>
                            </div>
                            <div className="dr-completion-actions">
                                {currentLevelIndex + 1 < (scenario.levels?.length || 0) ? (
                                    <button className="dr-completion-btn primary" onClick={handleNextLevel}>
                                        Наступний рівень →
                                    </button>
                                ) : (
                                    <button className="dr-completion-btn primary" onClick={handleClose}>
                                        До списку вправ
                                    </button>
                                )}
                                <button className="dr-completion-btn secondary" onClick={() => window.location.reload()}>
                                    Спробувати ще раз
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="dr-game-container">
                        {}
                        <div className="dr-game-controls">
                            <div className="dr-zoom-controls">
                                <button
                                    className="dr-control-btn"
                                    onClick={() => setImageZoom(prev => Math.min(3, prev + 0.2))}
                                    disabled={imageZoom >= 3}
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <span className="dr-zoom-level">{Math.round(imageZoom * 100)}%</span>
                                <button
                                    className="dr-control-btn"
                                    onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.2))}
                                    disabled={imageZoom <= 0.5}
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button className="dr-control-btn" onClick={resetZoom}>
                                    <RotateCcw size={18} />
                                </button>
                            </div>

                            <div className="dr-hint-control">
                                <button
                                    className={`dr-hint-btn ${hintsUsed >= 3 ? 'disabled' : ''}`}
                                    onClick={useHint}
                                    disabled={hintsUsed >= 3}
                                >
                                    <Eye size={18} />
                                    <span>Підказка ({3 - hintsUsed})</span>
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="dr-image-container">
                            <div className="dr-find-counter">
                                Знайдено: <span className="dr-found-count">{foundCount}</span> / {differences.length}
                            </div>

                            <div className="dr-image-wrapper">
                                <img
                                    ref={imageRef}
                                    src={currentLevel.image}
                                    alt="Find Differences"
                                    className="dr-find-image"
                                    style={{
                                        transform: `scale(${imageZoom})`,
                                        transformOrigin: 'center center',
                                        transition: 'transform 0.2s ease-out'
                                    }}
                                    onClick={handleImageClick}
                                    onWheel={handleWheel}
                                />

                                {}
                                {differences.map((diff, idx) => {
                                    const diffId = `${currentLevelIndex}-${diff.x}-${diff.y}`;
                                    const isFound = foundDifferences.includes(diffId);
                                    const isHinted = showHint && !isFound && diff === differences.find(d => {
                                        const dId = `${currentLevelIndex}-${d.x}-${d.y}`;
                                        return !foundDifferences.includes(dId);
                                    });

                                    const img = imageRef.current;
                                    if (!img) return null;
                                    const rect = img.getBoundingClientRect();
                                    const scaleX = rect.width / img.naturalWidth;
                                    const scaleY = rect.height / img.naturalHeight;

                                    return (
                                        <div
                                            key={idx}
                                            data-diff-id={diffId}
                                            className={`dr-difference-marker ${isFound ? 'found' : ''} ${isHinted ? 'hinted' : ''}`}
                                            style={{
                                                left: diff.x * scaleX - (diff.radius || 20) * scaleX,
                                                top: diff.y * scaleY - (diff.radius || 20) * scaleY,
                                                width: (diff.radius || 20) * 2 * scaleX,
                                                height: (diff.radius || 20) * 2 * scaleY,
                                                transform: `scale(${imageZoom})`,
                                                transformOrigin: 'center center'
                                            }}
                                        >
                                            {isFound && (
                                                <div className="dr-marker-content">
                                                    <div className="dr-marker-check">✓</div>
                                                    <div className="dr-marker-points">+{diff.points || 10}</div>
                                                </div>
                                            )}
                                            {isHinted && (
                                                <div className="dr-hint-ring"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {}
            <button className="dr-sos-fab" onClick={handleSosClick}>
                SOS
            </button>

            {}
            {}
        </div>
    );
}
