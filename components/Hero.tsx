
import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Compass } from 'lucide-react';
import { Button } from './Button';
import { HERO_METRICS } from '../constants';
import { Reveal } from './Reveal';
import { ShivaPortrait } from './ShivaPortrait';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal, SignupModal } from './LoginModal';

interface HeroProps {
  onNavPricing: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavPricing }) => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [shouldNavigateToPricing, setShouldNavigateToPricing] = useState(false);
  const { isAuthenticated } = useAuth();

  // Navigate to pricing after successful login if triggered from "Start Free Month"
  useEffect(() => {
    if (isAuthenticated && shouldNavigateToPricing) {
      setShouldNavigateToPricing(false);
      onNavPricing();
    }
  }, [isAuthenticated, shouldNavigateToPricing, onNavPricing]);

  const handleStartFreeMonth = () => {
    if (!isAuthenticated) {
      // Show login modal if user is not logged in
      setShouldNavigateToPricing(true);
      setIsLoginModalOpen(true);
    } else {
      // Navigate to pricing if user is logged in
      onNavPricing();
    }
  };

  const handleSeeJourney = () => {
    // Scroll to the "Path to Transformation" section (Timeline) on the landing page
    const pathToTransformationSection = document.getElementById('path-to-transformation');
    if (pathToTransformationSection) {
      pathToTransformationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center bg-white overflow-hidden pt-20">
      {/* Background with abstract teal elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="absolute -right-20 top-20 w-[600px] h-[600px] bg-teal-50 rounded-full blur-3xl opacity-60"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute -left-40 bottom-0 w-[800px] h-[800px] bg-teal-50/50 rounded-full blur-[120px] opacity-40"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[1.2fr,0.8fr] gap-12 lg:gap-16 items-center">
        
        {/* Left: Text Content */}
        <div className="space-y-10">
          <Reveal delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-teal-800 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
              <Compass size={14} className="animate-spin-slow text-teal-600" />
              Live from Rishikesh, India
            </div>
          </Reveal>
          
          <Reveal delay={0.2}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-slate-900 leading-[0.95] tracking-tighter">
              Train with Rishikesh's Best Yoga Teachers – <span className="text-teal-600">Online.</span>
            </h1>
          </Reveal>
          
          <Reveal delay={0.3}>
            <p className="text-lg md:text-xl text-slate-600 font-light max-w-2xl leading-relaxed border-l-2 border-teal-200 pl-6">
              Live sessions from the Yoga Capital of the World – Learn anytime, anywhere.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="rounded-full"
                onClick={handleStartFreeMonth}
              >
                Start Free Month
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full"
                onClick={handleSeeJourney}
              >
                See the 6-Month Journey
              </Button>
            </div>
            <p className="mt-6 text-[11px] text-slate-400 uppercase tracking-widest font-bold">
              Live classes • Ancient Tradition • Beginner-safe • Real results
            </p>
          </Reveal>
        </div>

        {/* Right: Divine Portrait Display (Updated Frame) */}
        <div className="relative hidden lg:block h-[600px]">
            <Reveal delay={0.5} className="relative z-10 h-full flex items-center justify-end">
              <div 
                className="relative aspect-[4/5] w-full max-w-[420px] transition-transform duration-100 ease-out flex items-center justify-center p-0"
                style={{ transform: `translateY(${scrollY * -0.05}px)` }}
              >
                <ShivaPortrait />
              </div>
            </Reveal>

            {/* Floating Metric Cards */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 space-y-6 z-20">
              {HERO_METRICS.map((metric, index) => {
                const speeds = [-0.15, -0.1, -0.2];
                return (
                  <Reveal key={index} delay={0.6 + index * 0.1}>
                    <div 
                      className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 w-56 transition-transform duration-150 ease-out hover:scale-105"
                      style={{ transform: `translateY(${scrollY * speeds[index]}px)` }}
                    >
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{metric.label}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                        {metric.trend === 'down' ? (
                          <div className="p-1.5 bg-teal-50 rounded-lg"><ArrowDown size={14} className="text-teal-600" /></div>
                        ) : (
                          <div className="p-1.5 bg-teal-50 rounded-lg"><ArrowUp size={14} className="text-teal-600" /></div>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
        </div>
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
    </section>
  );
};
