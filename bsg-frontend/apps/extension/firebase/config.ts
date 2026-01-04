// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let firebaseApp: FirebaseApp | null = null;

/**
 * Lazily initialize and return the Firebase app instance.
 * Returns null when run on the server or if the required env is missing.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (firebaseApp) return firebaseApp;

  if (!firebaseConfig.apiKey) {
    // Do not initialize Firebase in environments without an API key.
    // This prevents build-time/server-side initialization which causes
    // auth/invalid-api-key errors during next build when env files aren't loaded.
    return null;
  }

  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
}

/**
 * Lazily return an Auth instance, or null if unavailable (server or missing config).
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  // Only set browser persistence in a real browser environment
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserSessionPersistence).catch(() => {});
  }
  return auth;
}


