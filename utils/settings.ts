// Settings management for admin controls
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';

import type { JourneySettings, PricingTier } from '../types';

export interface CommunityAttachment {
  name: string;
  type: string;
}

export interface CommunityChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isMe: boolean;
  attachment?: CommunityAttachment;
}

export interface CommunityConversation {
  id: string;
  author: string;
  avatar: string;
  lastText: string;
  time: string;
  unreadCount?: number;
  isGroup?: boolean;
  members?: number;
  memberIds?: string[];
  isSupportGroup?: boolean;
}

export interface CommunitySettings {
  pageTitle: string;
  pageSubtitle: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  conversations: CommunityConversation[];
  histories: Record<string, CommunityChatMessage[]>;
}

export const DEFAULT_COMMUNITY_SETTINGS: CommunitySettings = {
  pageTitle: 'Community',
  pageSubtitle: 'Connect with fellow yogis, share experiences, and grow together.',
  welcomeTitle: 'Welcome to Community Chat',
  welcomeSubtitle: 'Select a conversation from the sidebar to start chatting with fellow practitioners and instructors.',
  conversations: [
    {
      id: 'support',
      author: 'Support Group',
      avatar: 'SG',
      lastText: "Remember: You're not alone in this journey...",
      time: 'Just now',
      unreadCount: 3,
      isGroup: true,
      isSupportGroup: true,
      members: 24,
    },
    {
      id: '2',
      author: "Beginner's Circle",
      avatar: 'BC',
      lastText: 'I use the Manduka PROlite and...',
      time: '1h',
      unreadCount: 2,
      isGroup: true,
      members: 5,
    },
  ],
  histories: {
    support: [
      {
        id: 's1',
        sender: 'Pawan (Instructor)',
        avatar: 'PN',
        text: "Welcome to the Support Group! This is a safe space for sharing challenges, victories, and everything in between. Remember: progress isn't linear, and every small step counts. 🙏",
        time: '9:00 AM',
        isMe: false,
      },
      {
        id: 's2',
        sender: 'Elena D.',
        avatar: 'ED',
        text: "Thank you for creating this space. I've been struggling with consistency this week. Any tips?",
        time: '9:15 AM',
        isMe: false,
      },
      {
        id: 's3',
        sender: 'Michael T.',
        avatar: 'MT',
        text: "Elena, I found that setting a specific time each day helps. Even if it's just 10 minutes, consistency beats intensity. You've got this! 💪",
        time: '9:20 AM',
        isMe: false,
      },
      {
        id: 's4',
        sender: 'Priya S.',
        avatar: 'PS',
        text: 'I had a breakthrough today! After 3 months, I finally touched my toes without bending my knees. Small wins matter! 🎉',
        time: '10:00 AM',
        isMe: false,
      },
      {
        id: 's5',
        sender: 'Alex M.',
        avatar: 'AM',
        text: "That's amazing, Priya! Celebrating with you. This group has been such a source of motivation for me.",
        time: '10:05 AM',
        isMe: false,
      },
      {
        id: 's6',
        sender: 'Support Group',
        avatar: 'SG',
        text: "Remember: You're not alone in this journey. We're all here to support each other. If you're having a tough day, reach out - someone is always here to listen. ❤️",
        time: '11:00 AM',
        isMe: false,
      },
    ],
    '2': [
      {
        id: 'g1',
        sender: "Beginner's Circle",
        avatar: 'BC',
        text: "Hey everyone, which mat are you all using? I'm looking to upgrade.",
        time: '1:00 PM',
        isMe: false,
      },
    ],
  },
};

export interface AppSettings {
  classesComingSoon: boolean;
  pricingTiersINR?: PricingTier[];
  pricingTiersUSD?: PricingTier[];
  community?: CommunitySettings;
  journey?: JourneySettings;
  lastUpdated: any;
}

const SETTINGS_DOC_ID = 'app_settings';

/**
 * Get app settings from Firestore
 */
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data() as AppSettings;
    } else {
      // Default settings
      const defaultSettings: AppSettings = {
        classesComingSoon: true, // Default to showing "coming soon"
        lastUpdated: serverTimestamp(),
      };
      // Create default settings
      await setDoc(settingsRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    // Return default on error
    return {
      classesComingSoon: true,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Update app settings in Firestore
 */
export const updateSettings = async (updates: Partial<AppSettings>): Promise<void> => {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(settingsRef, {
      ...updates,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
    console.log('✅ Settings updated:', updates);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};
