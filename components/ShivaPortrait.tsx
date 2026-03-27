
import React from 'react';

export const ShivaPortrait: React.FC = () => {
  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-[#050505] border border-slate-800/60 shadow-2xl group select-none">
      
      {/* Background Texture - Digital Noise/Grid */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/0 via-slate-900/0 to-teal-900/10 pointer-events-none"></div>

      {/* Main Vector Diagram */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 400 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="glow-gold-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-white-subtle" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="trishul-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* --- SACRED GEOMETRY BACKGROUND --- */}
          <g transform="translate(200, 250)" opacity="0.15">
             <circle cx="0" cy="0" r="140" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" />
             <circle cx="0" cy="0" r="180" stroke="white" strokeWidth="0.5" opacity="0.5" />
             <path d="M-140,0 L140,0" stroke="white" strokeWidth="0.5" />
             <path d="M0,-140 L0,140" stroke="white" strokeWidth="0.5" />
             {/* Rotating Elements */}
             <g className="animate-[spin_60s_linear_infinite]">
                <rect x="-100" y="-100" width="200" height="200" stroke="white" strokeWidth="0.5" fill="none" transform="rotate(45)" />
             </g>
          </g>

          {/* --- THE CRESCENT MOON (Upper Left) --- */}
          <g transform="translate(140, 160)">
             <path 
                d="M-30,-10 Q0,20 30,-10 Q0,5 -30,-10" 
                fill="#e2e8f0" 
                filter="url(#glow-white-subtle)" 
                opacity="0.9"
             />
             {/* Geometric Guide for Moon */}
             <circle cx="0" cy="-25" r="40" stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
          </g>

          {/* --- THE THIRD EYE (Center) --- */}
          <g transform="translate(180, 240)">
             {/* Vertical Axis Line */}
             <line x1="0" y1="-200" x2="0" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
             
             {/* The Eye */}
             <ellipse cx="0" cy="0" rx="6" ry="24" fill="#fbbf24" filter="url(#glow-gold-strong)" opacity="0.9" />
             <ellipse cx="0" cy="0" rx="2" ry="16" fill="#fff" opacity="0.9" />
             
             {/* Horizontal Tripundra Lines (Abstract) */}
             <g stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" fill="none">
                <path d="M-40,-15 Q0,-5 40,-15" />
                <path d="M-45,0 Q0,10 45,0" />
                <path d="M-40,15 Q0,25 40,15" />
             </g>
          </g>

          {/* --- THE TRISHUL (Right) --- */}
          <g transform="translate(280, 260) rotate(12)">
             {/* Long Staff Line extending out */}
             <line x1="0" y1="-250" x2="0" y2="250" stroke="#f59e0b" strokeWidth="2" opacity="0.8" />
             
             {/* Trident Head */}
             <g transform="translate(0, -100)">
                {/* Center Spike */}
                <path d="M0,0 L0,-60" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                {/* Outer Prongs (Bezier Curves) */}
                <path d="M-30,-20 C-30,-50 -10,-50 0,-10" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M30,-20 C30,-50 10,-50 0,-10" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                
                {/* Decorative Diamond */}
                <rect x="-6" y="-6" width="12" height="12" fill="#fbbf24" transform="rotate(45)" filter="url(#glow-gold-strong)" />
             </g>

             {/* Damru (Hourglass Shape) */}
             <g transform="translate(0, 20)">
                 <path d="M-12,-10 L12,-10 L0,8 L-12,-10 Z" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                 <path d="M-12,26 L12,26 L0,8 L-12,26 Z" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                 <circle cx="0" cy="8" r="2" fill="#fff" />
             </g>
          </g>

          {/* --- CONNECTION LINES --- */}
          {/* Eye to Trident */}
          <line x1="180" y1="240" x2="280" y2="260" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
          <circle cx="230" cy="250" r="2" fill="#f59e0b" opacity="0.6" />
          
          {/* Moon to Eye */}
          <line x1="140" y1="160" x2="180" y2="240" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />

        </svg>
      </div>
    </div>
  );
};
