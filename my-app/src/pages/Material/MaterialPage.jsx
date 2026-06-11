import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../infrastructure/api/api';
import { getDiagnosticConfig } from '../../infrastructure/utils/diagnosticLogic';
import CharacterCompanion from '../../components/characterCompanion/CharacterCompanion';
import FlipSidebarItem from '../../components/FlipSidebarItem/FlipSidebarItem';
import '../../infrastructure/assets/styles/shelter-styles.css';
import {
    ChevronLeft, Play, Pause, LifeBuoy, CheckCircle, Lightbulb, Shield,
    Clock, ShieldCheck, BookOpen, Video, Headphones, FileText,
    LayoutGrid, ClipboardList, Trophy, PenLine, BarChart3
} from 'lucide-react';

export default function MaterialPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [resilience, setResilience] = useState(50);
    const [material, setMaterial] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState(t('sidebar.guest'));
    const [userId, setUserId] = useState(localStorage.getItem("userId"));
    const [viewStartTime, setViewStartTime] = useState(Date.now());
    
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const formatText = (htmlContent) => {
        if (!htmlContent) return null;
        if (typeof htmlContent === 'string' && (htmlContent.includes('<') || htmlContent.includes('>'))) {
            return <div className="whitespace-pre-wrap space-y-4" dangerouslySetInnerHTML={{ __html: htmlContent.replace(/data-[^=]*=(["']([^"'])*["'])/g, '') }} />;
        }
        return htmlContent.split('\n').map((paragraph, index) => <p key={index} className="mb-4">{paragraph}</p>);
    };

    const isYouTubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
    };

    const getTypeLabel = (type) => {
        if (!type) return '';
        const t_label = type.toLowerCase();
        if (t_label === 'video') return t('library.video');
        if (t_label === 'audio') return t('library.audio');
        if (t_label === 'text' || t_label === 'article') return t('library.article');
        return type;
    };

    const handleVideoPlay = () => setIsPlaying(true);
    const handleVideoPause = () => setIsPlaying(false);
    const handleVideoEnded = () => setIsPlaying(false);
    const handleVideoError = () => setIsPlaying(false);
    const handleAudioPlay = () => setIsPlaying(true);
    const handleAudioPause = () => setIsPlaying(false);
    const handleAudioEnded = () => setIsPlaying(false);

    const handleComplete = async (delta = 2) => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            try {
                await api.updateUserProgress(userId, id, 'material');
                await api.updateResilience(userId, 'material_feedback', { delta }, material?.title || t('material.default_title'));
            } catch (error) {
                console.error('Error updating progress:', error);
            }
        }
        navigate(-1);
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const materialData = await api.getMaterialById(id);
                if (isMounted && materialData) {
                    setMaterial(materialData);
                    if (userId) {
                        api.recordMaterialView(userId, id, 0, materialData.type).catch(err => console.error(err));
                    }
                }
                const profile = await api.getProfile();
                if (isMounted && profile) {
                    if (profile.username) setUsername(profile.username);
                    if (profile.stats && profile.stats.resilience !== undefined) {
                        setResilience(Math.round(profile.stats.resilience));
                    }
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [id, userId]);

    return (
        <div className="flex h-screen bg-[#0b0f1a] text-slate-300 font-sans overflow-hidden">
            <aside className="w-20 lg:w-72 border-r border-slate-800 flex flex-col bg-[#0b0f1a] z-20 shadow-2xl">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0b0f1a] shadow-xl">
                        <ShieldCheck size={28} />
                    </div>
                    <span className="hidden lg:block text-2xl font-black text-white italic uppercase tracking-tighter">
                        Shelter
                    </span>
                </div>
                <nav className="flex-1 px-4 mt-6">
                    <div className="space-y-0">
                        {/* Menu Items */}
                        <FlipSidebarItem 
                            id="home" 
                            icon={<LayoutGrid size={22} />} 
                            label={t('sidebar.dashboard')} 
                            isDashboard={true}
                            index={0}
                            isSpecialMode={true}
                            onBackAction={() => navigate(-1)}
                        />
                        <FlipSidebarItem id="quests" icon={<Trophy size={22} />} label={t('sidebar.quests')} index={1} isSpecialMode={true} />
                        <FlipSidebarItem id="testing" icon={<ClipboardList size={22} />} label={t('sidebar.testing')} index={2} isSpecialMode={true} />
                        <FlipSidebarItem id="library" icon={<BookOpen size={22} />} label={t('sidebar.library')} index={3} isSpecialMode={true} />
                        <FlipSidebarItem id="advice" icon={<Lightbulb size={22} />} label={t('sidebar.advice')} index={4} isSpecialMode={true} />
                        <FlipSidebarItem id="diary" icon={<PenLine size={22} />} label={t('sidebar.diary')} index={5} isSpecialMode={true} />
                        <FlipSidebarItem id="stats" icon={<BarChart3 size={22} />} label={t('sidebar.stats')} index={6} isSpecialMode={true} />
                    </div>
                </nav>
                <div className="p-6 border-t border-slate-900">
                    <div className="bg-slate-900/50 p-4 rounded-[24px] flex items-center gap-3 border border-slate-800/50 shadow-inner">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-[#0b0f1a] font-black text-xs">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className="text-xs font-black text-white font-bold">{username}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('sidebar.resilience')}: {resilience}%</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-y-auto bg-[#0b0f1a]">
                <header className="h-24 px-8 flex items-center justify-between sticky top-0 z-10  bg-[#0b0f1a]/60 border-b border-slate-800/50">
                    <div className="flex items-center gap-4 bg-slate-900/40 px-6 py-3 rounded-full border border-slate-800 w-full max-w-md opacity-20 pointer-events-none">
                        <span className="text-xs font-bold uppercase tracking-widest">{t('material.viewing_material')}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/sos')}
                            className="bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 text-rose-500 hover:text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            SOS
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-4xl mx-auto w-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : material ? (
                        <>
                            <section className="space-y-4 animate-in fade-in slide-in-from-left duration-700">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-lg`}>
                                        {material.type === 'video' ? <Video size={24} /> :
                                         material.type === 'audio' ? <Headphones size={24} /> :
                                         <FileText size={24} />}
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                                            {material.title}
                                        </h1>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{getTypeLabel(material.type)}</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <Clock size={12} className="inline mr-1" />
                                                {material.duration || `10 ${t('common.min')}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {material.type === 'video' && material.url && (
                                <section className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-8  shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
                                    {isYouTubeUrl(material.url) ? (
                                        <iframe
                                            src={getYouTubeEmbedUrl(material.url)}
                                            title={material.title}
                                            allowFullScreen
                                            className="w-full h-96 rounded-2xl bg-black"
                                        />
                                    ) : (
                                        <video ref={videoRef} src={material.url} controls className="w-full h-96 rounded-2xl bg-black object-cover" />
                                    )}
                                </section>
                            )}

                            {material.type === 'audio' && material.url && (
                                <section className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-8  shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
                                    <audio ref={audioRef} src={material.url} controls className="w-full" />
                                </section>
                            )}

                            {(material.desc || material.content) && (
                                <section className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-8  shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                                        <BookOpen size={24} className="text-emerald-500" />
                                        {material.type === 'video' || material.type === 'audio' ? t('material.practice_description') : t('material.default_title')}
                                    </h2>
                                    <div className="space-y-6 text-slate-300 leading-relaxed">
                                        {material.desc && (
                                            <div className="text-lg font-medium text-emerald-400/90 italic bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 shadow-inner">
                                                {formatText(material.desc)}
                                            </div>
                                        )}
                                        {material.content && material.content !== material.desc && (
                                            <div className="text-base text-slate-300">
                                                {formatText(material.content)}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            <section className="flex justify-center animate-in fade-in slide-in-from-bottom duration-700 pb-10">
                                {!showFeedback ? (
                                    <button
                                        onClick={() => setShowFeedback(true)}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-[#0b0f1a] px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"
                                    >
                                        <CheckCircle size={20} />
                                        {t('material.finish_review')}
                                    </button>
                                ) : (
                                    <div className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-8  shadow-2xl text-center">
                                        <p className="text-white mb-6 uppercase font-black tracking-widest text-xs">{t('material.state_changed')}</p>
                                        <div className="flex gap-4 justify-center">
                                            <button onClick={() => handleComplete(2)} className="bg-emerald-500 hover:bg-emerald-400 text-[#0b0f1a] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl transition-all">😊 {t('material.felt_better')}</button>
                                            <button onClick={() => handleComplete(-2)} className="bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all">😔 {t('material.did_not_feel_better')}</button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center">
                            <div>
                                <div className="text-6xl mb-4">📄</div>
                                <h2 className="text-2xl font-black text-white mb-2">{t('material.not_found')}</h2>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            {}
        </div>
    );
}
