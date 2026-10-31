import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getDb } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { INITIAL_NOTIFICATIONS, AppNotification } from '@/lib/notificationsData';

const SEED_NOTIFS_PATH = path.join(process.cwd(), 'src', 'data', 'samko_notifications.json');
const RUNTIME_NOTIFS_DIR = process.env.NODE_ENV === 'production' && fs.existsSync('/tmp')
  ? '/tmp'
  : path.join(process.cwd(), '.runtime_data');
const NOTIFS_FILE_PATH = path.join(RUNTIME_NOTIFS_DIR, 'samko_notifications.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadLocalNotifs(): AppNotification[] {
  try {
    if (fs.existsSync(NOTIFS_FILE_PATH)) {
      const raw = fs.readFileSync(NOTIFS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    if (fs.existsSync(SEED_NOTIFS_PATH)) {
      const raw = fs.readFileSync(SEED_NOTIFS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[api/notifications] Failed to load local notifications:', e);
  }
  return [...INITIAL_NOTIFICATIONS];
}

function saveLocalNotifs(notifs: any[]) {
  try {
    ensureDir(NOTIFS_FILE_PATH);
    fs.writeFileSync(NOTIFS_FILE_PATH, JSON.stringify(notifs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[api/notifications] Failed to save local notifications:', e);
  }
}

function withTimeout<T>(promise: Promise<T>, ms = 1800): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout ' + ms + 'ms')), ms)),
  ]);
}

export async function GET() {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snap = await withTimeout(adminDb.collection('notifications').orderBy('timestamp', 'desc').limit(50).get(), 1800);
      if (!snap.empty && snap.docs.length >= 6) {
        const notifs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        saveLocalNotifs(notifs);
        return NextResponse.json({ success: true, data: notifs, source: 'firestore-admin' });
      } else {
        const batch = adminDb.batch();
        INITIAL_NOTIFICATIONS.forEach((n) => {
          const ref = adminDb.collection('notifications').doc(n.id);
          batch.set(ref, n, { merge: true });
        });
        await withTimeout(batch.commit(), 1800);
        const refreshed = await withTimeout(adminDb.collection('notifications').orderBy('timestamp', 'desc').limit(50).get(), 1800);
        const data = refreshed.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        saveLocalNotifs(data);
        return NextResponse.json({ success: true, data, source: 'firestore-admin' });
      }
    } catch (e) {
      console.warn('[api/notifications] Admin GET failed or timed out:', e);
    }
  }

  const clientDb = getDb();
  if (clientDb) {
    try {
      const q = query(collection(clientDb, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await withTimeout(getDocs(q), 1800);
      if (!snap.empty && snap.docs.length >= 6) {
        const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        saveLocalNotifs(notifs);
        return NextResponse.json({ success: true, data: notifs, source: 'firestore-client' });
      } else {
        const batch = writeBatch(clientDb);
        INITIAL_NOTIFICATIONS.forEach((n) => {
          const ref = doc(clientDb, 'notifications', n.id);
          batch.set(ref, n, { merge: true });
        });
        await withTimeout(batch.commit(), 1800);
        const refreshedSnap = await withTimeout(getDocs(q), 1800);
        const notifs = refreshedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        saveLocalNotifs(notifs);
        return NextResponse.json({ success: true, data: notifs, source: 'firestore-client' });
      }
    } catch (e) {
      console.warn('[api/notifications] Client GET failed or timed out:', e);
    }
  }

  const local = loadLocalNotifs();
  return NextResponse.json({ success: true, data: local, source: 'file-database' });
}

export async function POST(req: Request) {
  try {
    const body: AppNotification = await req.json();
    const notifId = body.id || `notif-${Date.now()}`;
    const payload = {
      ...body,
      id: notifId,
      timestamp: body.timestamp || new Date().toISOString(),
      read: body.read ?? false,
    };

    // Save directly to local database
    const local = loadLocalNotifs();
    const updated = [payload, ...local.filter((n) => n.id !== notifId)];
    saveLocalNotifs(updated);

    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection('notifications').doc(notifId).set(payload, { merge: true });
      return NextResponse.json({ success: true, data: payload, source: 'firestore' });
    }

    const clientDb = getDb();
    if (clientDb) {
      await setDoc(doc(clientDb, 'notifications', notifId), payload, { merge: true });
      return NextResponse.json({ success: true, data: payload, source: 'firestore' });
    }

    return NextResponse.json({ success: true, data: payload, source: 'file-database' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, read, markAll } = await req.json();
    const local = loadLocalNotifs();

    if (markAll) {
      const updated = local.map((n) => ({ ...n, read: true }));
      saveLocalNotifs(updated);

      const adminDb = getAdminDb();
      const clientDb = getDb();
      if (adminDb) {
        const snap = await adminDb.collection('notifications').where('read', '==', false).get();
        const batch = adminDb.batch();
        snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
        await batch.commit();
      } else if (clientDb) {
        const snap = await getDocs(collection(clientDb, 'notifications'));
        const batch = writeBatch(clientDb);
        snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
        await batch.commit();
      }
      return NextResponse.json({ success: true, message: 'All marked as read in database' });
    }

    if (id) {
      const updated = local.map((n) => (n.id === id ? { ...n, read: Boolean(read) } : n));
      saveLocalNotifs(updated);

      const adminDb = getAdminDb();
      const clientDb = getDb();
      if (adminDb) {
        await adminDb.collection('notifications').doc(id).update({ read: Boolean(read) });
      } else if (clientDb) {
        await setDoc(doc(clientDb, 'notifications', id), { read: Boolean(read) }, { merge: true });
      }
      return NextResponse.json({ success: true, id, read });
    }

    return NextResponse.json({ success: false, message: 'Missing id or markAll' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      saveLocalNotifs([]);
      const adminDb = getAdminDb();
      const clientDb = getDb();
      if (adminDb) {
        const snap = await adminDb.collection('notifications').get();
        const batch = adminDb.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } else if (clientDb) {
        const snap = await getDocs(collection(clientDb, 'notifications'));
        const batch = writeBatch(clientDb);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      return NextResponse.json({ success: true, message: 'All notifications cleared in database' });
    }

    if (id) {
      const local = loadLocalNotifs();
      saveLocalNotifs(local.filter((n) => n.id !== id));

      const adminDb = getAdminDb();
      const clientDb = getDb();
      if (adminDb) {
        await adminDb.collection('notifications').doc(id).delete();
      } else if (clientDb) {
        await deleteDoc(doc(clientDb, 'notifications', id));
      }
      return NextResponse.json({ success: true, message: `Notification ${id} deleted in database` });
    }

    return NextResponse.json({ success: false, message: 'Missing id parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
