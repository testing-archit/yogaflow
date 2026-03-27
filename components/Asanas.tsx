import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal, SignupModal } from './LoginModal';
import { Reveal } from './Reveal';
import { ASANAS, MEDITATION_TRACKS } from '../constants';
import { Track, Asana } from '../types';
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';

import { 
  Shield, 
  Sparkles, 
  Target, 
  Zap, 
  Waves, 
  ChevronRight, 
  Check, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Wind, 
  Music, 
  Moon, 
  X, 
  Headphones 
} from 'lucide-react';

interface AsanasProps {
  onNavPricing?: () => void;
}

export const Asanas: React.FC<AsanasProps> = ({ onNavPricing }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [shouldNavigateToPricing, setShouldNavigateToPricing] = useState(false);
  const { isAuthenticated } = useAuth();
  const [asanas, setAsanas] = useState<Asana[]>(ASANAS);
  const [selectedAsana, setSelectedAsana] = useState<Asana | null>(null);

  // Navigate to pricing after successful login if triggered from "Join Live Workshop"
  useEffect(() => {
    if (isAuthenticated && shouldNavigateToPricing && onNavPricing) {
      setShouldNavigateToPricing(false);
      onNavPricing();
    }
  }, [isAuthenticated, shouldNavigateToPricing, onNavPricing]);

  useEffect(() => {
    if (!selectedAsana) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAsana(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAsana]);

  const getAsanaGallery = (asana: Asana) => {
    const urls = Array.isArray((asana as any).galleryUrls) ? (asana as any).galleryUrls : [];
    const cleaned = urls.filter((u: any) => typeof u === 'string' && u.trim()).map((u: string) => u.trim());
    if (cleaned.length > 0) return cleaned.slice(0, 6);

    const fallback = [
      asana.imageUrl,
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1599901860904-17e0ed3af3ea?auto=format&fit=crop&q=80&w=1200',
    ].filter(Boolean) as string[];
    return fallback;
  };

  const getCommonMistakes = (asana: Asana) => {
    const mistakes = Array.isArray((asana as any).commonMistakes) ? (asana as any).commonMistakes : [];
    const cleaned = mistakes.filter((m: any) => typeof m === 'string' && m.trim()).map((m: string) => m.trim());
    if (cleaned.length > 0) return cleaned.slice(0, 5);
    return ['Rounding the lower back', 'Shrugging shoulders toward ears', 'Locking the elbows'];
  };

  const getInstructorTip = (asana: Asana) => {
    const tip = typeof (asana as any).instructorTip === 'string' ? (asana as any).instructorTip.trim() : '';
    if (tip) return tip;
    return `In ${asana.sanskritName}, ${asana.focusCue}`;
  };

  useEffect(() => {
    const ref = collection(db, 'asanas');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const loadedAsanas: Asana[] = snapshot.docs
        .map(doc => doc.data() as Asana)
        .filter(asana => !(asana as any).deleted);
      setAsanas(loadedAsanas);
    }, (error) => {
      console.error('Error loading asanas:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleJoinWorkshop = () => {
    if (!isAuthenticated) {
      // Show login modal if user is not logged in
      setShouldNavigateToPricing(true);
      setIsLoginModalOpen(true);
    } else if (onNavPricing) {
      // Navigate to pricing if user is logged in
      onNavPricing();
    }
  };

  // --- Audio State & Logic (from MeditationMusic) ---
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

  // Helper to format seconds into M:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-64 px-6 overflow-hidden relative">
      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={() => skipTrack('forward')}
      />

      <div className="max-w-7xl mx-auto">
        {/* --- Section 1: Asana Library --- */}
        <Reveal>
          <div className="text-center mb-20">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.4em] mb-4 block">Practice Library</span>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-slate-900 mb-8 tracking-tighter">
              The Path of <span className="text-teal-600 italic">Form.</span>
            </h1>
            <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              Foundational postures from the Rishikesh lineage, decoded for modern physiology and focused transformation.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mb-32">
          {asanas.map((asana, idx) => (
            <Reveal key={asana.id} delay={idx * 0.1}>
              <div className="group bg-white border border-slate-100 rounded-[2.5rem] p-0 hover:border-teal-200 hover:shadow-2xl transition-all duration-700 flex flex-col h-full overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={asana.imageUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800"} 
                    alt={asana.englishName}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-8">
                     <span className="text-[9px] font-bold text-white uppercase tracking-widest px-3 py-1 bg-teal-600 rounded-full mb-3 inline-block shadow-lg">
                        {asana.level}
                     </span>
                  </div>
                </div>

                <div className="p-10 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-slate-900 leading-tight mb-1">{asana.sanskritName}</h3>
                      <p className="text-sm text-slate-500 font-light italic">{asana.englishName}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-600 group-hover:text-white transition-all duration-700 shrink-0">
                      <Target size={20} />
                    </div>
                  </div>

                  <div className="space-y-6 mb-10 flex-grow">
                    <p className="text-sm text-slate-600 leading-relaxed font-light">
                      {asana.description}
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                         <Sparkles size={12} className="text-teal-50" /> Key Benefits
                      </h4>
                      <ul className="space-y-2">
                        {asana.benefits.map((b, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="w-1 h-1 bg-teal-200 rounded-full mt-1.5 shrink-0"></span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-xs text-slate-600">
                      <span className="font-bold text-teal-700 not-italic mr-1">Focus:</span> {asana.focusCue}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{asana.category}</span>
                    <button
                      onClick={() => setSelectedAsana(asana)}
                      className="text-[10px] font-bold uppercase tracking-widest text-teal-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                        Learn Technique <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {selectedAsana && (
          <div
            className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4 py-10"
            onClick={() => setSelectedAsana(null)}
          >
            <div
              className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_60px_140px_-30px_rgba(0,0,0,0.6)] overflow-hidden border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid lg:grid-cols-[360px_1fr_360px]">
                <div className="p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight truncate">
                        {selectedAsana.sanskritName}
                      </h3>
                      <p className="text-sm text-teal-700 font-medium mt-1">{selectedAsana.englishName}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAsana(null)}
                      className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-7 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {getAsanaGallery(selectedAsana).map((url, idx) => (
                      <div key={`${url}-${idx}`} className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                        <div className="aspect-[16/10]">
                          <img src={url} alt={`${selectedAsana.englishName} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    The Technique
                  </div>

                  <div className="mt-8 space-y-7">
                    {(selectedAsana.howTo || []).map((step, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
                    <Check size={14} className="text-teal-600" />
                    Key Benefits
                  </div>

                  <ul className="mt-6 space-y-3">
                    {(selectedAsana.benefits || []).map((b, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 p-5 rounded-2xl border border-rose-100 bg-rose-50">
                    <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-rose-700">
                      Common Mistakes
                    </div>
                    <ul className="mt-4 space-y-2">
                      {getCommonMistakes(selectedAsana).map((m, idx) => (
                        <li key={idx} className="text-xs text-rose-700 flex items-start gap-2">
                          <span className="mt-0.5 text-rose-400">
                            <X size={14} />
                          </span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 p-6 rounded-2xl bg-slate-900 text-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal-300">
                      Pro Instructor Tip
                    </div>
                    <p className="mt-3 text-sm text-slate-200 leading-relaxed">
                      {getInstructorTip(selectedAsana)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Section 2: Meditation Library --- */}
        <div className="pt-24 border-t border-slate-100">
          <Reveal>
            <div className="text-center mb-20">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.4em] mb-4 block">Sonic Restoration</span>
              <h2 className="text-4xl md:text-7xl font-serif font-bold text-slate-900 mb-8 tracking-tighter">
                Meditation <span className="text-teal-600 italic">Music.</span>
              </h2>
              <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
                Exclusive high-fidelity recordings from the heart of the Himalayas, designed for neural reset and deep sleep.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto mb-32">
            {MEDITATION_TRACKS.map((track, idx) => (
              <Reveal key={track.id} delay={idx * 0.2}>
                <div 
                  onClick={() => handleTrackSelect(track)}
                  className={`group p-10 md:p-14 rounded-[4rem] border transition-all duration-700 cursor-pointer relative overflow-hidden flex flex-col items-center text-center gap-10 ${
                    currentTrack?.id === track.id 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-3xl scale-[1.03]' 
                      : 'bg-white border-slate-100 hover:border-teal-300 hover:shadow-2xl'
                  }`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-[0.5em] ${
                    currentTrack?.id === track.id ? 'text-teal-400' : 'text-slate-400'
                  }`}>
                    {track.category}
                  </div>

                  <div className={`w-28 h-28 rounded-full flex items-center justify-center shrink-0 transition-all duration-700 relative ${
                    currentTrack?.id === track.id 
                      ? 'bg-teal-600 text-white shadow-[0_0_50px_rgba(20,184,166,0.4)]' 
                      : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-hover:scale-110'
                  }`}>
                    {currentTrack?.id === track.id && isPlaying 
                      ? <div className="flex gap-1.5 items-end h-8">
                          <div className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="w-1 bg-white rounded-full animate-bounce h-12" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 bg-white rounded-full animate-bounce h-6" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      : <Play size={40} className="ml-1.5" fill="currentColor" />
                    }
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif font-bold tracking-tighter leading-tight">{track.title}</h3>
                    <p className={`text-sm font-light leading-relaxed max-w-xs mx-auto ${
                      currentTrack?.id === track.id ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {track.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-10 pt-4 border-t border-white/5 w-full justify-center">
                    <div className="text-center">
                      <p className="text-xs font-bold font-mono tracking-widest uppercase">{track.duration}</p>
                      <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold mt-1">Length</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.4}>
          <div className="mt-24 p-12 md:p-20 bg-slate-900 rounded-[4rem] text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full blur-[100px]"></div>
             <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 relative z-10">Master the basics, <br/>unlock the potential.</h2>
             <p className="text-slate-300 max-w-xl mx-auto mb-10 relative z-10">Every pose and every frequency is a doorway. Our guides help you navigate the journey inward.</p>
             <button 
               onClick={handleJoinWorkshop}
               className="bg-teal-600 text-white px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:bg-teal-500 transition-all shadow-2xl relative z-10"
             >
                Join Live Classes
             </button>
          </div>
        </Reveal>
      </div>

      {/* Login/Signup Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setShouldNavigateToPricing(false);
        }}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => {
          setIsSignupModalOpen(false);
          setShouldNavigateToPricing(false);
        }}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Modern High-End Floating Audio Player (Only visible when a track is active) */}
      {currentTrack && (
        <div className="fixed bottom-10 left-0 right-0 z-[100] px-6 flex justify-center animate-fade-in-up">
          <div className="w-full max-w-6xl bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-5 md:p-8 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.7)] border border-white/10 text-white overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Track Info */}
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

              {/* Controls & Progress */}
              <div className="flex-1 w-full flex flex-col items-center gap-6">
                <div className="flex items-center gap-10">
                  <button 
                    onClick={() => skipTrack('backward')}
                    className="text-slate-500 hover:text-white transition-all"
                  >
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-1.5" fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => skipTrack('forward')}
                    className="text-slate-500 hover:text-white transition-all"
                  >
                    <SkipForward size={24} />
                  </button>
                </div>
                
                <div className="w-full flex items-center gap-6 group">
                   <span className="text-[10px] font-mono text-slate-500 w-10 text-right">
                      {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
                   </span>
                   <div 
                    ref={progressBarRef}
                    onClick={handleSeek}
                    className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
                   >
                      <div className="absolute left-0 top-0 h-full bg-teal-500 transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      ></div>
                   </div>
                   <span className="text-[10px] font-mono text-slate-500 w-10">
                      {currentTrack.duration}
                   </span>
                </div>
              </div>

              {/* Settings */}
              <div className="hidden md:flex items-center justify-end gap-10 w-1/3">
                <div className="flex items-center gap-4 group">
                  <button onClick={() => setVolume(v => v === 0 ? 0.7 : 0)}>
                    <Volume2 size={20} className={volume === 0 ? "text-slate-600" : "text-slate-500 group-hover:text-teal-400"} />
                  </button>
                  <div 
                    ref={volumeBarRef}
                    onClick={handleVolumeClick}
                    className="w-28 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-white/40 group-hover:bg-teal-500/60"
                      style={{ width: `${volume * 100}%` }}
                    ></div>
                  </div>
                </div>
                <button 
                  onClick={() => { setCurrentTrack(null); setIsPlaying(false); }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
