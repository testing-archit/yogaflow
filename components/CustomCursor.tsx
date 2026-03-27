
import React, { useEffect, useRef, useState } from 'react';

// Linear interpolation for smooth movement with variable friction
const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

// Particle class for the stardust trail (Canvas-based for performance)
class Sparkle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  decay: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 0.5; // Varied size for depth
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.4 + 0.1;
    this.speedX = Math.cos(angle) * speed;
    this.speedY = Math.sin(angle) * speed - 0.2; // Slight upward float like incense/energy
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.015;
    // Blend of Brand Colors: Sacred Gold and Healing Teal
    this.color = Math.random() > 0.6 ? '#fbbf24' : '#5eead4'; 
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    this.size *= 0.96; // Gently shrink
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

export const CustomCursor: React.FC = () => {
  const followerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Physics & State
  const mouse = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 }); // Follower position (laggy)
  const lastMouse = useRef({ x: -100, y: -100 }); // For trail calculation
  const dotPos = useRef({ x: -100, y: -100 }); // Dot position (fast)
  const sparkles = useRef<Sparkle[]>([]);
  const hasInitialized = useRef(false);
  
  // Interactive State
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Disable on touch devices to prevent ghost cursors
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // Initialize positions immediately on first move to prevent "fly-in" from (0,0)
      if (!hasInitialized.current) {
        pos.current = { x: e.clientX, y: e.clientY };
        dotPos.current = { x: e.clientX, y: e.clientY };
        lastMouse.current = { x: e.clientX, y: e.clientY };
        hasInitialized.current = true;
      }

      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      
      // 1. Check for explicit Cursor Labels (e.g. "VIEW", "START")
      const labelElement = target.closest('[data-cursor-label]') as HTMLElement;
      if (labelElement) {
        const text = labelElement.getAttribute('data-cursor-label');
        if (text && text !== labelText) setLabelText(text);
        if (!isHovering) setIsHovering(true);
      } else {
        // 2. Check for standard clickable elements
        const isInteractive = target.closest('button, a, input, select, textarea, .cursor-pointer, [role="button"]');
        if (isInteractive && !isHovering) {
          setIsHovering(true);
          setLabelText('');
        } else if (!isInteractive && !labelElement && isHovering) {
          setIsHovering(false);
          setLabelText('');
        }
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Setup Canvas for high-performance particles
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const setCanvasSize = () => {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    
    const render = () => {
      // 1. Spawn Particles based on distance moved (smoother trail than time-based)
      const dist = Math.hypot(mouse.current.x - lastMouse.current.x, mouse.current.y - lastMouse.current.y);
      if (dist > 4) {
         sparkles.current.push(new Sparkle(mouse.current.x, mouse.current.y));
         // Add extra sparkle for fast movements
         if (dist > 20) sparkles.current.push(new Sparkle(mouse.current.x, mouse.current.y));
         lastMouse.current = { ...mouse.current };
      }

      // 2. Smooth Physics Interpolation
      // The follower lags behind (0.12 factor) to create fluid weight
      pos.current.x = lerp(pos.current.x, mouse.current.x, 0.12);
      pos.current.y = lerp(pos.current.y, mouse.current.y, 0.12);
      
      // The core dot is snappy (0.5 factor) for precision
      dotPos.current.x = lerp(dotPos.current.x, mouse.current.x, 0.5);
      dotPos.current.y = lerp(dotPos.current.y, mouse.current.y, 0.5);

      // 3. Jelly/Stretch Effect Calculation
      const vx = mouse.current.x - pos.current.x;
      const vy = mouse.current.y - pos.current.y;
      const velocity = Math.sqrt(vx*vx + vy*vy);
      const angle = Math.atan2(vy, vx);
      
      // Apply transforms
      if (followerRef.current) {
        // Base scale: shrinks on click, grows on hover
        const baseScale = isClicking ? 0.8 : (isHovering ? 1.5 : 1);
        
        // Stretch: elongation based on speed (The "Jelly" look)
        const stretch = Math.min(velocity * 0.004, 0.3); 
        const scaleX = baseScale + stretch;
        const scaleY = baseScale - stretch;
        
        followerRef.current.style.transform = `
          translate3d(${pos.current.x}px, ${pos.current.y}px, 0) 
          rotate(${angle}rad) 
          scale(${scaleX}, ${scaleY})
        `;
      }

      if (dotRef.current) {
        // The dot stays perfectly round and precise
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0)`;
      }

      if (labelRef.current) {
         // Label floats with a slight offset
         labelRef.current.style.transform = `translate3d(${pos.current.x + 24}px, ${pos.current.y + 24}px, 0)`;
      }

      // 4. Render Canvas Particles
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = sparkles.current.length - 1; i >= 0; i--) {
            const s = sparkles.current[i];
            s.update();
            s.draw(ctx);
            if (s.life <= 0) sparkles.current.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovering, labelText, isVisible, isClicking]);

  // Don't render on mobile to save resources and avoid touch conflicts
  if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
     return null;
  }

  return (
    <>
      {/* 1. Stardust Trail Layer */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
      />

      {/* 2. Main Follower (The Aura) */}
      <div 
        ref={followerRef}
        className={`fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full pointer-events-none z-[9999] transition-opacity duration-500 will-change-transform flex items-center justify-center ${
            isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Dynamic Ring */}
        <div className={`absolute inset-0 rounded-full border border-teal-500 transition-[background-color,border-color,transform,box-shadow] duration-300 ${
            isHovering 
                ? 'bg-teal-500/10 border-teal-400 border-2 scale-110 shadow-[0_0_20px_rgba(45,212,191,0.3)]' 
                : 'bg-transparent border-teal-500/40'
        }`}></div>
        
        {/* Sacred Geometry Spinner (Only when idle) */}
        {!isHovering && (
            <div className="absolute inset-[-6px] border border-dotted border-amber-400/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
        )}
      </div>

      {/* 3. Center Core (The Atman) */}
      <div 
        ref={dotRef}
        className={`fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 pointer-events-none z-[10000] transition-opacity duration-500 will-change-transform ${
            isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className={`w-full h-full rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] transition-all duration-300 ${
             isHovering 
                ? 'bg-white scale-[0.5]' // Shrink dot on hover so ring is focus
                : 'bg-amber-400 scale-100'
        }`}></div>
      </div>

      {/* 4. Context Label - Removed transition-all to prevent "falling from sky" coordinate lag */}
      <div 
        ref={labelRef}
        className={`fixed top-0 left-0 pointer-events-none z-[10001] px-3 py-1.5 bg-slate-900/90 backdrop-blur text-teal-50 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg shadow-xl border border-white/10 whitespace-nowrap transition-[opacity,transform] duration-300 ease-out ${
            labelText ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-2'
        }`}
      >
        {labelText}
      </div>
    </>
  );
};
