import { apiClient } from './apiClient';

// Map Firebase collection names to Prisma model names
const FIREBASE_TO_PRISMA: Record<string, string> = {
  'users': 'user',
  'subscription': 'subscription',
  'asanas': 'asana',
  'instructors': 'instructor',
  'classes': 'yogaClass',
  'class_videos': 'classVideo',
  'community_conversations': 'communityConversation',
  'messages': 'communityMessage',
  'research': 'researchTopic',
  'contact_form': 'contactForm',
  'newsletter_subscribers': 'newsletterSubscriber',
  'settings': 'appSetting',
  '_connection_test': 'appSetting' // Dummy for tests
};

export const db: any = {
  _type: 'DB_INSTANCE',
  app: {
    options: {
      projectId: 'yoga-flow-mock'
    },
    name: '[DEFAULT]'
  }
};
export const auth: any = { currentUser: null };
export const storage = null;

// References types
export const collection = (dbInstance: any, name: string, ...rest: any[]) => {
  // Handle subcollections quickly (e.g. community_conversations/ID/messages)
  const isSub = rest.length > 0;
  const collName = isSub ? rest[1] : name;
  const parentId = isSub ? rest[0] : null;
  return { 
    _type: 'collection', 
    name: collName, 
    parentId,
    path: parentId ? `${parentId}/${collName}` : collName
  };
};

export const doc = (dbInstance: any, name: string, id: string, ...rest: any[]) => {
  const isSub = rest.length > 0;
  const collName = isSub ? rest[1] : name;
  const docId = isSub ? rest[2] : id;
  const parentId = isSub ? rest[0] : null;
  return { 
    _type: 'doc', 
    collection: collName, 
    id: docId, 
    parentId,
    path: parentId ? `${parentId}/${collName}/${docId}` : `${collName}/${docId}`
  };
};

// Modifiers (Ignored mostly for proxy, mapped if needed)
export const query = (ref: any, ...args: any[]) => ({ ...ref, _query: args });
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({ type: 'orderBy', field, direction });
export const limit = (count: number) => ({ type: 'limit', count });
export const serverTimestamp = () => new Date().toISOString();

export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }
  static now() {
    return Timestamp.fromDate(new Date());
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
}

// Fetching
export const getDocs = async (ref: any) => {
  const table = FIREBASE_TO_PRISMA[ref.name] || ref.name;
  let filters: any = undefined;
  let ordBy: string | undefined = undefined;
  let ordDir: 'asc' | 'desc' | undefined = undefined;

  // If it's a subcollection like explicitly 'messages', filter by parentId
  if (ref.parentId) {
    if (table === 'communityMessage') {
      filters = { conversationId: ref.parentId };
    }
  }

  if (ref._query) {
    for (const q of ref._query) {
      if (q.type === 'orderBy') {
             ordBy = q.field;
             ordDir = q.direction;
      }
    }
  }

  try {
    const data = await apiClient.get(table, undefined, { filters, orderBy: ordBy, orderDir: ordDir });
    const docs = Array.isArray(data) ? data : [];
    return {
      empty: docs.length === 0,
      docs: docs.map((d: any) => ({
        id: d.id || d.key,
        data: () => d
      })),
      forEach: function(cb: any) { this.docs.forEach(cb); }
    };
  } catch (err) {
    console.error(`Error fetching ${table} from Postgres:`, err);
    return { empty: true, docs: [], forEach: () => {} };
  }
};

export const getDoc = async (ref: any) => {
  const table = FIREBASE_TO_PRISMA[ref.collection] || ref.collection;
  try {
    const data = await apiClient.get(table, ref.id);
    return {
      exists: () => !!data && Object.keys(data).length > 0,
      data: () => data || {},
      id: ref.id
    };
  } catch (err) {
    return { exists: () => false, data: () => ({}), id: ref.id };
  }
};

export const setDoc = async (ref: any, data: any, options?: any) => {
  const table = FIREBASE_TO_PRISMA[ref.collection] || ref.collection;
  // If we are creating a subcollection item, ensure we set the parentId
  if (ref.parentId && table === 'communityMessage') {
     data.conversationId = ref.parentId;
  }
  // Remove complex functions
  const payload = JSON.parse(JSON.stringify(data));
  if (options?.merge) {
    // Treat as update/put
    return apiClient.put(table, ref.id, payload);
  }
  // Try update first, fallback to post
  try {
      await apiClient.put(table, ref.id, payload);
  } catch (e) {
      await apiClient.post(table, { ...payload, id: ref.id });
  }
};

export const addDoc = async (ref: any, data: any) => {
  const table = FIREBASE_TO_PRISMA[ref.name] || ref.name;
  if (ref.parentId && table === 'communityMessage') {
     data.conversationId = ref.parentId;
  }
  const payload = JSON.parse(JSON.stringify(data));
  return apiClient.post(table, payload);
};

export const deleteDoc = async (ref: any) => {
  const table = FIREBASE_TO_PRISMA[ref.collection] || ref.collection;
  return apiClient.delete(table, ref.id);
};

// "Poor man's real-time": execute getDocs, then poll every 6s to simulate onSnapshot
export const onSnapshot = (ref: any, callback: (snapshot: any) => void, errCb?: (err: any) => void) => {
  let isCancelled = false;
  
  const tick = async () => {
    if (isCancelled) return;
    try {
       const snap = await getDocs(ref);
       if (!isCancelled) callback(snap);
    } catch (e) {
       if (errCb && !isCancelled) errCb(e);
    }
  };

  tick(); // Initial fetch
  const interval = setInterval(tick, 6000);

  return () => {
    isCancelled = true;
    clearInterval(interval);
  };
};

export const writeBatch = () => {
  // Minimal stub for writeBatch
  return {
    commit: async () => {},
    set: (ref: any, data: any) => setDoc(ref, data),
    update: (ref: any, data: any) => setDoc(ref, data, { merge: true }),
    delete: (ref: any) => deleteDoc(ref)
  };
};

// Stub storage methods
export const getDownloadURL = async (ref: any) => 'https://mock.url/file';
export const ref = (...args: any[]) => null;
export const storageRef = (...args: any[]) => null;
export const uploadBytes = async (...args: any[]) => null;
export const deleteObject = async (...args: any[]) => null;

