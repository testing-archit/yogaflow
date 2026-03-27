import React, { useState, useEffect } from 'react';
import { Reveal } from './Reveal';
import { RESEARCH_TOPICS } from '../constants';
import { ResearchTopic } from '../types';
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';

import { 
  BookOpen, 
  ExternalLink, 
  Microscope, 
  ShieldCheck, 
  Zap
} from 'lucide-react';

export const Research: React.FC = () => {
  const [researchTopics, setResearchTopics] = useState<ResearchTopic[]>(RESEARCH_TOPICS); // Initialize with constants as fallback

  useEffect(() => {
    const ref = collection(db, 'research');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const loadedTopics: ResearchTopic[] = snapshot.docs
        .map(doc => doc.data() as ResearchTopic)
        .filter(topic => !(topic as any).deleted);
      setResearchTopics(loadedTopics);
    }, (error) => {
      console.error('Error loading research topics:', error);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-24">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.4em] mb-4 block">Evidence-Based Wellness</span>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-slate-900 mb-8 tracking-tighter">
              The Science of <span className="text-teal-600 italic">Self.</span>
            </h1>
            <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              We validate ancient Himalayan practices through the lens of modern clinical research. Explore the measurable physiological benefits of consistent Yoga Flow.
            </p>
          </div>
        </Reveal>

        <div className="space-y-12">
          {researchTopics.map((topic, idx) => (
            <Reveal key={topic.id} delay={idx * 0.05}>
              <div className="group grid lg:grid-cols-[1.5fr,2fr] gap-8 md:gap-16 items-start border-t border-slate-100 pt-16">
                
                {/* Left Side: The Claim */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-700">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">{topic.benefit}</h3>
                  </div>
                  <p className="text-lg text-slate-600 font-light leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {/* Right Side: The Evidence */}
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100">
                  <div className="flex items-center gap-2 mb-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Microscope size={14} className="text-teal-500" /> Academic References
                  </div>
                  <div className="space-y-4">
                    {topic.papers.map((paper, pIdx) => (
                      <a 
                        key={pIdx} 
                        href={paper.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-teal-300 hover:shadow-lg transition-all group/link"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover/link:text-teal-600 transition-colors">
                              <BookOpen size={14} />
                           </div>
                           <span className="text-sm font-medium text-slate-700 leading-snug max-w-[80%]">{paper.title}</span>
                        </div>
                        <ExternalLink size={16} className="text-slate-300 group-hover/link:text-teal-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.4}>
          <div className="mt-32 text-center p-16 md:p-24 border-2 border-dashed border-slate-100 rounded-[4rem]">
             <Zap size={32} className="text-teal-400 mx-auto mb-8" />
             <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mb-6">Continuously Evolving.</h2>
             <p className="text-slate-600 max-w-xl mx-auto mb-0 leading-relaxed font-light">
               Our curriculum is peer-reviewed by our in-house medical consultants to ensure that every sequence we teach 
               maximizes your physiological and psychological outcomes while maintaining traditional integrity.
             </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
