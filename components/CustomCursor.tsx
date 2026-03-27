import React, { useEffect, useRef } from 'react';

const lerp = (start: number, end: number, factor: number) =>
  start + (end - start) * factor;

class Sparkle {
  x: number; y: number; size: number;
  speedX: number; speedY: number; life: number; decay: number; color: string;

  constructor(x: number, y: number) {
    this.x = x; this.y = y;
    this.size = Math.random() * 2 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.4 + 0.1;
    this.speedX = Math.cos(angle) * speed;
    this.speedY = Math.sin(angle) * speed - 0.2;
    this.life = 1.0;
    this.decay = Math.random() * 0.025 + 0.02;
    this.color = Math.random() > 0.6 ? '#fbbf24' : '#5eead4';
  }

  update() {
    this.x += this.speedX; this.y += this.speedY;
    this.life -= this.decay;
    this.size *= 0.96;
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
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All state lives in refs — zero re-renders, zero animation loop restarts
  const mouse = useRef({ x: -200, y: -200 });
  const followerPos = useRef({ x: -200, y: -200 });
  const dotPos = useRef({ x: -200, y: -200 });
  const lastMouse = useRef({ x: -200, y: -200 });
  const sparkles = useRef<Sparkle[]>([]);
  const initialized = useRef(false);
  const cursorState = useRef({ hovering: false, clicking: false, visible: false, label: '' });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const applyVisibility = (v: boolean) => {
      if (followerRef.current) followerRef.current.style.opacity = v ? '1' : '0';
      if (dotRef.current) dotRef.current.style.opacity = v ? '1' : '0';
    };

    const applyHover = (h: boolean) => {
      if (ringRef.current) {
        ringRef.current.className = h
          ? 'absolute inset-0 rounded-full border-2 border-teal-400 bg-teal-500/10 scale-110 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all duration-200'
          : 'absolute inset-0 rounded-full border border-teal-500/40 bg-transparent transition-all duration-200';
      }
      if (spinnerRef.current) spinnerRef.current.style.opacity = h ? '0' : '1';
      const dotInner = dotRef.current?.firstElementChild as HTMLElement | null;
      if (dotInner) {
        dotInner.style.transform = h ? 'scale(0.5)' : 'scale(1)';
        dotInner.style.backgroundColor = h ? '#fff' : '#fbbf24';
      }
    };

    const applyLabel = (text: string) => {
      if (!labelRef.current) return;
      labelRef.current.textContent = text;
      labelRef.current.style.opacity = text ? '1' : '0';
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      if (!initialized.current) {
        followerPos.current = { x: e.clientX, y: e.clientY };
        dotPos.current = { x: e.clientX, y: e.clientY };
        lastMouse.current = { x: e.clientX, y: e.clientY };
        initialized.current = true;
      }

      if (!cursorState.current.visible) {
        cursorState.current.visible = true;
        applyVisibility(true);
      }

      const target = e.target as HTMLElement;
      const labelEl = target.closest('[data-cursor-label]') as HTMLElement | null;

      if (labelEl) {
        const text = labelEl.getAttribute('data-cursor-label') || '';
        if (text !== cursorState.current.label) { cursorState.current.label = text; applyLabel(text); }
        if (!cursorState.current.hovering) { cursorState.current.hovering = true; applyHover(true); }
      } else {
        const interactive = target.closest('button, a, input, select, textarea, .cursor-pointer, [role="button"]');
        if (interactive && !cursorState.current.hovering) {
          cursorState.current.hovering = true; cursorState.current.label = '';
          applyHover(true); applyLabel('');
        } else if (!interactive && cursorState.current.hovering) {
          cursorState.current.hovering = false; cursorState.current.label = '';
          applyHover(false); applyLabel('');
        }
      }
    };

    const onMouseDown = () => { cursorState.current.clicking = true; };
    const onMouseUp = () => { cursorState.current.clicking = false; };
    const onMouseLeave = () => { cursorState.current.visible = false; applyVisibility(false); };
    const onMouseEnter = () => { cursorState.current.visible = true; applyVisibility(true); };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    const resize = () => {
      if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    };
    resize();
    window.addEventListener('resize', resize);

    let raf: number;

    const render = () => {
      const dx = mouse.current.x - lastMouse.current.x;
      const dy = mouse.current.y - lastMouse.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        sparkles.current.push(new Sparkle(mouse.current.x, mouse.current.y));
        if (dist > 20) sparkles.current.push(new Sparkle(mouse.current.x, mouse.current.y));
        lastMouse.current = { ...mouse.current };
      }

      // Faster lerp factors: 0.25 follower (was 0.12), 0.7 dot (was 0.5)
      followerPos.current.x = lerp(followerPos.current.x, mouse.current.x, 0.25);
      followerPos.current.y = lerp(followerPos.current.y, mouse.current.y, 0.25);
      dotPos.current.x = lerp(dotPos.current.x, mouse.current.x, 0.7);
      dotPos.current.y = lerp(dotPos.current.y, mouse.current.y, 0.7);

      const vx = mouse.current.x - followerPos.current.x;
      const vy = mouse.current.y - followerPos.current.y;
      const velocity = Math.sqrt(vx * vx + vy * vy);
      const angle = Math.atan2(vy, vx);

      if (followerRef.current) {
        const baseScale = cursorState.current.clicking ? 0.8 : cursorState.current.hovering ? 1.5 : 1;
        const stretch = Math.min(velocity * 0.004, 0.3);
        followerRef.current.style.transform =
          `translate3d(${followerPos.current.x}px,${followerPos.current.y}px,0) rotate(${angle}rad) scale(${baseScale + stretch},${baseScale - stretch})`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px,${dotPos.current.y}px,0)`;
      }

      if (labelRef.current && cursorState.current.label) {
        labelRef.current.style.transform =
          `translate3d(${followerPos.current.x + 24}px,${followerPos.current.y + 24}px,0) scale(1)`;
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = sparkles.current.length - 1; i >= 0; i--) {
          const s = sparkles.current[i];
          s.update(); s.draw(ctx);
          if (s.life <= 0) sparkles.current.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(raf);
    };
  }, []); // run ONCE — no deps means no loop restarts on hover/click

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9998]" />

      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full pointer-events-none z-[9999] opacity-0 will-change-transform flex items-center justify-center"
        style={{ transition: 'opacity 0.4s' }}
      >
        <div
          ref={ringRef}
          className="absolute inset-0 rounded-full border border-teal-500/40 bg-transparent transition-all duration-200"
        />
        <div
          ref={spinnerRef}
          className="absolute inset-[-6px] border border-dotted border-amber-400/40 rounded-full"
          style={{ animation: 'spin 8s linear infinite', transition: 'opacity 0.2s' }}
        />
      </div>

      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 pointer-events-none z-[10000] opacity-0 will-change-transform"
        style={{ transition: 'opacity 0.4s' }}
      >
        <div
          className="w-full h-full rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
          style={{ transition: 'transform 0.2s, background-color 0.2s' }}
        />
      </div>

      <div
        ref={labelRef}
        className="fixed top-0 left-0 pointer-events-none z-[10001] px-3 py-1.5 bg-slate-900/90 backdrop-blur text-teal-50 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg shadow-xl border border-white/10 whitespace-nowrap opacity-0 will-change-transform"
        style={{ transition: 'opacity 0.2s, transform 0.2s' }}
      />
    </>
  );
};
