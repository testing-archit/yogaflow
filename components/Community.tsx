import React from 'react';
import { SectionHeading } from './SectionHeading';
import { MessageCircle, Trophy, Users } from 'lucide-react';

export const Community: React.FC = () => {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <SectionHeading 
              title="You Don't Practice Alone" 
              subtitle="Consistency is hard. Our community structure makes it automatic."
              align="left"
            />
            
            <div className="space-y-8 mt-8">
              <div className="flex gap-4">
                <div className="bg-teal-50 p-3 rounded-xl h-fit">
                    <Users className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-slate-900">Weekly Check-ins</h4>
                    <p className="text-slate-600 mt-1">Share wins and obstacles every Sunday evening. Stay accountable to the group.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-teal-50 p-3 rounded-xl h-fit">
                    <MessageCircle className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-slate-900">Community Chat</h4>
                    <p className="text-slate-600 mt-1">A quiet, focused space for questions. No spam, just support.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-teal-50 p-3 rounded-xl h-fit">
                    <Trophy className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-slate-900">Shared Milestones</h4>
                    <p className="text-slate-600 mt-1">Celebrate 30, 60, and 90-day streaks together.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
             {/* Mock Chat UI */}
             <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-teal-500">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Michael T.</span>
                        <span className="text-xs text-slate-400">2h ago</span>
                    </div>
                    <p className="text-slate-700 text-sm">Week 4 complete! Finally touched my toes without bending knees today. Small win but huge for me. 🎉</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Sarah J.</span>
                        <span className="text-xs text-slate-400">5h ago</span>
                    </div>
                    <p className="text-slate-700 text-sm">The Yoga Nidra session last night was exactly what I needed after a stressful launch week.</p>
                </div>
                <div className="bg-teal-600 p-4 rounded-lg shadow-sm text-white opacity-90">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Dr. Aditi (Instructor)</span>
                        <span className="text-xs text-teal-100">Just now</span>
                    </div>
                    <p className="text-sm">Great work everyone. For tomorrow's clinic, bring a strap or a belt. We're focusing on shoulder opening.</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};