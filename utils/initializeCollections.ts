// Utility to initialize SQL collections with default data via apiClient
import { apiClient } from './apiClient';
import { ASANAS, RESEARCH_TOPICS, LIVE_CLASSES, RECORDED_CLASSES } from '../constants';

/**
 * Initialize asanas collection with default data
 * Only adds asanas that don't already exist
 */
export const initializeAsanas = async (): Promise<{ added: number; skipped: number }> => {
  try {
    console.log('🧘 Initializing asanas collection in SQL...');
    
    // Get existing asanas via SQL API
    const existingAsanas = await apiClient.get('asana');
    const existingIds = new Set(existingAsanas.map((a: any) => a.id));
    
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
        await apiClient.post('asana', asana);
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
    console.log('🔬 Initializing research collection in SQL...');
    
    // Get existing research topics via SQL API
    const existingResearch = await apiClient.get('researchTopic');
    const existingIds = new Set(existingResearch.map((r: any) => r.id));
    
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
        await apiClient.post('researchTopic', topic);
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
    console.log('📅 Initializing classes collection in SQL...');
    
    // Get existing classes via SQL API
    const existingClasses = await apiClient.get('yogaClass');
    const existingIds = new Set(existingClasses.map((c: any) => c.id));
    
    let added = 0;
    let skipped = 0;
    
    // Combine live and recorded classes with category field
    const allClasses = [
      ...LIVE_CLASSES.map(cls => ({ ...cls, category: 'live' })),
      ...RECORDED_CLASSES.map(cls => ({ ...cls, category: 'recorded' })),
    ];
    
    // Add each class if it doesn't exist
    for (const cls of allClasses) {
      if (existingIds.has(cls.id)) {
        console.log(`⏭️  Skipping ${cls.title} (already exists)`);
        skipped++;
        continue;
      }
      
      try {
        await apiClient.post('yogaClass', cls);
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
    console.log('🚀 Initializing all collections in SQL...');
    
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
