// Contact Form Firebase Integration
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';


export interface ContactFormData {
  name: string;
  email: string;
  inquiryType: string;
  message: string;
}

/**
 * Save contact form submission to Firestore
 * @param formData - The contact form data
 * @returns Promise that resolves with the document ID on success
 */
export const saveContactMessage = async (formData: ContactFormData): Promise<string> => {
  try {
    // Validate input data
    if (!formData.name || !formData.email || !formData.message) {
      throw new Error('All fields are required');
    }

    // Check if db is initialized
    if (!db) {
      console.error('❌ Firestore db is not initialized!');
      throw new Error('Database not initialized. Please refresh the page.');
    }

    console.log('📦 Firestore db object:', db);
    console.log('📦 Firestore project ID:', db.app.options.projectId);

    // Prepare data - start with ONLY the required fields (no serverTimestamp for now)
    const contactData: any = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      message: formData.message.trim(),
      inquiryType: formData.inquiryType || 'General Inquiry',
      status: "new",
      createdAt: new Date().toISOString(),
      source: "website_contact_form"
    };
    
    // Skip serverTimestamp for now - it might be causing issues
    // contactData.timestamp = serverTimestamp();

    console.log("📝 Attempting to save contact form:", {
      name: contactData.name,
      email: contactData.email,
      inquiryType: contactData.inquiryType,
      messageLength: contactData.message.length,
      status: contactData.status,
      createdAt: contactData.createdAt,
      source: contactData.source,
      hasTimestamp: contactData.timestamp !== undefined
    });
    
    console.log("📤 Calling addDoc...");
    const contactCollection = collection(db, "contact_form");
    console.log("📂 Collection reference:", contactCollection);
    console.log("📂 Collection path:", contactCollection.path);
    console.log("📂 Firestore app:", db.app.name);
    
    // Add timeout wrapper to catch hanging requests
    const addDocPromise = addDoc(contactCollection, contactData);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore write timed out after 10 seconds')), 10000)
    );
    
    const docRef = await Promise.race([addDocPromise, timeoutPromise]) as any;
    
    console.log("✅ Contact form submission saved with ID: ", docRef.id);
    console.log("✅ Document path: ", docRef.path);
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error saving contact form:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Provide more detailed error message
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service unavailable. Please check your internet connection.');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Database error. Please try again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error(`Failed to send message: ${error.code || 'Unknown error'}. Please try again later.`);
    }
  }
};
