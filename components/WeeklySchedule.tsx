
import React from 'react';
import { SectionHeading } from './SectionHeading';
import { WEEKLY_SCHEDULE } from '../constants';
import { Clock, Signal, ExternalLink } from 'lucide-react';
import { Reveal } from './Reveal';

interface WeeklyScheduleProps {
  onViewSampleClass?: () => void;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ onViewSampleClass }) => {
  return (
    <section id="schedule" className="bg-white pt-12 md:pt-16 pb-16 md:pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <SectionHeading 
            title="The Weekly Rhythm" 
            subtitle="Guided live sessions timed for optimal recovery and focused work weeks."
          />
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {WEEKLY_SCHEDULE.map((session, idx) => (
            <Reveal key={idx} delay={idx * 0.1}>
              <div className="bg-white border border-slate-100 rounded-2xl p-8 hover:border-teal-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={14} className="text-teal-400" />
                </div>
                <div className="text-[10px] text-teal-600 font-bold tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                    {session.day}
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2 group-hover:text-teal-800 transition-colors">{session.focus}</h3>
                
                <div className="space-y-3 mt-8 border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <Clock size={16} />
                    </div>
                    <span className="text-sm font-medium">{session.duration}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <Signal size={16} />
                    </div>
                    <span className="text-sm font-medium">Intensity: <span className="text-slate-900">{session.intensity}</span></span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.4}>
          <div className="mt-16 md:mt-24 p-10 bg-slate-900 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="relative z-10">
                  <h4 className="text-2xl md:text-3xl font-serif font-bold mb-3">Missed the live flow?</h4>
                  <p className="text-slate-400 max-w-md">Every class is instantly archived in your private library for 7 days of on-demand practice.</p>
              </div>
              <button 
                onClick={onViewSampleClass}
                className="relative z-10 shrink-0 bg-white hover:bg-teal-50 text-slate-900 px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                  View Sample Class
              </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
