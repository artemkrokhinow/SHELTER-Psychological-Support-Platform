import React, { useEffect, useState } from 'react';
import { Lightbulb, CheckCircle, ExternalLink } from 'lucide-react';
import { api } from '../../../infrastructure/api/api';
import { useNavigate } from 'react-router-dom';
import './AdviceView.css';

const hasRichContent = (m) => {
    const text = (m.content || '').replace(/<[^>]*>/g, '').trim();
    return text.length > 60;
};

const AdviceView = ({ resilience = 50 }) => {
    const [advices, setAdvices] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [readIds, setReadIds] = useState(new Set());
    const navigate = useNavigate();

    const userId = localStorage.getItem('userId');

    const colors = [
        "from-blue-500/30 to-indigo-600/30",
        "from-emerald-500/30 to-teal-600/30",
        "from-orange-500/30 to-rose-600/30",
        "from-purple-500/30 to-fuchsia-600/30",
        "from-cyan-500/30 to-blue-600/30"
    ];

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [advicesData, materialsRes] = await Promise.all([
                    api.getAdvice(),
                    api.getMaterials()
                ]);
                if (Array.isArray(advicesData)) setAdvices(advicesData);
                if (Array.isArray(materialsRes)) {
                    let filtered = materialsRes.filter(m => m.type === 'text');
                    
                    filtered = filtered.filter(item => {
                        const min = (item.minResilience || 0) - 25;
                        const max = (item.maxResilience || 100) + 25;
                        return resilience >= min && resilience <= max;
                    });
                    
                    setMaterials(filtered);
                }

                if (userId) {
                    const stats = await api.getUserStats(userId);
                    const viewed = stats?.materialsViewed?.materials || [];
                    setReadIds(new Set(viewed.map(v => v.materialId)));
                }
            } catch (err) {
                console.error("Error loading knowledge:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [userId]);

    const handleCardClick = (m) => {
        if (!hasRichContent(m)) {
            navigate(`/material/${m._id}`);
            return;
        }
        const isOpening = expandedId !== m._id;
        setExpandedId(isOpening ? m._id : null);

        if (isOpening && !(readIds.has(m._id) || readIds.has(m.materialId))) {
            setReadIds(prev => new Set([...prev, m._id, m.materialId].filter(Boolean)));
            if (userId) {
                api.recordMaterialView(userId, m._id || m.materialId, 0).catch(err => console.error(err));
            }
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            <header className="space-y-4">
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Глибоке вивчення</h2>
                <p className="text-slate-500 font-medium text-lg">Ці статті підібрані розумним алгоритмом спеціально під ваш поточний рівень стійкості.</p>
            </header>

            {materials.length > 0 && (
                <div className="space-y-8 mt-12">
                    <div className="flex items-center justify-between">
                        {readIds.size > 0 && (
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Прочитано: {materials.filter(m => readIds.has(m._id) || readIds.has(m.materialId)).length}/{materials.length}
                            </span>
                        )}
                    </div>

                    <div className="advice-cards-grid">
                        {materials.map((m, idx) => {
                            const isExpanded = expandedId === m._id;
                            const isRead = readIds.has(m._id) || readIds.has(m.materialId);
                            const showDesc = m.desc && m.content && m.content.replace(/<[^>]*>/g, '').length > 200;
                            const cardColor = colors[idx % colors.length];

                            return (
                                <div key={m._id} className="advice-card-wrapper">
                                    <div className="advice-card placeholder">
                                        <div className="advice-card-header">
                                            <h3 className="advice-card-title">{m.title}</h3>
                                        </div>
                                        <div className="advice-card-action">
                                            ЧИТАТИ СТАТТЮ <span className="advice-card-action-icon">›</span>
                                        </div>
                                    </div>

                                    <div
                                        className={`advice-card ${isExpanded ? 'expanded' : ''} ${isRead && !isExpanded ? 'read' : ''} bg-slate-900 bg-gradient-to-br ${cardColor} backdrop-blur-md border border-white/5 hover:border-white/10`}
                                        onClick={() => handleCardClick(m)}
                                    >
                                        <div className="advice-card-header">
                                            <h3 className="advice-card-title">{m.title}</h3>
                                            {isRead && !isExpanded && (
                                                <CheckCircle size={15} className="advice-card-check" />
                                            )}
                                        </div>

                                        <div className="advice-card-content">
                                            {showDesc && (
                                                <p className="advice-card-desc">{m.desc}</p>
                                            )}
                                            {m.content && m.content !== m.desc ? (
                                                <div
                                                    className="advice-card-text"
                                                    dangerouslySetInnerHTML={{ __html: m.content }}
                                                />
                                            ) : (
                                                !showDesc && m.desc && (
                                                    <p className="advice-card-text">{m.desc}</p>
                                                )
                                            )}
                                        </div>

                                        <div className="advice-card-action">
                                            {isExpanded ? 'ЗГОРНУТИ' : isRead ? 'ПЕРЕГЛЯНУТИ ЩЕ РАЗ' : 'ЧИТАТИ СТАТТЮ'}
                                            {hasRichContent(m)
                                                ? <span className="advice-card-action-icon">›</span>
                                                : <ExternalLink size={12} style={{ flexShrink: 0 }} />
                                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdviceView;
