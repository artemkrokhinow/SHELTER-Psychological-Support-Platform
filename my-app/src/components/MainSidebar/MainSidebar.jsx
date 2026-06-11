import React from 'react';
import { ShieldCheck, LogOut, Layout, Trophy, ClipboardList, BookOpen, Lightbulb, PenLine, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FlipSidebarItem from '../FlipSidebarItem/FlipSidebarItem';

const MainSidebar = React.memo(({ 
    username, 
    resilience, 
    currentView, 
    isGuest, 
    isSpecialMode, 
    navigateTo, 
    handleChatBack, 
    showSOS, 
    logout,
    tourStep = '0'
}) => {
    const { t } = useTranslation();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    return (
        <aside className={`w-full md:w-72 h-14 md:h-auto border-t md:border-t-0 md:border-r border-slate-800 flex flex-row md:flex-col bg-[#0b0f1a] z-50 md:z-20 shadow-2xl transition-all duration-500 transform-gpu will-change-[filter,transform,opacity] order-last md:order-none shrink-0 ${showSOS ? 'blur-md grayscale opacity-50 scale-95 pointer-events-none' : ''}`}>
            <div className="p-8 hidden md:flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0b0f1a] shadow-xl">
                    <ShieldCheck size={28} />
                </div>
                <span className="block text-2xl font-black text-white italic uppercase tracking-tighter">Shelter</span>
            </div>

            <nav className="flex-1 px-2 md:px-4 mt-0 md:mt-6 flex items-center md:items-start overflow-x-auto overflow-y-hidden md:overflow-visible scrollbar-hide">
                <div className="flex flex-row md:flex-col items-center md:items-stretch justify-between md:justify-start space-x-0 md:space-y-0 w-full min-w-0">
                    <FlipSidebarItem id="home" icon={<Layout size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.dashboard')} isDashboard={true} index={0} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} onBackAction={handleChatBack} tourStep={tourStep} />
                    <FlipSidebarItem id="quests" icon={<Trophy size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.quests')} index={1} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="testing" icon={<ClipboardList size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.testing')} index={2} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="library" icon={<BookOpen size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.library')} index={3} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="advice" icon={<Lightbulb size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.advice')} index={4} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="diary" icon={<PenLine size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.diary')} index={5} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="stats" icon={<BarChart3 size={22} className="md:w-[22px] md:h-[22px] w-5 h-5" />} label={t('sidebar.stats')} index={6} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                </div>
            </nav>

            <div className="p-6 border-t border-slate-900 space-y-4 hidden md:block">
                <div className="bg-slate-900/50 p-4 rounded-[24px] flex items-center gap-3 border border-slate-800/50 shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-[#0b0f1a] font-black text-xs">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block">
                        <p className="font-bold text-white tracking-wide">{username === 'Гість' ? t('sidebar.guest') : username}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('sidebar.resilience')}: {Math.round(resilience)}%</p>
                    </div>
                </div>
                {isGuest ? (
                    <div className="hidden lg:flex flex-col gap-2">
                        <button onClick={() => window.location.href='/auth'} className="w-full flex items-center justify-center gap-2 p-3 rounded-[16px] bg-emerald-500 text-[#0b0f1a] font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors">{t('sidebar.register')}</button>
                    </div>
                ) : (
                    showLogoutConfirm ? (
                        <div className="flex gap-2">
                            <button onClick={logout} className="flex-1 flex items-center justify-center p-4 rounded-[20px] bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
                                {t('sidebar.logout')}
                            </button>
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 flex items-center justify-center p-4 rounded-[20px] bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
                                {t('sidebar.cancel')}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-4 p-4 rounded-[20px] text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors font-bold text-xs uppercase tracking-widest text-left">
                            <LogOut size={18} /> <span className="hidden lg:block">{t('sidebar.logout')}</span>
                        </button>
                    )
                )}
            </div>
        </aside>
    );
});

export default MainSidebar;
