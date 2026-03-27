
import React, { useState, useRef, useEffect } from 'react';
import { Reveal } from './Reveal';
import { Play, Pause, SkipForward, SkipBack, Volume2, Wind, Music, Moon, Zap, Waves, Sparkles, X, Headphones } from 'lucide-react';
import { MEDITATION_TRACKS } from '../constants';
import { Track } from '../types';

export const MeditationMusic: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const handleTrackSelect = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedPos = Math.max(0, Math.min(1, x / rect.width));
      audioRef.current.currentTime = clickedPos * audioRef.current.duration;
      setProgress(clickedPos * 100);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeBarRef.current && audioRef.current) {
      const rect = volumeBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, x / rect.width));
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
    }
  };

  const skipTrack = (direction: 'forward' | 'backward') => {
    if (!currentTrack) return;
    const currentIndex = MEDITATION_TRACKS.findIndex(t => t.id === currentTrack.id);
    let nextIndex;
    if (direction === 'forward') {
      nextIndex = (currentIndex + 1) % MEDITATION_TRACKS.length;
    } else {
      nextIndex = (currentIndex - 1 + MEDITATION_TRACKS.length) % MEDITATION_TRACKS.length;
    }
    setCurrentTrack(MEDITATION_TRACKS[nextIndex]);
    setIsPlaying(true);
    setProgress(0);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Sleep': return <Moon size={20} />;
      case 'Focus': return <Zap size={20} />;
      case 'Healing': return <Waves size={20} />;
      case 'Chant': return <Wind size={20} />;
      default: return <Music size={20} />;
    }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-64 px-6 overflow-hidden relative">
      {/* Immersive background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-teal-50/60 rounded-full blur-[140px] opacity-40 animate-slow-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-teal-50/40 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#0d9488 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={() => skipTrack('forward')}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <Reveal>
          <div className="text-center mb-24 md:mb-32">
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-slate-900 mb-8 tracking-tighter leading-tight">
              Pure <br/>
              <span className="text-teal-600 italic">Frequency.</span>
            </h1>
            <p className="text-xl md:text-3xl text-slate-500 font-light max-w-2xl mx-auto leading-relaxed border-l-2 border-teal-100 pl-8 md:pl-0 md:border-none">
              Two exclusive recordings from the heart of Rishikesh, specifically composed for deep physiological regulation.
            </p>
          </div>
        </Reveal>

        {/* Tracks Grid */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
          {MEDITATION_TRACKS.map((track, idx) => (
            <Reveal key={track.id} delay={idx * 0.2}>
              <div 
                onClick={() => handleTrackSelect(track)}
                className={`group p-10 md:p-16 rounded-[4rem] border transition-all duration-700 cursor-pointer relative overflow-hidden flex flex-col items-center text-center gap-10 ${
                  currentTrack?.id === track.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xl scale-[1.03]' 
                    : 'bg-white border-slate-100 hover:border-teal-300 hover:shadow-2xl'
                }`}
              >
                {/* Status Badge */}
                <div className={`text-[10px] font-bold uppercase tracking-[0.5em] ${
                   currentTrack?.id === track.id ? 'text-teal-400' : 'text-slate-300'
                }`}>
                   {track.category}
                </div>

                {/* Play Icon */}
                <div className={`w-32 h-32 rounded-full flex items-center justify-center shrink-0 transition-all duration-700 relative ${
                  currentTrack?.id === track.id 
                    ? 'bg-teal-600 text-white shadow-[0_0_50px_rgba(20,184,166,0.4)]' 
                    : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-hover:scale-110'
                }`}>
                  {currentTrack?.id === track.id && isPlaying 
                    ? <div className="flex gap-1.5 items-end h-10">
                        <div className="w-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 bg-white rounded-full animate-bounce h-16" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 bg-white rounded-full animate-bounce h-8" style={{ animationDelay: '0.4s' }}></div>
                        <div className="w-1.5 bg-white rounded-full animate-bounce h-12" style={{ animationDelay: '0.1s' }}></div>
                      </div>
                    : <Play size={48} className="ml-2" fill="currentColor" />
                  }
                </div>

                <div className="space-y-6">
                  <h3 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter leading-tight">{track.title}</h3>
                  <p className={`text-base md:text-lg font-light leading-relaxed max-w-xs mx-auto ${
                    currentTrack?.id === track.id ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {track.description}
                  </p>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center gap-10 pt-4 border-t border-white/5 w-full justify-center">
                  <div className="text-center">
                    <p className="text-xs font-bold font-mono tracking-widest uppercase">{track.duration}</p>
                    <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold mt-1">Length</p>
                  </div>
                  <div className="w-px h-10 bg-current opacity-10"></div>
                  <div className="text-center">
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${
                      currentTrack?.id === track.id ? 'text-teal-400' : 'text-slate-900'
                    }`}>{track.instructor}</p>
                    <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold mt-1">Origin</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.6}>
           <div className="mt-32 text-center">
              <div className="inline-block p-16 bg-teal-50/20 border border-teal-100/50 rounded-[4rem] max-w-3xl">
                 <Headphones size={32} className="text-teal-400 mx-auto mb-8 animate-pulse" />
                 <p className="text-slate-900 italic font-serif text-2xl md:text-3xl leading-relaxed max-w-xl mx-auto">
                   "The frequency you choose becomes the architecture of your tomorrow."
                 </p>
              </div>
           </div>
        </Reveal>
      </div>

      {/* Modern High-End Floating Audio Player */}
      {currentTrack && (
        <div className="fixed bottom-10 left-0 right-0 z-[100] px-6 flex justify-center animate-fade-in-up">
          <div className="w-full max-w-6xl bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-5 md:p-8 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.7)] border border-white/10 text-white overflow-hidden">
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              
              {/* 1. Immersive Track Display */}
              <div className="flex items-center gap-6 w-full md:w-1/3">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-600/30 shrink-0 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {getCategoryIcon(currentTrack.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl md:text-2xl font-serif font-bold truncate tracking-tight">{currentTrack.title}</h4>
                  <p className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.3em] mt-1">{currentTrack.instructor}</p>
                </div>
              </div>

              {/* 2. Advanced Controls & Progress */}
              <div className="flex-1 w-full flex flex-col items-center gap-6">
                
                {/* Main Playback HUD */}
                <div className="flex items-center gap-10">
                  <button 
                    onClick={() => skipTrack('backward')}
                    className="text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-90"
                    aria-label="Previous track"
                  >
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 md:w-20 md:h-20 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-1.5" fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => skipTrack('forward')}
                    className="text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-90"
                    aria-label="Next track"
                  >
                    <SkipForward size={24} />
                  </button>
                </div>
                
                {/* Precision Seek Bar */}
                <div className="w-full flex items-center gap-6 group">
                   <span className="text-[10px] font-mono text-slate-500 w-10 text-right font-bold">
                      {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
                   </span>
                   <div 
                    ref={progressBarRef}
                    onClick={handleSeek}
                    className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
                   >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div 
                        className="absolute left-0 top-0 h-full bg-teal-500 transition-all duration-200 group-hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.6)]"
                        style={{ width: `${progress}%` }}
                      ></div>
                   </div>
                   <span className="text-[10px] font-mono text-slate-500 w-10 font-bold">
                      {currentTrack.duration}
                   </span>
                </div>
              </div>

              {/* 3. Global Audio Settings */}
              <div className="hidden md:flex items-center justify-end gap-10 w-1/3">
                <div className="flex items-center gap-4 group">
                  <button onClick={() => setVolume(v => v === 0 ? 0.7 : 0)} aria-label="Toggle Mute">
                    <Volume2 size={20} className={volume === 0 ? "text-slate-600" : "text-slate-400 group-hover:text-teal-400 transition-colors"} />
                  </button>
                  <div 
                    ref={volumeBarRef}
                    onClick={handleVolumeClick}
                    className="w-28 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-white/40 group-hover:bg-teal-500/60 transition-colors"
                      style={{ width: `${volume * 100}%` }}
                    ></div>
                  </div>
                </div>
                <button 
                  onClick={() => { setCurrentTrack(null); setIsPlaying(false); }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90"
                  aria-label="Close player"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile HUD Controls */}
              <button 
                onClick={() => { setCurrentTrack(null); setIsPlaying(false); }}
                className="absolute top-6 right-6 md:hidden p-2 bg-white/5 rounded-xl text-slate-400"
              >
                <X size={20} />
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to format seconds into M:SS
function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
