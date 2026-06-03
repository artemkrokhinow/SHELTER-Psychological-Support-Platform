import React from 'react';
import { ShieldCheck, LogOut, Layout, Trophy, ClipboardList, BookOpen, Lightbulb, PenLine, BarChart3 } from 'lucide-react';
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
    return (
        <aside className={`w-72 border-r border-slate-800 flex flex-col bg-[#0b0f1a] z-20 shadow-2xl transition-all duration-500 transform-gpu will-change-[filter,transform,opacity] ${showSOS ? 'blur-md grayscale opacity-50 scale-95 pointer-events-none' : ''}`}>
            <div className="p-8 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0b0f1a] shadow-xl">
                    <ShieldCheck size={28} />
                </div>
                <span className="block text-2xl font-black text-white italic uppercase tracking-tighter">Shelter</span>
            </div>

            <nav className="flex-1 px-4 mt-6">
                <div className="space-y-0">
                    <FlipSidebarItem id="home" icon={<Layout size={22} />} label="Дашборд" isDashboard={true} index={0} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} onBackAction={handleChatBack} tourStep={tourStep} />
                    <FlipSidebarItem id="quests" icon={<Trophy size={22} />} label="Квести" index={1} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="testing" icon={<ClipboardList size={22} />} label="Діагностика" index={2} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="library" icon={<BookOpen size={22} />} label="Медіатека" index={3} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="advice" icon={<Lightbulb size={22} />} label="Поради" index={4} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="diary" icon={<PenLine size={22} />} label="Щоденник" index={5} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                    <FlipSidebarItem id="stats" icon={<BarChart3 size={22} />} label="Прогрес" index={6} isSpecialMode={isSpecialMode} currentView={currentView} onClickAction={navigateTo} tourStep={tourStep} />
                </div>
            </nav>

            <div className="p-6 border-t border-slate-900 space-y-4">
                <div className="bg-slate-900/50 p-4 rounded-[24px] flex items-center gap-3 border border-slate-800/50 shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-[#0b0f1a] font-black text-xs">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                        <p className="text-xs font-black text-white font-bold">{username}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Стійкість: {Math.round(resilience)}%</p>
                    </div>
                </div>
                {isGuest ? (
                    <div className="hidden lg:flex flex-col gap-2">
                        <button onClick={() => window.location.href='/auth'} className="w-full flex items-center justify-center gap-2 p-3 rounded-[16px] bg-emerald-500 text-[#0b0f1a] font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors">Зареєструватись</button>
                    </div>
                ) : (
                    <button onClick={logout} className="w-full flex items-center gap-4 p-4 rounded-[20px] text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors font-bold text-xs uppercase tracking-widest text-left">
                        <LogOut size={18} /> <span className="hidden lg:block">Вийти</span>
                    </button>
                )}
            </div>
        </aside>
    );
});

export default MainSidebar;
