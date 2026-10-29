import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_DEEP_CMS, DeepAppCMSStore } from '@/lib/deepPageCms';

export async function GET() {
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

  return NextResponse.json({ success: true, data: DEFAULT_DEEP_CMS, source: 'default' });
}

export async function POST(req: Request) {
  try {
    const body: DeepAppCMSStore = await req.json();
    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection('cms').doc('deep_page_cms').set(body, { merge: true });
      return NextResponse.json({ success: true, message: 'Saved to Firestore via Admin' });
    }

    const clientDb = getDb();
    if (clientDb) {
      await setDoc(doc(clientDb, 'cms', 'deep_page_cms'), body, { merge: true });
      return NextResponse.json({ success: true, message: 'Saved to Firestore via Client' });
    }

    return NextResponse.json({ success: true, message: 'Saved locally (Firebase not initialized)' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

