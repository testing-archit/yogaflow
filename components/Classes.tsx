import React, { useState, useMemo, useEffect } from 'react';
import { Reveal } from './Reveal';
import { Button } from './Button';
import { LIVE_CLASSES, RECORDED_CLASSES } from '../constants';
import { Clock, Play, ExternalLink, Filter, ChevronDown, Calendar, Search, X, Sparkles } from 'lucide-react';
import { YogaClass } from '../types';
import { getSettings } from '../utils/settings';
import { apiClient } from '../utils/apiClient';

import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

interface ClassesProps {
  initialTab?: 'live' | 'recorded';
  onNavHome?: () => void;
}

export const Classes: React.FC<ClassesProps> = ({ initialTab = 'live', onNavHome }) => {
  const { user, isAdmin, isAdminChecking } = useAuth();
  const [activeTab, setActiveTab] = useState<'live' | 'recorded'>(initialTab);
  const [filterType, setFilterType] = useState<string>('All Types');
  const [filterLevel, setFilterLevel] = useState<string>('All Levels');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true); // Default to showing overlay
  const [classVideos, setClassVideos] = useState<Record<string, string>>({}); // classId -> videoUrl
  const [liveClasses, setLiveClasses] = useState<YogaClass[]>(LIVE_CLASSES);
  const [recordedClasses, setRecordedClasses] = useState<YogaClass[]>(RECORDED_CLASSES);

  const isSubscribed = useMemo(() => {
    if (isAdmin) return true;
    if (!user?.plan) return false;
    // Any plan other than "Free Plan" is considered subscribed
    return user.plan !== 'Free Plan';
  }, [user?.plan, isAdmin]);

  // Update activeTab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        setShowComingSoon(settings.classesComingSoon);
      } catch (error) {
        console.error('Error loading settings:', error);
        setShowComingSoon(false);
      }

      // Load class videos
      apiClient.get('classVideo').then((videos: any[]) => {
        if (Array.isArray(videos)) {
          const map: Record<string, string> = {};
          videos.forEach((v: any) => { if (v.classId && v.videoUrl) map[v.classId] = v.videoUrl; });
          setClassVideos(map);
        }
      }).catch(() => {});

      // Load classes
      apiClient.get('yogaClass').then((all: any[]) => {
        if (Array.isArray(all) && all.length > 0) {
          const withCat = all.map((d: any) => ({ ...d, category: d.category || (d.time ? 'live' : 'recorded') }));
          const live = withCat.filter((c: any) => c.category === 'live').map(({ category, ...c }: any) => c);
          const recorded = withCat.filter((c: any) => c.category === 'recorded').map(({ category, ...c }: any) => c);
          if (live.length > 0) setLiveClasses(live);
          if (recorded.length > 0) setRecordedClasses(recorded);
        }
      }).catch(() => {});
    })();
  }, []);

  const handleJoinJourney = () => {
    // Navigate to home first, then scroll to path-to-transformation
    if (onNavHome) {
      onNavHome();
      // Wait for navigation and DOM update, then scroll
      setTimeout(() => {
        const pathToTransformationSection = document.getElementById('path-to-transformation');
        if (pathToTransformationSection) {
          pathToTransformationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // If element not found, try again after a longer delay
          setTimeout(() => {
            const section = document.getElementById('path-to-transformation');
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }
      }, 150);
    }
  };

  const handleWatchClass = async (cls: YogaClass, url: string) => {
    // Attempt tracking
    if (user?.id) {
      try {
        const durationMins = parseInt(cls.duration) || 30; // fallback to 30 mins
        
        let token = '';
        const clerk = (window as any).Clerk;
        if (clerk?.session) {
          token = await clerk.session.getToken();
        }

        await fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ classId: cls.id, durationMins })
        });
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    }
    window.open(ensureAbsoluteUrl(url), '_blank', 'noopener,noreferrer');
  };

  const types = ['All Types', 'Hatha', 'Vinyasa', 'Meditation', 'Mobility'];
  const levels = ['All Levels', 'Beginner', 'Intermediate', 'All'];

  const filteredClasses = useMemo(() => {
    const source = activeTab === 'live' ? liveClasses : recordedClasses;
    return source.filter(cls => {
      const typeMatch = filterType === 'All Types' || cls.type === filterType;
      const levelMatch = filterLevel === 'All Levels' || cls.level === filterLevel;
      const searchMatch = 
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        cls.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.type.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && levelMatch && searchMatch;
    });
  }, [activeTab, filterType, filterLevel, searchQuery, liveClasses, recordedClasses]);

  const clearFilters = () => {
    setFilterType('All Types');
    setFilterLevel('All Levels');
    setSearchQuery('');
  };

  return (
    <div className="bg-white min-h-screen selection:bg-teal-100 selection:text-teal-900">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-12 md:pt-48 md:pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-teal-50 rounded-full blur-[80px] md:blur-[120px] opacity-40 animate-slow-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Reveal>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4 md:mb-6 block opacity-80">
              The Practice
            </span>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-slate-900 mb-6 md:mb-8 tracking-tighter leading-none">
              Daily <span className="text-teal-600 italic">Flow.</span>
            </h1>
            <p className="text-base md:text-2xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed px-4">
              Rooted in Rishikesh, refined for your life. Find the session that meets your energy today.
            </p>
          </Reveal>
        </div>
      </section>

      {/* COMING SOON OR SUBSCRIPTION OVERLAY - Controlled by admin settings and user plan */}
      <div className="relative min-h-[600px]">
        {/* Content Area - only blur and disable interaction if coming soon or not subscribed is enabled */}
        <div className={`${(showComingSoon || !isSubscribed) ? 'pointer-events-none select-none blur-sm' : ''}`}>
          {/* 2. NAVIGATION & SEARCH BAR */}
          <div className="sticky top-[64px] md:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            {/* Tabs */}
            <div className="flex bg-slate-50 p-1 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 md:px-8 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeTab === 'live' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setActiveTab('recorded')}
                className={`px-4 md:px-8 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeTab === 'recorded' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Archives
              </button>
            </div>

            {/* Functional Search Input */}
            <div className="flex-1 flex items-center justify-end relative">
              <div className={`flex items-center transition-all duration-500 overflow-hidden ${isSearchVisible ? 'w-full max-w-[300px] opacity-100' : 'w-0 opacity-0 md:w-auto md:opacity-0'}`}>
                <input 
                  type="text" 
                  placeholder="Search classes..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchVisible(false)}
                  autoFocus={isSearchVisible}
                />
              </div>
              <button 
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 ${isSearchVisible ? 'text-teal-600' : 'text-slate-500 hover:text-teal-500'}`}
              >
                {isSearchVisible ? <X size={20} /> : <Search size={20} />}
                {!isSearchVisible && <span className="hidden md:inline text-[10px] uppercase font-bold tracking-widest">Search</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS */}
      <section className="px-4 md:px-6 pt-8 md:pt-12">
        <div className="max-w-7xl mx-auto">
          <Reveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-slate-500 shrink-0">
                <Filter size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Curate</span>
              </div>
              
              <FilterDropdown label={filterType} options={types} onSelect={setFilterType} />
              <FilterDropdown label={filterLevel} options={levels} onSelect={setFilterLevel} />
              
              <div className="ml-auto hidden lg:flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{filteredClasses.length} results found</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

          {/* 4. CONTENT AREA */}
          <section className="px-4 md:px-6 py-8 md:py-12 pb-24">
            <div className="max-w-7xl mx-auto">
              {filteredClasses.length > 0 ? (
                activeTab === 'live' ? (
                  <div className="space-y-4 md:space-y-6">
                    {filteredClasses.map((cls, idx) => {
                      const finalVideoUrl = cls.videoUrl || classVideos[cls.id];
                      return (
                        <Reveal key={cls.id} delay={idx * 0.05}>
                          <div className="group relative bg-white hover:bg-slate-50/50 rounded-2xl md:rounded-[2rem] p-5 md:p-10 border border-slate-100 transition-all duration-700 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 overflow-hidden shadow-sm hover:shadow-md">
                            {/* Interaction Background Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-teal-200 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl pointer-events-none"></div>
                            
                            {/* Time Indicator */}
                            <div className="md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-8">
                              <p className="text-2xl md:text-4xl font-serif font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                                {cls.time?.split(' ')[0]}
                                <span className="text-xs uppercase ml-1 opacity-40">{cls.time?.split(' ')[1]}</span>
                              </p>
                              <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-slate-400">Local Time (IST)</span>
                            </div>

                            {/* Class Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-teal-600 text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-teal-50 rounded">
                                  {cls.type}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                                  {cls.duration}
                                </span>
                              </div>
                              {finalVideoUrl ? (
                                <button 
                                  onClick={() => handleWatchClass(cls, finalVideoUrl)}
                                  className="text-left block text-lg md:text-3xl font-serif font-bold text-slate-900 hover:text-teal-600 transition-colors leading-tight"
                                >
                                  {cls.title}
                                </button>
                              ) : (
                                <h3 className="text-lg md:text-3xl font-serif font-bold text-slate-900 leading-tight">
                                  {cls.title}
                                </h3>
                              )}
                              <div className="flex flex-wrap gap-3">
                                {cls.focus.map(f => (
                                  <span key={f} className="text-[10px] md:text-[11px] text-slate-500 font-light italic">#{f.toLowerCase()}</span>
                                ))}
                              </div>
                            </div>

                            {/* Instructor Profile */}
                            <div className="flex items-center gap-4 md:px-8 md:border-l md:border-slate-100 pt-2 md:pt-0">
                              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] md:text-xs font-bold font-serif shadow-lg group-hover:bg-teal-600 transition-colors shrink-0">
                                {cls.instructor.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Instructor</p>
                                <p className="text-xs md:text-sm font-medium text-slate-800">{cls.instructor}</p>
                              </div>
                            </div>

                            {/* Action */}
                            <div className="md:w-48 text-right pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                              {finalVideoUrl ? (
                                <button 
                                  onClick={() => handleWatchClass(cls, finalVideoUrl)}
                                  className="w-full md:w-auto inline-flex items-center justify-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-teal-600 hover:text-teal-800 group-hover:translate-x-1 transition-all py-1 md:py-0"
                                >
                                  Enter Studio <Play size={14} />
                                </button>
                              ) : (
                                <button className="w-full md:w-auto inline-flex items-center justify-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-teal-600 hover:text-teal-800 group-hover:translate-x-1 transition-all py-1 md:py-0">
                                  Enter Studio <ExternalLink size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-12">
                    {filteredClasses.map((cls, idx) => {
                      const finalVideoUrl = cls.videoUrl || classVideos[cls.id];
                      return (
                        <Reveal key={cls.id} delay={idx * 0.1}>
                          <div className="group relative flex flex-col">
                            {finalVideoUrl ? (
                              <button 
                                onClick={() => handleWatchClass(cls, finalVideoUrl)}
                                className="relative aspect-[16/10] bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden mb-5 md:mb-8 border border-slate-50 shadow-sm hover:shadow-xl transition-all duration-700 block cursor-pointer w-full text-left"
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-600/5 to-transparent"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm">
                                   <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                                     <Play fill="currentColor" size={24} />
                                   </div>
                                </div>
                                <div className="absolute top-4 left-4 flex gap-2">
                                   <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-widest text-slate-700 shadow-sm border border-white/50">
                                     {cls.type}
                                   </span>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700/60 md:text-white/80 drop-shadow-sm md:drop-shadow-md">
                                     {cls.duration} • {cls.level}
                                   </span>
                                </div>
                              </button>
                            ) : (
                              <div className="relative aspect-[16/10] bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden mb-5 md:mb-8 border border-slate-50 shadow-sm transition-all duration-700">
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-600/5 to-transparent"></div>
                                <div className="absolute top-4 left-4 flex gap-2">
                                   <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-widest text-slate-700 shadow-sm border border-white/50">
                                     {cls.type}
                                   </span>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700/60 md:text-white/80 drop-shadow-sm md:drop-shadow-md">
                                     {cls.duration} • {cls.level}
                                   </span>
                                </div>
                              </div>
                            )}

                            <div className="px-2 space-y-2 md:space-y-3">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Archive Session</p>
                              {finalVideoUrl ? (
                                <button 
                                  onClick={() => handleWatchClass(cls, finalVideoUrl)}
                                  className="block text-left text-xl md:text-3xl font-serif font-bold text-slate-900 group-hover:text-teal-600 transition-colors leading-tight"
                                >
                                  {cls.title}
                                </button>
                              ) : (
                                <h3 className="text-xl md:text-3xl font-serif font-bold text-slate-900 group-hover:text-teal-600 transition-colors leading-tight">
                                  {cls.title}
                                </h3>
                              )}
                              <p className="text-xs md:text-sm font-light text-slate-600">{cls.instructor}</p>
                              <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                 <div className="flex gap-2">
                                   {cls.focus.slice(0, 2).map(f => (
                                     <span key={f} className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tighter">#{f}</span>
                                   ))}
                                 </div>
                                 {finalVideoUrl ? (
                                   <button 
                                     onClick={() => handleWatchClass(cls, finalVideoUrl)}
                                     className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:translate-x-1 transition-transform flex items-center gap-1"
                                   >
                                     Watch <Play size={12} />
                                   </button>
                                 ) : (
                                   <button className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:translate-x-1 transition-transform cursor-default opacity-50">
                                     Coming Soon
                                   </button>
                                 )}
                              </div>
                            </div>
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                )
              ) : (
                <EmptyState onReset={clearFilters} />
              )}
            </div>
          </section>
        </div>

        {/* Coming Soon Overlay - Only show if enabled in settings */}
        {showComingSoon ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md">
            <Reveal>
              <div className="text-center px-6 py-12 md:py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-teal-100 mb-6 md:mb-8 animate-pulse">
                  <Sparkles className="text-teal-600" size={40} />
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-4 md:mb-6">
                  Classes Starting From <span className="text-teal-600 italic">4th April</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-md mx-auto font-light leading-relaxed">
                  We're preparing something special for you. Classes will be available soon.
                </p>
              </div>
            </Reveal>
          </div>
        ) : !isSubscribed ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md">
            <Reveal>
              <div className="text-center px-6 py-12 md:py-20 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-teal-100 mb-6 md:mb-8">
                  <Lock className="text-teal-600" size={40} />
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-4 md:mb-6">
                  Premium <span className="text-teal-600 italic">Access Only.</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-600 mb-10 font-light leading-relaxed">
                  Daily live flows and archives are reserved for our community members. Choose a plan to unlock your practice.
                </p>
                <div className="flex justify-center">
                  <Button 
                    onClick={handleJoinJourney}
                    variant="primary" 
                    size="lg" 
                    className="rounded-full bg-teal-600 text-white hover:bg-teal-500 px-10 md:px-14 py-4 md:py-6 shadow-2xl transition-all duration-300 font-bold tracking-[0.2em] text-sm md:text-base active:scale-95"
                  >
                    Unlock All Classes
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}
      </div>
      {/* END OVERLAYS */}

      {/* 5. CTA SECTION - REFINED FOR VISIBILITY */}
      <section className="px-4 md:px-6 pb-20 md:pb-32">
        <Reveal>
          <div className="max-w-7xl mx-auto rounded-3xl md:rounded-[3rem] bg-slate-900 p-8 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -left-24 w-64 h-64 md:w-96 md:h-96 bg-teal-600/20 rounded-full blur-[80px] md:blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 md:w-96 md:h-96 bg-teal-400/10 rounded-full blur-[80px] md:blur-[100px]"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-8">
                Transformation Membership
              </span>
              <h2 className="text-3xl md:text-6xl font-serif font-bold text-white mb-6 md:mb-8 leading-tight">
                Practice consistently.<br />
                <span className="text-teal-500 italic">Transform</span> gradually.
              </h2>
              <p className="text-slate-300 text-base md:text-xl font-light mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed">
                Join our premium community to unlock 100+ archives, daily live streams from Rishikesh, and weekly 1-on-1 progress check-ins.
              </p>
              
              {/* FIXED BUTTON VISIBILITY: Explicit Solid Teal Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleJoinJourney}
                  variant="primary" 
                  size="lg" 
                  className="rounded-full bg-teal-600 text-white hover:bg-teal-500 px-10 md:px-14 py-4 md:py-6 shadow-2xl border-none transition-all duration-300 font-bold tracking-[0.2em] text-sm md:text-base active:scale-95"
                >
                  Join the Journey
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="text-center py-20 md:py-32 bg-slate-50 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-slate-100 px-6">
    <Calendar size={48} className="mx-auto text-slate-300 mb-6" />
    <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-2">No results found</h3>
    <p className="text-sm md:text-base text-slate-600 mb-8 max-w-sm mx-auto">Try adjusting your filters or keywords to find your session.</p>
    <button 
      onClick={onReset}
      className="text-[10px] font-bold uppercase tracking-widest text-teal-600 border-b border-teal-600 pb-1"
    >
      Clear all filters
    </button>
  </div>
);

// Helper to ensure URL is absolute
const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('www.')) return `https://${url}`;
  // For anything else that looks like a domain but lacks protocol
  if (url.includes('.') && !url.includes(' ')) return `https://${url}`;
  return url;
};

interface DropdownProps {
  label: string;
  options: string[];
  onSelect: (val: string) => void;
}

const FilterDropdown: React.FC<DropdownProps> = ({ label, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full border transition-all duration-300 text-[10px] md:text-[11px] font-bold uppercase tracking-widest cursor-pointer flex items-center gap-3 min-w-[110px] md:min-w-[140px] justify-between shadow-sm ${
          isOpen ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className={`transition-transform duration-500 shrink-0 ${isOpen ? 'rotate-180 text-teal-600' : 'text-slate-400'}`} />
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-3 w-48 md:w-56 bg-white rounded-2xl md:rounded-[2rem] shadow-2xl border border-slate-100 z-50 py-3 px-1 animate-fade-in-up">
            {options.map(opt => (
              <div 
                key={opt}
                onClick={() => {
                  onSelect(opt);
                  setIsOpen(false);
                }}
                className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer transition-colors ${
                  label === opt ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
