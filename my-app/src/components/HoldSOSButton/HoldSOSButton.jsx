import React from 'react';

const HoldSOSButton = ({ onActivate, children }) => {
    return (
        <button 
            onClick={onActivate}
            className="relative bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-900/40 transition-all transform hover:scale-105 active:scale-95 overflow-hidden group font-montserrat"
        >
            <span className="relative z-10">{children || "SOS"}</span>
        </button>
    );
};

export default HoldSOSButton;
