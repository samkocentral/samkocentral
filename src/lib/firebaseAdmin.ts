import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

export function isAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Firebase Admin MUST have a valid private key to avoid hanging on GCP metadata server
  if (
    projectId &&
    clientEmail &&
    privateKey &&
    privateKey.trim().length > 50 &&
    privateKey.includes('PRIVATE KEY')
  ) {
    return true;
  }
  return false;
}

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;

  // Do NOT initialize Admin SDK without full credentials, otherwise it hangs 15s on metadata server
  if (!isAdminConfigured()) {
    return null;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
    });
    return adminApp;
  } catch (error) {
    console.warn('[Firebase Admin] Initialization failed:', error);
  }

  return null;
}

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;
  const app = getAdminApp();
  if (app) {
    try {
      adminDb = getFirestore(app);
      return adminDb;
    } catch (e) {
      console.warn('[Firebase Admin] Firestore init failed:', e);
    }
  }
  return null;
}
