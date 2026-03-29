
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { TIMELINE_STEPS } from '../constants';
import { Quote, Check, ArrowDown, Battery, Brain, Activity, User, ShieldCheck, Heart, Trees, Moon, type LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal, SignupModal } from './LoginModal';
import { getSettings } from '../utils/settings';

import type { JourneySettings, JourneyTimelineStepSettings } from '../types';

// Custom hook for intersection observer
const useInView = (options = { threshold: 0.1, rootMargin: '-20px' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isInView] as const;
};

const TimelineCard: React.FC<{ step: any; index: number }> = ({ step, index }) => {
  const [ref, isInView] = useInView();
  const isEven = index % 2 === 0;

  return (
    <div 
      ref={ref}
      className={`relative flex flex-col md:flex-row gap-0 md:gap-0 items-start md:items-center mb-20 md:mb-32 last:mb-0 transition-all duration-1000 ease-out transform ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Mobile-Only Connecting Line Background */}
      <div className="md:hidden absolute left-5 top-10 bottom-0 w-[1px] bg-slate-100 -z-10"></div>
      
      {/* Mobile: Header Section */}
      <div className="md:hidden flex flex-col gap-2 w-full mb-8 pl-12 relative">
        <div className="absolute left-[-28px] top-0 bg-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-lg shadow-lg z-10 border-4 border-white">
           <step.icon size={18} />
        </div>
        <div className="text-teal-600 font-bold uppercase tracking-[0.3em] text-[10px]">{step.month}</div>
        <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">{step.title}</h3>
      </div>

      {/* Content Side */}
      <div className={`md:w-1/2 w-full pl-12 md:pl-0 ${isEven ? 'md:pr-16 md:text-right' : 'md:pl-16 md:order-last md:text-left'}`}>
         <div className="space-y-6">
            <div className={`hidden md:flex items-center gap-3 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
               <span className="text-teal-600 font-bold tracking-widest uppercase text-sm">{step.month}</span>
               <div className="h-px w-12 bg-teal-200"></div>
            </div>
            
            <h3 className="hidden md:block text-3xl md:text-4xl font-serif font-bold text-slate-900">{step.title}</h3>
            
            <ul className={`space-y-4 ${isEven ? 'md:items-end' : 'md:items-start'} flex flex-col`}>
              {step.outcomes.map((outcome: string, i: number) => (
                <li key={i} className={`flex items-start gap-3 text-slate-600 text-sm md:text-base ${isEven ? 'md:flex-row-reverse md:text-right' : 'text-left'}`}>
                  <div className="mt-1 p-0.5 bg-teal-50 rounded-full shrink-0">
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>

            {/* Outcome Metric Cards (Mobile/Desktop) */}
            <div className={`flex flex-wrap gap-3 md:gap-4 pt-4 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
               {step.metrics.map((m: any, i: number) => (
                  <div key={i} className="bg-white px-4 py-3 rounded-xl border border-teal-100 shadow-sm min-w-[120px]">
                    <div className="text-xl md:text-2xl font-bold text-slate-900">{m.value}</div>
                    <div className="text-[9px] text-teal-600 uppercase font-bold tracking-widest">{m.label}</div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Desktop Center Line & Node */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 flex-col items-center h-full">
        <div className={`w-14 h-14 rounded-full border-4 border-white bg-teal-600 shadow-xl z-20 flex items-center justify-center transition-all duration-700 delay-300 ${isInView ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
           <step.icon className="text-white w-5 h-5" />
        </div>
        <div className="absolute top-0 bottom-0 w-[1px] bg-slate-100 -z-10"></div>
        <div className={`absolute top-0 w-[1px] bg-teal-500 -z-10 transition-all duration-[1.5s] ease-in-out ${isInView ? 'h-full' : 'h-0'}`}></div>
      </div>

      {/* Testimonial Side */}
      <div className={`md:w-1/2 w-full mt-8 md:mt-0 pl-12 md:pl-0 ${isEven ? 'md:pl-16' : 'md:pr-16 md:order-first'}`}>
        <div className={`relative bg-white p-8 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-100 transition-all duration-700 delay-200 transform ${isInView ? 'translate-x-0 opacity-100' : isEven ? 'md:translate-x-12 opacity-0' : 'md:-translate-x-12 opacity-0'}`}>
          {/* Refined Hanging Quote - Positioned straddling the top border, now in vibrant Green */}
          <div className="absolute -top-6 left-10 w-12 h-12 bg-white rounded-2xl shadow-md border border-green-50 flex items-center justify-center text-green-600 z-20 transition-transform duration-500 hover:scale-110">
            <Quote size={24} fill="currentColor" className="opacity-20" />
          </div>
          
          <div className="relative z-10 pt-4">
             <p className="text-base md:text-lg text-slate-600 italic leading-relaxed mb-8">"{step.testimonial.text}"</p>
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700 font-serif font-bold text-base shadow-inner">
                  {step.testimonial.author.charAt(0)}
               </div>
               <div>
                 <p className="text-xs md:text-sm font-bold text-slate-900">{step.testimonial.author}</p>
                 <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Verified Member</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TimelineProps {
  onNavPricing: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({ onNavPricing }) => {
  const { isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [shouldNavigateToPricing, setShouldNavigateToPricing] = useState(false);
  const [settings, setSettings] = useState<JourneySettings | null>(null);

  const iconMap = useMemo<Record<string, LucideIcon>>(
    () => ({
      Moon,
      Brain,
      Activity,
      User,
      Battery,
      ShieldCheck,
      Heart,
      Trees,
    }),
    []
  );

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.journey) setSettings(settings.journey as JourneySettings);
    }).catch((error) => {
      console.error('❌ Journey settings read failed:', error);
    });
  }, []);

  const handleReadyToStart = () => {
    if (!isAuthenticated) {
      // Show login modal if user is not logged in
      setShouldNavigateToPricing(true);
      setIsLoginModalOpen(true);
    } else {
      // Navigate to pricing if user is logged in
      onNavPricing();
    }
  };

  useEffect(() => {
    if (isAuthenticated && shouldNavigateToPricing) {
      // Navigate to pricing after successful login
      onNavPricing();
      setShouldNavigateToPricing(false);
    }
  }, [isAuthenticated, shouldNavigateToPricing, onNavPricing]);

  const derivedSteps = useMemo(() => {
    const source = settings?.steps;
    if (!Array.isArray(source) || source.length === 0) return TIMELINE_STEPS;
    return (source as JourneyTimelineStepSettings[])
      .filter((s) => s && typeof s.month === 'string' && typeof s.title === 'string')
      .map((s) => ({
        month: s.month,
        title: s.title,
        outcomes: Array.isArray(s.outcomes) ? s.outcomes.filter((o) => typeof o === 'string' && o.trim().length > 0) : [],
        icon: iconMap[s.iconName] || Moon,
        testimonial: {
          text: s.testimonial?.text || '',
          author: s.testimonial?.author || '',
        },
        metrics: Array.isArray(s.metrics)
          ? s.metrics
              .filter((m) => m && typeof m.label === 'string' && typeof m.value === 'string')
              .map((m) => ({ label: m.label, value: m.value }))
          : [],
      }));
  }, [iconMap, settings?.steps]);

  const headingTitle = settings?.timelineTitle || 'The Path to Transformation';
  const headingSubtitle = settings?.timelineSubtitle || '6 months. 3 distinct phases. A lifetime of measurable change.';
  const ctaTitle = settings?.ctaTitle || 'Ready to start Month 1?';
  const ctaSubtitle = settings?.ctaSubtitle || 'Focus: Restoring your nervous system and sleep architecture.';

  return (
    <>
      <section id="path-to-transformation" className="bg-white pt-24 md:pt-32 pb-12 md:pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <SectionHeading 
            title={headingTitle}
            subtitle={headingSubtitle}
          />

          <div className="relative mt-16 md:mt-32 max-w-5xl mx-auto">
             {derivedSteps.map((step, idx) => (
               <TimelineCard key={idx} step={step} index={idx} />
             ))}
          </div>
          
          {/* Call to Action at bottom of timeline - Reduced margin for tighter rhythm */}
          <div className="text-center mt-12 md:mt-16">
              <button
                onClick={handleReadyToStart}
                className="p-10 bg-teal-50 rounded-[3rem] inline-block w-full max-w-2xl border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all duration-300 cursor-pointer group"
              >
                 <ArrowDown className="w-6 h-6 mx-auto text-teal-400 mb-6 animate-bounce group-hover:text-teal-600 transition-colors" />
                 <h4 className="text-2xl md:text-3xl font-serif font-bold text-teal-900 mb-4 tracking-tight group-hover:text-teal-800 transition-colors">
                   {ctaTitle}
                 </h4>
                 <p className="text-teal-700 font-light mb-0 text-lg group-hover:text-teal-800 transition-colors">
                   {ctaSubtitle}
                 </p>
              </button>
          </div>
        </div>
      </section>

      {/* Login and Signup Modals */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToSignup={() => {
            setIsLoginModalOpen(false);
            setIsSignupModalOpen(true);
          }}
        />
      )}

      {isSignupModalOpen && (
        <SignupModal
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
          onSwitchToLogin={() => {
            setIsSignupModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      )}
    </>
  );
};
