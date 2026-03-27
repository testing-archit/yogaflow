
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Menu, X, User } from 'lucide-react';
import { LOGO_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal, SignupModal } from './LoginModal';
import { ProfileDropdown } from './ProfileDropdown';

interface NavbarProps {
  onNavHome: () => void;
  onNavInstructors: () => void;
  onNavClasses: () => void;
  onNavAbout: () => void;
  onNavPricing: () => void;
  onNavCommunity: () => void;
  onNavMeditation?: () => void;
  onNavAsanas?: () => void;
  onNavAdmin?: () => void;
  onNavDashboard?: (tab?: 'profile' | 'asanas' | 'classes' | 'subscription') => void;
  isHomePage: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavHome,
  onNavInstructors,
  onNavClasses,
  onNavAbout,
  onNavPricing,
  onNavCommunity,
  onNavMeditation,
  onNavAsanas,
  onNavResearch,
  onNavAdmin,
  onNavDashboard,
  isHomePage
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [shouldNavigateToPricing, setShouldNavigateToPricing] = useState(false);
  const [shouldNavigateToDashboard, setShouldNavigateToDashboard] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Navigate to pricing after successful login if triggered from "Start Free Month"
  useEffect(() => {
    if (isAuthenticated && shouldNavigateToPricing) {
      setShouldNavigateToPricing(false);
      onNavPricing();
    }
  }, [isAuthenticated, shouldNavigateToPricing, onNavPricing]);

  useEffect(() => {
    if (isAuthenticated && shouldNavigateToDashboard) {
      setShouldNavigateToDashboard(false);
      onNavDashboard?.('profile');
    }
  }, [isAuthenticated, shouldNavigateToDashboard, onNavDashboard]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Journey', href: '#journey', action: onNavHome },
    { name: 'Asanas', href: '#asanas', action: onNavAsanas },
    { name: 'Classes', href: '#classes', action: onNavClasses },
    { name: 'Research', href: '#research', action: onNavResearch },
    { name: 'Community', href: '#community', action: onNavCommunity },
    { name: 'Instructors', href: '#instructors', action: onNavInstructors },
    { name: 'Pricing', href: '#pricing', action: onNavPricing }
  ];

  return (
    <>
      <nav
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-[top,width,max-width,padding,background-color,border-radius,box-shadow,border-color] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-between overflow-hidden will-change-[top,width,padding] ${isScrolled
            ? 'top-4 w-[94%] md:w-[90%] max-w-6xl rounded-[2rem] bg-white/80 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/50 py-3 px-6 md:px-10'
            : `top-0 w-full py-8 px-6 md:px-12 border-b border-transparent rounded-none ${!isHomePage
              ? 'bg-white/80 backdrop-blur-md shadow-sm border-slate-100/50'
              : 'bg-transparent'
            }`
          }`}
      >
        <div
          className={`absolute top-0 left-0 h-[2px] bg-teal-500/60 transition-opacity duration-500 z-0 pointer-events-none ${isScrolled ? 'opacity-0' : 'opacity-100'}`}
          style={{ width: `${scrollProgress}%` }}
        ></div>

        <button
          onClick={onNavHome}
          className="relative z-10 flex items-center transition-all duration-500 group"
        >
          <div className={`flex items-center justify-center bg-teal-600 rounded-xl group-hover:scale-110 transition-all duration-500 overflow-hidden shadow-lg border border-teal-500/20 shrink-0 ${isScrolled ? 'w-9 h-9' : 'w-10 h-10 md:w-12 md:h-12'}`}>
            <img
              src={LOGO_URL}
              alt="Yoga Flow"
              className="w-full h-full object-cover"
            />
          </div>
          <div className={`font-serif font-bold tracking-tight text-slate-900 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] whitespace-nowrap overflow-hidden ${isScrolled
              ? 'max-w-0 opacity-0 translate-x-[-10px] pointer-events-none'
              : 'max-w-[200px] opacity-100 translate-x-0 ml-4 hidden sm:block text-2xl'
            }`}>
            Yoga Flow
          </div>
        </button>

        <div className="relative z-10 hidden md:flex items-center gap-6 lg:gap-8">
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
              className="text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 text-slate-600 hover:text-teal-600 relative group py-2"
            >
              {link.name}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-teal-500 transition-all duration-500 ease-out group-hover:w-full opacity-0 group-hover:opacity-100"></span>
            </a>
          ))}
          <Button
            onClick={() => {
              // Check if user is logged in before navigating to pricing
              if (!isAuthenticated) {
                setShouldNavigateToPricing(true);
                setIsLoginModalOpen(true);
              } else {
                onNavPricing();
              }
            }}
            variant="primary"
            size="sm"
            className={`rounded-full shadow-none hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-500 ${isScrolled ? 'px-5 py-2 text-[9px]' : 'px-7 py-3'}`}
          >
            Start Free Month
          </Button>

          {/* Profile Icon */}
          <div className="relative">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  if (onNavDashboard) {
                    setIsProfileDropdownOpen(false);
                    onNavDashboard('profile');
                  } else {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  }
                } else {
                  setShouldNavigateToDashboard(true);
                  setIsLoginModalOpen(true);
                }
              }}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${isScrolled
                  ? 'w-9 h-9'
                  : 'w-10 h-10'
                } ${isAuthenticated
                  ? 'bg-teal-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              aria-label={isAuthenticated ? 'Profile' : 'Login'}
            >
              {isAuthenticated && user ? (
                <span className="font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={isScrolled ? 16 : 18} />
              )}
            </button>
            {isAuthenticated && (
              <ProfileDropdown
                isOpen={isProfileDropdownOpen}
                onClose={() => setIsProfileDropdownOpen(false)}
                onNavAdmin={onNavAdmin}
                onNavDashboard={onNavDashboard}
              />
            )}
          </div>
        </div>

        <button
          className="md:hidden relative z-10 flex items-center justify-center p-3 rounded-2xl bg-teal-600 text-white shadow-lg active:scale-90 transition-all duration-300 hover:bg-teal-700"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
      </nav>

      <div
        className={`fixed inset-0 bg-white z-[70] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] md:hidden ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
      >
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-teal-50/30 to-white pointer-events-none"></div>
        <div className="flex items-center justify-between px-6 py-8 border-b border-slate-50 relative z-20 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
              <img src={LOGO_URL} alt="Yoga Flow" className="w-full h-full object-cover" />
            </div>
            <div className="text-2xl font-serif font-bold text-slate-900 whitespace-nowrap">
              Yoga Flow
            </div>
          </div>
          <button
            className="p-3 bg-teal-600 rounded-2xl text-white shadow-xl active:scale-90 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative z-10 flex flex-col h-[calc(100%-104px)] overflow-y-auto pt-12 pb-20 px-10">
          <div className="flex flex-col gap-6">
            {navLinks.map((link, idx) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className={`text-4xl font-serif font-bold text-slate-900 hover:text-teal-600 transition-all duration-500 transform tracking-tight flex items-center justify-between group ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'
                  }`}
                style={{ transitionDelay: `${0.1 + idx * 0.05}s` }}
              >
                {link.name}
                <span className="w-10 h-px bg-slate-100 group-hover:bg-teal-500 group-hover:w-16 transition-all duration-500"></span>
              </a>
            ))}
          </div>
          <div className="mt-auto pt-12 space-y-4">
            <Button
              onClick={() => {
                setIsMobileMenuOpen(false);
                // Check if user is logged in before navigating to pricing
                if (!isAuthenticated) {
                  setShouldNavigateToPricing(true);
                  setIsLoginModalOpen(true);
                } else {
                  onNavPricing();
                }
              }}
              variant="primary"
              size="lg"
              className="w-full rounded-3xl shadow-2xl py-6 font-bold tracking-[0.2em] text-sm uppercase"
            >
              Start Free Month
            </Button>

            {/* Mobile Profile Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (isAuthenticated) {
                  if (onNavDashboard) {
                    onNavDashboard('profile');
                  } else {
                    setIsProfileDropdownOpen(true);
                  }
                } else {
                  setShouldNavigateToDashboard(true);
                  setIsLoginModalOpen(true);
                }
              }}
              className={`w-full flex items-center justify-center gap-3 rounded-3xl py-6 font-bold transition-all ${isAuthenticated
                  ? 'bg-teal-600 text-white shadow-2xl hover:bg-teal-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {isAuthenticated && user ? (
                <>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>Profile</span>
                </>
              ) : (
                <>
                  <User size={20} />
                  <span>Login / Sign Up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setShouldNavigateToPricing(false);
          setShouldNavigateToDashboard(false);
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
          setShouldNavigateToDashboard(false);
        }}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
};
