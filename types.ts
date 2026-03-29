
import { LucideIcon } from 'lucide-react';

export interface Metric {
  label: string;
  value: string;
  trend: 'up' | 'down';
}

export interface TimelinePhase {
  month: string;
  title: string;
  outcomes: string[];
  icon: LucideIcon;
  testimonial: {
    text: string;
    author: string;
  };
  metrics: {
    label: string;
    value: string;
  }[];
}

export type JourneyIconName =
  | 'Moon'
  | 'Brain'
  | 'Activity'
  | 'User'
  | 'Battery'
  | 'ShieldCheck'
  | 'Heart'
  | 'Trees';

export interface JourneyListItemSettings {
  text: string;
  iconName: JourneyIconName;
}

export interface JourneyTimelineMetricSettings {
  label: string;
  value: string;
}

export interface JourneyTimelineStepSettings {
  month: string;
  title: string;
  outcomes: string[];
  iconName: JourneyIconName;
  testimonial: {
    text: string;
    author: string;
  };
  metrics: JourneyTimelineMetricSettings[];
  videoUrl?: string;
}

export interface JourneySettings {
  problemSolutionTitle: string;
  problemSolutionSubtitle: string;
  problemsHeading: string;
  solutionsHeading: string;
  problems: JourneyListItemSettings[];
  solutions: JourneyListItemSettings[];
  timelineTitle: string;
  timelineSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  steps: JourneyTimelineStepSettings[];
}

export interface ClassSession {
  day: string;
  focus: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
}

export interface YogaClass {
  id: string;
  title: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'All';
  duration: string;
  time?: string;
  type: 'Hatha' | 'Vinyasa' | 'Meditation' | 'Mobility';
  focus: string[];
  videoUrl?: string;
  deleted?: boolean;
}

export interface Track {
  id: string;
  title: string;
  category: 'Sleep' | 'Focus' | 'Healing' | 'Chant';
  duration: string;
  audioUrl: string;
  description: string;
  instructor?: string;
}

export interface Instructor {
  id: string;
  name: string;
  role: string;
  lineage: string;
  bio: string;
  imageUrl?: string;
  contact?: {
    phone: string;
    email: string;
  };
  social?: {
    instagram?: string;
    youtube?: string;
  };
  specialties: string[];
  education: string[];
  achievements?: string[];
  experience?: string[];
  deleted?: boolean;
}

export interface PricingTier {
  name: string;
  price: string;
  frequency: string;
  features: string[];
  isRecommended: boolean;
  buttonText: string;
}

export interface Asana {
  id: string;
  sanskritName: string;
  englishName: string;
  category: string;
  level: 'Beginner' | 'Beginner–Intermediate' | 'Intermediate';
  description: string;
  benefits: string[];
  howTo: string[];
  focusCue: string;
  imageUrl?: string;
  galleryUrls?: string[];
  commonMistakes?: string[];
  instructorTip?: string;
  deleted?: boolean;
}

export interface ResearchPaper {
  title: string;
  url: string;
}

export interface ResearchTopic {
  id: string;
  benefit: string;
  description: string;
  papers: ResearchPaper[];
}
