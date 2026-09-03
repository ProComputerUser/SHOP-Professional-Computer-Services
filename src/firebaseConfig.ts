import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

// Configure Firebase settings: prioritize custom environment variables from Vercel / .env
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyCGRdWpPe1wH29KXOWK4mbqppLybKk3iZ0",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0018884710.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0018884710",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0018884710.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "808026589502",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:808026589502:web:c8119192b919a8046b846f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Determine database id:
// Standard Firebase projects on Vercel use the default database (no databaseId parameter or '(default)').
// If custom database ID is explicitly provided, use it; otherwise, fall back to AI Studio's DB ID only if in development.
const customDbId = (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '').trim();
let db: any;

try {
  if (customDbId && customDbId !== '(default)') {
    db = getFirestore(app, customDbId);
  } else if (!metaEnv.VITE_FIREBASE_PROJECT_ID) {
    // Development sandbox fallback
    try {
      db = getFirestore(app, "ai-studio-remixshopprofess-73fd5b49-d14b-4aa0-9465-c705293db9bd");
    } catch {
      db = getFirestore(app);
    }
  } else {
    // Standard Vercel deployment with user's own Firebase project
    db = getFirestore(app);
  }
} catch (dbErr) {
  console.warn('[Firebase] Initializing default firestore instance:', dbErr);
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };

/**
 * Recursively strips undefined fields from an object so that Firestore setDoc/updateDoc/addDoc
 * never throws "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}
