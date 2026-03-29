import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  Facebook, 
  Compass,
  Clock,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { LOGO_URL } from '../constants';
import { apiClient } from '../utils/apiClient';


interface FooterProps {
  onNavHome: () => void;
  onNavInstructors: () => void;
  onNavClasses: () => void;
  onNavAbout: () => void;
  onNavPricing: () => void;
  onNavCommunity: () => void;
  onNavPrivacy?: () => void;
  onNavTerms?: () => void;
  isHomePage: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavHome, onNavInstructors, onNavClasses, onNavAbout, onNavPricing, onNavCommunity, onNavPrivacy, onNavTerms, isHomePage }) => {
  const [indiaTime, setIndiaTime] = useState<string>('');
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setIndiaTime(formatter.format(new Date()));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    // Validate email
    if (!newsletterEmail || !newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      await apiClient.post('newsletterSubscriber', {
        id: crypto.randomUUID(),
        email: newsletterEmail.toLowerCase().trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      setSubmitStatus('success');
      setNewsletterEmail('');
      
      // Reset success message and submitting state after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setIsSubmitting(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving newsletter subscription:', error);
      setSubmitStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const navLinks = [
    { name: 'The Journey', href: '#journey', action: isHomePage ? null : onNavHome },
    { name: 'Classes', href: '#classes', action: onNavClasses },
    { name: 'Instructors', href: '#instructors', action: onNavInstructors },
    { name: 'Community', href: '#community', action: onNavCommunity },
    { name: 'About', href: '#about', action: onNavAbout },
    { name: 'Pricing', href: '#pricing', action: onNavPricing }
  ];

  return (
    <footer className="relative bg-white border-t border-slate-100 pt-24 pb-12 overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-50 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none opacity-40"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <button 
            onClick={onNavHome}
            className="flex flex-col items-center gap-4 group mb-8"
          >
            <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl group-hover:rotate-12 transition-transform">
              <img src={LOGO_URL} alt="Yoga Flow" className="w-full h-full object-cover" />
            </div>
            <span className="text-3xl md:text-5xl font-serif font-bold tracking-tighter text-slate-900 group-hover:text-teal-600 transition-colors">
              Yoga Flow
            </span>
          </button>
          
          <p className="text-slate-500 text-lg font-light max-w-xl leading-relaxed mb-12">
            A live, 6-month yoga transformation program rooted in the lineage of Rishikesh, designed for modern lives.
          </p>
          <nav className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-900 hover:text-teal-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="w-full max-w-2xl bg-teal-50 border border-teal-100 rounded-[2.5rem] p-8 md:p-12 mb-20">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-600 mb-4">The Practice Insider</h3>
            <p className="text-slate-900 text-xl md:text-2xl font-serif mb-8">Insights on breath, sleep, and longevity.</p>
            <form onSubmit={handleNewsletterSubmit} className="relative max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="email@address.com" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={isSubmitting}
                className={`w-full bg-white border rounded-full py-4 px-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all text-sm ${
                  submitStatus === 'error' 
                    ? 'border-red-300 focus:ring-red-500' 
                    : submitStatus === 'success'
                    ? 'border-teal-300 focus:ring-teal-500'
                    : 'border-teal-100 focus:ring-teal-500'
                } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                required
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`absolute right-2 top-2 bottom-2 px-6 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg z-10 ${
                  submitStatus === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                } ${isSubmitting ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
              >
                {isSubmitting ? (
                  'Joining...'
                ) : submitStatus === 'success' ? (
                  <>
                    <Check size={14} /> Joined
                  </>
                ) : (
                  <>
                    Join <ArrowRight size={14} />
                  </>
                )}
              </button>
              {submitStatus === 'success' && (
                <p className="mt-3 text-sm text-green-600 text-center font-medium">
                  Thank you! You've been subscribed.
                </p>
              )}
              {submitStatus === 'error' && (
                <p className="mt-3 text-sm text-red-600 text-center font-medium flex items-center justify-center gap-2">
                  <X size={14} />
                  {errorMessage}
                </p>
              )}
            </form>
          </div>

          <div className="w-full pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
               <a href="#" className="text-slate-400 hover:text-teal-600 transition-colors"><Instagram size={20} /></a>
               <a href="#" className="text-slate-400 hover:text-teal-600 transition-colors"><Facebook size={20} /></a>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <Compass size={14} className="text-teal-500" />
                Rishikesh, India
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 tabular-nums">
                <Clock size={14} className="text-teal-500" />
                {indiaTime || 'Loading Time...'}
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                © {new Date().getFullYear()} Yoga Flow Inc.
              </p>
              <div className="flex gap-4 md:gap-6">
                <button 
                  onClick={onNavTerms}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-teal-600 transition-colors"
                >
                  Terms & Conditions
                </button>
                <button 
                  onClick={onNavPrivacy}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-teal-600 transition-colors"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10vw] font-serif font-bold text-slate-50 select-none pointer-events-none whitespace-nowrap uppercase tracking-widest">
        Authentic Tradition
      </div>
    </footer>
  );
};