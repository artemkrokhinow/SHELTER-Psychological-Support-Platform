import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Smile, Meh, Frown, BookOpen, Calendar, Trash2 } from 'lucide-react';
import { api } from '../../../infrastructure/api/api';

const MOOD_CONFIG = [
    { icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500', label: 'Добре' },
    { icon: Meh,   color: 'text-amber-500',   bg: 'bg-amber-500/20',   border: 'border-amber-500',   label: 'Нейтрально' },
    { icon: Frown, color: 'text-rose-500',     bg: 'bg-rose-500/20',    border: 'border-rose-500',    label: 'Погано' },
];

const DiaryView = ({ userId, onAddEntry }) => {
    const { t, i18n } = useTranslation();
    const moodsLabels = [t('diary.good'), t('diary.neutral'), t('diary.bad')];
    const [diaryEntry, setDiaryEntry] = useState('');
    const [selectedMood, setSelectedMood] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const resolvedUserId = userId || localStorage.getItem('userId');

    const loadEntries = () => {
        if (!resolvedUserId) return;
        setIsLoading(true);
        api.getDiaryEntries(resolvedUserId, 20, 1)
            .then((data) => {
                if (data && Array.isArray(data.entries)) {
                    setEntries(data.entries);
                }
            })
            .catch((err) => console.error('Error loading diary entries:', err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadEntries();
    }, [resolvedUserId]);

    const handleSaveDiary = () => {
        if (!diaryEntry.trim() || selectedMood === null) {
            setSaveMessage(t('diary.validation_error'));
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        if (!resolvedUserId) {
            setSaveMessage(t('diary.auth_required'));
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage('');

        api.addDiaryEntry(resolvedUserId, selectedMood, diaryEntry.trim())
            .then((res) => {
                if (res && res.error) {
                    throw new Error(res.error);
                }
                setSaveMessage(t('diary.note_saved'));
                setDiaryEntry('');
                setSelectedMood(null);
                loadEntries(); 
                if (onAddEntry) {
                    onAddEntry();
                }
                setIsSaving(false);
                setTimeout(() => setSaveMessage(''), 3000);
            })
            .catch((err) => {
                console.error('Error saving diary entry:', err);
                setSaveMessage(t('diary.save_error'));
                setIsSaving(false);
                setTimeout(() => setSaveMessage(''), 3000);
            });
    };

    const handleDeleteEntry = useCallback((entryId) => {
        if (!window.confirm(t('diary.delete_confirm'))) return;

        api.deleteDiaryEntry(resolvedUserId, entryId)
            .then(() => {
                setEntries(prev => prev.filter(e => e._id !== entryId));
            })
            .catch((err) => console.error('Error deleting entry:', err));
    }, [resolvedUserId]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'uk-UA', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h2 className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">{t('diary.title')}</h2>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 md:p-8 rounded-3xl md:rounded-[40px]  shadow-2xl space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <BookOpen size={20} className="text-emerald-500" />
                    </div>
                    <h3 className="text-white font-black uppercase text-sm tracking-widest">{t('diary.new_entry')}</h3>
                </div>

                <textarea
                    value={diaryEntry}
                    onChange={(e) => setDiaryEntry(e.target.value)}
                    placeholder={t('diary.placeholder')}
                    className="w-full h-32 md:h-40 bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-[24px] p-4 md:p-6 text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest text-center md:text-left">{t('diary.my_state')}</span>
                        <div className="flex justify-center md:justify-start gap-2 w-full md:w-auto">
                            {MOOD_CONFIG.map((mood, idx) => {
                                const Icon = mood.icon;
                                const isSelected = selectedMood === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedMood(idx)}
                                        title={moodsLabels[idx]}
                                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 ${
                                            isSelected
                                                ? `${mood.bg} ${mood.border} scale-110 shadow-lg`
                                                : 'bg-slate-800/50 border-transparent opacity-40 hover:opacity-100'
                                        }`}
                                    >
                                        <Icon size={24} className={mood.color} />
                                    </button>
                                );
                            })}
                        </div>
                        {selectedMood !== null && (
                            <span className={`text-xs font-bold ${MOOD_CONFIG[selectedMood].color}`}>
                                {moodsLabels[selectedMood]}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
                        {saveMessage && (
                            <span className={`text-sm font-bold ${saveMessage.includes('✅') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {saveMessage}
                            </span>
                        )}
                        <button
                            onClick={handleSaveDiary}
                            disabled={isSaving}
                            className="bg-emerald-500 text-[#0b0f1a] px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto mt-4 md:mt-0"
                        >
                            {isSaving ? t('diary.saving') : t('diary.save_note')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                    {t('diary.previous_entries')}
                </h3>

                {React.useMemo(() => {
                    if (isLoading) {
                        return (
                            <div className="text-center py-10 text-slate-600 text-sm font-bold uppercase tracking-widest">
                                {t('common.loading')}
                            </div>
                        );
                    }
                    if (entries.length === 0) {
                        return (
                            <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-[32px]">
                                <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">{t('diary.empty')}</p>
                                <p className="text-slate-700 text-xs mt-2">{t('diary.write_first')}</p>
                            </div>
                        );
                    }
                    return entries.map((entry, idx) => {
                        const mood = MOOD_CONFIG[entry.mood] || MOOD_CONFIG[1];
                        const Icon = mood.icon;
                        return (
                            <div
                                key={entry._id || idx}
                                className="group bg-slate-900/40 border border-slate-800 rounded-2xl md:rounded-[32px] p-4 md:p-6  transition-all hover:border-slate-700 animate-in fade-in duration-300 relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between gap-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mood.bg}`}>
                                            <Icon size={20} className={mood.color} />
                                        </div>
                                        <div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${mood.color}`}>
                                                {moodsLabels[entry.mood] || moodsLabels[1]}
                                            </span>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Calendar size={10} className="text-slate-600" />
                                                <span className="text-[10px] text-slate-600 font-bold">
                                                    {formatDate(entry.createdAt || entry.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleDeleteEntry(entry._id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-300"
                                        title={t('diary.delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <p className="mt-4 text-slate-300 text-sm leading-relaxed pl-1 whitespace-pre-wrap relative z-10">
                                    {entry.content}
                                </p>
                            </div>
                        );
                    });
                }, [isLoading, entries, handleDeleteEntry])}
            </div>
        </div>
    );
};

export default DiaryView;
