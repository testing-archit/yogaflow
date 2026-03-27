import React from 'react';
import { Reveal } from './Reveal';
import { Compass, Wind, Eye, Anchor, Sparkles, Heart, MessageCircle } from 'lucide-react';
import { Button } from './Button';

interface AboutProps {
  onContactClick?: () => void;
}

export const About: React.FC<AboutProps> = ({ onContactClick }) => {
  return (
    <div className="bg-white min-h-screen selection:bg-teal-100 selection:text-teal-900">
      {/* 1. HERO: MINIMALIST INTRODUCTION */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-teal-50/40 rounded-full blur-[120px] opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-teal-50/20 rounded-full blur-[100px] opacity-30"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Reveal direction="down">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white border border-teal-100 rounded-full text-teal-600 text-[11px] font-bold tracking-[0.5em] uppercase mb-12 shadow-sm">
              <Anchor size={14} className="text-teal-500" />
              Yoga Flow Origin
            </div>
          </Reveal>
          
          <Reveal delay={0.2}>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 mb-10 tracking-tighter leading-[1.1]">
              Bringing the Soul of <br/>
              <span className="text-teal-600 italic">Rishikesh to the World.</span>
            </h1>
          </Reveal>
          
          <Reveal delay={0.4} className="max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl text-slate-600 font-light leading-relaxed">
              Grounded in the wisdom of India's yoga capital, we honor tradition while embracing modern life. We connect lifelong practitioners and seekers with experienced teachers and a compassionate community.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. OUR STORY: THE BRIDGE */}
      <section className="py-32 px-6 bg-slate-50/50">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-6 mb-12">
              <div className="h-px flex-1 bg-slate-200"></div>
              <h2 className="text-[12px] font-bold text-teal-600 uppercase tracking-[0.6em] shrink-0">Our Story</h2>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="space-y-10 text-slate-600 font-light text-lg md:text-xl leading-relaxed text-center md:text-left">
              <p>
                Yoga Flow was born from a deep love for yoga and a desire to share its transformative power with the world. Inspired by the serene atmosphere and profound teachings of Rishikesh, the birthplace of yoga, we set out on a mission to bridge the gap between traditional yoga and the modern urban lifestyle.
              </p>
              <p>
                Our journey began with a small group of dedicated practitioners and teachers, united by a shared vision: to make authentic yoga accessible to everyone, regardless of their location or schedule.
              </p>
              <div className="pt-8 flex justify-center">
                <div className="w-16 h-1 bg-teal-600/20 rounded-full"></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. VISION & MISSION: THE ARCHITECTURE */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            
            {/* Vision */}
            <Reveal direction="right">
              <div className="space-y-10 p-12 md:p-16 bg-white border border-slate-100 rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all duration-700 group">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                  <Eye size={32} />
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6 tracking-tight">Our Vision</h3>
                  <p className="text-slate-600 text-lg font-light leading-relaxed">
                    We strive to create a global yoga family where anyone can experience the life-changing benefits of traditional yoga. We envision a world where the wisdom of Rishikesh is readily available, empowering individuals to cultivate inner peace, strength, and well-being.
                  </p>
                </div>
                <div className="flex gap-3">
                   <div className="h-1.5 w-10 bg-teal-600 rounded-full"></div>
                   <div className="h-1.5 w-3 bg-teal-100 rounded-full"></div>
                </div>
              </div>
            </Reveal>

            {/* Mission */}
            <Reveal direction="left" delay={0.2}>
              <div className="space-y-10 p-12 md:p-16 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl shadow-slate-900/20 group">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:rotate-12 transition-transform">
                  <Compass size={32} />
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 tracking-tight">Our Mission</h3>
                  <p className="text-slate-300 text-lg font-light leading-relaxed">
                    To make authentic teachings from Rishikesh accessible regardless of location or schedule. Through live and on-demand classes led by experienced instructors, we nurture personal growth, community connection, and holistic well-being.
                  </p>
                </div>
                <div className="flex gap-3">
                   <div className="h-1.5 w-10 bg-teal-500 rounded-full"></div>
                   <div className="h-1.5 w-3 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* 4. CORE VALUES: MINIMALIST GRID */}
      <section className="py-32 px-6 border-t border-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-20 text-center">
            <Reveal delay={0.1}>
              <div className="space-y-6">
                <Wind className="mx-auto text-teal-600/40" size={40} />
                <h4 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-900">Authenticity</h4>
                <p className="text-sm text-slate-500 font-light leading-relaxed px-4">Upholding the pure, unaltered lineages of Himalayan Hatha.</p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-6">
                <Sparkles className="mx-auto text-teal-600/40" size={40} />
                <h4 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-900">Accessibility</h4>
                <p className="text-sm text-slate-500 font-light leading-relaxed px-4">Digital tools bridging the gap to remote spiritual wisdom.</p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="space-y-6">
                <Heart className="mx-auto text-teal-600/40" size={40} />
                <h4 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-900">Compassion</h4>
                <p className="text-sm text-slate-500 font-light leading-relaxed px-4">A supportive global family growing in strength together.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. CONTACT CTA */}
      <section className="py-24 px-6 bg-teal-50">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-8">Still have questions?</h2>
            <p className="text-slate-700 text-lg md:text-xl font-light mb-12 leading-relaxed">
              We're here to help you choose the right path for your journey. Talk to our team for personalized guidance.
            </p>
            <Button 
              onClick={onContactClick} 
              variant="primary" 
              size="lg" 
              className="rounded-full flex items-center gap-3 mx-auto px-10"
            >
              Talk to a Guide <MessageCircle size={20} />
            </Button>
          </Reveal>
        </div>
      </section>

      <div className="h-24 md:hidden"></div>
    </div>
  );
};