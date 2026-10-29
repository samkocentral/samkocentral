import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getDb } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { INITIAL_NOTIFICATIONS, AppNotification } from '@/lib/notificationsData';

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
        return NextResponse.json({ success: true, data: notifs });
      } else {
        const batch = adminDb.batch();
        INITIAL_NOTIFICATIONS.forEach((n) => {
          const ref = adminDb.collection('notifications').doc(n.id);
          batch.set(ref, n, { merge: true });
        });
        await withTimeout(batch.commit(), 1800);
        const refreshed = await withTimeout(adminDb.collection('notifications').orderBy('timestamp', 'desc').limit(50).get(), 1800);
        return NextResponse.json({ success: true, data: refreshed.docs.map((d: any) => ({ id: d.id, ...d.data() })) });
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
        return NextResponse.json({ success: true, data: notifs });
      } else {
        const batch = writeBatch(clientDb);
        INITIAL_NOTIFICATIONS.forEach((n) => {
          const ref = doc(clientDb, 'notifications', n.id);
          batch.set(ref, n, { merge: true });
        });
        await withTimeout(batch.commit(), 1800);
        const refreshedSnap = await withTimeout(getDocs(q), 1800);
        const notifs = refreshedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ success: true, data: notifs });
      }
    } catch (e) {
      console.warn('[api/notifications] Client GET failed or timed out:', e);
    }
  }

  return NextResponse.json({ success: true, data: INITIAL_NOTIFICATIONS });
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

    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection('notifications').doc(notifId).set(payload, { merge: true });
      return NextResponse.json({ success: true, data: payload });
    }

    const clientDb = getDb();
    if (clientDb) {
      await setDoc(doc(clientDb, 'notifications', notifId), payload, { merge: true });
      return NextResponse.json({ success: true, data: payload });
    }

    return NextResponse.json({ success: true, data: payload, offline: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, read, markAll } = await req.json();
    const adminDb = getAdminDb();
    const clientDb = getDb();

    if (markAll) {
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
      return NextResponse.json({ success: true, message: 'All marked as read in Firestore' });
    }

    if (id) {
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

    const adminDb = getAdminDb();
    const clientDb = getDb();

    if (clearAll) {
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
      return NextResponse.json({ success: true, message: 'All notifications cleared in Firestore' });
    }

    if (id) {
      if (adminDb) {
        await adminDb.collection('notifications').doc(id).delete();
      } else if (clientDb) {
        await deleteDoc(doc(clientDb, 'notifications', id));
      }
      return NextResponse.json({ success: true, message: `Notification ${id} deleted in Firestore` });
    }

    return NextResponse.json({ success: false, message: 'Missing id parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
