import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../infrastructure/api/api";
import CharacterCompanion from "../../components/characterCompanion/CharacterCompanion";
import "./sortingPage.css";

export default function SortingPage({ isEmbedded = false, embeddedId = null, onBack = null, onComplete = null }) {
    const params = useParams();
    const id = embeddedId || params.id;
    const navigate = useNavigate();
    const [scenario, setScenario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [boxes, setBoxes] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [sortedCount, setSortedCount] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [highlightedBox, setHighlightedBox] = useState(null);
    const [showCompletionMenu, setShowCompletionMenu] = useState(false);
    const [showCompanion, setShowCompanion] = useState(false);
    const companionRef = useRef(null);

    const generateItems = () => {
        const colors = ['#ff4b4b', '#4b4bff', '#4baf4b', '#9b4bff'];
        const newItems = [];
        for (let i = 0; i < 15; i++) {
            newItems.push({
                id: i,
                color: colors[Math.floor(Math.random() * colors.length)],
                x: Math.random() * 60 + 20,
                y: Math.random() * 40 + 15,
            });
        }
        return newItems;
    };

    const generateBoxes = () => {
        const colors = ['#ff4b4b', '#4b4bff', '#4baf4b', '#9b4bff'];
        return colors.map((color, index) => ({
            id: index,
            color: color,
            items: []
        }));
    };

    useEffect(() => {
        if (!id || id === 'chaos-unloading') {
            const chaosItems = generateItems();
            setScenario({ name: 'Розвантаження хаосу', description: 'Перетягни квадрати у відповідні коробки або просто пересувай їх по полю' });
            setItems(chaosItems);
            setBoxes(generateBoxes());
            setTotalItems(chaosItems.length);
            setLoading(false);
        } else {
            api.getScenarioById(id).then((data) => {
                if (data) {
                    setScenario(data);
                    if (data.categories?.length && data.items?.length) {
                        const parsedBoxes = data.categories.map(c => ({ ...c, items: [] }));
                        const parsedItems = data.items.map((it, idx) => ({
                            ...it,
                            id: idx,
                            color: parsedBoxes.find(b => b.id === it.categoryId)?.color || '#ff4b4b',
                            x: Math.random() * 60 + 20,
                            y: Math.random() * 40 + 15,
                        }));
                        setBoxes(parsedBoxes);
                        setItems(parsedItems);
                        setTotalItems(parsedItems.length);
                    } else {
                        const fallbackItems = generateItems();
                        setItems(fallbackItems);
                        setBoxes(generateBoxes());
                        setTotalItems(fallbackItems.length);
                    }
                }
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [id]);

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        setTimeout(() => e.target.classList.add('dr-item-dragging'), 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dr-item-dragging');
        setDraggedItem(null);
    };

    const handleGlobalDrop = (e) => {
        e.preventDefault();
        if (!draggedItem) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setItems(items.map(item => 
            item.id === draggedItem.id 
                ? { ...item, x: Math.max(5, Math.min(90, x - 2)), y: Math.max(5, Math.min(90, y - 2)) } 
                : item
        ));
    };

    const handleBoxDrop = (e, boxId) => {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (!draggedItem) return;

        const targetBox = boxes.find(b => b.id === boxId);
        const isCorrect =
            draggedItem.categoryId !== undefined
                ? draggedItem.categoryId === boxId
                : draggedItem.color === targetBox?.color;

        if (isCorrect) {
            setBoxes(boxes.map(b => b.id === boxId ? { ...b, items: [...b.items, draggedItem] } : b));
            setItems(items.filter(item => item.id !== draggedItem.id));
            setSortedCount(prev => {
                const next = prev + 1;
                if (next >= totalItems) {
                    setIsFinished(true);
                    setTimeout(() => setShowCompletionMenu(true), 1000);
                }
                return next;
            });
        } else {
            const correctBox = boxes.find(
                b => b.id === draggedItem.categoryId || b.color === draggedItem.color
            );
            if (correctBox) {
                setHighlightedBox(correctBox.id);
                setTimeout(() => setHighlightedBox(null), 2000);
            }
        }
    };

    if (loading) return <div className="dr-new-layout dr-st-center"><h2>Завантаження...</h2></div>;

    return (
        <div className="dr-new-layout dr-sorting-page">
            <div className="dr-sorting-header">
                <button
                    className="dr-show-all-btn dr-sorting-back"
                    onClick={() => (onBack ? onBack() : navigate("/quests"))}
                >
                    ← {onBack ? 'На дашборд' : 'Повернутися до квестів'}
                </button>
                
                <div className="dr-sorting-top-counter">
                    Залишилось {items.length}
                </div>
            </div>

            <aside className="dr-sorting-sidebar">
                <h2 className="dr-sorting-title">{scenario?.name}</h2>
                <p className="dr-sorting-desc">{scenario?.description}</p>
            </aside>

            <main className="dr-game-area" onDragOver={(e) => e.preventDefault()} onDrop={handleGlobalDrop}>
                <div className="dr-items-layer">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="dr-sorting-item"
                            style={{ backgroundColor: item.color, left: `${item.x}%`, top: `${item.y}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4px', fontSize: '10px', color: 'white', fontWeight: 'bold' }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                        >
                            {item.text || ''}
                        </div>
                    ))}
                </div>

                <div className="dr-sorting-dock">
                    <div className="dr-dock-tray">
                        {boxes.map((box) => (
                            <div
                                key={box.id}
                                className={`dr-sorting-box ${highlightedBox === box.id ? 'highlight-correct' : ''}`}
                                style={{
                                    borderColor: box.color,
                                    outlineColor: box.color + '40'
                                }}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                onDrop={(e) => handleBoxDrop(e, box.id)}
                            >
                                <div className="dr-box-label" style={{ backgroundColor: box.color }}></div>
                                <div className="dr-box-content">
                                    {box.items.map((item, idx) => (
                                        <div key={idx} className="dr-sorted-mini-item" style={{ backgroundColor: item.color }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {showCompanion && <CharacterCompanion ref={companionRef} context="exercise" position="bottom-right" />}

            {showCompletionMenu && (
                <div className="dr-completion-overlay">
                    <div className="dr-status-card dr-st-empty-card">
                        <div className="dr-card-emoji">🎉</div>
                        <h2 className="dr-status-title">Відмінно!</h2>
                        <button className="dr-trainer-btn" onClick={() => navigate("/exercises")}>Продовжити</button>
                    </div>
                </div>
            )}
        </div>
    );
}