
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSolution } from './components/ProblemSolution';
import { Timeline } from './components/Timeline';
import { WeeklySchedule } from './components/WeeklySchedule';
import { Instructors } from './components/Instructors';
import { FullInstructors } from './components/FullInstructors';
import { Classes } from './components/Classes';
import { CommunityPage } from './components/CommunityPage';
import { Pricing } from './components/Pricing';
import { FutureVision } from './components/FutureVision';
import { Footer } from './components/Footer';
import { About } from './components/About';
import { MeditationMusic } from './components/MeditationMusic';
import { Asanas } from './components/Asanas';
import { Research } from './components/Research';
import { Contact } from './components/Contact';
import { CustomCursor } from './components/CustomCursor';
import { AuthProvider } from './contexts/AuthContext';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsConditions } from './components/TermsConditions';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';

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
      <CustomCursor />
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
              <ProblemSolution />
              <Timeline onNavPricing={handleNavPricing} />
            </div>

            <WeeklySchedule onViewSampleClass={handleViewSampleClass} />

            <Instructors onViewProfile={handleViewProfile} />

            <div className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-serif font-bold mb-6">Explore the Path</h2>
                <p className="text-slate-500 mb-10 max-w-2xl mx-auto">Master the foundational postures and understand the clinical research behind every movement.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button
                    onClick={handleNavAsanas}
                    className="bg-teal-600 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-teal-700 transition-all shadow-xl"
                  >
                    Browse Asana Library
                  </button>
                  <button
                    onClick={handleNavResearch}
                    className="bg-white text-teal-600 border border-teal-200 px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-teal-50 transition-all shadow-xl"
                  >
                    View Scientific Research
                  </button>
                </div>
              </div>
            </div>

            <Contact />
            <FutureVision />
          </>
        )}

        {view === 'instructors' && (
          <FullInstructors onBack={handleNavHome} selectedId={selectedInstructorId} />
        )}

        {view === 'classes' && <Classes initialTab={classesInitialTab} onNavHome={handleNavHome} />}
        {view === 'about' && <About onContactClick={handleContactClick} />}
        {view === 'pricing' && <Pricing />}
        {view === 'community' && <CommunityPage />}
        {view === 'meditation' && <MeditationMusic />}
        {view === 'asanas' && <Asanas onNavPricing={handleNavPricing} />}
        {view === 'research' && <Research />}
        {view === 'privacy' && <PrivacyPolicy onBack={handleNavHome} />}
        {view === 'terms' && <TermsConditions onBack={handleNavHome} />}
        {view === 'admin' && <AdminDashboard onBack={handleNavHome} />}
        {view === 'dashboard' && <UserDashboard onBack={handleNavHome} initialTab={dashboardInitialTab} onNavAdmin={handleNavAdmin} />}
      </main>

      {view !== 'admin' && (
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
