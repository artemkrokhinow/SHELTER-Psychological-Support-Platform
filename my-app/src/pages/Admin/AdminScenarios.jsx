import { useState, useCallback, useEffect } from "react";
import { api } from "../../infrastructure/api/api";
import "./adminPage.css";

const SAMPLE_SCENARIO_JSON = JSON.stringify({
    scenarioId: "my-scenario",
    name: "Назва сценарію",
    category: "general",
    duration: "5 хв",
    difficulty: 50,
    nodes: {
        start: {
            text: "Привіт! Як ти себе почуваєш сьогодні?",
            isFinal: false,
            options: [
                { text: "Чудово!", next: "good", weight: 1 },
                { text: "Не дуже", next: "bad", weight: -1 }
            ]
        },
        good: {
            text: "Супер! Продовжуй в тому ж дусі! 🌟",
            isFinal: true,
            options: []
        },
        bad: {
            text: "Я поруч. Зроби глибокий вдих... 🫁",
            isFinal: true,
            options: []
        }
    }
}, null, 2);

export default function AdminScenarios() {
    const [scenarios, setScenarios] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const [editId, setEditId] = useState(null);
    const [isJsonMode, setIsJsonMode] = useState(false);
    const [jsonInput, setJsonInput] = useState("");
    
    const [scenarioTitle, setScenarioTitle] = useState("");
    const [scenarioSlug, setScenarioSlug] = useState("");
    const [scenarioCategory, setScenarioCategory] = useState("general");
    const [scenarioDuration, setScenarioDuration] = useState("5 хв");
    const [scenarioDifficulty, setScenarioDifficulty] = useState(50);
    const [scenarioType, setScenarioType] = useState("dialogue");
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    
    const [videoUrl, setVideoUrl] = useState("");
    const [videoTranscript, setVideoTranscript] = useState("");
    
    const [nodes, setNodes] = useState([
        {
            id: "start",
            text: "",
            isFinal: false,
            options: [{ text: "", next: "", weight: 0 }],
        },
    ]);

    const [findImage2, setFindImage2] = useState("");
    const [differences, setDifferences] = useState([]);
    const [imageZoom, setImageZoom] = useState(1);
    const [draggingMarker, setDraggingMarker] = useState(null);

    const [boxes, setBoxes] = useState([
        { id: 0, name: "Корисні", color: "#10b981" },
        { id: 1, name: "Шкідливі", color: "#ef4444" }
    ]);
    const [items, setItems] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const data = await api.getScenarios();
            if (Array.isArray(data)) {
                setScenarios(data);
            }
        } catch (error) {
            console.error("Error loading scenarios:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggingMarker !== null) {
                const container = document.querySelector('.dr-find-image-container');
                if (container) {
                    const rect = container.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / imageZoom;
                    const y = (e.clientY - rect.top) / imageZoom;
                    const newDifferences = [...differences];
                    newDifferences[draggingMarker] = {
                        ...newDifferences[draggingMarker],
                        x: x,
                        y: y,
                    };
                    setDifferences(newDifferences);
                }
            }
        };

        const handleMouseUp = () => {
            setDraggingMarker(null);
        };

        if (draggingMarker !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingMarker, differences, imageZoom]);

    const handleEditScenario = (item) => {
        setEditId(item._id);
        setScenarioTitle(item.name);
        setScenarioSlug(item.scenarioId);
        setScenarioCategory(item.category || "general");
        setScenarioDuration(item.duration || "5 хв");
        setScenarioDifficulty(item.difficulty || 50);
        setScenarioType(item.type || "dialogue");

        if (item.type === "find-differences") {
            setFindImage2(item.levels?.[0]?.image || "");
            setDifferences(item.levels?.[0]?.differences || []);
        } else if (item.type === "video" || item.type === "audio") {
            setVideoUrl(item.videoUrl || item.audioUrl || "");
            setVideoTranscript(item.videoTranscript || item.audioTranscript || "");
        } else if (item.type === "sorting") {
            setBoxes(item.categories || []);
            setItems(item.items || []);
        } else {
            const transformedNodes = item.nodes ? Object.entries(item.nodes).map(([id, data]) => ({
                id,
                ...data,
                options: data.options?.map((opt) => ({ ...opt, weight: opt.weight || 0 })) || [],
            })) : [];
            setNodes(transformedNodes);
        }

        setJsonInput(JSON.stringify(item, null, 4));
        setViewMode("create");
    };

    const resetForms = () => {
        setEditId(null);
        setIsJsonMode(false);
        setJsonInput("");
        setScenarioTitle("");
        setScenarioSlug("");
        setScenarioCategory("general");
        setScenarioDuration("5 хв");
        setScenarioDifficulty(50);
        setNodes([{ id: "start", text: "", isFinal: false, options: [{ text: "", next: "", weight: 0 }] }]);
        setFindImage2("");
        setDifferences([]);
        setVideoUrl("");
        setVideoTranscript("");
        setBoxes([{ id: 0, name: "Корисні", color: "#10b981" }, { id: 1, name: "Шкідливі", color: "#ef4444" }]);
        setItems([]);
        setViewMode("list");
    };

    const handleSaveScenario = async (e, customPayload = null) => {
        if (e) e.preventDefault();
        let payload;
        if (customPayload) {
            payload = customPayload;
        } else if (isJsonMode) {
            try {
                payload = JSON.parse(jsonInput);
            } catch (e) {
                alert("Некоректний формат JSON");
                return;
            }
        } else {
            const nodesObject = nodes.reduce((acc, node) => {
                if (node.id.trim()) {
                    acc[node.id] = {
                        text: node.text,
                        isFinal: node.isFinal,
                        options: node.isFinal ? [] : node.options
                                    .filter((opt) => opt.text.trim() !== "")
                                    .map((opt) => ({
                                        text: opt.text,
                                        next: opt.next.trim() || null,
                                        weight: parseInt(opt.weight) || 0,
                                    })),
                    };
                }
                return acc;
            }, {});

            payload = {
                scenarioId: scenarioSlug,
                name: scenarioTitle,
                category: scenarioCategory,
                duration: scenarioDuration,
                difficulty: scenarioDifficulty,
                type: scenarioType,
                nodes: nodesObject,
                categories: scenarioType === 'sorting' ? boxes : undefined,
                items: scenarioType === 'sorting' ? items : undefined,
                levels: scenarioType === 'find-differences' ? [{ image: findImage2, differences }] : undefined,
                videoUrl: scenarioType === 'video' || scenarioType === 'audio' ? videoUrl : undefined,
                videoTranscript: scenarioType === 'video' || scenarioType === 'audio' ? videoTranscript : undefined,
            };
        }

        try {
            const res = editId
                ? await api.updateScenario(editId, payload)
                : await api.createScenario(payload);
            if (res && !res.error) {
                alert("Збережено успішно!");
                resetForms();
                loadData();
            } else {
                alert("Помилка: " + (res?.error || res?.message));
            }
        } catch (err) {
            alert("Помилка збереження");
        }
    };

    const updateNode = (index, field, value) => {
        const newNodes = [...nodes];
        newNodes[index][field] = value;
        setNodes(newNodes);
    };

    if (viewMode === "list") {
        return (
            <div className="dr-admin-content-wrapper">
                <div className="dr-admin-header-row">
                    <h1>Тренажери</h1>
                    <button className="dr-add-new-btn" onClick={() => setShowTypeSelector(true)}>+ Створити</button>
                </div>
                <div className="dr-admin-list">
                    {scenarios.map((item) => (
                        <div key={item._id} className="dr-list-item">
                            <div className="dr-item-info">
                                <span className="dr-item-icon">
                                    {item.type === "find-differences" ? "🔍" : 
                                     item.type === "dialogue" ? "💬" : 
                                     item.type === "sorting" ? "🎯" : "🎮"}
                                </span>
                                <div>
                                    <h3>{item.name}</h3>
                                    <p>{item.type} • {item.category || "general"}</p>
                                </div>
                            </div>
                            <div className="dr-item-actions">
                                <button className="dr-edit-btn" onClick={() => handleEditScenario(item)}>Редагувати</button>
                                <button className="dr-delete-btn" onClick={async () => {
                                    if (window.confirm("Видалити?")) {
                                        await api.deleteScenario(item._id);
                                        loadData();
                                    }
                                }}>Видалити</button>
                            </div>
                        </div>
                    ))}
                </div>

                {showTypeSelector && (
                    <div className="dr-type-selector-modal">
                        <div className="dr-type-selector-content">
                            <h2>Виберіть тип сценарію</h2>
                            <div className="dr-type-options">
                                <button className="dr-type-option" onClick={() => { setScenarioType("dialogue"); setShowTypeSelector(false); setViewMode("create"); }}>
                                    <div className="dr-type-icon">💬</div>
                                    <h3>Діалог</h3>
                                </button>
                                <button className="dr-type-option" onClick={() => { setScenarioType("find-differences"); setShowTypeSelector(false); setViewMode("create"); }}>
                                    <div className="dr-type-icon">🔍</div>
                                    <h3>Знайди відмінності</h3>
                                </button>
                                <button className="dr-type-option" onClick={() => { setScenarioType("sorting"); setShowTypeSelector(false); setViewMode("create"); }}>
                                    <div className="dr-type-icon">🎯</div>
                                    <h3>Сортування</h3>
                                </button>
                            </div>
                            <button className="dr-close-modal-btn" onClick={() => setShowTypeSelector(false)}>Скасувати</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="dr-admin-content-wrapper">
            <div className="dr-admin-header-row">
                <h1>{editId ? "Редагування" : "Створення"} ({scenarioType})</h1>
                <button className="dr-back-btn" onClick={resetForms}>Назад</button>
            </div>

            {scenarioType === "sorting" ? (
                <div className="dr-sorting-builder">
                    <div className="dr-scenario-meta">
                        <div className="dr-input-group">
                            <label>Назва сценарію</label>
                            <input type="text" value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} />
                        </div>
                        <div className="dr-input-group">
                            <label>Технічний ID</label>
                            <input type="text" value={scenarioSlug} onChange={(e) => setScenarioSlug(e.target.value)} />
                        </div>
                    </div>
                    <div className="dr-builder-section">
                        <h3>📦 Категорії</h3>
                        <div className="dr-boxes-list">
                            {boxes.map((box, bIdx) => (
                                <div key={bIdx} className="dr-box-item">
                                    <input type="text" value={box.name} onChange={(e) => {
                                        const b = [...boxes];
                                        b[bIdx].name = e.target.value;
                                        setBoxes(b);
                                    }} />
                                    <input type="color" value={box.color} onChange={(e) => {
                                        const b = [...boxes];
                                        b[bIdx].color = e.target.value;
                                        setBoxes(b);
                                    }} />
                                    <button onClick={() => setBoxes(boxes.filter((_, i) => i !== bIdx))}>✕</button>
                                </div>
                            ))}
                            <button className="dr-add-btn" onClick={() => setBoxes([...boxes, { id: boxes.length, name: "", color: "#ffffff" }])}>+ Додати категорію</button>
                        </div>
                    </div>
                    <div className="dr-builder-section">
                        <h3>🧩 Елементи для сортування</h3>
                        <div className="dr-items-list">
                            {items.map((item, iIdx) => (
                                <div key={iIdx} className="dr-item-edit-row">
                                    <input type="text" value={item.text} onChange={(e) => {
                                        const it = [...items];
                                        it[iIdx].text = e.target.value;
                                        setItems(it);
                                    }} />
                                    <select value={item.categoryId} onChange={(e) => {
                                        const it = [...items];
                                        it[iIdx].categoryId = parseInt(e.target.value);
                                        setItems(it);
                                    }}>
                                        {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <button onClick={() => setItems(items.filter((_, i) => i !== iIdx))}>✕</button>
                                </div>
                            ))}
                            <button className="dr-add-btn" onClick={() => setItems([...items, { text: "", categoryId: boxes[0]?.id || 0 }])}>+ Додати елемент</button>
                        </div>
                    </div>
                    <button className="dr-save-btn" onClick={handleSaveScenario}>Зберегти сценарій</button>
                </div>
            ) : scenarioType === "find-differences" ? (
                <div className="dr-find-differences-builder">
                    <div className="dr-scenario-meta">
                        <div className="dr-input-group">
                            <label>Назва</label>
                            <input type="text" value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} />
                        </div>
                        <div className="dr-input-group">
                            <label>Зображення</label>
                            <input type="text" value={findImage2} onChange={(e) => setFindImage2(e.target.value)} placeholder="/images/..." />
                        </div>
                    </div>
                    {findImage2 && (
                        <div className="dr-find-preview">
                            <div className="dr-find-image-container">
                                <img src={findImage2} alt="Find" className="dr-find-preview-img" onClick={(e) => {
                                    const rect = e.target.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    setDifferences([...differences, { x, y, radius: 30 }]);
                                }} />
                                {differences.map((diff, idx) => (
                                    <div key={idx} className="dr-difference-marker" style={{ left: diff.x - 15, top: diff.y - 15 }}>
                                        <button onClick={(e) => { e.stopPropagation(); setDifferences(differences.filter((_, i) => i !== idx)); }}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button className="dr-save-btn" onClick={handleSaveScenario}>Зберегти сценарій</button>
                </div>
            ) : (
                <div className="dr-scenario-builder">
                    <div className="dr-scenario-meta">
                        <div className="dr-input-group">
                            <label>Назва</label>
                            <input type="text" value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} />
                        </div>
                        <div className="dr-input-group">
                            <label>Технічний ID</label>
                            <input type="text" value={scenarioSlug} onChange={(e) => setScenarioSlug(e.target.value)} />
                        </div>
                    </div>
                    <div className="dr-nodes-container">
                        {nodes.map((node, nIdx) => (
                            <div key={nIdx} className="dr-node-card">
                                <div className="dr-node-header">
                                    <input type="text" value={node.id} onChange={(e) => updateNode(nIdx, "id", e.target.value)} placeholder="Node ID" />
                                    <label className="dr-checkbox">
                                        <input type="checkbox" checked={node.isFinal} onChange={(e) => updateNode(nIdx, "isFinal", e.target.checked)} />
                                        <span>Фінал</span>
                                    </label>
                                </div>
                                <textarea value={node.text} onChange={(e) => updateNode(nIdx, "text", e.target.value)} placeholder="Текст бота..." />
                                {!node.isFinal && (
                                    <div className="dr-options-area">
                                        {node.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="dr-opt-row">
                                                <input type="text" value={opt.text} placeholder="Варіант" onChange={(e) => {
                                                    const n = [...nodes];
                                                    n[nIdx].options[oIdx].text = e.target.value;
                                                    setNodes(n);
                                                }} />
                                                <input type="text" value={opt.next} placeholder="Перехід до ID" onChange={(e) => {
                                                    const n = [...nodes];
                                                    n[nIdx].options[oIdx].next = e.target.value;
                                                    setNodes(n);
                                                }} />
                                            </div>
                                        ))}
                                        <button className="dr-add-opt-btn" onClick={() => {
                                            const n = [...nodes];
                                            n[nIdx].options.push({ text: "", next: "", weight: 0 });
                                            setNodes(n);
                                        }}>+ Варіант</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button className="dr-add-node-btn" onClick={() => setNodes([...nodes, { id: `node_${nodes.length}`, text: "", isFinal: false, options: [] }])}>+ Додати блок</button>
                    </div>
                    <button className="dr-save-btn" onClick={handleSaveScenario}>Зберегти сценарій</button>
                </div>
            )}
        </div>
    );
}
