
import React, { useState, useEffect } from 'react';
import { SectionHeading } from './SectionHeading';
import { INSTRUCTORS } from '../constants';
import { Award, ShieldCheck, ChevronRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { Instructor } from '../types';
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';


interface InstructorsProps {
  onViewProfile?: (id: string) => void;
}

export const Instructors: React.FC<InstructorsProps> = ({ onViewProfile }) => {
  const [instructors, setInstructors] = useState<Instructor[]>(INSTRUCTORS);

  useEffect(() => {
    const ref = collection(db, 'instructors');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const loadedInstructors: Instructor[] = snapshot.docs
        .map(doc => doc.data() as Instructor)
        .filter(instructor => !(instructor as any).deleted);
      setInstructors(loadedInstructors);
    }, (error) => {
      console.error('Error loading instructors:', error);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section id="instructors" className="bg-white pt-4 md:pt-8 pb-12 md:pb-20 px-4 md:px-6 relative">
      {/* 
        The "Taught in Truth" block is now a floating "island" with deep rounded corners 
        to reflect the fluidity of Yoga Flow.
      */}
      <div className="max-w-7xl mx-auto bg-teal-600 rounded-[3.5rem] md:rounded-[6rem] py-24 md:py-32 px-8 md:px-16 relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(13,148,136,0.25)]">
        
        {/* Decorative background gradients inside the rounded container */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/10 to-transparent"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
          </div>
        </div>
        
        <div className="relative z-10">
          <Reveal>
            <SectionHeading 
              title="Taught in Truth" 
              subtitle="Meet our Masters rooted in the spiritual heart of Rishikesh."
              light={true}
            />
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-16">
            {instructors.map((instructor, idx) => (
              <Reveal key={idx} delay={idx * 0.2}>
                <div 
                  className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col group hover:-translate-y-3 transition-all duration-700 cursor-pointer border border-transparent hover:border-teal-200/50"
                  onClick={() => onViewProfile?.(instructor.id)}
                >
                  <div className="flex items-start justify-between mb-10">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-teal-50 overflow-hidden flex items-center justify-center text-teal-600 font-serif text-4xl font-bold shadow-sm transition-transform duration-700 group-hover:rotate-6">
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
                    <div className="text-teal-100 group-hover:text-teal-500 transition-all duration-700 scale-90 group-hover:scale-110">
                      <ShieldCheck size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-800 text-[10px] font-bold uppercase rounded-full mb-6 self-start tracking-widest shadow-sm">
                    <Award size={12} className="text-teal-600" />
                    Rishikesh Lineage
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {instructor.name}
                  </h3>
                  <p className="text-teal-600 font-bold uppercase tracking-[0.2em] mb-8 text-[11px]">
                    {instructor.role}
                  </p>
                  
                  <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-10 line-clamp-3 font-light">
                    {instructor.bio}
                  </p>

                  <div className="space-y-4 mb-10">
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {instructor.specialties.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-4 py-2 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-tight rounded-xl border border-slate-100 transition-colors group-hover:bg-teal-50 group-hover:border-teal-100">
                          {skill}
                        </span>
                      ))}
                      {instructor.specialties.length > 3 && (
                        <span className="px-4 py-2 bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-tight rounded-xl">
                          +{instructor.specialties.length - 3} More
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center gap-2 text-teal-600 font-bold text-xs md:text-sm group-hover:gap-4 transition-all tracking-[0.1em] uppercase">
                    Full Profile & Education <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
