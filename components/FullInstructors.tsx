
import React, { useEffect, useState } from 'react';
import { INSTRUCTORS } from '../constants';
import { Button } from './Button';
import { ArrowLeft, Award, BookOpen, Star, Instagram, Youtube, MapPin } from 'lucide-react';
import { Reveal } from './Reveal';
import { Instructor } from '../types';
interface FullInstructorsProps {
  onBack: () => void;
  selectedId?: string | null;
}

export const FullInstructors: React.FC<FullInstructorsProps> = ({ onBack, selectedId }) => {
  const [instructors, setInstructors] = useState<Instructor[]>(INSTRUCTORS);


  const displayInstructors = selectedId 
    ? instructors.filter(i => i.id === selectedId)
    : instructors;

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-teal-600 font-bold uppercase tracking-widest text-xs mb-12 hover:gap-3 transition-all"
        >
          <ArrowLeft size={16} /> Back to Journey
        </button>

        <Reveal>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6">Our Mentors</h1>
          <p className="text-xl text-slate-500 font-light max-w-2xl mb-20">
            Dedicated practitioners from Rishikesh, bringing centuries of tradition to your modern wellness journey.
          </p>
        </Reveal>

        <div className="space-y-32">
          {displayInstructors.map((instructor, idx) => (
            <Reveal key={instructor.id} delay={idx * 0.1}>
              <div className="grid md:grid-cols-[1fr,2fr] gap-12 border-t border-slate-100 pt-16">
                
                {/* Left: Contact & Stats */}
                <div className="space-y-10">
                  <div className="w-32 h-32 rounded-3xl bg-teal-600 overflow-hidden flex items-center justify-center text-white font-serif text-5xl font-bold shadow-xl">
                    {instructor.imageUrl ? (
                      <img
                        src={instructor.imageUrl}
                        alt={instructor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (instructor.name || '')
                        .replace(/\s+/g, '')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={16} /> <span className="text-sm font-medium">{instructor.lineage}</span>
                    </div>
                  </div>

                  {(instructor.social?.instagram || instructor.social?.youtube) && (
                    <div className="space-y-4">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Social Presence</h3>
                      <div className="flex gap-4">
                        {instructor.social?.instagram && (
                          <div className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
                             <Instagram size={18} /> <span className="text-xs font-bold">{instructor.social.instagram}</span>
                          </div>
                        )}
                        {instructor.social?.youtube && (
                          <div className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
                             <Youtube size={18} /> <span className="text-xs font-bold">{instructor.social.youtube}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Full Details */}
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2">{instructor.name}</h2>
                    <p className="text-teal-600 font-bold uppercase tracking-widest text-sm mb-6">{instructor.role}</p>
                    <p className="text-lg text-slate-600 leading-relaxed font-light">
                      {instructor.bio}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-slate-900 font-serif text-xl font-bold">
                        <Star className="text-teal-600 w-5 h-5" /> Mastery
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {instructor.specialties.map((s, i) => (
                          <span key={i} className="px-4 py-2 bg-teal-50 text-teal-800 text-xs font-bold rounded-lg uppercase tracking-tight">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-slate-900 font-serif text-xl font-bold">
                        <BookOpen className="text-teal-600 w-5 h-5" /> Education
                      </div>
                      <ul className="space-y-3">
                        {instructor.education.map((e, i) => (
                          <li key={i} className="text-sm text-slate-600 leading-snug border-l-2 border-teal-100 pl-4">{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {instructor.achievements && (
                    <div className="bg-slate-50 p-8 rounded-[2rem]">
                      <div className="flex items-center gap-2 text-slate-900 font-serif text-xl font-bold mb-6">
                        <Award className="text-teal-600 w-6 h-6" /> Key Achievements
                      </div>
                      <ul className="grid sm:grid-cols-2 gap-4">
                        {instructor.achievements.map((a, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 text-sm">
                            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {instructor.experience && (
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Professional Timeline</h3>
                      <div className="space-y-6">
                        {instructor.experience.map((ex, i) => (
                          <div key={i} className="flex gap-6 items-baseline group">
                            <div className="w-2 h-2 rounded-full bg-teal-200 group-hover:bg-teal-500 transition-colors mt-1 shrink-0"></div>
                            <p className="text-slate-700 text-sm leading-relaxed">{ex}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-32 text-center p-16 bg-teal-50 rounded-[3rem]">
          <h3 className="text-3xl font-serif font-bold text-teal-900 mb-4">Start your journey with us</h3>
          <p className="text-teal-700 mb-8 max-w-lg mx-auto">Get direct access to Dr. Aditi, Pawan, and Aradhna in our live daily sessions.</p>
          <Button variant="primary" size="lg" className="rounded-full">Join the Program</Button>
        </div>
      </div>
    </div>
  );
};
