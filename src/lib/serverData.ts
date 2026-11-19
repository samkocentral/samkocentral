import { COMPLIANCE_MASTER_ITEMS } from '@/data/complianceMasterData';
import fs from 'fs';
import path from 'path';
import { getAdminDb } from './firebaseAdmin';
import { getDb } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { HOTELS, ASSETS, MAINTENANCE_RECORDS, ASSET_CATEGORIES } from './assetData';
import { TASKS, ALERTS, DOCUMENTS } from './mockData';

// Fallback in-memory stores for runtime when Firebase is not connected
const memoryStore: Record<string, any[]> = {
  properties: HOTELS.map((h) => ({
    ...h,
    propertyId: h.id,
    type: 'Property',
  })),
  categories: [...ASSET_CATEGORIES],
  assets: [...ASSETS],
  maintenance: [...MAINTENANCE_RECORDS],
  compliance: [...COMPLIANCE_MASTER_ITEMS],
  tasks: [...TASKS],
  alerts: [...ALERTS],
  contracts: [
    {
      id: '1',
      contractId: 'CON-001',
      supplierName: 'Otis Elevators UK',
      contractName: 'Lift Maintenance & LOLER Inspection',
      category: 'Lift Maintenance',
      property: 'Stanhill Court',
      hotel: 'Stanhill Court',
      department: 'Facilities',
      startDate: '2025-01-01',
      endDate: '2027-12-31',
      renewalDate: '2027-11-30',
      noticePeriod: '60 days',
      autoRenew: true,
      contractValue: 12500,
      value: 12500,
      monthlyCost: 1042,
      paymentFrequency: 'Quarterly',
      contractOwner: 'Marcus Webb',
      supplierContact: 'Otis UK Service Desk',
      phone: '+44 800 181 363',
      email: 'service.uk@otis.com',
      sla: '24/7 emergency dispatch < 45 mins',
      status: 'active',
      notes: 'LOLER passenger lift service.',
    },
    {
      id: '2',
      contractId: 'CON-002',
      supplierName: 'Carrier Commercial Services',
      contractName: 'Carrier Rooftop AHU & Chiller Maintenance',
      category: 'HVAC',
      property: 'Crowne Plaza Kingston-south',
      hotel: 'Crowne Plaza Kingston-south',
      department: 'Engineering',
      startDate: '2025-04-01',
      endDate: '2027-03-31',
      renewalDate: '2027-01-31',
      noticePeriod: '30 days',
      autoRenew: true,
      contractValue: 18200,
      value: 18200,
      monthlyCost: 1517,
      paymentFrequency: 'Monthly',
      contractOwner: 'Marcus Webb',
      supplierContact: 'Carrier Facilities Team',
      phone: '+44 800 242 437',
      email: 'service@carrier.com',
      sla: 'Quarterly filter changes & 4h callout',
      status: 'active',
      notes: 'Rooftop AHU maintenance.',
    },
    {
      id: '3',
      contractId: 'CON-003',
      supplierName: 'Cummins Power Systems',
      contractName: 'Standby Generator Load Bank & Fuel Polishing',
      category: 'Electrical',
      property: 'Stanhill Court',
      hotel: 'Stanhill Court',
      department: 'Engineering',
      startDate: '2025-06-01',
      endDate: '2027-05-31',
      renewalDate: '2027-04-30',
      noticePeriod: '30 days',
      autoRenew: false,
      contractValue: 9800,
      value: 9800,
      monthlyCost: 817,
      paymentFrequency: 'Annual',
      contractOwner: 'Sarah Chen',
      supplierContact: 'Cummins UK Service',
      phone: '+44 1293 882 100',
      email: 'generators@cummins.co.uk',
      sla: 'Annual resistive load bank test',
      status: 'active',
      notes: 'Critical standby generator cover.',
    },
  ],
  insurance: [
    {
      id: '1',
      policyNumber: 'INS-008547',
      insuranceType: 'Buildings & Plant Cover',
      company: 'Aviva UK',
      insuranceCompany: 'Aviva UK',
      broker: 'Marsh UK',
      property: 'Stanhill Court',
      hotel: 'Stanhill Court',
      coverage: '£25,000,000',
      coverageAmount: 25000000,
      annualPremium: 59335,
      excessAmount: 5000,
      startDate: '2025-07-01',
      expiryDate: '2027-06-30',
      renewalDate: '2027-06-30',
      responsibleManager: 'Marcus Webb',
      manager: 'Marcus Webb',
      contactPerson: 'Sarah Thompson',
      emergencyPhone: '+44 800 123 4567',
      status: 'active',
      notes: 'Comprehensive commercial building cover.',
    },
    {
      id: '2',
      policyNumber: 'POL-2026-001',
      insuranceType: 'Building Insurance',
      company: 'Aviva UK',
      insuranceCompany: 'Aviva UK',
      broker: 'Marsh UK',
      property: 'Crowne Plaza Kingston-south',
      hotel: 'Crowne Plaza Kingston-south',
      coverage: '£15,000,000',
      coverageAmount: 15000000,
      annualPremium: 42000,
      excessAmount: 5000,
      startDate: '2025-01-01',
      expiryDate: '2026-12-31',
      renewalDate: '2026-12-15',
      responsibleManager: 'Marcus Webb',
      manager: 'Marcus Webb',
      contactPerson: 'Sarah Thompson',
      emergencyPhone: '+44 800 123 4567',
      status: 'active',
      notes: 'Comprehensive property building cover.',
    },
    {
      id: '3',
      policyNumber: 'POL-2026-003',
      insuranceType: 'Employers Liability',
      company: 'Zurich Insurance',
      insuranceCompany: 'Zurich Insurance',
      broker: 'Marsh UK',
      property: 'Stanhill Court',
      hotel: 'Stanhill Court',
      coverage: '£10,000,000',
      coverageAmount: 10000000,
      annualPremium: 12000,
      excessAmount: 1000,
      startDate: '2025-02-01',
      expiryDate: '2027-02-01',
      renewalDate: '2027-01-15',
      responsibleManager: 'Sarah Chen',
      manager: 'Sarah Chen',
      contactPerson: 'Rachel Green',
      emergencyPhone: '+44 800 345 6789',
      status: 'active',
      notes: 'Statutory employers liability.',
    },
  ],
  utilities: [
    {
      id: 'ut-001',
      accountNo: 'ELEC-GOW-001',
      property: 'Stanhill Court',
      utilityType: 'Electricity',
      supplier: 'British Gas Business',
      meterNo: 'MPAN-190002847192',
      contractEndDate: '2027-12-31',
      annualCost: 28400,
      status: 'active',
    },
    {
      id: 'ut-002',
      accountNo: 'GAS-CP-001',
      property: 'Crowne Plaza Kingston-south',
      utilityType: 'Gas',
      supplier: 'TotalEnergies Gas & Power',
      meterNo: 'MPRN-84729104',
      contractEndDate: '2028-02-29',
      annualCost: 13508,
      status: 'active',
    },
    {
      id: 'ut-003',
      accountNo: 'WAT-SC-001',
      property: 'Stanhill Court',
      utilityType: 'Water',
      supplier: 'Thames Water Commercial',
      meterNo: 'SPID-301928471',
      contractEndDate: '2027-09-30',
      annualCost: 14800,
      status: 'active',
    },
  ],
  documents: [...DOCUMENTS],
  claims: [
    {
      id: 'c1',
      policyId: '1',
      policyNumber: 'INS-008547',
      hotel: 'Stanhill Court',
      property: 'Stanhill Court',
      claimDate: '2025-03-15',
      description: 'Water damage to ground floor lobby ceiling',
      amount: 12500,
      status: 'settled',
    },
    {
      id: 'c2',
      policyId: '2',
      policyNumber: 'POL-2026-001',
      hotel: 'Crowne Plaza Kingston-south',
      property: 'Crowne Plaza Kingston-south',
      claimDate: '2025-05-20',
      description: 'Guest slip and fall in car park',
      amount: 8000,
      status: 'in-progress',
    },
    {
      id: 'c3',
      policyId: '3',
      policyNumber: 'POL-2026-003',
      hotel: 'Stanhill Court',
      property: 'Stanhill Court',
      claimDate: '2025-07-22',
      description: 'Commercial kitchen oven breakdown',
      amount: 4500,
      status: 'open',
    },
  ],
  users: [
    {
      id: 'usr-bot-001',
      name: 'Digital Bot',
      email: 'digitalbot@samkocentral.com',
      role: 'super-admin',
      roleLevel: 'L1',
      hotel: 'All Properties',
      status: 'active',
      lastLogin: '2026-11-09',
      initials: 'DB',
    },
    {
      id: 'usr-admin-001',
      name: 'Group Admin',
      email: 'admin@samkocentral.com',
      role: 'super-admin',
      roleLevel: 'L1',
      hotel: 'All Properties',
      status: 'active',
      lastLogin: '2026-11-09',
      initials: 'GA',
    },
    {
      id: 'usr-madhu-001',
      name: 'Madhu',
      email: 'madhu@samkocentral.com',
      role: 'super-admin',
      roleLevel: 'L1',
      hotel: 'All Properties',
      status: 'active',
      lastLogin: '2026-11-09',
      initials: 'M',
    },
  ],
  acquisitionFolders: [],
  acquisitionFiles: [],
};

const SEED_DB_PATH = path.join(process.cwd(), 'src', 'data', 'samko_db.json');
const RUNTIME_DB_DIR =
  process.env.NODE_ENV === 'production' && fs.existsSync('/tmp')
    ? '/tmp'
    : path.join(process.cwd(), '.runtime_data');
const DB_FILE_PATH = path.join(RUNTIME_DB_DIR, 'samko_db.json');
let lastMtime = 0;

function saveToDisk(data: Record<string, any[]>) {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_FILE_PATH, jsonStr, 'utf-8');
    try {
      if (fs.existsSync(path.dirname(SEED_DB_PATH))) {
        fs.writeFileSync(SEED_DB_PATH, jsonStr, 'utf-8');
      }
    } catch { }
    try {
      lastMtime = fs.statSync(DB_FILE_PATH).mtimeMs;
    } catch { }
  } catch (e) {
    console.warn('[serverData] Disk save warning:', e);
  }
}

function loadFromDisk(force = false): boolean {
  try {
    const targetPath = fs.existsSync(DB_FILE_PATH)
      ? DB_FILE_PATH
      : fs.existsSync(SEED_DB_PATH)
        ? SEED_DB_PATH
        : null;
    if (targetPath) {
      const stats = fs.statSync(targetPath);
      if (!force && stats.mtimeMs === lastMtime && Object.keys(memoryStore).length > 0) {
        return true;
      }
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach((k) => {
          if (Array.isArray(parsed[k])) {
            memoryStore[k] = parsed[k];
          }
        });
        lastMtime = stats.mtimeMs;
        return true;
      }
    }
  } catch (e) {
    console.warn('[serverData] Disk read warning:', e);
  }
  return false;
}

// Hydrate from disk on initial module load
if (!loadFromDisk(true)) {
  saveToDisk(memoryStore);
}

function matchesId(item: any, id: string): boolean {
  if (!item || !id) return false;
  const target = String(id).toLowerCase().trim();
  const itemId = String(item.id || '')
    .toLowerCase()
    .trim();
  const itemName = String(item.name || '')
    .toLowerCase()
    .trim();
  const itemEmail = String(item.email || '')
    .toLowerCase()
    .trim();
  const itemEmailPrefix = itemEmail.includes('@') ? itemEmail.split('@')[0] : '';
  const itemUserTag = itemEmailPrefix ? `usr-${itemEmailPrefix}` : '';
  const itemNameTag = itemName ? `usr-${itemName.replace(/\s+/g, '')}` : '';

  return (
    itemId === target ||
    itemEmail === target ||
    (itemUserTag && itemUserTag === target) ||
    (itemNameTag && itemNameTag === target) ||
    itemName === target ||
    String(item.propertyName || '')
      .toLowerCase()
      .trim() === target ||
    String(item.hotelName || '')
      .toLowerCase()
      .trim() === target ||
    String(item.assetId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.propertyId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.hotelId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.complianceId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.contractId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.policyNumber || '')
      .toLowerCase()
      .trim() === target ||
    String(item.accountNo || '')
      .toLowerCase()
      .trim() === target ||
    String(item.accountNumber || '')
      .toLowerCase()
      .trim() === target ||
    String(item.taskId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.documentId || '')
      .toLowerCase()
      .trim() === target ||
    String(item.userId || '')
      .toLowerCase()
      .trim() === target
  );
}

async function withTimeout<T>(promise: Promise<T>, ms = 1200): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function getCollectionData(
  collectionName: string,
  forceRemote = false
): Promise<any[]> {
  loadFromDisk();
  const cached = memoryStore[collectionName];

  // Return cached data immediately for sub-millisecond response
  if (!forceRemote && cached !== undefined) {
    return cached;
  }

  // Fetch live from Firebase Firestore
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snap = await withTimeout(adminDb.collection(collectionName).get(), 3500);
      if (!snap.empty) {
        const docs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        memoryStore[collectionName] = docs;
        saveToDisk(memoryStore);
        return docs;
      }
    } catch (e) {
      console.warn(`[serverData] Admin Firestore read for ${collectionName} failed:`, e);
    }
  }

  const clientDb = getDb();
  if (clientDb) {
    try {
      const snap = await withTimeout(getDocs(collection(clientDb, collectionName)), 3500);
      if (!snap.empty) {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        memoryStore[collectionName] = docs;
        saveToDisk(memoryStore);
        return docs;
      }
    } catch (e) {
      console.warn(`[serverData] Client Firestore read for ${collectionName} failed:`, e);
    }
  }

  return memoryStore[collectionName] || [];
}

export async function getDocumentById(collectionName: string, id: string): Promise<any | null> {
  loadFromDisk();
  const items = memoryStore[collectionName] || [];
  const localMatch = items.find((item: any) => matchesId(item, id));
  if (localMatch) {
    return localMatch;
  }

  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const docSnap = await withTimeout(adminDb.collection(collectionName).doc(id).get(), 3000);
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.warn(`[serverData] Admin Firestore doc read ${collectionName}/${id} failed:`, e);
    }
  }

  const clientDb = getDb();
  if (clientDb) {
    try {
      const dSnap = await withTimeout(getDoc(doc(clientDb, collectionName, id)), 3000);
      if (dSnap.exists()) {
        return { id: dSnap.id, ...dSnap.data() };
      }
    } catch (e) {
      console.warn(`[serverData] Client Firestore doc read ${collectionName}/${id} failed:`, e);
    }
  }

  return null;
}

export async function createDocument(collectionName: string, data: any): Promise<any> {
  loadFromDisk();
  const id = data.id || `${collectionName.slice(0, 3)}-${Date.now()}`;
  const docData = {
    ...data,
    id,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!memoryStore[collectionName]) memoryStore[collectionName] = [];
  const existingIdx = memoryStore[collectionName].findIndex((item: any) => matchesId(item, id));
  if (existingIdx !== -1) {
    memoryStore[collectionName][existingIdx] = docData;
  } else {
    memoryStore[collectionName].unshift(docData);
  }
  saveToDisk(memoryStore);

  const adminDb = getAdminDb();
  if (adminDb) {
    withTimeout(
      adminDb.collection(collectionName).doc(String(id)).set(docData, { merge: true }),
      3000
    ).catch((e) =>
      console.warn(`[serverData] Admin Firestore write to ${collectionName} failed:`, e)
    );
  } else {
    const clientDb = getDb();
    if (clientDb) {
      withTimeout(
        setDoc(doc(clientDb, collectionName, String(id)), docData, { merge: true }),
        3000
      ).catch((e) =>
        console.warn(`[serverData] Client Firestore write to ${collectionName} failed:`, e)
      );
    }
  }

  return docData;
}

export async function bulkCreateDocuments(
  collectionName: string,
  items: any[]
): Promise<{ count: number; data: any[] }> {
  loadFromDisk();
  const prepared = items.map((item, idx) => {
    const id = item.id || `${collectionName.slice(0, 3)}-${Date.now()}-${idx}`;
    return {
      ...item,
      id,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  if (!memoryStore[collectionName]) memoryStore[collectionName] = [];
  for (const docData of prepared) {
    const existingIdx = memoryStore[collectionName].findIndex((x: any) => matchesId(x, docData.id));
    if (existingIdx !== -1) {
      memoryStore[collectionName][existingIdx] = docData;
    } else {
      memoryStore[collectionName].unshift(docData);
    }
  }
  saveToDisk(memoryStore);

  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      let batch = adminDb.batch();
      let count = 0;
      for (const docData of prepared) {
        const ref = adminDb.collection(collectionName).doc(String(docData.id));
        batch.set(ref, docData, { merge: true });
        count++;
        if (count % 450 === 0) {
          await withTimeout(batch.commit(), 5000);
          batch = adminDb.batch();
        }
      }
      await withTimeout(batch.commit(), 5000);
    } catch (e) {
      console.warn(`[serverData] Admin bulkCreate for ${collectionName} failed:`, e);
    }
  } else {
    const clientDb = getDb();
    if (clientDb) {
      try {
        let count = 0;
        let batch = writeBatch(clientDb);
        for (const docData of prepared) {
          const ref = doc(clientDb, collectionName, String(docData.id));
          batch.set(ref, docData, { merge: true });
          count++;
          if (count % 450 === 0) {
            await withTimeout(batch.commit(), 5000);
            batch = writeBatch(clientDb);
          }
        }
        await withTimeout(batch.commit(), 5000);
      } catch (e) {
        console.warn(`[serverData] Client bulkCreate for ${collectionName} failed:`, e);
      }
    }
  }

  return { count: prepared.length, data: prepared };
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: any
): Promise<any | null> {
  loadFromDisk();
  const updatedAt = new Date().toISOString();

  // Normalize asset approval and status interconnection
  if (collectionName === 'assets' && data && typeof data === 'object') {
    if (data.approvalStatus === 'approved') {
      data.status = 'active';
    } else if (data.approvalStatus === 'pending' || data.approvalStatus === 'hold') {
      data.status = 'under-maintenance';
    } else if (data.status === 'active' && !data.approvalStatus) {
      data.approvalStatus = 'approved';
    } else if (data.status === 'under-maintenance' && !data.approvalStatus) {
      data.approvalStatus = 'pending';
    }
  }

  const store = memoryStore[collectionName] || [];
  const idx = store.findIndex(
    (item: any) =>
      matchesId(item, id) ||
      (item.email &&
        data?.email &&
        String(item.email).toLowerCase().trim() === String(data.email).toLowerCase().trim()) ||
      (item.id &&
        data?.id &&
        String(item.id).toLowerCase().trim() === String(data.id).toLowerCase().trim())
  );

  let targetId = id;
  let updatedDoc: any;

  if (idx !== -1) {
    targetId = store[idx].id || id;
    store[idx] = { ...store[idx], ...data, updatedAt };
    updatedDoc = store[idx];
  } else {
    updatedDoc = { id, ...data, updatedAt };
    store.push(updatedDoc);
  }
  memoryStore[collectionName] = store;
  saveToDisk(memoryStore);

  const adminDb = getAdminDb();
  if (adminDb) {
    withTimeout(
      adminDb
        .collection(collectionName)
        .doc(String(targetId))
        .set({ ...data, updatedAt }, { merge: true }),
      3000
    ).catch((e) =>
      console.warn(
        `[serverData] Admin Firestore update to ${collectionName}/${targetId} failed:`,
        e
      )
    );
  } else {
    const clientDb = getDb();
    if (clientDb) {
      withTimeout(
        setDoc(
          doc(clientDb, collectionName, String(targetId)),
          { ...data, updatedAt },
          { merge: true }
        ),
        3000
      ).catch((e) =>
        console.warn(
          `[serverData] Client Firestore update to ${collectionName}/${targetId} failed:`,
          e
        )
      );
    }
  }

  return updatedDoc;
}

export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  loadFromDisk();
  const store = memoryStore[collectionName] || [];
  const itemToDelete = store.find((item: any) => matchesId(item, id));
  const targetId = itemToDelete?.id || id;

  memoryStore[collectionName] = store.filter((item: any) => !matchesId(item, id));
  saveToDisk(memoryStore);

  const adminDb = getAdminDb();
  if (adminDb) {
    withTimeout(adminDb.collection(collectionName).doc(String(targetId)).delete(), 3000).catch(
      (e) =>
        console.warn(`[serverData] Admin Firestore delete ${collectionName}/${targetId} failed:`, e)
    );
  } else {
    const clientDb = getDb();
    if (clientDb) {
      withTimeout(deleteDoc(doc(clientDb, collectionName, String(targetId))), 3000).catch((e) =>
        console.warn(
          `[serverData] Client Firestore delete ${collectionName}/${targetId} failed:`,
          e
        )
      );
    }
  }

  return true;
}

export async function bulkDeleteDocuments(
  collectionName: string,
  ids: string[]
): Promise<{ count: number }> {
  loadFromDisk();
  if (!ids || !ids.length) return { count: 0 };
  const idSet = new Set(ids.map((id) => String(id).toLowerCase().trim()));
  const store = memoryStore[collectionName] || [];

  const toDelete = store.filter((item: any) => idSet.has(String(item.id).toLowerCase().trim()));
  memoryStore[collectionName] = store.filter(
    (item: any) => !idSet.has(String(item.id).toLowerCase().trim())
  );
  saveToDisk(memoryStore);

  const adminDb = getAdminDb();
  if (adminDb && toDelete.length > 0) {
    try {
      const batch = adminDb.batch();
      toDelete.forEach((item: any) => {
        batch.delete(adminDb.collection(collectionName).doc(String(item.id)));
      });
      withTimeout(batch.commit(), 3000).catch((e) => console.warn(`Batch delete failed:`, e));
    } catch (e) {
      console.warn('Batch delete error:', e);
    }
  }

  return { count: toDelete.length };
}

export async function seedAllCollections(): Promise<{
  success: boolean;
  counts: Record<string, number>;
  message: string;
}> {
  const counts: Record<string, number> = {};
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      for (const [colName, items] of Object.entries(memoryStore)) {
        const batch = adminDb.batch();
        let count = 0;
        for (const item of items) {
          const docRef = adminDb.collection(colName).doc(String(item.id));
          batch.set(docRef, item, { merge: true });
          count++;
          if (count % 450 === 0) {
            await batch.commit();
          }
        }
        await batch.commit();
        counts[colName] = count;
      }
      return {
        success: true,
        counts,
        message: 'Successfully seeded all collections to Firestore database via Admin SDK!',
      };
    } catch (err: any) {
      console.warn('[serverData] Admin seed failed, attempting Web SDK fallback:', err);
    }
  }

  const clientDb = getDb();
  if (clientDb) {
    try {
      for (const [colName, items] of Object.entries(memoryStore)) {
        const batch = writeBatch(clientDb);
        let count = 0;
        for (const item of items) {
          const docRef = doc(clientDb, colName, String(item.id));
          batch.set(docRef, item, { merge: true });
          count++;
          if (count % 450 === 0) {
            await batch.commit();
          }
        }
        await batch.commit();
        counts[colName] = count;
      }
      return {
        success: true,
        counts,
        message: 'Successfully seeded all collections to Firestore database via Firebase SDK!',
      };
    } catch (err: any) {
      return {
        success: false,
        counts,
        message: `Error seeding via Firebase SDK: ${err?.message || String(err)}`,
      };
    }
  }

  return {
    success: false,
    counts,
    message: 'Firebase is not initialized. Please verify your credentials in .env.',
  };
}
