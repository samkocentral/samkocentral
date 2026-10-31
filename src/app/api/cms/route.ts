import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_DEEP_CMS, DeepAppCMSStore } from '@/lib/deepPageCms';

const CMS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'samko_cms.json');
const APP_CMS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'samko_app_cms.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'deep_cms';

  // Handle Application Navigation / Portal CMS
  if (type === 'app_cms') {
    const adminDb = getAdminDb();
    if (adminDb) {
      try {
        const snap = await adminDb.collection('cms').doc('app_cms').get();
        if (snap.exists) {
          return NextResponse.json({ success: true, data: snap.data(), source: 'firestore-admin' });
        }
      } catch (e) {
        console.warn('[api/cms] Admin get app_cms failed:', e);
      }
    }

    const clientDb = getDb();
    if (clientDb) {
      try {
        const snap = await getDoc(doc(clientDb, 'cms', 'app_cms'));
        if (snap.exists()) {
          return NextResponse.json({ success: true, data: snap.data(), source: 'firestore-client' });
        }
      } catch (e) {
        console.warn('[api/cms] Client get app_cms failed:', e);
      }
    }

    if (fs.existsSync(APP_CMS_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(APP_CMS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return NextResponse.json({ success: true, data: parsed, source: 'file-database' });
      } catch (e) {
        console.warn('[api/cms] Failed to read app_cms from disk:', e);
      }
    }

    return NextResponse.json({ success: true, data: null, source: 'default' });
  }

  // Handle Page Content & Table Deep CMS (Default)
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snap = await adminDb.collection('cms').doc('deep_page_cms').get();
      if (snap.exists) {
        return NextResponse.json({ success: true, data: snap.data(), source: 'firestore-admin' });
      }
    } catch (e) {
      console.warn('[api/cms] Admin get failed:', e);
    }
  }

  const clientDb = getDb();
  if (clientDb) {
    try {
      const snap = await getDoc(doc(clientDb, 'cms', 'deep_page_cms'));
      if (snap.exists()) {
        return NextResponse.json({ success: true, data: snap.data(), source: 'firestore-client' });
      }
    } catch (e) {
      console.warn('[api/cms] Client get failed:', e);
    }
  }

  // Load from persistent local database file
  if (fs.existsSync(CMS_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(CMS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const merged = { ...DEFAULT_DEEP_CMS, ...parsed };
        return NextResponse.json({ success: true, data: merged, source: 'file-database' });
      }
    } catch (e) {
      console.warn('[api/cms] Failed to read deep_page_cms from disk:', e);
    }
  }

  return NextResponse.json({ success: true, data: DEFAULT_DEEP_CMS, source: 'default' });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'deep_cms';
    const body = await req.json();

    if (type === 'app_cms') {
      // Save directly to disk database
      ensureDir(APP_CMS_FILE_PATH);
      fs.writeFileSync(APP_CMS_FILE_PATH, JSON.stringify(body, null, 2), 'utf-8');

      // Sync to Firestore if configured
      const adminDb = getAdminDb();
      if (adminDb) {
        await adminDb.collection('cms').doc('app_cms').set(body, { merge: true });
      } else {
        const clientDb = getDb();
        if (clientDb) {
          await setDoc(doc(clientDb, 'cms', 'app_cms'), body, { merge: true });
        }
      }

      return NextResponse.json({ success: true, message: 'Saved app CMS directly to database', source: 'database' });
    }

    // Default Deep Page CMS
    const deepBody: DeepAppCMSStore = body;

    // Save directly to disk database
    ensureDir(CMS_FILE_PATH);
    fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(deepBody, null, 2), 'utf-8');

    // Sync to Firestore if configured
    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection('cms').doc('deep_page_cms').set(deepBody, { merge: true });
    } else {
      const clientDb = getDb();
      if (clientDb) {
        await setDoc(doc(clientDb, 'cms', 'deep_page_cms'), deepBody, { merge: true });
      }
    }

    return NextResponse.json({ success: true, message: 'Saved deep CMS directly to database', source: 'database' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
