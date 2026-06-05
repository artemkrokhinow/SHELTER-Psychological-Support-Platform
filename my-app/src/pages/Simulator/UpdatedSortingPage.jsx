import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../infrastructure/api/api";
import CharacterCompanion from "../../components/characterCompanion/CharacterCompanion";
import { ArrowLeft, Target, Sparkles, Clock, LayoutGrid } from 'lucide-react';
import "./updatedSortingPage.css";

export default function UpdatedSortingPage({ isEmbedded, embeddedId, onBack, onComplete }) {
    const params = useParams();
    const id = isEmbedded ? embeddedId : params.id;
    const navigate = useNavigate();
    
    const [scenario, setScenario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [boxes, setBoxes] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [sortedCount, setSortedCount] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [highlightedBox, setHighlightedBox] = useState(null);
    const [showCompletionMenu, setShowCompletionMenu] = useState(false);
    const [score, setScore] = useState(100);
    const [sessionTime, setSessionTime] = useState(0);
    const sessionStartTime = useRef(Date.now());

    const handleClose = () => {
        if (isEmbedded && onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setSessionTime(Math.floor((Date.now() - sessionStartTime.current) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadScenario = async () => {
            try {
                let data = null;
                if (id && id !== 'null' && !id.startsWith('hardcoded-sorting')) {
                    data = await api.getScenarioById(id).catch(e => null);
                }

                setScenario(data && !data.message ? data : { name: "Сортування думок" });
                
                let dbBoxes = data && !data.message ? (data.content?.categories || data.categories || []) : [];
                let dbItems = data && !data.message ? (data.content?.items || data.items || []) : [];

                if (dbBoxes.length === 0 || dbItems.length === 0) {
                    console.log('Using hardcoded sorting data as fallback');
                    
                    if (id === 'hardcoded-sorting-2') {
                        setScenario({ name: "Коло контролю" });
                        dbBoxes = [
                            { id: 'in_control', name: 'Мій контроль', color: '#8b5cf6' },
                            { id: 'out_control', name: 'Поза моїм контролем', color: '#64748b' }
                        ];
                        dbItems = [
                            { id: 'i1', text: 'Мої власні вчинки', categoryId: 'in_control' },
                            { id: 'i2', text: 'Дії інших людей', categoryId: 'out_control' },
                            { id: 'i3', text: 'Мої слова та реакції', categoryId: 'in_control' },
                            { id: 'i4', text: 'Погода на вулиці', categoryId: 'out_control' },
                            { id: 'i5', text: 'Думки інших про мене', categoryId: 'out_control' },
                            { id: 'i6', text: 'Мої життєві цілі', categoryId: 'in_control' },
                        ];
                    } else if (id === 'hardcoded-sorting-3') {
                        setScenario({ name: "Звички" });
                        dbBoxes = [
                            { id: 'healthy', name: 'Здорові звички', color: '#10b981' },
                            { id: 'toxic', name: 'Токсичні патерни', color: '#f59e0b' }
                        ];
                        dbItems = [
                            { id: 'i1', text: 'Регулярний відпочинок', categoryId: 'healthy' },
                            { id: 'i2', text: 'Порівняння себе з іншими', categoryId: 'toxic' },
                            { id: 'i3', text: 'Вміння казати «Ні»', categoryId: 'healthy' },
                            { id: 'i4', text: 'Ігнорування власних емоцій', categoryId: 'toxic' },
                            { id: 'i5', text: 'Перфекціонізм у всьому', categoryId: 'toxic' },
                            { id: 'i6', text: 'Фізична активність', categoryId: 'healthy' },
                        ];
                    } else {
                        setScenario({ name: "Сортування думок" });
                        dbBoxes = [
                            { id: 'positive', name: 'Корисні думки', color: '#10b981' },
                            { id: 'negative', name: 'Деструктивні думки', color: '#f43f5e' }
                        ];
                        dbItems = [
                            { id: 'i1', text: 'Я зможу це подолати', categoryId: 'positive' },
                            { id: 'i2', text: 'Все завжди йде не так', categoryId: 'negative' },
                            { id: 'i4', text: 'Це гарна можливість для росту', categoryId: 'positive' },
                            { id: 'i5', text: 'Я ніколи не навчуся', categoryId: 'negative' },
                            { id: 'i7', text: 'Помилки допомагають мені вчитися', categoryId: 'positive' },
                            { id: 'i8', text: 'Ніхто мене не розуміє', categoryId: 'negative' },
                        ];
                    }
                }

                setBoxes(dbBoxes.map(b => ({ ...b, items: [], isHighlighted: false })));
                setItems(dbItems.map((item, index) => ({
                    ...item,
                    id: item.id !== undefined ? item.id : index,
                    categoryId: item.categoryId !== undefined ? item.categoryId : item.category,
                    scale: 1,
                    isAbsolute: false
                })).sort(() => Math.random() - 0.5));
                setTotalItems(dbItems.length);
            } catch (err) {
                console.error('Error loading sorting scenario:', err);
            } finally {
                setLoading(false);
            }
        };

        loadScenario();
    }, [id]);

    const dragCloneRef = useRef(null);

    const handleDragStart = (e, item) => {
        // Create opaque clone for custom drag ghost
        const rect = e.target.getBoundingClientRect();
        
        const clone = e.target.cloneNode(true);
        clone.style.position = "absolute";
        clone.style.top = `${rect.top + window.scrollY}px`;
        clone.style.left = `${rect.left + window.scrollX}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.opacity = "1";
        clone.style.transform = "scale(1.05)";
        clone.style.boxShadow = "0 30px 60px -15px rgba(0, 0, 0, 0.8)";
        clone.style.zIndex = "-9999";
        clone.style.pointerEvents = "none";
        clone.classList.remove('hidden-source');
        document.body.appendChild(clone);
        dragCloneRef.current = clone;

        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        if (e.dataTransfer && e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(clone, offsetX, offsetY);
        }

        // Delay state update so browser can take the snapshot of the original element first
        // And then React will re-render and apply 'hidden-source' class to the original element
        setTimeout(() => {
            setDraggedItem(item);
        }, 0);
    };

    const handleDragEnd = (e) => {
        setDraggedItem(null);
        if (dragCloneRef.current && document.body.contains(dragCloneRef.current)) {
            document.body.removeChild(dragCloneRef.current);
            dragCloneRef.current = null;
        }
    };

    const handleBoxDrop = (e, boxId) => {
        e.preventDefault();
        e.stopPropagation(); // prevent area drop
        e.currentTarget.classList.remove('drag-over');
        if (!draggedItem) return;

        if (draggedItem.categoryId === boxId) {
            setBoxes(prev => prev.map(b => 
                b.id === boxId ? { ...b, items: [...b.items, draggedItem], isHighlighted: true } : b
            ));
            setItems(prev => prev.filter(item => item.id !== draggedItem.id));
            setSortedCount(prev => prev + 1);
            
            setTimeout(() => {
                setBoxes(prev => prev.map(b => 
                    b.id === boxId ? { ...b, isHighlighted: false } : b
                ));
            }, 500);

            if (sortedCount + 1 >= totalItems) {
                if (showCompletionMenu) return; 

                const userId = localStorage.getItem("userId");
                if (userId) {
                    try {
                        api.updateResilience(userId, "exercise_complete", { score }, scenario?.name || "Сортування").catch(console.error);
                    } catch(e) {}
                }
                try {
                    if (id && !id.startsWith('hardcoded-sorting')) {
                        api.completeScenario(id, 100).catch(console.error);
                    }
                } catch(e) {}
                if (onComplete) {
                    onComplete(id);
                }
                setShowCompletionMenu(true);
            }
        } else {
            setHighlightedBox(boxId);
            setScore(prev => prev - 10);
            setTimeout(() => setHighlightedBox(null), 500);
        }
    };

    const handleAreaDrop = (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        const rect = e.currentTarget.getBoundingClientRect();
        // center the item around the drop point (assuming width ~200, height ~60)
        const x = e.clientX - rect.left - 100;
        const y = e.clientY - rect.top - 30;

        setItems(prev => prev.map(item => 
            item.id === draggedItem.id ? { ...item, x, y, isAbsolute: true } : item
        ));
        setDraggedItem(null);
    };

    if (loading) return (
        <div className="dr-updated-sorting-layout items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="dr-updated-sorting-layout">
            <header className="dr-sorting-header">
                <div className="dr-header-content">
                    {/* Back button removed as requested */}
                    
                    <h1 className="dr-scenario-title">{scenario?.name || "Сортування"}</h1>
                    
                    <div className="dr-header-stats">
                        <div className="dr-stat-item">
                            <Target size={16} />
                            <span>{sortedCount}/{totalItems}</span>
                        </div>
                        <div className="dr-stat-item">
                            <Sparkles size={16} />
                            <span>{score}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="dr-game-main">
                <div 
                    className="dr-sorting-area" 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleAreaDrop}
                >
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`dr-sorting-item ${draggedItem?.id === item.id ? 'hidden-source' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            style={{
                                ...(item.isAbsolute ? {
                                    position: 'absolute',
                                    left: `${item.x}px`,
                                    top: `${item.y}px`,
                                    zIndex: 10
                                } : { position: 'relative' })
                            }}
                        >
                            {item.text}
                        </div>
                    ))}
                    {items.length === 0 && sortedCount < totalItems && (
                        <div className="flex items-center justify-center h-full opacity-20 italic">
                            Всі елементи на місцях...
                        </div>
                    )}
                </div>

                <div className="dr-sorting-dock">
                    {boxes.map((box) => (
                        <div
                            key={box.id}
                            className={`dr-sorting-box ${highlightedBox === box.id ? 'highlight-wrong' : ''} ${box.isHighlighted ? 'highlight-correct' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                            onDrop={(e) => handleBoxDrop(e, box.id)}
                        >
                            <div className="dr-box-header">
                                <div className="dr-box-label" style={{ backgroundColor: box.color }}>
                                    {box.name}
                                </div>
                                <div className="dr-box-count">
                                    {box.items.length}
                                </div>
                            </div>
                            <div className="dr-box-content">
                                {box.items.map((_, idx) => (
                                    <div key={idx} className="dr-sorted-mini-item" style={{ backgroundColor: box.color }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {showCompletionMenu && (
                <div className="dr-completion-overlay">
                    <div className="dr-completion-card">
                        <div className="dr-completion-icon">🏆</div>
                        <h2>Вправа завершена!</h2>
                        <div className="dr-completion-stats">
                            <div className="dr-stat-row">
                                <span>Рахунок:</span>
                                <span>{score}</span>
                            </div>
                        </div>
                        <button className="dr-completion-btn primary" onClick={handleClose}>
                            Завершити
                        </button>
                        <button className="dr-completion-btn secondary" onClick={() => window.location.reload()}>
                            Ще раз
                        </button>
                    </div>
                </div>
            )}

            {}
        </div>
    );
}
