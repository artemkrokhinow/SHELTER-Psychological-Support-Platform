import React from 'react';
import { Search, X, Sun, Moon, LogOut } from 'lucide-react';
import HoldSOSButton from '../HoldSOSButton/HoldSOSButton';

const MainHeader = React.memo(({ 
    searchTerm, 
    setSearchTerm, 
    setShowSOS,
    currentView,
    logout,
    username,
    resilience
}) => {
    const [isLight, setIsLight] = React.useState(() => {
        return localStorage.getItem("dr_theme") === "light";
    });

    const toggleTheme = () => {
        const nextLight = !isLight;
        setIsLight(nextLight);
        if (nextLight) {
            document.documentElement.classList.add("light-theme");
            localStorage.setItem("dr_theme", "light");
        } else {
            document.documentElement.classList.remove("light-theme");
            localStorage.setItem("dr_theme", "dark");
        }
    };

    const showSearch = currentView === 'home' || currentView === 'library';

    return (
        <header className="h-20 md:h-24 shrink-0 px-4 md:px-8 flex items-center justify-between gap-2 md:gap-4 sticky top-0 z-10  bg-[#0b0f1a]/80 backdrop-blur-md md:bg-[#0b0f1a]/60 border-b border-slate-800/50">
            {showSearch ? (
                <div className="flex items-center gap-4 bg-slate-900/40 px-6 py-3 rounded-full border border-slate-800 w-full max-w-md focus-within:border-emerald-500 transition-colors group shadow-inner">
                    <Search size={18} className="text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Пошук..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-600 font-medium"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex md:hidden items-center gap-3 bg-slate-900/40 p-1.5 pr-4 rounded-full border border-slate-800/50 shadow-inner">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[#0b0f1a] font-black text-xs shrink-0">
                        {username ? username.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white leading-none mb-1 max-w-[100px] truncate">{username || 'Гість'}</span>
                        <span className="text-[8px] text-emerald-400 uppercase font-bold tracking-widest leading-none whitespace-nowrap">Стійкість: {Math.round(resilience || 0)}%</span>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3 md:gap-4 ml-auto">
                {logout && (
                    <button
                        onClick={logout}
                        className="md:hidden p-3 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center cursor-pointer"
                        title="Вийти з акаунта"
                    >
                        <LogOut size={18} />
                    </button>
                )}
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center cursor-pointer"
                    title={isLight ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
                >
                    {isLight ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <HoldSOSButton onActivate={() => setShowSOS(true)} />
            </div>
        </header>
    );
});

export default MainHeader;
