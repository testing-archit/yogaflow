import React, { useEffect, useMemo, useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { PROBLEMS, SOLUTIONS } from '../constants';
import { Reveal } from './Reveal';
import { Battery, Brain, Activity, User, ShieldCheck, Heart, Trees, Moon, type LucideIcon } from 'lucide-react';
import type { JourneyListItemSettings, JourneySettings } from '../types';

export const ProblemSolution: React.FC = () => {
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

  const [settings, setSettings] = useState<JourneySettings | null>(null);

  const derivedProblems = useMemo(() => {
    const source = settings?.problems;
    if (!Array.isArray(source) || source.length === 0) return PROBLEMS;
    return (source as JourneyListItemSettings[])
      .filter((i) => i && typeof i.text === 'string' && typeof i.iconName === 'string')
      .map((i) => ({
        text: i.text,
        icon: iconMap[i.iconName] || Moon,
      }));
  }, [iconMap, settings?.problems]);

  const derivedSolutions = useMemo(() => {
    const source = settings?.solutions;
    if (!Array.isArray(source) || source.length === 0) return SOLUTIONS;
    return (source as JourneyListItemSettings[])
      .filter((i) => i && typeof i.text === 'string' && typeof i.iconName === 'string')
      .map((i) => ({
        text: i.text,
        icon: iconMap[i.iconName] || Trees,
      }));
  }, [iconMap, settings?.solutions]);

  const headingTitle = settings?.problemSolutionTitle || 'Modern Life is Loud. We Offer Silence.';
  const headingSubtitle =
    settings?.problemSolutionSubtitle || 'Bridging the gap between Himalayan tradition and urban performance.';
  const problemsHeading = settings?.problemsHeading || 'The Modern Struggle';
  const solutionsHeading = settings?.solutionsHeading || 'The Rishikesh Solution';

  return (
    <section className="bg-white py-12 md:py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <SectionHeading 
            title={headingTitle}
            subtitle={headingSubtitle}
          />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-start mt-10">
          
          {/* Problem Column */}
          <div className="space-y-4">
            <Reveal delay={0.1}>
              <h3 className="text-xl md:text-2xl uppercase tracking-[0.1em] font-bold text-slate-500 mb-4 border-b border-slate-100 pb-2">
                {problemsHeading}
              </h3>
            </Reveal>
            {derivedProblems.map((item, idx) => (
              <Reveal key={idx} delay={0.2 + idx * 0.1}>
                <div className="flex items-center gap-5 group p-3 rounded-xl hover:bg-slate-50 transition-all cursor-default">
                  <div className="p-2.5 bg-slate-100 rounded-full text-slate-400 group-hover:bg-white group-hover:text-slate-900 shadow-sm transition-all">
                    <item.icon size={20} />
                  </div>
                  <p className="text-lg text-slate-600 group-hover:text-slate-900 transition-colors font-light">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Solution Column */}
          <div className="space-y-4">
            <Reveal delay={0.1}>
              <h3 className="text-xl md:text-2xl uppercase tracking-[0.1em] font-bold text-teal-600 mb-4 border-b border-teal-100 pb-2">
                {solutionsHeading}
              </h3>
            </Reveal>
            {derivedSolutions.map((item, idx) => (
              <Reveal key={idx} delay={0.2 + idx * 0.1}>
                <div className="flex items-center gap-5 group p-3 rounded-xl hover:bg-teal-50 transition-all cursor-default">
                  <div className="p-2.5 bg-teal-50 rounded-full text-teal-600 shadow-sm group-hover:bg-white transition-all">
                    <item.icon size={20} />
                  </div>
                  <p className="text-lg text-slate-900 font-medium">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
