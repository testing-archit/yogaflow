// Utility to initialize Firestore collections with default data
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';

import { ASANAS, RESEARCH_TOPICS, LIVE_CLASSES, RECORDED_CLASSES } from '../constants';
import { Asana, ResearchTopic, YogaClass } from '../types';

/**
 * Initialize asanas collection with default data
 * Only adds asanas that don't already exist
 */
export const initializeAsanas = async (): Promise<{ added: number; skipped: number }> => {
  try {
    console.log('🧘 Initializing asanas collection...');
    
    // Get existing asanas
    const existingSnapshot = await getDocs(collection(db, 'asanas'));
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
    
    let added = 0;
    let skipped = 0;
    
    // Add each asana if it doesn't exist
    for (const asana of ASANAS) {
      if (existingIds.has(asana.id)) {
        console.log(`⏭️  Skipping ${asana.englishName} (already exists)`);
        skipped++;
        continue;
      }
      
      try {
        await setDoc(doc(db, 'asanas', asana.id), {
          ...asana,
          createdAt: new Date().toISOString(),
        });
        console.log(`✅ Added asana: ${asana.englishName} (${asana.id})`);
        added++;
      } catch (error: any) {
        console.error(`❌ Error adding asana ${asana.id}:`, error);
      }
    }
    
    console.log(`✅ Asanas initialization complete: ${added} added, ${skipped} skipped`);
    return { added, skipped };
  } catch (error: any) {
    console.error('❌ Error initializing asanas:', error);
    throw error;
  }
};

/**
 * Initialize research collection with default data
 * Only adds research topics that don't already exist
 */
export const initializeResearch = async (): Promise<{ added: number; skipped: number }> => {
  try {
    console.log('🔬 Initializing research collection...');
    
    // Get existing research topics
    const existingSnapshot = await getDocs(collection(db, 'research'));
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
    
    let added = 0;
    let skipped = 0;
    
    // Add each research topic if it doesn't exist
    for (const topic of RESEARCH_TOPICS) {
      if (existingIds.has(topic.id)) {
        console.log(`⏭️  Skipping ${topic.benefit} (already exists)`);
        skipped++;
        continue;
      }
      
      try {
        await setDoc(doc(db, 'research', topic.id), {
          ...topic,
          createdAt: new Date().toISOString(),
        });
        console.log(`✅ Added research topic: ${topic.benefit} (${topic.id})`);
        added++;
      } catch (error: any) {
        console.error(`❌ Error adding research topic ${topic.id}:`, error);
      }
    }
    
    console.log(`✅ Research initialization complete: ${added} added, ${skipped} skipped`);
    return { added, skipped };
  } catch (error: any) {
    console.error('❌ Error initializing research:', error);
    throw error;
  }
};

/**
 * Initialize classes collection with default data
 * Only adds classes that don't already exist
 */
export const initializeClasses = async (): Promise<{ added: number; skipped: number }> => {
  try {
    console.log('📅 Initializing classes collection...');
    
    // Get existing classes
    const existingSnapshot = await getDocs(collection(db, 'classes'));
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
    
    let added = 0;
    let skipped = 0;
    
    // Combine live and recorded classes with category field
    const allClasses: (YogaClass & { category: 'live' | 'recorded' })[] = [
      ...LIVE_CLASSES.map(cls => ({ ...cls, category: 'live' as const })),
      ...RECORDED_CLASSES.map(cls => ({ ...cls, category: 'recorded' as const })),
    ];
    
    // Add each class if it doesn't exist
    for (const cls of allClasses) {
      if (existingIds.has(cls.id)) {
        console.log(`⏭️  Skipping ${cls.title} (already exists)`);
        skipped++;
        continue;
      }
      
      try {
        await setDoc(doc(db, 'classes', cls.id), {
          ...cls,
          createdAt: new Date().toISOString(),
        });
        console.log(`✅ Added class: ${cls.title} (${cls.id})`);
        added++;
      } catch (error: any) {
        console.error(`❌ Error adding class ${cls.id}:`, error);
      }
    }
    
    console.log(`✅ Classes initialization complete: ${added} added, ${skipped} skipped`);
    return { added, skipped };
  } catch (error: any) {
    console.error('❌ Error initializing classes:', error);
    throw error;
  }
};

/**
 * Initialize both asanas and research collections
 */
export const initializeAllCollections = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing all collections...');
    
    const asanasResult = await initializeAsanas();
    const researchResult = await initializeResearch();
    const classesResult = await initializeClasses();
    
    console.log('✅ All collections initialized:');
    console.log(`   - Asanas: ${asanasResult.added} added, ${asanasResult.skipped} skipped`);
    console.log(`   - Research: ${researchResult.added} added, ${researchResult.skipped} skipped`);
    console.log(`   - Classes: ${classesResult.added} added, ${classesResult.skipped} skipped`);
    
    return Promise.resolve();
  } catch (error: any) {
    console.error('❌ Error initializing collections:', error);
    throw error;
  }
};
