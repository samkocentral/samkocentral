import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your-project-id' &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key'
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined' && !isFirebaseConfigured()) {
    return null;
  }
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore | null {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

export function getAuthInstance(): Auth | null {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      auth = getAuth(firebaseApp);
    }
  }
  return auth;
}

export function getStorageInstance(): FirebaseStorage | null {
  if (!storage) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      storage = getStorage(firebaseApp);
    }
  }
  return storage;
}
