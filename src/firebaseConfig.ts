import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyCGRdWpPe1wH29KXOWK4mbqppLybKk3iZ0",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0018884710.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0018884710",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0018884710.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "808026589502",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:808026589502:web:c8119192b919a8046b846f"
};

const databaseId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-remixshopprofess-73fd5b49-d14b-4aa0-9465-c705293db9bd";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, databaseId);
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
