import React from 'react';
import { ChevronLeft, LayoutGrid } from 'lucide-react';


const FlipSidebarItem = ({ 
    id, 
    icon, 
    label, 
    isDashboard = false, 
    index = 0, 
    isSpecialMode = false, 
    currentView = '', 
    onClickAction = () => {}, 
    onBackAction = () => {},
    tourStep = '0'
}) => {
  const [actuallyFlipped, setActuallyFlipped] = React.useState(false);

  React.useEffect(() => {
    if (isSpecialMode) {
      
      const timer = setTimeout(() => setActuallyFlipped(true), 100);
      return () => clearTimeout(timer);
    } else {
      setActuallyFlipped(false);
    }
  }, [isSpecialMode]);

  const isFlipped = actuallyFlipped;
  const isActive = currentView === id && !isSpecialMode;

  const isHighlighted = (tourStep === '1_go_testing' && id === 'testing') ||
                        ((tourStep === '3_go_quests' || tourStep === '5_go_quests') && id === 'quests') ||
                        (tourStep === '6_go_library' && id === 'library');

  
  const baseDelay = isFlipped ? index * 0.1 : (5 - index) * 0.1;

  const wrapperStyle = {
    perspective: '1200px',
    transition: `height 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${isFlipped && !isDashboard ? baseDelay + 0.4 : baseDelay}s, opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${isFlipped && !isDashboard ? baseDelay + 0.3 : baseDelay}s, margin-bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${isFlipped && !isDashboard ? baseDelay + 0.4 : baseDelay}s`,
    height: isFlipped && !isDashboard ? '0px' : '56px',
    opacity: isFlipped && !isDashboard ? 0 : 1,
    marginBottom: isFlipped && !isDashboard ? '0px' : '12px',
    pointerEvents: isFlipped && !isDashboard ? 'none' : 'auto',
    position: 'relative',
    zIndex: isHighlighted ? 9999 : (10 - index),
    willChange: 'height, opacity, margin-bottom'
  };

  const innerStyle = {
    position: 'absolute',
    width: '100%',
    height: '56px',
    transformStyle: 'preserve-3d',
    transition: `transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay}s`,
    transform: isFlipped ? 'rotateY(180deg) translateZ(0)' : 'rotateY(0deg) translateZ(0)',
    willChange: 'transform'
  };

  const faceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: 'translateZ(0)'
  };

  const backFaceStyle = {
    ...faceStyle,
    transform: 'rotateY(180deg) translateZ(0)'
  };

  return (
    <div style={wrapperStyle} className={isHighlighted ? 'ring-4 ring-emerald-500 animate-pulse rounded-[20px] shadow-[0_0_20px_rgba(16,185,129,0.5)]' : ''}>
      <div style={innerStyle}>
        {}
        <div
          style={faceStyle}
          className={`flex items-center gap-4 p-4 robust-rounded-20 cursor-pointer transition-all duration-300 ${isActive || isHighlighted
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          onClick={() => { if (!isFlipped) onClickAction(id); }}
        >
          {icon}
          <span className="font-bold text-sm hidden lg:block tracking-wide">{label}</span>
        </div>

        {}
        <div
          style={backFaceStyle}
          className={`flex items-center gap-4 p-4 robust-rounded-20 transition-all duration-300 w-full ${isDashboard
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 cursor-pointer'
              : 'bg-slate-800/40 border border-slate-700/30'
            }`}
          onClick={() => { if (isFlipped && isDashboard) onBackAction(); }}
        >
          {isDashboard && (
            <>
              <ChevronLeft size={22} />
              <span className="font-bold text-sm hidden lg:block tracking-wide">Назад</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipSidebarItem;
