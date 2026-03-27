import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Layout, Activity, BookOpen, UsersRound, DollarSign, 
  MessageSquare, Music, FileText, Search, Filter, Download,
  ArrowLeft, Shield, Calendar, Mail, User as UserIcon, LogOut, User as LucideUser, Brain, Battery, Heart, Trees, Moon,
  TrendingUp, Eye, Edit, Trash2, CheckCircle2, XCircle, Upload, Video, ToggleLeft, ToggleRight, Plus,
  Sparkles, Target, ChevronRight, X, ShieldCheck, Microscope, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';

import { DEFAULT_COMMUNITY_SETTINGS, getSettings, updateSettings } from '../utils/settings';
import type { CommunityChatMessage, CommunityConversation, CommunitySettings } from '../utils/settings';
import { LIVE_CLASSES, RECORDED_CLASSES, ASANAS, INSTRUCTORS, RESEARCH_TOPICS, PRICING_TIERS_INR, PRICING_TIERS_USD, PROBLEMS, SOLUTIONS, TIMELINE_STEPS } from '../constants';
import { initializeAllCollections, initializeAsanas, initializeResearch, initializeClasses } from '../utils/initializeCollections';
import { Asana, Instructor, PricingTier, ResearchTopic, YogaClass, type JourneyIconName, type JourneyListItemSettings, type JourneySettings, type JourneyTimelineStepSettings } from '../types';
import { LoginModal, SignupModal } from './LoginModal';
import { ProblemSolution } from './ProblemSolution';
import { Timeline } from './Timeline';
import { Asanas } from './Asanas';
import { Classes } from './Classes';
import { Instructors } from './Instructors';
import { CommunityPage } from './CommunityPage';
import { Pricing } from './Pricing';
import { MeditationMusic } from './MeditationMusic';
import { Research } from './Research';
import { Contact } from './Contact';

interface AdminDashboardProps {
  onBack: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  joinDate?: string;
  plan?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
  source: 'firebase' | 'localStorage';
  lastLogin?: string;
  classesAttended?: number;
  hoursPracticed?: number;
  streak?: number;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  inquiryType: string;
  message: string;
  timestamp: any;
  createdAt?: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: any;
  source?: string;
}

type TabType = 'overview' | 'users' | 'journey' | 'asanas' | 'classes' | 'classes-manage' | 'instructors' | 'instructors-manage' | 'community' | 'pricing' | 'meditation' | 'research' | 'contact' | 'newsletter';

type ManagedYogaClass = YogaClass & { category: 'live' | 'recorded' };

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { user, logout, isAuthenticated, isAdmin, isAdminChecking } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'firebase' | 'localStorage'>('all');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  
  // Classes management state
  const [classesComingSoon, setClassesComingSoon] = useState(true);
  const [classesWithVideos, setClassesWithVideos] = useState<Record<string, string>>({}); // classId -> videoUrl
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [classes, setClasses] = useState<ManagedYogaClass[]>([]);
  const [editingClass, setEditingClass] = useState<ManagedYogaClass | null>(null);
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  
  // Asanas management state
  const [asanas, setAsanas] = useState<Asana[]>([]);
  const [editingAsana, setEditingAsana] = useState<Asana | null>(null);
  const [isAsanaFormOpen, setIsAsanaFormOpen] = useState(false);
  
  // Instructors management state
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [isInstructorFormOpen, setIsInstructorFormOpen] = useState(false);
  
  // Research management state
  const [researchTopics, setResearchTopics] = useState<ResearchTopic[]>([]);
  const [editingResearch, setEditingResearch] = useState<ResearchTopic | null>(null);
  const [isResearchFormOpen, setIsResearchFormOpen] = useState(false);

  // Pricing management state
  const [pricingTiersINR, setPricingTiersINR] = useState<PricingTier[]>(PRICING_TIERS_INR);
  const [pricingTiersUSD, setPricingTiersUSD] = useState<PricingTier[]>(PRICING_TIERS_USD);
  const [activePricingCurrency, setActivePricingCurrency] = useState<'inr' | 'usd'>('inr');
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Community management state
  const [communitySettings, setCommunitySettings] = useState<CommunitySettings>(DEFAULT_COMMUNITY_SETTINGS);
  const [activeCommunityConversationId, setActiveCommunityConversationId] = useState<string>(
    DEFAULT_COMMUNITY_SETTINGS.conversations[0]?.id || ''
  );
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  const [isCommunityGroupModalOpen, setIsCommunityGroupModalOpen] = useState(false);
  const [communityGroupName, setCommunityGroupName] = useState('');
  const [communityGroupMemberSearch, setCommunityGroupMemberSearch] = useState('');
  const [communityGroupSelectedUserIds, setCommunityGroupSelectedUserIds] = useState<string[]>([]);
  const [editingCommunityConversationId, setEditingCommunityConversationId] = useState<string | null>(null);
  const [journeySettings, setJourneySettings] = useState<JourneySettings | null>(null);
  const [isSavingJourney, setIsSavingJourney] = useState(false);
  const [isJourneyStepModalOpen, setIsJourneyStepModalOpen] = useState(false);
  const [editingJourneyStepIndex, setEditingJourneyStepIndex] = useState<number | null>(null);
  const [editingUserStats, setEditingUserStats] = useState<UserData | null>(null);
  const [isUserStatsModalOpen, setIsUserStatsModalOpen] = useState(false);

  const sanitizeForFirestore = (value: any): any => {
    if (Array.isArray(value)) {
      return value
        .filter((v) => v !== undefined)
        .map((v) => sanitizeForFirestore(v));
    }
    if (value && typeof value === 'object') {
      const result: any = {};
      Object.entries(value).forEach(([k, v]) => {
        if (v === undefined) return;
        const sv = sanitizeForFirestore(v);
        if (sv !== undefined) result[k] = sv;
      });
      return result;
    }
    return value;
  };

  const iconNameByComponent = useMemo(
    () =>
      new Map<any, JourneyIconName>([
        [Moon, 'Moon'],
        [Brain, 'Brain'],
        [Activity, 'Activity'],
        [LucideUser, 'User'],
        [Battery, 'Battery'],
        [ShieldCheck, 'ShieldCheck'],
        [Heart, 'Heart'],
        [Trees, 'Trees'],
      ]),
    []
  );

  const getJourneyIconName = (icon: any): JourneyIconName => {
    return iconNameByComponent.get(icon) || 'Moon';
  };

  const getDefaultJourneySettings = (): JourneySettings => {
    const problems: JourneyListItemSettings[] = (PROBLEMS as any[]).map((p) => ({
      text: String(p?.text || ''),
      iconName: getJourneyIconName(p?.icon),
    }));

    const solutions: JourneyListItemSettings[] = (SOLUTIONS as any[]).map((s) => ({
      text: String(s?.text || ''),
      iconName: getJourneyIconName(s?.icon),
    }));

    const steps: JourneyTimelineStepSettings[] = (TIMELINE_STEPS as any[]).map((st) => ({
      month: String(st?.month || ''),
      title: String(st?.title || ''),
      outcomes: Array.isArray(st?.outcomes) ? st.outcomes.map((o: any) => String(o || '')).filter((o: string) => o.trim().length > 0) : [],
      iconName: getJourneyIconName(st?.icon),
      testimonial: {
        text: String(st?.testimonial?.text || ''),
        author: String(st?.testimonial?.author || ''),
      },
      metrics: Array.isArray(st?.metrics)
        ? st.metrics
            .map((m: any) => ({ label: String(m?.label || ''), value: String(m?.value || '') }))
            .filter((m: any) => m.label.trim().length > 0 || m.value.trim().length > 0)
        : [],
    }));

    return {
      problemSolutionTitle: 'Modern Life is Loud. We Offer Silence.',
      problemSolutionSubtitle: 'Bridging the gap between Himalayan tradition and urban performance.',
      problemsHeading: 'The Modern Struggle',
      solutionsHeading: 'The Rishikesh Solution',
      problems,
      solutions,
      timelineTitle: 'The Path to Transformation',
      timelineSubtitle: '6 months. 3 distinct phases. A lifetime of measurable change.',
      ctaTitle: 'Ready to start Month 1?',
      ctaSubtitle: 'Focus: Restoring your nervous system and sleep architecture.',
      steps,
    };
  };

  useEffect(() => {
    if (!isAuthenticated || isAdminChecking || !isAdmin) {
      setIsLoading(false);
      return;
    }
    loadData();
  }, [isAuthenticated, isAdmin, isAdminChecking]);

  const loadData = async () => {

    setIsLoading(true);
    try {
      console.log('📊 Loading admin data...');
      // Load users from SQL database via API
      try {
        console.log('👥 Loading users from SQL database...');
        // Dynamically import apiClient to avoid circular dependency
        const { apiClient } = await import('../utils/apiClient');
        const sqlUsers = await apiClient.get('user');
        const users: UserData[] = sqlUsers.map((u: any) => ({
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email || '',
          joinDate: u.createdAt || new Date().toISOString(),
          plan: u.Subscription?.planId || null,
          role: typeof u.role === 'string' ? u.role : undefined,
          isAdmin: u.role === 'admin' || u.role === 'ADMIN',
          roles: u.roles || undefined,
          lastLogin: u.updatedAt || null,
          classesAttended: u.classesAttended || 0,
          hoursPracticed: u.hoursPracticed || 0,
          streak: u.streak || 0,
          source: 'sql' as const,
        }));
        setUsers(users);
        console.log(`✅ Loaded ${users.length} users from SQL database`);
      } catch (error: any) {
        console.error('❌ Error loading users from SQL database:', error);
        setUsers([]);
      }

      // Load contact form submissions
      try {
        console.log('📧 Loading contact form submissions...');
        // Try with orderBy first, fallback to simple query if timestamp doesn't exist
        let contactSnapshot;
        try {
          const contactQuery = query(
            collection(db, 'contact_form'),
            orderBy('createdAt', 'desc'),
            limit(100)
          );
          contactSnapshot = await getDocs(contactQuery);
        } catch (orderByError: any) {
          // If orderBy fails (no index or field missing), just get all docs
          console.warn('⚠️ orderBy failed, using simple query:', orderByError);
          contactSnapshot = await getDocs(collection(db, 'contact_form'));
        }
        
        const contacts: ContactSubmission[] = contactSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            inquiryType: data.inquiryType || 'General Inquiry',
            message: data.message || '',
            timestamp: data.timestamp,
            createdAt: data.createdAt || data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });
        // Sort by createdAt if orderBy didn't work
        contacts.sort((a, b) => {
          const dateA = new Date(a.createdAt || '').getTime();
          const dateB = new Date(b.createdAt || '').getTime();
          return dateB - dateA;
        });
        console.log(`✅ Loaded ${contacts.length} contact submissions`);
        setContactSubmissions(contacts);
      } catch (error: any) {
        console.error('❌ Error loading contact submissions:', error);
        console.error('Error code:', error.code);
        setContactSubmissions([]);
      }

      // Load newsletter subscribers
      try {
        console.log('📬 Loading newsletter subscribers...');
        let newsletterSnapshot;
        try {
          const newsletterQuery = query(
            collection(db, 'newsletter_subscribers'),
            orderBy('subscribedAt', 'desc'),
            limit(100)
          );
          newsletterSnapshot = await getDocs(newsletterQuery);
        } catch (orderByError: any) {
          console.warn('⚠️ orderBy failed, using simple query:', orderByError);
          newsletterSnapshot = await getDocs(collection(db, 'newsletter_subscribers'));
        }
        
        const subscribers: NewsletterSubscriber[] = newsletterSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || '',
            subscribedAt: data.subscribedAt,
            source: data.source || 'unknown',
          };
        });
        // Sort by subscribedAt if orderBy didn't work
        subscribers.sort((a, b) => {
          const dateA = a.subscribedAt?.toDate?.()?.getTime() || 0;
          const dateB = b.subscribedAt?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        });
        console.log(`✅ Loaded ${subscribers.length} newsletter subscribers`);
        setNewsletterSubscribers(subscribers);
      } catch (error: any) {
        console.error('❌ Error loading newsletter subscribers:', error);
        console.error('Error code:', error.code);
        setNewsletterSubscribers([]);
      }
      
      // Load app settings
      try {
        console.log('⚙️ Loading app settings...');
        const settings = await getSettings();
        setClassesComingSoon(settings.classesComingSoon);
        setPricingTiersINR((settings.pricingTiersINR && settings.pricingTiersINR.length > 0) ? settings.pricingTiersINR : PRICING_TIERS_INR);
        setPricingTiersUSD((settings.pricingTiersUSD && settings.pricingTiersUSD.length > 0) ? settings.pricingTiersUSD : PRICING_TIERS_USD);
        const nextCommunity: CommunitySettings = {
          ...DEFAULT_COMMUNITY_SETTINGS,
          ...(settings.community || {}),
          conversations:
            settings.community?.conversations && Array.isArray(settings.community.conversations) && settings.community.conversations.length > 0
              ? (settings.community.conversations as CommunityConversation[])
              : DEFAULT_COMMUNITY_SETTINGS.conversations,
          histories:
            settings.community?.histories && typeof settings.community.histories === 'object'
              ? (settings.community.histories as Record<string, CommunityChatMessage[]>)
              : DEFAULT_COMMUNITY_SETTINGS.histories,
        };
        setCommunitySettings(nextCommunity);
        setActiveCommunityConversationId((prev) => {
          const exists = nextCommunity.conversations.some((c) => c.id === prev);
          return exists ? prev : (nextCommunity.conversations[0]?.id || '');
        });
        const fallbackJourney = getDefaultJourneySettings();
        const loadedJourney = (settings as any).journey as JourneySettings | undefined;
        const nextJourney: JourneySettings = {
          ...fallbackJourney,
          ...(loadedJourney || {}),
          problems:
            loadedJourney?.problems && Array.isArray(loadedJourney.problems) && loadedJourney.problems.length > 0
              ? (loadedJourney.problems as JourneyListItemSettings[])
              : fallbackJourney.problems,
          solutions:
            loadedJourney?.solutions && Array.isArray(loadedJourney.solutions) && loadedJourney.solutions.length > 0
              ? (loadedJourney.solutions as JourneyListItemSettings[])
              : fallbackJourney.solutions,
          steps:
            loadedJourney?.steps && Array.isArray(loadedJourney.steps) && loadedJourney.steps.length > 0
              ? (loadedJourney.steps as JourneyTimelineStepSettings[])
              : fallbackJourney.steps,
        };
        setJourneySettings(nextJourney);
        console.log('✅ Settings loaded:', settings);
      } catch (error: any) {
        console.error('❌ Error loading settings:', error);
        setJourneySettings(getDefaultJourneySettings());
      }

      // Load class videos from Firestore
      try {
        console.log('🎥 Loading class videos...');
        const videosSnapshot = await getDocs(collection(db, 'class_videos'));
        const videosMap: Record<string, string> = {};
        videosSnapshot.docs.forEach(doc => {
          const data = doc.data();
          videosMap[data.classId] = data.videoUrl;
        });
        setClassesWithVideos(videosMap);
        console.log(`✅ Loaded ${Object.keys(videosMap).length} class videos`);
      } catch (error: any) {
        console.error('❌ Error loading class videos:', error);
      }

      // Load asanas from Firestore
      try {
        console.log('🧘 Loading asanas...');
        const asanasSnapshot = await getDocs(collection(db, 'asanas'));
        if (asanasSnapshot.empty) {
          // Initialize with default asanas if empty
          const defaultAsanas = ASANAS;
          for (const asana of defaultAsanas) {
            await setDoc(doc(db, 'asanas', asana.id), asana);
          }
          setAsanas(defaultAsanas);
          console.log('✅ Initialized asanas with defaults');
        } else {
          const loadedAsanas: Asana[] = asanasSnapshot.docs
            .map(doc => doc.data() as Asana)
            .filter(asana => !asana.deleted); // Filter out deleted asanas
          setAsanas(loadedAsanas);
          console.log(`✅ Loaded ${loadedAsanas.length} asanas`);
        }
      } catch (error: any) {
        console.error('❌ Error loading asanas:', error);
        // Fallback to constants
        setAsanas(ASANAS);
      }

      // Load instructors from Firestore
      try {
        console.log('👨‍🏫 Loading instructors...');
        const instructorsSnapshot = await getDocs(collection(db, 'instructors'));
        if (instructorsSnapshot.empty) {
          // Initialize with default instructors if empty
          const defaultInstructors = INSTRUCTORS;
          for (const instructor of defaultInstructors) {
            await setDoc(doc(db, 'instructors', instructor.id), instructor);
          }
          setInstructors(defaultInstructors);
          console.log('✅ Initialized instructors with defaults');
        } else {
          const loadedInstructors: Instructor[] = instructorsSnapshot.docs
            .map(doc => doc.data() as Instructor)
            .filter(instructor => !instructor.deleted); // Filter out deleted instructors
          setInstructors(loadedInstructors);
          console.log(`✅ Loaded ${loadedInstructors.length} instructors`);
        }
      } catch (error: any) {
        console.error('❌ Error loading instructors:', error);
        // Fallback to constants
        setInstructors(INSTRUCTORS);
      }

      // Load research topics from Firestore
      try {
        console.log('🔬 Loading research topics...');
        const researchSnapshot = await getDocs(collection(db, 'research'));
        if (researchSnapshot.empty) {
          // Initialize with default research topics if empty
          const defaultResearch = RESEARCH_TOPICS;
          for (const topic of defaultResearch) {
            await setDoc(doc(db, 'research', topic.id), topic);
          }
          setResearchTopics(defaultResearch);
          console.log('✅ Initialized research topics with defaults');
        } else {
          const loadedResearch: ResearchTopic[] = researchSnapshot.docs
            .map(doc => doc.data() as ResearchTopic);
          setResearchTopics(loadedResearch);
          console.log(`✅ Loaded ${loadedResearch.length} research topics`);
        }
      } catch (error: any) {
        console.error('❌ Error loading research topics:', error);
        // Fallback to constants
        setResearchTopics(RESEARCH_TOPICS);
      }

      // Load classes from Firestore
      try {
        console.log('📅 Loading classes...');
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        if (classesSnapshot.empty) {
          // Initialize with default classes if empty
          const defaultLiveClasses = LIVE_CLASSES.map(cls => ({ ...cls, category: 'live' as const }));
          const defaultRecordedClasses = RECORDED_CLASSES.map(cls => ({ ...cls, category: 'recorded' as const }));
          const allDefaultClasses = [...defaultLiveClasses, ...defaultRecordedClasses];
          for (const cls of allDefaultClasses) {
            await setDoc(doc(db, 'classes', cls.id), cls);
          }
          setClasses(allDefaultClasses);
          console.log('✅ Initialized classes with defaults');
        } else {
          const loadedClasses: (YogaClass & { category: 'live' | 'recorded' })[] = classesSnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                ...data,
                category: data.category || (data.time ? 'live' : 'recorded'),
              } as YogaClass & { category: 'live' | 'recorded' };
            })
            .filter(cls => !cls.deleted);
          setClasses(loadedClasses);
          console.log(`✅ Loaded ${loadedClasses.length} classes`);
        }
      } catch (error: any) {
        console.error('❌ Error loading classes:', error);
        // Fallback to constants
        const fallbackLive = LIVE_CLASSES.map(cls => ({ ...cls, category: 'live' as const }));
        const fallbackRecorded = RECORDED_CLASSES.map(cls => ({ ...cls, category: 'recorded' as const }));
        setClasses([...fallbackLive, ...fallbackRecorded]);
      }
      
      console.log('✅ Admin data loading complete');
    } catch (error: any) {
      console.error('❌ Error loading admin data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = userFilter === 'all' || u.source === userFilter;
    return matchesSearch && matchesFilter;
  });

  const isUserAdmin = (u: UserData) => {
    return u.role === 'admin' || u.isAdmin === true || (Array.isArray(u.roles) && u.roles.includes('admin'));
  };

  const setUserAdmin = async (target: UserData, makeAdmin: boolean) => {
    if (target.source !== 'firebase') {
      alert('This user is from localStorage and cannot be updated in Firestore.');
      return;
    }

    const label = makeAdmin ? 'make this user an admin' : 'remove admin access from this user';
    if (!confirm(`Are you sure you want to ${label}?`)) return;

    try {
      const userRef = doc(db, 'users', target.id);
      await setDoc(
        userRef,
        {
          role: makeAdmin ? 'admin' : 'user',
          isAdmin: makeAdmin,
          roles: makeAdmin ? ['admin'] : [],
        },
        { merge: true }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? { ...u, role: makeAdmin ? 'admin' : 'user', isAdmin: makeAdmin, roles: makeAdmin ? ['admin'] : [] }
            : u
        )
      );
    } catch (error: any) {
      console.error('❌ Error updating admin role:', error);
      alert(`Failed to update admin role: ${error?.message || 'Please try again.'}`);
    }
  };

  const updateUserStats = async (userId: string, stats: { classesAttended: number; hoursPracticed: number; streak: number }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...stats,
        statsUpdatedAt: serverTimestamp(),
      }, { merge: true });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, ...stats }
            : u
        )
      );
      alert('User stats updated successfully!');
    } catch (error: any) {
      console.error('❌ Error updating user stats:', error);
      alert(`Failed to update user stats: ${error?.message || 'Please try again.'}`);
    }
  };

  const filteredContacts = contactSubmissions.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubscribers = newsletterSubscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Layout },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'classes-manage' as TabType, label: 'Classes Management', icon: Video },
    { id: 'instructors-manage' as TabType, label: 'Instructors Management', icon: UsersRound },
    { id: 'journey' as TabType, label: 'Journey', icon: Activity },
    { id: 'asanas' as TabType, label: 'Asanas', icon: BookOpen },
    { id: 'classes' as TabType, label: 'Classes', icon: Calendar },
    { id: 'instructors' as TabType, label: 'Instructors', icon: UsersRound },
    { id: 'community' as TabType, label: 'Community', icon: MessageSquare },
    { id: 'pricing' as TabType, label: 'Pricing', icon: DollarSign },
    { id: 'meditation' as TabType, label: 'Meditation', icon: Music },
    { id: 'research' as TabType, label: 'Research', icon: FileText },
    { id: 'contact' as TabType, label: 'Contact', icon: Mail },
    { id: 'newsletter' as TabType, label: 'Newsletter', icon: TrendingUp },
  ];

  // Toggle "coming soon" overlay
  const handleToggleComingSoon = async () => {
    const newValue = !classesComingSoon;
    setClassesComingSoon(newValue);
    try {
      await updateSettings({ classesComingSoon: newValue });
      console.log('✅ Coming soon toggle updated:', newValue);
    } catch (error) {
      console.error('❌ Error updating coming soon toggle:', error);
      // Revert on error
      setClassesComingSoon(!newValue);
    }
  };

  const getActivePricingTiers = () => {
    return activePricingCurrency === 'inr' ? pricingTiersINR : pricingTiersUSD;
  };

  const setActivePricingTiers = (next: PricingTier[] | ((prev: PricingTier[]) => PricingTier[])) => {
    if (activePricingCurrency === 'inr') {
      setPricingTiersINR(next as any);
      return;
    }
    setPricingTiersUSD(next as any);
  };

  const updatePricingTier = (index: number, updates: Partial<PricingTier>) => {
    setActivePricingTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addPricingTier = () => {
    setActivePricingTiers((prev) => [
      ...prev,
      {
        name: '',
        price: activePricingCurrency === 'inr' ? '₹' : '$',
        frequency: '/month',
        features: [''],
        isRecommended: false,
        buttonText: 'Get Started',
      },
    ]);
  };

  const removePricingTier = (index: number) => {
    setActivePricingTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTierFeature = (tierIndex: number, featureIndex: number, value: string) => {
    setActivePricingTiers((prev) => {
      const next = [...prev];
      const tier = next[tierIndex];
      const features = [...(tier.features || [])];
      features[featureIndex] = value;
      next[tierIndex] = { ...tier, features };
      return next;
    });
  };

  const addTierFeature = (tierIndex: number) => {
    setActivePricingTiers((prev) => {
      const next = [...prev];
      const tier = next[tierIndex];
      next[tierIndex] = { ...tier, features: [...(tier.features || []), ''] };
      return next;
    });
  };

  const removeTierFeature = (tierIndex: number, featureIndex: number) => {
    setActivePricingTiers((prev) => {
      const next = [...prev];
      const tier = next[tierIndex];
      const features = (tier.features || []).filter((_, i) => i !== featureIndex);
      next[tierIndex] = { ...tier, features: features.length > 0 ? features : [''] };
      return next;
    });
  };

  const handleSavePricing = async () => {
    try {
      setIsSavingPricing(true);

      const cleanTiers = (tiers: PricingTier[]) => {
        return tiers
          .map((t) => ({
            ...t,
            name: (t.name || '').trim(),
            price: (t.price || '').trim(),
            frequency: (t.frequency || '').trim(),
            buttonText: (t.buttonText || '').trim(),
            features: (t.features || []).map(f => (f || '').trim()).filter(f => f !== ''),
          }))
          .filter((t) => t.name !== '' && t.price !== '' && t.frequency !== '' && t.features.length > 0);
      };

      const nextINR = cleanTiers(pricingTiersINR);
      const nextUSD = cleanTiers(pricingTiersUSD);

      if (nextINR.length === 0 || nextUSD.length === 0) {
        alert('Please make sure both INR and USD pricing have at least one complete tier.');
        return;
      }

      await updateSettings({
        pricingTiersINR: sanitizeForFirestore(nextINR),
        pricingTiersUSD: sanitizeForFirestore(nextUSD),
      });

      setPricingTiersINR(nextINR);
      setPricingTiersUSD(nextUSD);
      alert('Pricing saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving pricing:', error);
      alert(`Failed to save pricing: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSavingPricing(false);
    }
  };

  const journeyIconOptions: JourneyIconName[] = [
    'Moon',
    'Brain',
    'Activity',
    'User',
    'Battery',
    'ShieldCheck',
    'Heart',
    'Trees',
  ];

  const updateJourneySettings = (updates: Partial<JourneySettings>) => {
    setJourneySettings((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const updateJourneyListItem = (
    list: 'problems' | 'solutions',
    index: number,
    updates: Partial<JourneyListItemSettings>
  ) => {
    setJourneySettings((prev) => {
      if (!prev) return prev;
      const nextList = [...(prev[list] || [])];
      const current = nextList[index];
      if (!current) return prev;
      nextList[index] = { ...current, ...updates };
      return { ...prev, [list]: nextList };
    });
  };

  const addJourneyListItem = (list: 'problems' | 'solutions') => {
    setJourneySettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [list]: [...(prev[list] || []), { text: '', iconName: 'Moon' }],
      };
    });
  };

  const removeJourneyListItem = (list: 'problems' | 'solutions', index: number) => {
    setJourneySettings((prev) => {
      if (!prev) return prev;
      const nextList = (prev[list] || []).filter((_, i) => i !== index);
      return { ...prev, [list]: nextList.length > 0 ? nextList : [{ text: '', iconName: 'Moon' }] };
    });
  };

  const getDefaultJourneyStep = (): JourneyTimelineStepSettings => ({
    month: '',
    title: '',
    outcomes: [''],
    iconName: 'Moon',
    testimonial: { text: '', author: '' },
    metrics: [{ label: '', value: '' }],
  });

  const openJourneyStepModal = (index: number | null) => {
    setEditingJourneyStepIndex(index);
    setIsJourneyStepModalOpen(true);
  };

  const deleteJourneyStep = (index: number) => {
    setJourneySettings((prev) => {
      if (!prev) return prev;
      const nextSteps = (prev.steps || []).filter((_, i) => i !== index);
      return { ...prev, steps: nextSteps.length > 0 ? nextSteps : [getDefaultJourneyStep()] };
    });
  };

  const upsertJourneyStep = (step: JourneyTimelineStepSettings) => {
    setJourneySettings((prev) => {
      if (!prev) return prev;
      const nextSteps = [...(prev.steps || [])];
      if (editingJourneyStepIndex === null || editingJourneyStepIndex === undefined) {
        nextSteps.push(step);
      } else if (nextSteps[editingJourneyStepIndex]) {
        nextSteps[editingJourneyStepIndex] = step;
      } else {
        nextSteps.push(step);
      }
      return { ...prev, steps: nextSteps };
    });
    setIsJourneyStepModalOpen(false);
    setEditingJourneyStepIndex(null);
  };

  const handleSaveJourney = async () => {
    if (!journeySettings) return;
    try {
      setIsSavingJourney(true);

      const cleanText = (v: any) => (typeof v === 'string' ? v.trim() : '');

      const cleanList = (items: JourneyListItemSettings[]) => {
        return (items || [])
          .map((i) => ({
            text: cleanText(i.text),
            iconName: (journeyIconOptions.includes(i.iconName) ? i.iconName : 'Moon') as JourneyIconName,
          }))
          .filter((i) => i.text.length > 0);
      };

      const cleanStep = (s: JourneyTimelineStepSettings): JourneyTimelineStepSettings => {
        const outcomes = Array.isArray(s.outcomes) ? s.outcomes.map((o) => cleanText(o)).filter((o) => o.length > 0) : [];
        const metrics = Array.isArray(s.metrics)
          ? s.metrics
              .map((m) => ({ label: cleanText(m.label), value: cleanText(m.value) }))
              .filter((m) => m.label.length > 0 && m.value.length > 0)
          : [];

        return {
          month: cleanText(s.month),
          title: cleanText(s.title),
          outcomes,
          iconName: (journeyIconOptions.includes(s.iconName) ? s.iconName : 'Moon') as JourneyIconName,
          testimonial: {
            text: cleanText(s.testimonial?.text),
            author: cleanText(s.testimonial?.author),
          },
          metrics,
        };
      };

      const cleaned: JourneySettings = {
        ...journeySettings,
        problemSolutionTitle: cleanText(journeySettings.problemSolutionTitle),
        problemSolutionSubtitle: cleanText(journeySettings.problemSolutionSubtitle),
        problemsHeading: cleanText(journeySettings.problemsHeading),
        solutionsHeading: cleanText(journeySettings.solutionsHeading),
        timelineTitle: cleanText(journeySettings.timelineTitle),
        timelineSubtitle: cleanText(journeySettings.timelineSubtitle),
        ctaTitle: cleanText(journeySettings.ctaTitle),
        ctaSubtitle: cleanText(journeySettings.ctaSubtitle),
        problems: cleanList(journeySettings.problems || []),
        solutions: cleanList(journeySettings.solutions || []),
        steps: (journeySettings.steps || []).map(cleanStep).filter((s) => s.month.length > 0 && s.title.length > 0),
      };

      if (cleaned.problems.length === 0 || cleaned.solutions.length === 0 || cleaned.steps.length === 0) {
        alert('Please add at least 1 problem, 1 solution, and 1 timeline step.');
        return;
      }

      await updateSettings({ journey: sanitizeForFirestore(cleaned) });
      setJourneySettings(cleaned);
      alert('Journey saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving journey:', error);
      alert(`Failed to save journey: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSavingJourney(false);
    }
  };

  const updateCommunitySettings = (updates: Partial<CommunitySettings>) => {
    setCommunitySettings((prev) => ({ ...prev, ...updates }));
  };

  const updateCommunityConversation = (index: number, updates: Partial<CommunityConversation>) => {
    setCommunitySettings((prev) => {
      const nextConversations = [...(prev.conversations || [])];
      const current = nextConversations[index];
      if (!current) return prev;

      const next = { ...current, ...updates };
      nextConversations[index] = next;

      if (updates.id !== undefined && updates.id !== current.id) {
        const oldId = current.id;
        const newId = updates.id;
        const nextHistories = { ...(prev.histories || {}) };
        if (oldId && nextHistories[oldId] && newId) {
          nextHistories[newId] = nextHistories[oldId];
          delete nextHistories[oldId];
        }
        if (activeCommunityConversationId === oldId) {
          setActiveCommunityConversationId(newId);
        }
        return { ...prev, conversations: nextConversations, histories: nextHistories };
      }

      return { ...prev, conversations: nextConversations };
    });
  };

  const addCommunityConversation = () => {
    setCommunitySettings((prev) => ({
      ...prev,
      conversations: [
        ...(prev.conversations || []),
        {
          id: '',
          author: '',
          avatar: '',
          lastText: '',
          time: '',
          unreadCount: 0,
          isGroup: true,
          isSupportGroup: false,
          members: 0,
        },
      ],
    }));
  };

  const removeCommunityConversation = (index: number) => {
    setCommunitySettings((prev) => {
      const nextConversations = (prev.conversations || []).filter((_, i) => i !== index);
      const removed = prev.conversations?.[index];
      const nextHistories = { ...(prev.histories || {}) };
      if (removed?.id && nextHistories[removed.id]) {
        delete nextHistories[removed.id];
      }
      const nextActive =
        removed?.id && activeCommunityConversationId === removed.id ? (nextConversations[0]?.id || '') : activeCommunityConversationId;
      if (nextActive !== activeCommunityConversationId) {
        setActiveCommunityConversationId(nextActive);
      }
      return { ...prev, conversations: nextConversations, histories: nextHistories };
    });
  };

  const getActiveCommunityMessages = () => {
    return (communitySettings.histories || {})[activeCommunityConversationId] || [];
  };

  const setActiveCommunityMessages = (next: CommunityChatMessage[] | ((prev: CommunityChatMessage[]) => CommunityChatMessage[])) => {
    setCommunitySettings((prev) => {
      const current = (prev.histories || {})[activeCommunityConversationId] || [];
      const nextMessages = typeof next === 'function' ? (next as any)(current) : next;
      return {
        ...prev,
        histories: {
          ...(prev.histories || {}),
          [activeCommunityConversationId]: nextMessages,
        },
      };
    });
  };

  const updateCommunityMessage = (index: number, updates: Partial<CommunityChatMessage>) => {
    setActiveCommunityMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addCommunityMessage = () => {
    setActiveCommunityMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sender: '',
        avatar: '',
        text: '',
        time: '',
        isMe: false,
      },
    ]);
  };

  const resetCommunityGroupModal = () => {
    setEditingCommunityConversationId(null);
    setCommunityGroupName('');
    setCommunityGroupMemberSearch('');
    setCommunityGroupSelectedUserIds([]);
  };

  const openCreateCommunityGroup = () => {
    if (!auth.currentUser) {
      alert('Please sign in with Google/Firebase to manage community groups.');
      setIsLoginModalOpen(true);
      return;
    }
    resetCommunityGroupModal();
    setIsCommunityGroupModalOpen(true);
  };

  const openEditCommunityGroup = (conversationId: string) => {
    if (!auth.currentUser) {
      alert('Please sign in with Google/Firebase to manage community groups.');
      setIsLoginModalOpen(true);
      return;
    }
    const conv = (communitySettings.conversations || []).find((c) => c.id === conversationId);
    if (!conv) return;
    setEditingCommunityConversationId(conversationId);
    setCommunityGroupName(conv.author || '');
    setCommunityGroupMemberSearch('');
    setCommunityGroupSelectedUserIds(Array.isArray((conv as any).memberIds) ? ((conv as any).memberIds as string[]) : []);
    setIsCommunityGroupModalOpen(true);
  };

  const saveCommunityGroupFromModal = async () => {
    if (!auth.currentUser) {
      alert('Please sign in with Google/Firebase to manage community groups.');
      setIsLoginModalOpen(true);
      return;
    }
    const name = communityGroupName.trim();
    if (!name) {
      alert('Please enter a group name.');
      return;
    }
    if (communityGroupSelectedUserIds.length === 0) {
      alert('Please select at least 1 user for the group.');
      return;
    }

    const makeAvatar = (author: string) => {
      const parts = (author || '').trim().split(/\s+/).filter(Boolean);
      const letters = parts.map((p) => (p[0] || '').toUpperCase()).join('');
      return (letters || 'CC').slice(0, 2);
    };
    const makeId = (author: string) => {
      const base = author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!base) return `group-${Date.now()}`;
      const exists = (communitySettings.conversations || []).some((c) => c.id === base);
      return exists ? `${base}-${Date.now()}` : base;
    };

    const nextId = editingCommunityConversationId || makeId(name);
    const avatar = makeAvatar(name);

    const prevConversations = communitySettings.conversations || [];
    const existingIndex = prevConversations.findIndex((c) => c.id === nextId);
      const nextConversation: CommunityConversation = {
        ...(existingIndex >= 0 ? prevConversations[existingIndex] : ({} as any)),
        id: nextId,
        author: name,
        avatar,
        lastText: (existingIndex >= 0 ? prevConversations[existingIndex].lastText : '') || '',
        time: (existingIndex >= 0 ? prevConversations[existingIndex].time : '') || 'Just now',
        unreadCount: 0,
        isGroup: true,
        isSupportGroup: false,
        members: communityGroupSelectedUserIds.length,
        memberIds: [...communityGroupSelectedUserIds],
      };

    const nextConversations =
      existingIndex >= 0
        ? prevConversations.map((c, idx) => (idx === existingIndex ? nextConversation : c))
        : [...prevConversations, nextConversation];

    const nextHistories = { ...(communitySettings.histories || {}) };
    if (!nextHistories[nextId]) nextHistories[nextId] = [];

    const nextCommunitySettings: CommunitySettings = {
      ...communitySettings,
      conversations: nextConversations,
      histories: nextHistories,
    };

    setCommunitySettings(nextCommunitySettings);

    void setDoc(
      doc(db, 'community_conversations', nextId),
      {
        author: name,
        avatar,
        isGroup: true,
        isSupportGroup: false,
        members: communityGroupSelectedUserIds.length,
        memberIds: [...communityGroupSelectedUserIds],
        lastText: '',
        time: 'Just now',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});

    try {
      await updateSettings({ community: sanitizeForFirestore(nextCommunitySettings) });
    } catch (error: any) {
      console.error('❌ Error saving community group:', error);
      alert(`Failed to save group: ${error?.message || 'Please try again.'}`);
    }

    setActiveCommunityConversationId(nextId);
    setIsCommunityGroupModalOpen(false);
    resetCommunityGroupModal();
  };

  const removeCommunityMessage = (index: number) => {
    setActiveCommunityMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCommunity = async () => {
    try {
      if (!auth.currentUser) {
        alert('Please sign in with Google/Firebase to manage community groups.');
        setIsLoginModalOpen(true);
        return;
      }
      setIsSavingCommunity(true);

      const cleanText = (v: any) => (typeof v === 'string' ? v.trim() : '');
      const makeAvatar = (author: string) => {
        const parts = (author || '').trim().split(/\s+/).filter(Boolean);
        const letters = parts.map((p) => (p[0] || '').toUpperCase()).join('');
        return (letters || 'CC').slice(0, 2);
      };
      const makeId = (author: string, index: number) => {
        const base = cleanText(author).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return base || `conversation-${index + 1}`;
      };

      const cleanedConversations = (communitySettings.conversations || [])
        .map((c, index) => {
          const author = cleanText(c.author);
          const id = cleanText(c.id) || makeId(author, index);
          const avatar = cleanText(c.avatar) || makeAvatar(author);
          const lastText = cleanText(c.lastText);
          const time = cleanText(c.time);
          const unreadCount = typeof c.unreadCount === 'number' ? c.unreadCount : 0;
          const memberIds =
            Array.isArray((c as any).memberIds)
              ? (c as any).memberIds.map((v: any) => cleanText(v)).filter((v: string) => v.length > 0)
              : [];
          const members = memberIds.length > 0 ? memberIds.length : (typeof c.members === 'number' ? c.members : 0);
          const isGroup = !!c.isGroup;
          const isSupportGroup = !!c.isSupportGroup;
          if (author === '' && lastText === '' && time === '') return null;
          return { ...c, id, author, avatar, lastText, time, unreadCount, members, memberIds, isGroup, isSupportGroup } as CommunityConversation;
        })
        .filter((c): c is CommunityConversation => !!c);

      const finalConversations = cleanedConversations.length > 0 ? cleanedConversations : DEFAULT_COMMUNITY_SETTINGS.conversations;

      const cleanedHistories: Record<string, CommunityChatMessage[]> = {};
      finalConversations.forEach((c) => {
        const raw = (communitySettings.histories || {})[c.id] || [];
        cleanedHistories[c.id] = (raw || [])
          .map((m) => {
            const sender = cleanText(m.sender);
            const avatar = cleanText(m.avatar) || makeAvatar(sender);
            const text = cleanText(m.text);
            const time = cleanText(m.time);
            const id = cleanText(m.id) || `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            if (sender === '' && text === '' && time === '') return null;
            const attachmentName = cleanText((m.attachment as any)?.name);
            const attachmentType = cleanText((m.attachment as any)?.type);
            const attachment = attachmentName && attachmentType ? { name: attachmentName, type: attachmentType } : undefined;
            return { ...m, id, sender, avatar, text, time, isMe: !!m.isMe, attachment } as CommunityChatMessage;
          })
          .filter((m): m is CommunityChatMessage => !!m);
      });

      const cleaned: CommunitySettings = {
        pageTitle: cleanText(communitySettings.pageTitle) || DEFAULT_COMMUNITY_SETTINGS.pageTitle,
        pageSubtitle: cleanText(communitySettings.pageSubtitle) || DEFAULT_COMMUNITY_SETTINGS.pageSubtitle,
        welcomeTitle: cleanText(communitySettings.welcomeTitle) || DEFAULT_COMMUNITY_SETTINGS.welcomeTitle,
        welcomeSubtitle: cleanText(communitySettings.welcomeSubtitle) || DEFAULT_COMMUNITY_SETTINGS.welcomeSubtitle,
        conversations: finalConversations,
        histories: cleanedHistories,
      };

      await updateSettings({ community: sanitizeForFirestore(cleaned) });
      await Promise.all(
        cleaned.conversations.map((c) =>
          setDoc(
            doc(db, 'community_conversations', c.id),
            {
              author: c.author,
              avatar: c.avatar,
              isGroup: !!c.isGroup,
              isSupportGroup: !!c.isSupportGroup,
              members: typeof c.members === 'number' ? c.members : 0,
              memberIds: Array.isArray((c as any).memberIds) ? (c as any).memberIds : [],
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            },
            { merge: true }
          )
        )
      );
      setCommunitySettings(cleaned);
      setActiveCommunityConversationId((prev) => {
        const exists = cleaned.conversations.some((c) => c.id === prev);
        return exists ? prev : (cleaned.conversations[0]?.id || '');
      });
      alert('Community saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving community:', error);
      alert(`Failed to save community: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSavingCommunity(false);
    }
  };

  // Helper function to save with timeout and retry
  const saveWithRetry = async <T,>(
    saveFn: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} - Attempt ${attempt}/${maxRetries}`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out after 30 seconds')), 30000);
        });
        
        // Race between save and timeout
        const result = await Promise.race([saveFn(), timeoutPromise]) as T;
        
        console.log(`✅ ${operationName} - Success on attempt ${attempt}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ ${operationName} - Attempt ${attempt} failed:`, error.message || error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  };

  const handleSaveClass = async (cls: ManagedYogaClass) => {
    try {
      let finalId = cls.id;
      if (!finalId || finalId === '') {
        finalId = cls.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      const cleanFocus = (cls.focus || []).filter(f => f.trim() !== '');
      if (cleanFocus.length === 0) {
        alert('Please add at least one focus item.');
        return;
      }

      if (cls.category === 'live' && (!cls.time || cls.time.trim() === '')) {
        alert('Please add a time for live classes.');
        return;
      }

      const finalClass: ManagedYogaClass = {
        ...cls,
        id: finalId,
        focus: cleanFocus,
        time: cls.category === 'live' ? (cls.time || '').trim() : undefined,
      };

      const classRef = doc(db, 'classes', finalId);
      await saveWithRetry(
        () => setDoc(classRef, sanitizeForFirestore(finalClass), { merge: true }),
        `Save class ${finalId}`
      );

      setClasses(prev => {
        const existing = prev.findIndex(c => c.id === finalId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = finalClass;
          return updated;
        }
        return [...prev, finalClass];
      });

      setEditingClass(null);
      setIsClassFormOpen(false);
      alert('Class saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving class:', error);
      let errorMessage = 'Failed to save class. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check Firestore security rules are deployed.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      alert(errorMessage);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await saveWithRetry(
        () => setDoc(doc(db, 'classes', classId), { deleted: true }, { merge: true }),
        `Delete class ${classId}`
      );
      setClasses(prev => prev.filter(c => c.id !== classId));
      setClassesWithVideos(prev => {
        const next = { ...prev };
        delete next[classId];
        return next;
      });
      console.log('✅ Class deleted:', classId);
    } catch (error) {
      console.error('❌ Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  // Handle asana save
  const handleSaveAsana = async (asana: Asana) => {
    try {
      console.log('💾 Attempting to save asana:', {
        id: asana.id,
        sanskritName: asana.sanskritName,
        englishName: asana.englishName,
        hasBenefits: asana.benefits?.length > 0,
        hasHowTo: asana.howTo?.length > 0,
      });
      
      // Test connection first
      try {
        const testRef = doc(db, '_connection_test', 'test');
        await getDoc(testRef);
        console.log('✅ Firestore connection test passed');
      } catch (testError: any) {
        console.warn('⚠️ Connection test failed, but continuing:', testError.message);
      }
      
      const asanaRef = doc(db, 'asanas', asana.id);
      console.log('📝 Document reference created:', asanaRef.path);
      
      // Save with retry logic
      await saveWithRetry(
        () => setDoc(asanaRef, asana),
        `Save asana ${asana.id}`
      );
      
      console.log('✅ Asana saved successfully to Firestore:', asana.id);
      
      setAsanas(prev => {
        const existing = prev.findIndex(a => a.id === asana.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = asana;
          return updated;
        }
        return [...prev, asana];
      });
      setEditingAsana(null);
      setIsAsanaFormOpen(false);
      
      alert('Asana saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving asana:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      
      let errorMessage = 'Failed to save asana. ';
      if (error.message?.includes('timed out')) {
        errorMessage += 'Request timed out. This might be a network issue or Firestore database configuration problem. ';
        errorMessage += 'Please check: 1) Your internet connection, 2) Firebase Console to ensure Firestore is enabled, 3) Browser console for more details.';
      } else if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check Firestore security rules are deployed.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Service unavailable. Please check your internet connection and Firebase project status.';
      } else if (error.code === 'failed-precondition') {
        errorMessage += 'Database error. Please check Firebase Console to ensure Firestore is in Native mode (not Datastore mode).';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  // Handle asana delete
  const handleDeleteAsana = async (asanaId: string) => {
    if (!confirm('Are you sure you want to delete this asana?')) return;
    try {
      // Mark as deleted instead of actually deleting
      await setDoc(doc(db, 'asanas', asanaId), { deleted: true }, { merge: true });
      setAsanas(prev => prev.filter(a => a.id !== asanaId));
      console.log('✅ Asana deleted:', asanaId);
    } catch (error) {
      console.error('❌ Error deleting asana:', error);
      alert('Failed to delete asana. Please try again.');
    }
  };

  // Handle instructor save
  const handleSaveInstructor = async (instructor: Instructor) => {
    try {
      // Generate ID if new instructor
      let finalId = instructor.id;
      if (!finalId || finalId === '') {
        finalId = instructor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      
      const finalInstructor: Instructor = {
        ...instructor,
        id: finalId,
      };
      
      console.log('💾 Attempting to save instructor:', {
        id: finalId,
        name: finalInstructor.name,
        role: finalInstructor.role,
        hasSpecialties: finalInstructor.specialties?.length > 0,
      });
      
      // Test connection first
      try {
        const testRef = doc(db, '_connection_test', 'test');
        await getDoc(testRef);
        console.log('✅ Firestore connection test passed');
      } catch (testError: any) {
        console.warn('⚠️ Connection test failed, but continuing:', testError.message);
      }
      
      const instructorRef = doc(db, 'instructors', finalId);
      console.log('📝 Document reference created:', instructorRef.path);
      
      // Save with retry logic
      await saveWithRetry(
        () => setDoc(instructorRef, sanitizeForFirestore(finalInstructor)),
        `Save instructor ${finalId}`
      );
      
      console.log('✅ Instructor saved successfully to Firestore:', finalId);
      
      setInstructors(prev => {
        const existing = prev.findIndex(i => i.id === finalId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = finalInstructor;
          return updated;
        }
        return [...prev, finalInstructor];
      });
      setEditingInstructor(null);
      setIsInstructorFormOpen(false);
      
      alert('Instructor saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving instructor:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      
      let errorMessage = 'Failed to save instructor. ';
      if (error.message?.includes('timed out')) {
        errorMessage += 'Request timed out. This might be a network issue or Firestore database configuration problem. ';
        errorMessage += 'Please check: 1) Your internet connection, 2) Firebase Console to ensure Firestore is enabled, 3) Browser console for more details.';
      } else if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check Firestore security rules are deployed.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Service unavailable. Please check your internet connection and Firebase project status.';
      } else if (error.code === 'failed-precondition') {
        errorMessage += 'Database error. Please check Firebase Console to ensure Firestore is in Native mode (not Datastore mode).';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  // Handle instructor delete
  const handleDeleteInstructor = async (instructorId: string) => {
    if (!confirm('Are you sure you want to delete this instructor?')) return;
    try {
      // Mark as deleted instead of actually deleting
      await setDoc(doc(db, 'instructors', instructorId), { deleted: true }, { merge: true });
      setInstructors(prev => prev.filter(i => i.id !== instructorId));
      console.log('✅ Instructor deleted:', instructorId);
    } catch (error) {
      console.error('❌ Error deleting instructor:', error);
      alert('Failed to delete instructor. Please try again.');
    }
  };

  // Handle research topic save
  const handleSaveResearch = async (topic: ResearchTopic) => {
    try {
      console.log('💾 Attempting to save research topic:', topic.id || 'new topic');
      await saveWithRetry(
        () => setDoc(doc(db, 'research', topic.id), topic),
        `Save research topic ${topic.id}`
      );
      setResearchTopics(prev => {
        const existing = prev.findIndex(t => t.id === topic.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = topic;
          return updated;
        }
        return [...prev, topic];
      });
      setEditingResearch(null);
      setIsResearchFormOpen(false);
      console.log('✅ Research topic saved successfully to Firestore:', topic.id);
      alert('Research topic saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving research topic:', error);
      alert(`Failed to save research topic: ${error.message}. Please try again.`);
    }
  };

  // Handle research topic delete
  const handleDeleteResearch = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this research topic?')) return;
    try {
      console.log('🗑️ Attempting to delete research topic:', topicId);
      // Mark as deleted instead of actually deleting
      await saveWithRetry(
        () => setDoc(doc(db, 'research', topicId), { deleted: true }, { merge: true }),
        `Delete research topic ${topicId}`
      );
      setResearchTopics(prev => prev.filter(t => t.id !== topicId));
      console.log('✅ Research topic deleted successfully from Firestore:', topicId);
      alert('Research topic deleted successfully!');
    } catch (error: any) {
      console.error('❌ Error deleting research topic:', error);
      alert(`Failed to delete research topic: ${error.message}. Please try again.`);
    }
  };

  // Handle video upload (simplified - just URL input for now)
  const handleVideoUpload = async (classId: string, videoUrl: string) => {
    if (!videoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }

    setUploadingVideo(classId);
    try {
      // Check if video already exists for this class
      const allVideos = await getDocs(collection(db, 'class_videos'));
      const existingVideo = allVideos.docs.find(doc => doc.data().classId === classId);

      if (existingVideo) {
        // Update existing video
        await setDoc(doc(db, 'class_videos', existingVideo.id), {
          classId,
          videoUrl: videoUrl.trim(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // Create new video
        await addDoc(collection(db, 'class_videos'), {
          classId,
          videoUrl: videoUrl.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Update local state
      setClassesWithVideos(prev => ({
        ...prev,
        [classId]: videoUrl.trim()
      }));

      console.log('✅ Video uploaded for class:', classId);
    } catch (error) {
      console.error('❌ Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploadingVideo(null);
    }
  };

  // TEMPORARY: No auth gates - show dashboard directly

  // Debug: Log when component renders
  useEffect(() => {
    console.log('🎯 AdminDashboard component rendered');
    console.log('📊 Current state:', {
      isLoading,
      usersCount: users.length,
      contactsCount: contactSubmissions.length,
      subscribersCount: newsletterSubscribers.length
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" style={{ cursor: 'default' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Site</span>
              </button>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-xs text-slate-500">
                    {isAdminChecking
                      ? 'Checking permissions...'
                      : isAuthenticated
                        ? isAdmin
                          ? 'Admin access'
                          : 'Access restricted'
                        : 'Sign in required'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Back to Site</span>
            </button>
          </div>
        </div>
      </header>

      {isAuthenticated && isAdmin && !isAdminChecking ? (
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-80px)] sticky top-[80px]">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {isLoading && activeTab === 'overview' ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Users size={24} className="text-teal-600" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{users.length}</h3>
                        <p className="text-sm text-slate-600">Total Users</p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail size={24} className="text-blue-600" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{contactSubmissions.length}</h3>
                        <p className="text-sm text-slate-600">Contact Submissions</p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp size={24} className="text-green-600" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{newsletterSubscribers.length}</h3>
                        <p className="text-sm text-slate-600">Newsletter Subscribers</p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Activity size={24} className="text-purple-600" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">
                          {users.filter(u => u.plan).length}
                        </h3>
                        <p className="text-sm text-slate-600">Active Subscriptions</p>
                      </div>
                    </div>
                  </div>

                  {/* Initialize Collections */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Initialize Collections</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Store all default asanas and research topics in Firestore. This will only add items that don't already exist.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={async () => {
                          try {
                            const result = await initializeAsanas();
                            alert(`Asanas initialized!\n${result.added} added, ${result.skipped} skipped.\n\nPlease refresh the page to see the updated data.`);
                            // Reload asanas
                            const asanasSnapshot = await getDocs(collection(db, 'asanas'));
                            const loadedAsanas: Asana[] = asanasSnapshot.docs
                              .map(doc => doc.data() as Asana)
                              .filter(asana => !asana.deleted);
                            setAsanas(loadedAsanas);
                          } catch (error: any) {
                            console.error('Error initializing asanas:', error);
                            alert(`Failed to initialize asanas: ${error.message || 'Unknown error'}`);
                          }
                        }}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                      >
                        <BookOpen size={18} />
                        <span>Initialize Asanas</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await initializeResearch();
                            alert(`Research topics initialized!\n${result.added} added, ${result.skipped} skipped.`);
                          } catch (error: any) {
                            console.error('Error initializing research:', error);
                            alert(`Failed to initialize research: ${error.message || 'Unknown error'}`);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FileText size={18} />
                        <span>Initialize Research</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await initializeAllCollections();
                            alert('All collections initialized successfully!\n\nPlease refresh the page to see the updated data.');
                            // Reload asanas
                            const asanasSnapshot = await getDocs(collection(db, 'asanas'));
                            const loadedAsanas: Asana[] = asanasSnapshot.docs
                              .map(doc => doc.data() as Asana)
                              .filter(asana => !asana.deleted);
                            setAsanas(loadedAsanas);
                          } catch (error: any) {
                            console.error('Error initializing collections:', error);
                            alert(`Failed to initialize collections: ${error.message || 'Unknown error'}`);
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <Activity size={18} />
                        <span>Initialize All</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {tabs.slice(1).map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Icon size={24} className="text-teal-600" />
                            <span className="text-sm font-medium text-slate-700">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
                        <Search size={18} className="text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="outline-none text-sm"
                        />
                      </div>
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value as any)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="all">All Users</option>
                        <option value="firebase">Firebase</option>
                        <option value="localStorage">Local Storage</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">User</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Join Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                No users found
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                      <UserIcon size={18} className="text-teal-600" />
                                    </div>
                                    <span className="font-medium text-slate-900">{user.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                  {user.plan ? (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                      {user.plan}
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                      No Plan
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    user.source === 'firebase'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {user.source}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                                      <Eye size={16} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingUserStats(user);
                                        setIsUserStatsModalOpen(true);
                                      }}
                                      disabled={user.source !== 'firebase'}
                                      title={user.source !== 'firebase' ? 'Only Firebase users can be updated' : 'Edit practice stats'}
                                      className={`p-2 transition-colors ${
                                        user.source !== 'firebase'
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-blue-600'
                                      }`}
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => setUserAdmin(user, !isUserAdmin(user))}
                                      disabled={user.source !== 'firebase'}
                                      title={user.source !== 'firebase' ? 'Only Firebase users can be updated' : isUserAdmin(user) ? 'Remove admin' : 'Make admin'}
                                      className={`p-2 transition-colors ${
                                        user.source !== 'firebase'
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : isUserAdmin(user)
                                            ? 'text-teal-600 hover:text-teal-700'
                                            : 'text-slate-400 hover:text-teal-600'
                                      }`}
                                    >
                                      <Shield size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Submissions Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Contact Form Submissions</h2>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
                      <Search size={18} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search submissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-200">
                      {filteredContacts.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                          No contact submissions found
                        </div>
                      ) : (
                        filteredContacts.map((contact) => (
                          <div key={contact.id} className="p-6 hover:bg-slate-50">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-slate-900">{contact.name}</h3>
                                <p className="text-sm text-slate-600">{contact.email}</p>
                              </div>
                              <div className="text-right">
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                                  {contact.inquiryType}
                                </span>
                                <p className="text-xs text-slate-500 mt-2">
                                  {contact.timestamp?.toDate ? 
                                    contact.timestamp.toDate().toLocaleString() : 
                                    contact.createdAt ? new Date(contact.createdAt).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-700 mt-3">{contact.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Newsletter Subscribers Tab */}
              {activeTab === 'newsletter' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Newsletter Subscribers</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
                        <Search size={18} className="text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search subscribers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="outline-none text-sm"
                        />
                      </div>
                      <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                        <Download size={18} />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Subscribed At</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredSubscribers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                No subscribers found
                              </td>
                            </tr>
                          ) : (
                            filteredSubscribers.map((subscriber) => (
                              <tr key={subscriber.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{subscriber.email}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {subscriber.subscribedAt?.toDate ? 
                                    subscriber.subscribedAt.toDate().toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    {subscriber.source || 'website_footer'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                    <CheckCircle2 size={12} />
                                    Active
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Sections */}
              {activeTab === 'journey' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Journey Management</h2>
                    <button
                      onClick={handleSaveJourney}
                      disabled={isSavingJourney || !journeySettings}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={18} />
                      <span>{isSavingJourney ? 'Saving...' : 'Save Journey'}</span>
                    </button>
                  </div>

                  {!journeySettings ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Loading journey settings...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                          <h3 className="text-lg font-bold text-slate-900">Problem & Solution</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Heading Title</label>
                              <input
                                type="text"
                                value={journeySettings.problemSolutionTitle}
                                onChange={(e) => updateJourneySettings({ problemSolutionTitle: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Heading Subtitle</label>
                              <input
                                type="text"
                                value={journeySettings.problemSolutionSubtitle}
                                onChange={(e) => updateJourneySettings({ problemSolutionSubtitle: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Problems Heading</label>
                                <input
                                  type="text"
                                  value={journeySettings.problemsHeading}
                                  onChange={(e) => updateJourneySettings({ problemsHeading: e.target.value })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Solutions Heading</label>
                                <input
                                  type="text"
                                  value={journeySettings.solutionsHeading}
                                  onChange={(e) => updateJourneySettings({ solutionsHeading: e.target.value })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                          <h3 className="text-lg font-bold text-slate-900">Timeline</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Timeline Title</label>
                              <input
                                type="text"
                                value={journeySettings.timelineTitle}
                                onChange={(e) => updateJourneySettings({ timelineTitle: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Timeline Subtitle</label>
                              <input
                                type="text"
                                value={journeySettings.timelineSubtitle}
                                onChange={(e) => updateJourneySettings({ timelineSubtitle: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">CTA Title</label>
                                <input
                                  type="text"
                                  value={journeySettings.ctaTitle}
                                  onChange={(e) => updateJourneySettings({ ctaTitle: e.target.value })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">CTA Subtitle</label>
                                <input
                                  type="text"
                                  value={journeySettings.ctaSubtitle}
                                  onChange={(e) => updateJourneySettings({ ctaSubtitle: e.target.value })}
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Problems</h3>
                            <button
                              type="button"
                              onClick={() => addJourneyListItem('problems')}
                              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
                            >
                              <Plus size={16} />
                              Add
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(journeySettings.problems || []).map((item, idx) => (
                              <div key={idx} className="flex gap-3 items-center">
                                <select
                                  value={item.iconName}
                                  onChange={(e) => updateJourneyListItem('problems', idx, { iconName: e.target.value as JourneyIconName })}
                                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
                                >
                                  {journeyIconOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) => updateJourneyListItem('problems', idx, { text: e.target.value })}
                                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeJourneyListItem('problems', idx)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Solutions</h3>
                            <button
                              type="button"
                              onClick={() => addJourneyListItem('solutions')}
                              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
                            >
                              <Plus size={16} />
                              Add
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(journeySettings.solutions || []).map((item, idx) => (
                              <div key={idx} className="flex gap-3 items-center">
                                <select
                                  value={item.iconName}
                                  onChange={(e) => updateJourneyListItem('solutions', idx, { iconName: e.target.value as JourneyIconName })}
                                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
                                >
                                  {journeyIconOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) => updateJourneyListItem('solutions', idx, { text: e.target.value })}
                                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeJourneyListItem('solutions', idx)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-slate-900">Timeline Steps</h3>
                          <button
                            type="button"
                            onClick={() => openJourneyStepModal(null)}
                            className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <Plus size={16} />
                            Add Step
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Month</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Icon</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(journeySettings.steps || []).map((step, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{step.month}</td>
                                  <td className="px-4 py-3 text-sm text-slate-700">{step.title}</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">{step.iconName}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openJourneyStepModal(idx)}
                                        className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 text-xs font-medium flex items-center gap-1.5"
                                      >
                                        <Edit size={14} />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteJourneyStep(idx)}
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium flex items-center gap-1.5"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Journey Section Preview</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                      <ProblemSolution />
                    </div>
                    <div className="border-t border-slate-200">
                      <Timeline onNavPricing={() => {}} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'asanas' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Asanas Section Preview</h2>
                    <button
                      onClick={() => {
                        setEditingAsana(null);
                        setIsAsanaFormOpen(true);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={18} />
                      <span>Add New Asana</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Custom Asanas Display with Edit Buttons */}
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(asanas.length > 0 ? asanas : ASANAS).map((asana) => (
                          <div key={asana.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-0 hover:border-teal-200 hover:shadow-2xl transition-all duration-700 flex flex-col h-full overflow-hidden">
                            {/* Edit Button - Top Right - Always Visible */}
                            <button
                              onClick={() => {
                                setEditingAsana({ ...asana });
                                setIsAsanaFormOpen(true);
                              }}
                              className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5 text-xs shadow-lg"
                              title={`Edit ${asana.englishName}`}
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            
                            <div className="relative aspect-[16/10] overflow-hidden">
                              <img 
                                src={asana.imageUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800"} 
                                alt={asana.englishName}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                              <div className="absolute bottom-6 left-8">
                                <span className="text-[9px] font-bold text-white uppercase tracking-widest px-3 py-1 bg-teal-600 rounded-full mb-3 inline-block shadow-lg">
                                  {asana.level}
                                </span>
                              </div>
                            </div>

                            <div className="p-10 flex flex-col flex-grow">
                              <div className="flex justify-between items-start mb-8">
                                <div>
                                  <h3 className="text-3xl font-serif font-bold text-slate-900 leading-tight mb-1">{asana.sanskritName}</h3>
                                  <p className="text-sm text-slate-500 font-light italic">{asana.englishName}</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-600 group-hover:text-white transition-all duration-700 shrink-0">
                                  <Target size={20} />
                                </div>
                              </div>

                              <div className="space-y-6 mb-10 flex-grow">
                                <p className="text-sm text-slate-600 leading-relaxed font-light">
                                  {asana.description}
                                </p>
                                
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} className="text-teal-50" /> Key Benefits
                                  </h4>
                                  <ul className="space-y-2">
                                    {asana.benefits?.map((b, i) => (
                                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                        <span className="w-1 h-1 bg-teal-200 rounded-full mt-1.5 shrink-0"></span>
                                        {b}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-xs text-slate-600">
                                  <span className="font-bold text-teal-700 not-italic mr-1">Focus:</span> {asana.focusCue}
                                </div>
                              </div>

                              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{asana.category}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 flex items-center gap-1">
                                  Learn Technique <ChevronRight size={14} />
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructors Management Tab */}
              {activeTab === 'instructors-manage' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Instructors Management</h2>
                    <button
                      onClick={() => {
                        setEditingInstructor(null);
                        setIsInstructorFormOpen(true);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={18} />
                      <span>Add New Instructor</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-200">
                      {instructors.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                          No instructors found. Add your first instructor!
                        </div>
                      ) : (
                        instructors.map((instructor) => (
                          <div key={instructor.id} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3 flex-wrap">
                                  <h3 className="text-xl font-bold text-slate-900">{instructor.name}</h3>
                                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                                    {instructor.role}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{instructor.bio}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
                                  <span>Lineage: {instructor.lineage}</span>
                                  {instructor.contact && (
                                    <>
                                      <span>•</span>
                                      <span>Email: {instructor.contact.email}</span>
                                      <span>•</span>
                                      <span>Phone: {instructor.contact.phone}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {instructor.specialties?.slice(0, 3).map((spec, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                      {spec}
                                    </span>
                                  ))}
                                  {instructor.specialties && instructor.specialties.length > 3 && (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                      +{instructor.specialties.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingInstructor({ ...instructor });
                                    setIsInstructorFormOpen(true);
                                  }}
                                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                  <Edit size={16} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteInstructor(instructor.id)}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={16} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Classes Management Tab */}
              {activeTab === 'classes-manage' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Classes Management</h2>
                    <button
                      onClick={() => {
                        setEditingClass(null);
                        setIsClassFormOpen(true);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={18} />
                      <span>Add New Class</span>
                    </button>
                  </div>

                  {/* Coming Soon Toggle */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Coming Soon Overlay</h3>
                        <p className="text-sm text-slate-600">
                          Toggle the "Coming Soon" overlay on the classes page. When disabled, users can see all classes.
                        </p>
                      </div>
                      <button
                        onClick={handleToggleComingSoon}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
                          classesComingSoon
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {classesComingSoon ? (
                          <>
                            <ToggleRight size={24} />
                            <span>Enabled</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={24} />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">
                        <strong>Current Status:</strong> {classesComingSoon ? 'Overlay is showing (classes hidden)' : 'Overlay is hidden (classes visible)'}
                      </p>
                    </div>
                  </div>

                  {/* Live Classes Video Management */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">Live Classes - Video Upload</h3>
                      <p className="text-sm text-slate-600 mt-1">Upload video URLs for live classes</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {(classes.filter(c => c.category === 'live').length > 0 
                        ? classes.filter(c => c.category === 'live')
                        : LIVE_CLASSES.map(cls => ({ ...cls, category: 'live' as const }))
                      ).map((cls) => (
                        <div key={cls.id} className="p-6 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-900">{cls.title}</h4>
                                <button
                                  onClick={() => {
                                    setEditingClass({ ...cls });
                                    setIsClassFormOpen(true);
                                  }}
                                  className="px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 transition-colors flex items-center gap-1"
                                >
                                  <Edit size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(cls.id)}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                <span>{cls.instructor}</span>
                                <span>•</span>
                                <span>{cls.type}</span>
                                <span>•</span>
                                <span>{cls.level}</span>
                                <span>•</span>
                                <span>{cls.time || cls.duration}</span>
                              </div>
                              {classesWithVideos[cls.id] && (
                                <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                  <p className="text-xs font-medium text-teal-900 mb-1">Current Video:</p>
                                  <a 
                                    href={classesWithVideos[cls.id]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-teal-600 hover:underline break-all"
                                  >
                                    {classesWithVideos[cls.id]}
                                  </a>
                                </div>
                              )}
                            </div>
                            <VideoUploadForm
                              classId={cls.id}
                              currentVideoUrl={classesWithVideos[cls.id]}
                              onUpload={handleVideoUpload}
                              isUploading={uploadingVideo === cls.id}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recorded Classes Management */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">Recorded Classes (Archives)</h3>
                      <p className="text-sm text-slate-600 mt-1">Manage recorded classes and upload video URLs</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {(classes.filter(c => c.category === 'recorded').length > 0 
                        ? classes.filter(c => c.category === 'recorded')
                        : RECORDED_CLASSES.map(cls => ({ ...cls, category: 'recorded' as const }))
                      ).map((cls) => (
                        <div key={cls.id} className="p-6 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-900">{cls.title}</h4>
                                <button
                                  onClick={() => {
                                    setEditingClass({ ...cls });
                                    setIsClassFormOpen(true);
                                  }}
                                  className="px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 transition-colors flex items-center gap-1"
                                >
                                  <Edit size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(cls.id)}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                <span>{cls.instructor}</span>
                                <span>•</span>
                                <span>{cls.type}</span>
                                <span>•</span>
                                <span>{cls.level}</span>
                                <span>•</span>
                                <span>{cls.duration}</span>
                              </div>
                              {classesWithVideos[cls.id] && (
                                <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                  <p className="text-xs font-medium text-teal-900 mb-1">Current Video:</p>
                                  <a 
                                    href={classesWithVideos[cls.id]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-teal-600 hover:underline break-all"
                                  >
                                    {classesWithVideos[cls.id]}
                                  </a>
                                </div>
                              )}
                            </div>
                            <VideoUploadForm
                              classId={cls.id}
                              currentVideoUrl={classesWithVideos[cls.id]}
                              onUpload={handleVideoUpload}
                              isUploading={uploadingVideo === cls.id}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'classes' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Classes Section Preview</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <Classes initialTab="live" onNavHome={() => {}} />
                  </div>
                </div>
              )}

              {activeTab === 'instructors' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Instructors Section Preview</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <Instructors onViewProfile={() => {}} />
                  </div>
                </div>
              )}

              {activeTab === 'community' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Community Management</h2>
                      <p className="text-sm text-slate-600">Create groups and assign members from your users list.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openCreateCommunityGroup}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Plus size={18} />
                        <span>Add Group</span>
                      </button>
                      <button
                        onClick={handleSaveCommunity}
                        disabled={isSavingCommunity}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 size={18} />
                        <span>{isSavingCommunity ? 'Saving...' : 'Save Community'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-200">
                      {(communitySettings.conversations || []).filter((c) => c.isGroup).length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">No groups found. Add your first group.</div>
                      ) : (
                        (communitySettings.conversations || [])
                          .map((c, idx) => ({ c, idx }))
                          .filter(({ c }) => c.isGroup)
                          .map(({ c, idx }) => (
                            <div key={c.id || idx} className="p-6 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start justify-between gap-6 flex-wrap">
                                <div className="min-w-[240px]">
                                  <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-serif font-bold">
                                      {(c.avatar || 'CG').slice(0, 2)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900">{c.author || 'Untitled group'}</div>
                                      <div className="text-xs text-slate-500">{c.id || '(id pending)'}</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-600 mt-2">
                                    Members:{' '}
                                    {Array.isArray((c as any).memberIds) && (c as any).memberIds.length > 0
                                      ? (c as any).memberIds.length
                                      : (typeof c.members === 'number' ? c.members : 0)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditCommunityGroup(c.id)}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                                  >
                                    <Edit size={16} />
                                    <span>Edit Members</span>
                                  </button>
                                  <button
                                    onClick={() => removeCommunityConversation(idx)}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-bold text-slate-900">Community Preview</h3>
                    </div>
                    <CommunityPage />
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-slate-900">Pricing Management</h2>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                          <button
                            onClick={() => setActivePricingCurrency('inr')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                              activePricingCurrency === 'inr'
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ₹ INR
                          </button>
                          <button
                            onClick={() => setActivePricingCurrency('usd')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                              activePricingCurrency === 'usd'
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            $ USD
                          </button>
                        </div>
                        <button
                          onClick={addPricingTier}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Plus size={18} />
                          <span>Add Tier</span>
                        </button>
                        <button
                          onClick={handleSavePricing}
                          disabled={isSavingPricing}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 size={18} />
                          <span>{isSavingPricing ? 'Saving...' : 'Save Pricing'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Edit pricing tiers and features. Changes apply to the main pricing section.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 space-y-6">
                      {getActivePricingTiers().length === 0 ? (
                        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
                          No pricing tiers yet. Click “Add Tier” to create one.
                        </div>
                      ) : (
                        getActivePricingTiers().map((tier, tierIndex) => (
                          <div key={`${activePricingCurrency}-${tierIndex}`} className="border border-slate-200 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                                  <input
                                    type="text"
                                    value={tier.name}
                                    onChange={(e) => updatePricingTier(tierIndex, { name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., Monthly"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Price *</label>
                                  <input
                                    type="text"
                                    value={tier.price}
                                    onChange={(e) => updatePricingTier(tierIndex, { price: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    placeholder={activePricingCurrency === 'inr' ? '₹1999' : '$29'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Frequency *</label>
                                  <input
                                    type="text"
                                    value={tier.frequency}
                                    onChange={(e) => updatePricingTier(tierIndex, { frequency: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    placeholder="/month"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Button Text *</label>
                                  <input
                                    type="text"
                                    value={tier.buttonText}
                                    onChange={(e) => updatePricingTier(tierIndex, { buttonText: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    placeholder="Get Started"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                                  <input
                                    type="checkbox"
                                    checked={!!tier.isRecommended}
                                    onChange={(e) => updatePricingTier(tierIndex, { isRecommended: e.target.checked })}
                                    className="h-4 w-4"
                                  />
                                  Recommended
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removePricingTier(tierIndex)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                                >
                                  <Trash2 size={16} />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>

                            <div className="mt-5">
                              <div className="flex items-center justify-between gap-4 mb-3">
                                <label className="block text-xs font-medium text-slate-600">Features *</label>
                                <button
                                  type="button"
                                  onClick={() => addTierFeature(tierIndex)}
                                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
                                >
                                  <Plus size={16} />
                                  <span>Add Feature</span>
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(tier.features && tier.features.length > 0 ? tier.features : ['']).map((feature, featureIndex) => (
                                  <div key={featureIndex} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={feature}
                                      onChange={(e) => updateTierFeature(tierIndex, featureIndex, e.target.value)}
                                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                      placeholder={`Feature ${featureIndex + 1}`}
                                    />
                                    {(tier.features?.length || 0) > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeTierFeature(tierIndex, featureIndex)}
                                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Pricing Section Preview</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <Pricing />
                  </div>
                </div>
              )}

              {activeTab === 'meditation' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Meditation Section Preview</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <MeditationMusic />
                  </div>
                </div>
              )}

              {activeTab === 'research' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Research Section Preview</h2>
                    <button
                      onClick={() => {
                        setEditingResearch(null);
                        setIsResearchFormOpen(true);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={18} />
                      <span>Add New Research Topic</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                      <div className="space-y-12">
                        {(researchTopics.length > 0 ? researchTopics : RESEARCH_TOPICS).map((topic, idx) => (
                          <div key={topic.id} className="group relative grid lg:grid-cols-[1.5fr,2fr] gap-8 md:gap-16 items-start border-t border-slate-100 pt-16">
                            {/* Edit Button - Top Right */}
                            <button
                              onClick={() => {
                                setEditingResearch({ ...topic });
                                setIsResearchFormOpen(true);
                              }}
                              className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5 text-xs shadow-lg"
                              title={`Edit ${topic.benefit}`}
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            
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
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {!isAuthenticated ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Sign in to continue</h2>
                  <p className="text-slate-600 mt-2">
                    Only approved admin users can access this portal.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignupModalOpen(true)}
                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            ) : isAdminChecking ? (
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Checking admin permissions...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Access denied</h2>
                  <p className="text-slate-600 mt-2">
                    {user?.email ? `Signed in as ${user.email}. ` : ''}
                    Your account does not have admin access.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onBack();
                    }}
                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                  >
                    Sign out
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
                  >
                    Back to site
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asana Form Modal */}
      {isAsanaFormOpen && (
        <AsanaFormModal
          asana={editingAsana}
          onSave={handleSaveAsana}
          onClose={() => {
            setIsAsanaFormOpen(false);
            setEditingAsana(null);
          }}
        />
      )}

      {isUserStatsModalOpen && editingUserStats && (
        <UserStatsModal
          user={editingUserStats}
          onSave={updateUserStats}
          onClose={() => {
            setIsUserStatsModalOpen(false);
            setEditingUserStats(null);
          }}
        />
      )}

      {/* Instructor Form Modal */}
      {isInstructorFormOpen && (
        <InstructorFormModal
          instructor={editingInstructor}
          onSave={handleSaveInstructor}
          onClose={() => {
            setIsInstructorFormOpen(false);
            setEditingInstructor(null);
          }}
        />
      )}

      {/* Research Form Modal */}
      {isResearchFormOpen && (
        <ResearchFormModal
          topic={editingResearch}
          onSave={handleSaveResearch}
          onClose={() => {
            setIsResearchFormOpen(false);
            setEditingResearch(null);
          }}
        />
      )}

      {/* Class Form Modal */}
      {isClassFormOpen && (
        <ClassFormModal
          classData={editingClass}
          instructors={instructors}
          onSave={handleSaveClass}
          onClose={() => {
            setIsClassFormOpen(false);
            setEditingClass(null);
          }}
        />
      )}

      {isJourneyStepModalOpen && journeySettings && (
        <JourneyStepModal
          step={
            editingJourneyStepIndex !== null && journeySettings.steps?.[editingJourneyStepIndex]
              ? journeySettings.steps[editingJourneyStepIndex]
              : getDefaultJourneyStep()
          }
          iconOptions={journeyIconOptions}
          isEditing={editingJourneyStepIndex !== null}
          onSave={upsertJourneyStep}
          onClose={() => {
            setIsJourneyStepModalOpen(false);
            setEditingJourneyStepIndex(null);
          }}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {isCommunityGroupModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCommunityGroupModalOpen(false);
              resetCommunityGroupModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl m-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCommunityConversationId ? 'Edit Group' : 'Create Group'}
                </h3>
                <p className="text-sm text-slate-600">Select members from your users list.</p>
              </div>
              <button
                onClick={() => {
                  setIsCommunityGroupModalOpen(false);
                  resetCommunityGroupModal();
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Group name</label>
                  <input
                    value={communityGroupName}
                    onChange={(e) => setCommunityGroupName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g., Beginners Support"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Selected members</span>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">
                      {communityGroupSelectedUserIds.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-2">
                    {communityGroupSelectedUserIds.length === 0 ? (
                      <div className="text-sm text-slate-500">No users selected.</div>
                    ) : (
                      communityGroupSelectedUserIds.map((id) => {
                        const u = users.find((x) => x.id === id);
                        return (
                          <div key={id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{u?.name || id}</div>
                              <div className="text-xs text-slate-500 truncate">{u?.email || ''}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCommunityGroupSelectedUserIds((prev) => prev.filter((x) => x !== id))
                              }
                              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search users</label>
                  <input
                    value={communityGroupMemberSearch}
                    onChange={(e) => setCommunityGroupMemberSearch(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Search by name or email"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                    {users
                      .filter((u) => {
                        const q = communityGroupMemberSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (u.name || '').toLowerCase().includes(q) ||
                          (u.email || '').toLowerCase().includes(q)
                        );
                      })
                      .map((u) => {
                        const checked = communityGroupSelectedUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked;
                                setCommunityGroupSelectedUserIds((prev) =>
                                  next ? Array.from(new Set([...prev, u.id])) : prev.filter((x) => x !== u.id)
                                );
                              }}
                              className="h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-900 truncate">{u.name}</div>
                              <div className="text-xs text-slate-500 truncate">{u.email}</div>
                            </div>
                            <div className="text-xs text-slate-500">{u.source}</div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCommunityGroupModalOpen(false);
                  resetCommunityGroupModal();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCommunityGroupFromModal}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors"
              >
                {editingCommunityConversationId ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// User Stats Modal Component
interface UserStatsModalProps {
  user: UserData;
  onSave: (userId: string, stats: { classesAttended: number; hoursPracticed: number; streak: number }) => void;
  onClose: () => void;
}

const UserStatsModal: React.FC<UserStatsModalProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    classesAttended: user.classesAttended || 0,
    hoursPracticed: user.hoursPracticed || 0,
    streak: user.streak || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Practice Stats</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900 mb-1">{user.name}</p>
            <p className="text-xs text-slate-500 mb-4">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Classes Attended</label>
            <input
              type="number"
              min="0"
              value={formData.classesAttended}
              onChange={(e) => setFormData({ ...formData, classesAttended: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hours Practiced</label>
            <input
              type="number"
              min="0"
              value={formData.hoursPracticed}
              onChange={(e) => setFormData({ ...formData, hoursPracticed: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Streak (Days)</label>
            <input
              type="number"
              min="0"
              value={formData.streak}
              onChange={(e) => setFormData({ ...formData, streak: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold transition-colors"
            >
              Save Stats
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Video Upload Form Component
interface VideoUploadFormProps {
  classId: string;
  currentVideoUrl?: string;
  onUpload: (classId: string, videoUrl: string) => void;
  isUploading: boolean;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ classId, currentVideoUrl, onUpload, isUploading }) => {
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl || '');

  useEffect(() => {
    setVideoUrl(currentVideoUrl || '');
  }, [currentVideoUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      onUpload(classId, videoUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 min-w-[400px]">
      <div className="flex-1">
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter video URL (YouTube, Vimeo, etc.)"
          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          disabled={isUploading}
        />
      </div>
      <button
        type="submit"
        disabled={isUploading || !videoUrl.trim()}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Uploading...</span>
          </>
        ) : currentVideoUrl ? (
          <>
            <Edit size={16} />
            <span>Update</span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span>Upload</span>
          </>
        )}
      </button>
    </form>
  );
};

// Asana Form Modal Component
interface AsanaFormModalProps {
  asana: Asana | null;
  onSave: (asana: Asana) => void;
  onClose: () => void;
}

const AsanaFormModal: React.FC<AsanaFormModalProps> = ({ asana, onSave, onClose }) => {
  // Helper to safely initialize form data with defaults for missing fields
  const getInitialFormData = (asanaData: Asana | null): Asana => {
    if (!asanaData) {
      return {
        id: '',
        sanskritName: '',
        englishName: '',
        category: '',
        level: 'Beginner',
        description: '',
        benefits: [''],
        howTo: [''],
        focusCue: '',
        imageUrl: '',
        galleryUrls: [],
      };
    }
    
    return {
      id: asanaData.id || '',
      sanskritName: asanaData.sanskritName || '',
      englishName: asanaData.englishName || '',
      category: asanaData.category || '',
      level: asanaData.level || 'Beginner',
      description: asanaData.description || '',
      benefits: (asanaData.benefits && asanaData.benefits.length > 0) ? [...asanaData.benefits] : [''],
      howTo: (asanaData.howTo && asanaData.howTo.length > 0) ? [...asanaData.howTo] : [''],
      focusCue: asanaData.focusCue || '',
      imageUrl: asanaData.imageUrl || '',
      galleryUrls: (asanaData.galleryUrls && asanaData.galleryUrls.length > 0) ? [...asanaData.galleryUrls] : [],
    };
  };

  const [formData, setFormData] = useState<Asana>(getInitialFormData(asana));

  useEffect(() => {
    setFormData(getInitialFormData(asana));
  }, [asana]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate ID if new asana
    let finalId = formData.id;
    if (!finalId || finalId === '') {
      finalId = formData.englishName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    
    // Filter out empty benefits and howTo
    const cleanBenefits = formData.benefits.filter(b => b.trim() !== '');
    const cleanHowTo = formData.howTo.filter(h => h.trim() !== '');
    const cleanGalleryUrls = (formData.galleryUrls || []).filter(u => u.trim() !== '');
    
    // Ensure at least one benefit and one howTo
    if (cleanBenefits.length === 0 || cleanHowTo.length === 0) {
      alert('Please add at least one benefit and one "How To" step.');
      return;
    }
    
    const finalAsana: Asana = {
      ...formData,
      id: finalId,
      benefits: cleanBenefits,
      howTo: cleanHowTo,
      galleryUrls: cleanGalleryUrls.length > 0 ? cleanGalleryUrls : undefined,
    };
    
    onSave(finalAsana);
  };

  const addBenefit = () => {
    const currentBenefits = formData.benefits && formData.benefits.length > 0 ? formData.benefits : [''];
    setFormData({ ...formData, benefits: [...currentBenefits, ''] });
  };

  const updateBenefit = (index: number, value: string) => {
    const currentBenefits = formData.benefits && formData.benefits.length > 0 ? [...formData.benefits] : [''];
    if (index >= currentBenefits.length) {
      currentBenefits.push('');
    }
    currentBenefits[index] = value;
    setFormData({ ...formData, benefits: currentBenefits });
  };

  const removeBenefit = (index: number) => {
    const currentBenefits = formData.benefits && formData.benefits.length > 0 ? formData.benefits : [''];
    const newBenefits = currentBenefits.filter((_, i) => i !== index);
    // Ensure at least one benefit remains
    setFormData({ ...formData, benefits: newBenefits.length > 0 ? newBenefits : [''] });
  };

  const addHowTo = () => {
    const currentHowTo = formData.howTo && formData.howTo.length > 0 ? formData.howTo : [''];
    setFormData({ ...formData, howTo: [...currentHowTo, ''] });
  };

  const updateHowTo = (index: number, value: string) => {
    const currentHowTo = formData.howTo && formData.howTo.length > 0 ? [...formData.howTo] : [''];
    if (index >= currentHowTo.length) {
      currentHowTo.push('');
    }
    currentHowTo[index] = value;
    setFormData({ ...formData, howTo: currentHowTo });
  };

  const removeHowTo = (index: number) => {
    const currentHowTo = formData.howTo && formData.howTo.length > 0 ? formData.howTo : [''];
    const newHowTo = currentHowTo.filter((_, i) => i !== index);
    // Ensure at least one step remains
    setFormData({ ...formData, howTo: newHowTo.length > 0 ? newHowTo : [''] });
  };

  const addGalleryUrl = () => {
    const currentUrls = formData.galleryUrls && formData.galleryUrls.length > 0 ? formData.galleryUrls : [''];
    setFormData({ ...formData, galleryUrls: [...currentUrls, ''] });
  };

  const updateGalleryUrl = (index: number, value: string) => {
    const currentUrls = formData.galleryUrls && formData.galleryUrls.length > 0 ? [...formData.galleryUrls] : [''];
    if (index >= currentUrls.length) {
      currentUrls.push('');
    }
    currentUrls[index] = value;
    setFormData({ ...formData, galleryUrls: currentUrls });
  };

  const removeGalleryUrl = (index: number) => {
    const currentUrls = formData.galleryUrls && formData.galleryUrls.length > 0 ? formData.galleryUrls : [''];
    const newUrls = currentUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, galleryUrls: newUrls });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {asana ? 'Edit Asana' : 'Add New Asana'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sanskrit Name *</label>
              <input
                type="text"
                required
                value={formData.sanskritName}
                onChange={(e) => setFormData({ ...formData, sanskritName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">English Name *</label>
              <input
                type="text"
                required
                value={formData.englishName}
                onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level *</label>
              <select
                required
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as Asana['level'] })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Beginner–Intermediate">Beginner–Intermediate</option>
                <option value="Intermediate">Intermediate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images (Optional)</label>
            {(formData.galleryUrls && formData.galleryUrls.length > 0 ? formData.galleryUrls : []).map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url || ''}
                  onChange={(e) => updateGalleryUrl(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Gallery Image URL ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeGalleryUrl(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addGalleryUrl}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Gallery Image
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Benefits *</label>
            {(formData.benefits && formData.benefits.length > 0 ? formData.benefits : ['']).map((benefit, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  required
                  value={benefit || ''}
                  onChange={(e) => updateBenefit(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Benefit ${index + 1}`}
                />
                {(formData.benefits?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addBenefit}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Benefit
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">How To Steps *</label>
            {(formData.howTo && formData.howTo.length > 0 ? formData.howTo : ['']).map((step, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  required
                  value={step || ''}
                  onChange={(e) => updateHowTo(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Step ${index + 1}`}
                />
                {(formData.howTo?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHowTo(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addHowTo}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Step
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Focus Cue *</label>
            <input
              type="text"
              required
              value={formData.focusCue}
              onChange={(e) => setFormData({ ...formData, focusCue: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {asana ? 'Update' : 'Create'} Asana
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Instructor Form Modal Component
interface InstructorFormModalProps {
  instructor: Instructor | null;
  onSave: (instructor: Instructor) => void;
  onClose: () => void;
}

const InstructorFormModal: React.FC<InstructorFormModalProps> = ({ instructor, onSave, onClose }) => {
  const [formData, setFormData] = useState<Instructor>(instructor ? { ...instructor } : {
    id: '',
    name: '',
    role: '',
    lineage: '',
    bio: '',
    contact: { phone: '', email: '' },
    social: {},
    specialties: [''],
    education: [''],
    achievements: [],
    experience: [],
  });
  const [isUploadingInstructorImage, setIsUploadingInstructorImage] = useState(false);

  useEffect(() => {
    if (instructor) {
      setFormData({ ...instructor });
    } else {
      setFormData({
        id: '',
        name: '',
        role: '',
        lineage: '',
        bio: '',
        contact: { phone: '', email: '' },
        social: {},
        specialties: [''],
        education: [''],
        achievements: [],
        experience: [],
      });
    }
  }, [instructor]);

  const getAvatarText = (name: string) => {
    const compact = (name || '').replace(/\s+/g, '');
    const firstTwo = compact.slice(0, 2).toUpperCase();
    if (firstTwo.length === 2) return firstTwo;
    const initials = (name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return initials || firstTwo || 'IN';
  };

  const handleInstructorImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const base = (formData.id || formData.name || 'instructor')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'instructor';

    const safeName = (file.name || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `instructors/${base}/${Date.now()}-${safeName}`;

    try {
      setIsUploadingInstructorImage(true);
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      console.error('❌ Instructor image upload failed:', error);
      alert(`Failed to upload image: ${error?.message || 'Please try again.'}`);
    } finally {
      setIsUploadingInstructorImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploadingInstructorImage) {
      alert('Image upload in progress. Please wait.');
      return;
    }
    
    // Filter out empty array items
    const cleanSpecialties = (formData.specialties || []).filter(s => s.trim() !== '');
    const cleanEducation = (formData.education || []).filter(e => e.trim() !== '');
    const cleanAchievements = (formData.achievements || []).filter(a => a.trim() !== '');
    const cleanExperience = (formData.experience || []).filter(e => e.trim() !== '');
    
    // Ensure at least one specialty
    if (cleanSpecialties.length === 0) {
      alert('Please add at least one specialty.');
      return;
    }
    
    const finalInstructor: Instructor = {
      ...formData,
      imageUrl: formData.imageUrl && formData.imageUrl.trim().length > 0 ? formData.imageUrl.trim() : undefined,
      specialties: cleanSpecialties,
      education: cleanEducation,
      achievements: cleanAchievements.length > 0 ? cleanAchievements : undefined,
      experience: cleanExperience.length > 0 ? cleanExperience : undefined,
    };
    
    onSave(finalInstructor);
  };

  const addArrayItem = (field: 'specialties' | 'education' | 'achievements' | 'experience') => {
    setFormData({ ...formData, [field]: [...(formData[field] || []), ''] });
  };

  const updateArrayItem = (field: 'specialties' | 'education' | 'achievements' | 'experience', index: number, value: string) => {
    const newArray = [...(formData[field] || [])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const removeArrayItem = (field: 'specialties' | 'education' | 'achievements' | 'experience', index: number) => {
    const newArray = (formData[field] || []).filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {instructor ? 'Edit Instructor' : 'Add New Instructor'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 overflow-hidden flex items-center justify-center text-teal-700 font-serif text-xl font-bold border border-slate-100">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt={formData.name || 'Instructor'} className="w-full h-full object-cover" />
                ) : (
                  <span>{getAvatarText(formData.name)}</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isUploadingInstructorImage ? 'bg-slate-200 text-slate-500' : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingInstructorImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleInstructorImageUpload(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  {isUploadingInstructorImage ? 'Uploading...' : 'Upload Photo'}
                </label>
                {formData.imageUrl && formData.imageUrl.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: undefined }))}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lineage *</label>
            <input
              type="text"
              required
              value={formData.lineage}
              onChange={(e) => setFormData({ ...formData, lineage: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio *</label>
            <textarea
              required
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.contact?.email || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, email: e.target.value, phone: formData.contact?.phone || '' }
                })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.contact?.phone || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone: e.target.value, email: formData.contact?.email || '' }
                })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Instagram</label>
              <input
                type="text"
                value={formData.social?.instagram || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social: { ...formData.social, instagram: e.target.value }
                })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">YouTube</label>
              <input
                type="text"
                value={formData.social?.youtube || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social: { ...formData.social, youtube: e.target.value }
                })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Specialties *</label>
            {(formData.specialties && formData.specialties.length > 0 ? formData.specialties : ['']).map((spec, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  required={index === 0}
                  value={spec}
                  onChange={(e) => updateArrayItem('specialties', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Specialty ${index + 1}`}
                />
                {(formData.specialties?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('specialties', index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('specialties')}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Specialty
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
            {(formData.education && formData.education.length > 0 ? formData.education : ['']).map((edu, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={edu}
                  onChange={(e) => updateArrayItem('education', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Education ${index + 1}`}
                />
                {(formData.education?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('education', index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('education')}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Education
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Achievements (Optional)</label>
            {(formData.achievements && formData.achievements.length > 0 ? formData.achievements : ['']).map((ach, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ach}
                  onChange={(e) => updateArrayItem('achievements', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Achievement ${index + 1}`}
                />
                {(formData.achievements?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('achievements', index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('achievements')}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Achievement
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Experience (Optional)</label>
            {(formData.experience && formData.experience.length > 0 ? formData.experience : ['']).map((exp, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={exp}
                  onChange={(e) => updateArrayItem('experience', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Experience ${index + 1}`}
                />
                {(formData.experience?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('experience', index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('experience')}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Experience
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {instructor ? 'Update' : 'Create'} Instructor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Research Form Modal Component
interface ResearchFormModalProps {
  topic: ResearchTopic | null;
  onSave: (topic: ResearchTopic) => void;
  onClose: () => void;
}

const ResearchFormModal: React.FC<ResearchFormModalProps> = ({ topic, onSave, onClose }) => {
  // Helper to safely initialize form data with defaults for missing fields
  const getInitialFormData = (topicData: ResearchTopic | null): ResearchTopic => {
    if (!topicData) {
      return {
        id: '',
        benefit: '',
        description: '',
        papers: [{ title: '', url: '' }],
      };
    }
    
    return {
      id: topicData.id || '',
      benefit: topicData.benefit || '',
      description: topicData.description || '',
      papers: (topicData.papers && topicData.papers.length > 0) ? [...topicData.papers] : [{ title: '', url: '' }],
    };
  };

  const [formData, setFormData] = useState<ResearchTopic>(getInitialFormData(topic));

  useEffect(() => {
    setFormData(getInitialFormData(topic));
  }, [topic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate ID if new topic
    let finalId = formData.id;
    if (!finalId || finalId === '') {
      finalId = formData.benefit.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    
    // Filter out empty papers
    const cleanPapers = formData.papers.filter(p => p.title.trim() !== '' && p.url.trim() !== '');
    
    // Ensure at least one paper
    if (cleanPapers.length === 0) {
      alert('Please add at least one research paper with both title and URL.');
      return;
    }
    
    const finalTopic: ResearchTopic = {
      ...formData,
      id: finalId,
      papers: cleanPapers,
    };
    
    onSave(finalTopic);
  };

  const addPaper = () => {
    const currentPapers = formData.papers && formData.papers.length > 0 ? formData.papers : [{ title: '', url: '' }];
    setFormData({ ...formData, papers: [...currentPapers, { title: '', url: '' }] });
  };

  const updatePaper = (index: number, field: 'title' | 'url', value: string) => {
    const currentPapers = formData.papers && formData.papers.length > 0 ? [...formData.papers] : [{ title: '', url: '' }];
    if (index >= currentPapers.length) {
      currentPapers.push({ title: '', url: '' });
    }
    currentPapers[index] = { ...currentPapers[index], [field]: value };
    setFormData({ ...formData, papers: currentPapers });
  };

  const removePaper = (index: number) => {
    const currentPapers = formData.papers && formData.papers.length > 0 ? formData.papers : [{ title: '', url: '' }];
    const newPapers = currentPapers.filter((_, i) => i !== index);
    // Ensure at least one paper remains
    setFormData({ ...formData, papers: newPapers.length > 0 ? newPapers : [{ title: '', url: '' }] });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {topic ? 'Edit Research Topic' : 'Add New Research Topic'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Benefit *</label>
            <input
              type="text"
              required
              value={formData.benefit}
              onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Anxiety Reduction"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Describe the research finding..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Research Papers *</label>
            {(formData.papers && formData.papers.length > 0 ? formData.papers : [{ title: '', url: '' }]).map((paper, index) => (
              <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Paper {index + 1}</span>
                  {(formData.papers?.length || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => removePaper(index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={paper.title || ''}
                    onChange={(e) => updatePaper(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Research paper title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">URL *</label>
                  <input
                    type="url"
                    required
                    value={paper.url || ''}
                    onChange={(e) => updatePaper(index, 'url', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPaper}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Research Paper
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {topic ? 'Update' : 'Create'} Research Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface JourneyStepModalProps {
  step: JourneyTimelineStepSettings;
  iconOptions: JourneyIconName[];
  onSave: (step: JourneyTimelineStepSettings) => void;
  onClose: () => void;
  isEditing: boolean;
}

const JourneyStepModal: React.FC<JourneyStepModalProps> = ({ step, iconOptions, onSave, onClose, isEditing }) => {
  const getInitial = (s: JourneyTimelineStepSettings): JourneyTimelineStepSettings => ({
    month: s.month || '',
    title: s.title || '',
    outcomes: (s.outcomes && s.outcomes.length > 0 ? [...s.outcomes] : ['']).map((o) => o ?? ''),
    iconName: s.iconName || 'Moon',
    testimonial: {
      text: s.testimonial?.text || '',
      author: s.testimonial?.author || '',
    },
    metrics:
      s.metrics && s.metrics.length > 0
        ? s.metrics.map((m) => ({ label: m?.label || '', value: m?.value || '' }))
        : [{ label: '', value: '' }],
  });

  const [formData, setFormData] = useState<JourneyTimelineStepSettings>(getInitial(step));

  useEffect(() => {
    setFormData(getInitial(step));
  }, [step]);

  const updateOutcome = (index: number, value: string) => {
    const current = formData.outcomes && formData.outcomes.length > 0 ? [...formData.outcomes] : [''];
    if (index >= current.length) current.push('');
    current[index] = value;
    setFormData({ ...formData, outcomes: current });
  };

  const addOutcome = () => {
    const current = formData.outcomes && formData.outcomes.length > 0 ? formData.outcomes : [''];
    setFormData({ ...formData, outcomes: [...current, ''] });
  };

  const removeOutcome = (index: number) => {
    const current = formData.outcomes && formData.outcomes.length > 0 ? formData.outcomes : [''];
    const next = current.filter((_, i) => i !== index);
    setFormData({ ...formData, outcomes: next.length > 0 ? next : [''] });
  };

  const updateMetric = (index: number, field: 'label' | 'value', value: string) => {
    const current = formData.metrics && formData.metrics.length > 0 ? [...formData.metrics] : [{ label: '', value: '' }];
    if (index >= current.length) current.push({ label: '', value: '' });
    current[index] = { ...current[index], [field]: value };
    setFormData({ ...formData, metrics: current });
  };

  const addMetric = () => {
    const current = formData.metrics && formData.metrics.length > 0 ? formData.metrics : [{ label: '', value: '' }];
    setFormData({ ...formData, metrics: [...current, { label: '', value: '' }] });
  };

  const removeMetric = (index: number) => {
    const current = formData.metrics && formData.metrics.length > 0 ? formData.metrics : [{ label: '', value: '' }];
    const next = current.filter((_, i) => i !== index);
    setFormData({ ...formData, metrics: next.length > 0 ? next : [{ label: '', value: '' }] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.month.trim() || !formData.title.trim()) {
      alert('Please fill in Month and Title.');
      return;
    }
    onSave({
      ...formData,
      outcomes: (formData.outcomes || []).map((o) => (o || '').trim()).filter((o) => o.length > 0),
      metrics: (formData.metrics || [])
        .map((m) => ({ label: (m.label || '').trim(), value: (m.value || '').trim() }))
        .filter((m) => m.label.length > 0 && m.value.length > 0),
      testimonial: {
        text: (formData.testimonial?.text || '').trim(),
        author: (formData.testimonial?.author || '').trim(),
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Timeline Step' : 'Add Timeline Step'}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Month *</label>
              <input
                type="text"
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Month 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Icon *</label>
              <select
                required
                value={formData.iconName}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value as JourneyIconName })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {iconOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Watch Link / Video URL (Optional)</label>
            <input
              type="url"
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. https://youtube.com/watch?v=... or Zoom link"
            />
            <p className="mt-1 text-xs text-slate-500">If provided, the "Watch Now" button will link to this URL.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Outcomes *</label>
            {(formData.outcomes && formData.outcomes.length > 0 ? formData.outcomes : ['']).map((o, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  required={idx === 0}
                  value={o}
                  onChange={(e) => updateOutcome(idx, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Outcome ${idx + 1}`}
                />
                {(formData.outcomes?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(idx)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOutcome}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Outcome
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Testimonial Text</label>
              <textarea
                rows={4}
                value={formData.testimonial.text}
                onChange={(e) =>
                  setFormData({ ...formData, testimonial: { ...formData.testimonial, text: e.target.value } })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Testimonial Author</label>
              <input
                type="text"
                value={formData.testimonial.author}
                onChange={(e) =>
                  setFormData({ ...formData, testimonial: { ...formData.testimonial, author: e.target.value } })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Sarah J., 34"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Metrics</label>
            {(formData.metrics && formData.metrics.length > 0 ? formData.metrics : [{ label: '', value: '' }]).map((m, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={m.label}
                  onChange={(e) => updateMetric(idx, 'label', e.target.value)}
                  className="md:col-span-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={m.value}
                  onChange={(e) => updateMetric(idx, 'value', e.target.value)}
                  className="md:col-span-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Value"
                />
                <div className="md:col-span-1">
                  {(formData.metrics?.length || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMetric(idx)}
                      className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMetric}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Metric
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              {isEditing ? 'Update' : 'Add'} Step
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Class Form Modal Component
interface ClassFormModalProps {
  classData: ManagedYogaClass | null;
  instructors: Instructor[];
  onSave: (cls: ManagedYogaClass) => void;
  onClose: () => void;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ classData, instructors, onSave, onClose }) => {
  const getInitialFormData = (data: ManagedYogaClass | null): ManagedYogaClass => {
    if (!data) {
      return {
        id: '',
        title: '',
        instructor: '',
        level: 'Beginner',
        duration: '',
        time: '',
        type: 'Hatha',
        focus: [''],
        category: 'live',
        videoUrl: '',
      };
    }

    const focus = (data.focus && data.focus.length > 0) ? [...data.focus] : [''];
    const isLive = data.category === 'live';

    return {
      id: data.id || '',
      title: data.title || '',
      instructor: data.instructor || '',
      level: data.level || 'Beginner',
      duration: data.duration || '',
      time: isLive ? (data.time || '') : undefined,
      type: data.type || 'Hatha',
      focus,
      category: data.category || 'live',
      videoUrl: data.videoUrl || '',
    };
  };

  const [formData, setFormData] = useState<ManagedYogaClass>(getInitialFormData(classData));
  const [instructorMode, setInstructorMode] = useState<'select' | 'custom'>('select');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [timeMode, setTimeMode] = useState<'select' | 'custom'>('select');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM' | ''>('');

  const parseTimeValue = (raw: string) => {
    const value = (raw || '').trim();
    if (value === '') {
      return { mode: 'select' as const, date: '', hour: '', minute: '', period: '' as const };
    }

    const withDate = value.match(/^(\d{4}-\d{2}-\d{2})\s*(?:•|-)?\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (withDate) {
      const [, date, hourRaw, minute, periodRaw] = withDate;
      const hour = String(parseInt(hourRaw, 10)).padStart(2, '0');
      const period = (periodRaw || '').toUpperCase() as 'AM' | 'PM';
      return { mode: 'select' as const, date, hour, minute, period };
    }

    const timeOnly = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (timeOnly) {
      const [, hourRaw, minute, periodRaw] = timeOnly;
      const hour = String(parseInt(hourRaw, 10)).padStart(2, '0');
      const period = (periodRaw || '').toUpperCase() as 'AM' | 'PM';
      return { mode: 'select' as const, date: '', hour, minute, period };
    }

    return { mode: 'custom' as const, date: '', hour: '', minute: '', period: '' as const };
  };

  const buildTimeValue = (date: string, hour: string, minute: string, period: 'AM' | 'PM' | '') => {
    if (!hour || !minute || !period) return '';
    const base = `${hour}:${minute} ${period}`;
    return date ? `${date} ${base}` : base;
  };

  useEffect(() => {
    const next = getInitialFormData(classData);
    setFormData(next);
    if (next.category !== 'live') {
      setTimeMode('select');
      setSelectedDate('');
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedPeriod('');
      return;
    }
    const parsed = parseTimeValue(next.time || '');
    setTimeMode(parsed.mode);
    setSelectedDate(parsed.date);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [classData]);

  useEffect(() => {
    const current = (formData.instructor || '').trim();
    const normalized = current.toLowerCase();
    const match = (instructors || []).find((i) => (i.name || '').trim().toLowerCase() === normalized);
    if (match) {
      setInstructorMode('select');
      setSelectedInstructor(match.name);
      return;
    }
    setInstructorMode('custom');
    setSelectedInstructor('');
  }, [formData.instructor, instructors]);

  useEffect(() => {
    if (formData.category !== 'live') {
      setTimeMode('select');
      setSelectedDate('');
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedPeriod('');
      return;
    }
    if (timeMode !== 'select') return;
    const next = buildTimeValue(selectedDate, selectedHour, selectedMinute, selectedPeriod);
    if ((formData.time || '') !== next) {
      setFormData({ ...formData, time: next });
    }
  }, [formData, formData.category, selectedDate, selectedHour, selectedMinute, selectedPeriod, timeMode]);

  const addFocus = () => {
    setFormData({ ...formData, focus: [...(formData.focus || ['']), ''] });
  };

  const updateFocus = (index: number, value: string) => {
    const next = [...(formData.focus || [''])];
    next[index] = value;
    setFormData({ ...formData, focus: next });
  };

  const removeFocus = (index: number) => {
    const next = (formData.focus || ['']).filter((_, i) => i !== index);
    setFormData({ ...formData, focus: next.length > 0 ? next : [''] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFocus = (formData.focus || []).filter(f => f.trim() !== '');
    if (cleanFocus.length === 0) {
      alert('Please add at least one focus item.');
      return;
    }

    if (formData.category === 'live' && (!formData.time || formData.time.trim() === '')) {
      alert('Please add a time for live classes.');
      return;
    }

    let finalId = formData.id;
    if (!finalId || finalId === '') {
      finalId = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const finalClass: ManagedYogaClass = {
      ...formData,
      id: finalId,
      focus: cleanFocus,
      time: formData.category === 'live' ? (formData.time || '').trim() : undefined,
    };

    onSave(finalClass);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {classData ? 'Edit Class' : 'Add New Class'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const category = e.target.value as ManagedYogaClass['category'];
                  setFormData({
                    ...formData,
                    category,
                    time: category === 'live' ? (formData.time || '') : undefined,
                  });
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="live">Live</option>
                <option value="recorded">Recorded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as YogaClass['level'] })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="All">All</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Watch Link / Video URL (Optional)</label>
            <input
              type="url"
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. https://youtube.com/watch?v=... or Zoom link"
            />
            <p className="mt-1 text-xs text-slate-500">If provided, the "Watch Now" button will link to this URL.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Instructor *</label>
              <div className="space-y-3">
                <select
                  value={instructorMode === 'select' ? selectedInstructor : '__custom__'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__custom__') {
                      setInstructorMode('custom');
                      setSelectedInstructor('');
                      setFormData({ ...formData, instructor: formData.instructor || '' });
                      return;
                    }
                    setInstructorMode('select');
                    setSelectedInstructor(value);
                    setFormData({ ...formData, instructor: value });
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="" disabled>
                    Select instructor
                  </option>
                  {(instructors || [])
                    .filter((i) => !i.deleted)
                    .slice()
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  <option value="__custom__">Custom</option>
                </select>
                {instructorMode === 'custom' && (
                  <input
                    type="text"
                    required
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter instructor name"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as YogaClass['type'] })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Hatha">Hatha</option>
                <option value="Vinyasa">Vinyasa</option>
                <option value="Meditation">Meditation</option>
                <option value="Mobility">Mobility</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.category === 'live' ? 'Duration (optional)' : 'Duration *'}
              </label>
              <input
                type="text"
                required={formData.category !== 'live'}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 45 min"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.category === 'live' ? 'Time *' : 'Time (not used)'}
              </label>
              {formData.category !== 'live' ? (
                <input
                  type="text"
                  value=""
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                  placeholder="Not used for recorded classes"
                  disabled
                />
              ) : (
                <div className="space-y-3">
                  <select
                    value={timeMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as 'select' | 'custom';
                      setTimeMode(nextMode);
                      if (nextMode === 'select') {
                        const parsed = parseTimeValue(formData.time || '');
                        setSelectedDate(parsed.date);
                        setSelectedHour(parsed.hour);
                        setSelectedMinute(parsed.minute);
                        setSelectedPeriod(parsed.period);
                        const built = buildTimeValue(parsed.date, parsed.hour, parsed.minute, parsed.period);
                        setFormData({ ...formData, time: built });
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="select">Pick date & time</option>
                    <option value="custom">Custom</option>
                  </select>

                  {timeMode === 'select' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Date (optional)</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Time *</label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={selectedHour}
                            onChange={(e) => setSelectedHour(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="" disabled>
                              HH
                            </option>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedMinute}
                            onChange={(e) => setSelectedMinute(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="" disabled>
                              MM
                            </option>
                            {['00', '15', '30', '45'].map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="" disabled>
                              AM/PM
                            </option>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.time || ''}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="e.g., Mon/Wed/Fri 6:00 AM"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Focus *</label>
            {(formData.focus && formData.focus.length > 0 ? formData.focus : ['']).map((focus, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  required={index === 0}
                  value={focus}
                  onChange={(e) => updateFocus(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={`Focus ${index + 1}`}
                />
                {(formData.focus?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFocus(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFocus}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Focus
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {classData ? 'Update' : 'Create'} Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
