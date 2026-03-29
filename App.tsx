
import React, { useState, useEffect, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AuthProvider } from './contexts/AuthContext';

const lazyNamed = <T extends React.ComponentType<any>>(factory: () => Promise<any>, exportName: string) =>
  React.lazy(async () => {
    const mod = await factory();
    return { default: mod[exportName] as T };
  });

// Lazy-load everything except the above-the-fold essentials.
const CustomCursor = lazyNamed<React.FC>(() => import('./components/CustomCursor'), 'CustomCursor');
const ProblemSolution = lazyNamed<React.FC>(() => import('./components/ProblemSolution'), 'ProblemSolution');
const Timeline = lazyNamed<React.FC<any>>(() => import('./components/Timeline'), 'Timeline');
const WeeklySchedule = lazyNamed<React.FC<any>>(() => import('./components/WeeklySchedule'), 'WeeklySchedule');
const Instructors = lazyNamed<React.FC<any>>(() => import('./components/Instructors'), 'Instructors');
const Contact = lazyNamed<React.FC>(() => import('./components/Contact'), 'Contact');
const FutureVision = lazyNamed<React.FC>(() => import('./components/FutureVision'), 'FutureVision');
const Footer = lazyNamed<React.FC<any>>(() => import('./components/Footer'), 'Footer');

const FullInstructors = lazyNamed<React.FC<any>>(() => import('./components/FullInstructors'), 'FullInstructors');
const Classes = lazyNamed<React.FC<any>>(() => import('./components/Classes'), 'Classes');
const About = lazyNamed<React.FC<any>>(() => import('./components/About'), 'About');
const Pricing = lazyNamed<React.FC<any>>(() => import('./components/Pricing'), 'Pricing');
const CommunityPage = lazyNamed<React.FC>(() => import('./components/CommunityPage'), 'CommunityPage');
const MeditationMusic = lazyNamed<React.FC>(() => import('./components/MeditationMusic'), 'MeditationMusic');
const Asanas = lazyNamed<React.FC<any>>(() => import('./components/Asanas'), 'Asanas');
const Research = lazyNamed<React.FC>(() => import('./components/Research'), 'Research');
const PrivacyPolicy = lazyNamed<React.FC<any>>(() => import('./components/PrivacyPolicy'), 'PrivacyPolicy');
const TermsConditions = lazyNamed<React.FC<any>>(() => import('./components/TermsConditions'), 'TermsConditions');
const AdminDashboard = lazyNamed<React.FC<any>>(() => import('./components/AdminDashboard'), 'AdminDashboard');
const UserDashboard = lazyNamed<React.FC<any>>(() => import('./components/UserDashboard'), 'UserDashboard');

const AppContent: React.FC = () => {
  // Initialize view based on current path
  const getInitialView = (): 'home' | 'instructors' | 'classes' | 'about' | 'pricing' | 'community' | 'meditation' | 'asanas' | 'research' | 'privacy' | 'terms' | 'admin' | 'dashboard' => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/admin/') {
        console.log('🚀 Initializing with admin view');
        return 'admin';
      }
    }
    return 'home';
  };

  const [view, setView] = useState<'home' | 'instructors' | 'classes' | 'about' | 'pricing' | 'community' | 'meditation' | 'asanas' | 'research' | 'privacy' | 'terms' | 'admin' | 'dashboard'>(getInitialView());
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [classesInitialTab, setClassesInitialTab] = useState<'live' | 'recorded'>('live');
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'profile' | 'asanas' | 'classes' | 'subscription'>('profile');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const handleViewProfile = (id: string) => {
    setSelectedInstructorId(id);
    setView('instructors');
  };

  const handleNavInstructors = () => {
    setSelectedInstructorId(null);
    setView('instructors');
  };

  const handleNavClasses = () => {
    setClassesInitialTab('live');
    setView('classes');
  };

  const handleViewSampleClass = () => {
    setClassesInitialTab('recorded');
    setView('classes');
    window.scrollTo(0, 0);
  };

  const handleNavAbout = () => {
    setView('about');
  };

  const handleNavPricing = () => {
    setView('pricing');
    // Scroll to top when navigating to pricing
    window.scrollTo(0, 0);
  };

  const handleNavCommunity = () => {
    setView('community');
  };

  const handleNavMeditation = () => {
    setView('meditation');
  };

  const handleNavAsanas = () => {
    setView('asanas');
  };

  const handleNavResearch = () => {
    setView('research');
  };

  const handleNavHome = () => {
    setView('home');
  };

  const handleNavPrivacy = () => {
    setView('privacy');
    window.scrollTo(0, 0);
  };

  const handleNavTerms = () => {
    setView('terms');
    window.scrollTo(0, 0);
  };

  const handleNavAdmin = () => {
    setView('admin');
    window.scrollTo(0, 0);
  };

  const handleNavDashboard = (tab?: 'profile' | 'asanas' | 'classes' | 'subscription') => {
    if (tab) setDashboardInitialTab(tab);
    setView('dashboard');
    window.scrollTo(0, 0);
  };

  const handleContactClick = () => {
    setView('home');
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Simple path-based routing for /admin (no hash)
  useEffect(() => {
    const syncViewFromPath = () => {
      const path = window.location.pathname;
      console.log('🔄 Syncing view from path:', path);
      if (path === '/admin' || path === '/admin/') {
        console.log('✅ Setting view to admin');
        setView('admin');
      } else if (path === '/' || path === '') {
        console.log('✅ Setting view to home');
        setView('home');
      } else {
        // For other paths, default to home
        console.log('⚠️ Unknown path, defaulting to home');
        setView('home');
      }
    };

    // Initial sync - run immediately
    syncViewFromPath();

    // Also check on mount with a small delay to catch any race conditions
    const timeoutId = setTimeout(syncViewFromPath, 100);

    // Back/forward buttons
    window.addEventListener('popstate', syncViewFromPath);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', syncViewFromPath);
    };
  }, []);

  // Update URL when view changes
  useEffect(() => {
    console.log('📝 View changed to:', view);
    if (view === 'admin') {
      if (window.location.pathname !== '/admin') {
        console.log('🔗 Updating URL to /admin');
        window.history.pushState({}, '', '/admin');
      }
    } else if (view === 'home' && (window.location.pathname === '/admin' || window.location.pathname === '/admin/')) {
      console.log('🔗 Updating URL to /');
      window.history.pushState({}, '', '/');
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900 antialiased">
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      {view !== 'admin' && (
        <Navbar
          onNavHome={handleNavHome}
          onNavInstructors={handleNavInstructors}
          onNavClasses={handleNavClasses}
          onNavAbout={handleNavAbout}
          onNavPricing={handleNavPricing}
          onNavCommunity={handleNavCommunity}
          onNavMeditation={handleNavMeditation}
          onNavAsanas={handleNavAsanas}
          onNavResearch={handleNavResearch}
          onNavAdmin={handleNavAdmin}
          onNavDashboard={handleNavDashboard}
          isHomePage={view === 'home'}
        />
      )}

      <main>
        {view === 'home' && (
          <>
            <Hero onNavPricing={handleNavPricing} />

            <div id="journey">
              <Suspense fallback={null}>
                <ProblemSolution />
              </Suspense>
              <Suspense fallback={null}>
                <Timeline onNavPricing={handleNavPricing} />
              </Suspense>
            </div>

            <Suspense fallback={null}>
              <WeeklySchedule onViewSampleClass={handleViewSampleClass} />
            </Suspense>

            <Suspense fallback={null}>
              <Instructors onViewProfile={handleViewProfile} />
            </Suspense>

            <div className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-serif font-bold mb-3">Explore Everything</h2>
                <p className="text-slate-500 mb-12 max-w-2xl mx-auto">Connect with your tribe, deepen your practice, and understand the science behind every movement.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  <button
                    onClick={handleNavCommunity}
                    className="bg-teal-600 text-white px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-teal-700 transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    Community Portal
                  </button>
                  <button
                    onClick={handleNavMeditation}
                    className="bg-white text-teal-600 border border-teal-200 px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-teal-50 transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    Meditation Music
                  </button>
                  <button
                    onClick={handleNavAsanas}
                    className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    Asana Library
                  </button>
                  <button
                    onClick={handleNavResearch}
                    className="bg-white text-slate-700 border border-slate-200 px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    Research & Science
                  </button>
                </div>
              </div>
            </div>


            <Suspense fallback={null}>
              <Contact />
            </Suspense>
            <Suspense fallback={null}>
              <FutureVision />
            </Suspense>
          </>
        )}

        {view === 'instructors' && (
          <Suspense fallback={null}>
            <FullInstructors onBack={handleNavHome} selectedId={selectedInstructorId} />
          </Suspense>
        )}

        {view === 'classes' && (
          <Suspense fallback={null}>
            <Classes initialTab={classesInitialTab} onNavHome={handleNavHome} />
          </Suspense>
        )}
        {view === 'about' && (
          <Suspense fallback={null}>
            <About onContactClick={handleContactClick} />
          </Suspense>
        )}
        {view === 'pricing' && (
          <Suspense fallback={null}>
            <Pricing />
          </Suspense>
        )}
        {view === 'community' && (
          <Suspense fallback={null}>
            <CommunityPage />
          </Suspense>
        )}
        {view === 'meditation' && (
          <Suspense fallback={null}>
            <MeditationMusic />
          </Suspense>
        )}
        {view === 'asanas' && (
          <Suspense fallback={null}>
            <Asanas onNavPricing={handleNavPricing} />
          </Suspense>
        )}
        {view === 'research' && (
          <Suspense fallback={null}>
            <Research />
          </Suspense>
        )}
        {view === 'privacy' && (
          <Suspense fallback={null}>
            <PrivacyPolicy onBack={handleNavHome} />
          </Suspense>
        )}
        {view === 'terms' && (
          <Suspense fallback={null}>
            <TermsConditions onBack={handleNavHome} />
          </Suspense>
        )}
        {view === 'admin' && (
          <Suspense fallback={null}>
            <AdminDashboard onBack={handleNavHome} />
          </Suspense>
        )}
        {view === 'dashboard' && (
          <Suspense fallback={null}>
            <UserDashboard onBack={handleNavHome} initialTab={dashboardInitialTab} onNavAdmin={handleNavAdmin} />
          </Suspense>
        )}
      </main>

      {view !== 'admin' && (
        <Suspense fallback={null}>
          <Footer
            onNavHome={handleNavHome}
            onNavInstructors={handleNavInstructors}
            onNavClasses={handleNavClasses}
            onNavAbout={handleNavAbout}
            onNavPricing={handleNavPricing}
            onNavCommunity={handleNavCommunity}
            onNavPrivacy={handleNavPrivacy}
            onNavTerms={handleNavTerms}
            isHomePage={view === 'home'}
          />
        </Suspense>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
