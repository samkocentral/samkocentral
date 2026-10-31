import fs from 'fs';
import path from 'path';
import { getAdminDb } from './firebaseAdmin';
import { getDb } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  compliance: [
    {
      id: '1', complianceId: 'COMP-001', name: 'Fire Risk Assessment', type: 'Statutory', category: 'Fire Risk Assessment',
      description: 'Annual fire risk assessment for the entire property', property: 'Crowne Plaza Kingston-south', hotel: 'Crowne Plaza Kingston-south',
      department: 'Engineering', area: 'Whole Building', regulatoryAuthority: 'Fire & Rescue Service',
      certificateNumber: 'FRA-2024-001', issueDate: '2024-06-01', expiryDate: '2025-06-01',
      renewalDate: '2025-05-15', inspectionFrequency: 'Yearly', responsiblePerson: 'Marcus Webb',
      contractor: 'FireGuard Systems', status: 'overdue', riskRating: 'critical', notes: 'Renewal overdue — book immediately',
    },
    {
      id: '2', complianceId: 'COMP-002', name: 'Fire Alarm Certificate', type: 'Statutory', category: 'Fire Alarm Certificate',
      description: 'Annual fire alarm system inspection and certification', property: 'Crowne Plaza Kingston-south', hotel: 'Crowne Plaza Kingston-south',
      department: 'Engineering', area: 'Whole Building', regulatoryAuthority: 'BS 5839',
      certificateNumber: 'FAC-2025-002', issueDate: '2025-01-10', expiryDate: '2026-01-10',
      renewalDate: '2025-12-15', inspectionFrequency: 'Yearly', responsiblePerson: 'Marcus Webb',
      contractor: 'Chubb Fire & Security', status: 'expiring-soon', riskRating: 'high', notes: 'Due for re-inspection',
    },
    {
      id: '3', complianceId: 'COMP-003', name: 'Emergency Lighting Test', type: 'Statutory', category: 'Emergency Lighting',
      description: 'Annual 3-hour emergency lighting discharge test', property: 'Stanhill Court', hotel: 'Stanhill Court',
      department: 'Engineering', area: 'All Floors', regulatoryAuthority: 'BS 5266',
      certificateNumber: 'ELT-2025-003', issueDate: '2025-03-01', expiryDate: '2026-03-01',
      renewalDate: '2026-02-15', inspectionFrequency: 'Yearly', responsiblePerson: 'Sarah Chen',
      contractor: 'Apex Electrical Services', status: 'compliant', riskRating: 'medium', notes: 'All units passed',
    },
    {
      id: '4', complianceId: 'COMP-004', name: 'Legionella Risk Assessment', type: 'Statutory', category: 'Legionella',
      description: 'Biennial legionella bacteria risk assessment and water monitoring', property: 'Hampton 1 & 2', hotel: 'Hampton 1 & 2',
      department: 'Engineering', area: 'Calorifiers & Cold Water Tanks', regulatoryAuthority: 'ACOP L8 / HSE',
      certificateNumber: 'LEG-2024-004', issueDate: '2024-09-15', expiryDate: '2026-09-15',
      renewalDate: '2026-08-15', inspectionFrequency: '2-Yearly', responsiblePerson: 'James Okafor',
      contractor: 'Breathe Water Solutions', status: 'compliant', riskRating: 'high', notes: 'Monthly temperature logs up to date',
    },
    {
      id: '5', complianceId: 'COMP-005', name: 'Passenger Lift Thorough Examination', type: 'Statutory', category: 'Lift Inspection',
      description: '6-monthly statutory thorough examination of passenger lifts under LOLER', property: 'Ravents Ait Island', hotel: 'Ravents Ait Island',
      department: 'Engineering', area: 'Main Guest Lift 1 & 2', regulatoryAuthority: 'LOLER 1998 / SAFed',
      certificateNumber: 'LOL-2025-005', issueDate: '2025-02-15', expiryDate: '2025-08-15',
      renewalDate: '2025-08-01', inspectionFrequency: '6-Monthly', responsiblePerson: 'Priya Sharma',
      contractor: 'Otis Elevators UK', status: 'expiring-soon', riskRating: 'critical', notes: 'Engineer scheduled for renewal',
    },
  ],
  tasks: [...TASKS],
  alerts: [...ALERTS],
  contracts: [
    { id: '1', contractId: 'CON-001', supplierName: 'Chubb Fire & Security', contractName: 'Fire Alarm & Extinguisher Maintenance', category: 'Fire Safety', property: 'Crowne Plaza Kingston-south', hotel: 'Crowne Plaza Kingston-south', department: 'Engineering', startDate: '2025-12-01', endDate: '2026-11-30', renewalDate: '2026-10-31', noticePeriod: '30 days', autoRenew: true, contractValue: 24500, value: 24500, monthlyCost: 2041, paymentFrequency: 'Quarterly', contractOwner: 'Marcus Webb', supplierContact: 'Dave Thornton (Account Director)', phone: '+44 800 321 654', email: 'contracts@chubb.co.uk', sla: '24/7 Emergency response within 4 hours; bi-annual statutory inspection', status: 'active', notes: 'Statutory BS 5839 compliance cover. Covers main hotel, conference wing, and underground car park.' },
    { id: '2', contractId: 'CON-002', supplierName: 'Otis Elevators UK', contractName: 'Lift Maintenance & Emergency Response', category: 'Lift Maintenance', property: 'Crowne Plaza Kingston-south', hotel: 'Crowne Plaza Kingston-south', department: 'Facilities', startDate: '2024-04-01', endDate: '2027-03-31', renewalDate: '2027-01-31', noticePeriod: '60 days', autoRenew: false, contractValue: 38200, value: 38200, monthlyCost: 3183, paymentFrequency: 'Monthly', contractOwner: 'Marcus Webb', supplierContact: 'Emma Richardson', phone: '+44 800 181 363', email: 'service.uk@otis.com', sla: 'Trapped passenger rescue < 45 mins; 6-monthly LOLER comprehensive service', status: 'active', notes: 'Covers 3 passenger lifts and 1 service lift. LOLER certificates delivered within 48h.' },
    { id: '3', contractId: 'CON-003', supplierName: 'Breathe Water Solutions', contractName: 'Legionella & Water Hygiene Control', category: 'Water Hygiene', property: 'Stanhill Court', hotel: 'Stanhill Court', department: 'Engineering', startDate: '2024-08-16', endDate: '2026-08-15', renewalDate: '2026-07-15', noticePeriod: '30 days', autoRenew: false, contractValue: 16800, value: 16800, monthlyCost: 1400, paymentFrequency: 'Monthly', contractOwner: 'Sarah Chen', supplierContact: 'Liam Gallagher', phone: '+44 1293 882 100', email: 'compliance@breathewater.co.uk', sla: 'Monthly chemical dosing, calorifier inspections, and quarterly bacterial sampling', status: 'expiring-soon', notes: 'Requires contract renewal sign-off before July 2026. ACOP L8 statutory requirement.' },
    { id: '4', contractId: 'CON-004', supplierName: 'Apex Electrical Services', contractName: 'Fixed Wire & PAT Testing Contract', category: 'Electrical', property: 'Hampton 1 & 2', hotel: 'Hampton 1 & 2', department: 'Engineering', startDate: '2024-02-01', endDate: '2027-01-31', renewalDate: '2026-11-30', noticePeriod: '60 days', autoRenew: true, contractValue: 29400, value: 29400, monthlyCost: 2450, paymentFrequency: 'Annual', contractOwner: 'James Okafor', supplierContact: 'Mark Stevens', phone: '+44 20 8941 7720', email: 'commercial@apexelectrical.co.uk', sla: '5-year rolling EICR program; annual portable appliance testing across 210 guest rooms', status: 'active', notes: 'NICEIC certified contractors. Includes thermal imaging of main distribution boards.' },
    { id: '5', contractId: 'CON-005', supplierName: 'EcoCool HVAC Ltd', contractName: 'Chiller & AHU Preventive Maintenance', category: 'HVAC', property: 'Ravens Ait Island', hotel: 'Ravens Ait Island', department: 'Facilities', startDate: '2024-01-01', endDate: '2026-12-31', renewalDate: '2026-10-31', noticePeriod: '60 days', autoRenew: true, contractValue: 45000, value: 45000, monthlyCost: 3750, paymentFrequency: 'Quarterly', contractOwner: 'Priya Sharma', supplierContact: 'Simon Hughes', phone: '+44 20 8390 4411', email: 'service@ecocool-hvac.co.uk', sla: 'Quarterly F-Gas leak testing, seasonal changeover, and 4-hour breakdown callout', status: 'active', notes: 'Full F-gas logbook maintenance. Critical for island event pavilion cooling.' },
    { id: '6', contractId: 'CON-006', supplierName: 'Rentokil Pest Control', contractName: 'Quarterly Pest Management & Prevention', category: 'Pest Control', property: 'River Club', hotel: 'River Club', department: 'Housekeeping', startDate: '2024-07-01', endDate: '2027-06-30', renewalDate: '2027-04-30', noticePeriod: '30 days', autoRenew: true, contractValue: 11200, value: 11200, monthlyCost: 933, paymentFrequency: 'Quarterly', contractOwner: 'David Thornton', supplierContact: 'Rentokil Commercial Desk', phone: '+44 800 214 214', email: 'commercial.desk@rentokil.com', sla: '8 scheduled visits per year + unlimited emergency callouts within 24 hours', status: 'active', notes: 'Digital pestConnect bait stations installed throughout riverside food prep areas.' },
  ],
  insurance: [
    { id: '1', policyNumber: 'POL-2026-001', insuranceType: 'Property & Buildings', company: 'Aviva UK', insuranceCompany: 'Aviva UK', broker: 'Marsh UK', property: 'Crowne Plaza Kingston-south', hotel: 'Crowne Plaza Kingston-south', coverage: '£45,000,000', coverageAmount: 45000000, annualPremium: 58400, excessAmount: 5000, startDate: '2026-01-01', expiryDate: '2026-12-31', renewalDate: '2026-11-30', responsibleManager: 'Marcus Webb', manager: 'Marcus Webb', contactPerson: 'Sarah Thompson', emergencyPhone: '+44 800 123 4567', status: 'active', notes: 'Comprehensive commercial building cover.' },
    { id: '2', policyNumber: 'POL-2026-002', insuranceType: 'Public & Employers Liability', company: 'AXA Insurance', insuranceCompany: 'AXA Insurance', broker: 'Aon UK', property: 'Crowne Plaza Kingston-south', hotel: 'Crowne Plaza Kingston-south', coverage: '£20,000,000', coverageAmount: 20000000, annualPremium: 32600, excessAmount: 2500, startDate: '2025-11-15', expiryDate: '2026-11-15', renewalDate: '2026-10-15', responsibleManager: 'Marcus Webb', manager: 'Marcus Webb', contactPerson: 'James Patel', emergencyPhone: '+44 800 234 5678', status: 'active', notes: 'Statutory employers and public liability.' },
    { id: '3', policyNumber: 'POL-2026-003', insuranceType: 'Business Interruption', company: 'Allianz Commercial', insuranceCompany: 'Allianz Commercial', broker: 'Marsh UK', property: 'Stanhill Court', hotel: 'Stanhill Court', coverage: '£15,000,000', coverageAmount: 15000000, annualPremium: 28900, excessAmount: 10000, startDate: '2025-08-31', expiryDate: '2026-08-31', renewalDate: '2026-07-31', responsibleManager: 'Sarah Chen', manager: 'Sarah Chen', contactPerson: 'Rachel Green', emergencyPhone: '+44 800 345 6789', status: 'expiring-soon', notes: '36-month indemnity period.' },
    { id: '4', policyNumber: 'POL-2026-004', insuranceType: 'Engineering & Machinery Breakdown', company: 'Zurich Insurance', insuranceCompany: 'Zurich Insurance', broker: 'Willis Towers Watson', property: 'Hampton 1 & 2', hotel: 'Hampton 1 & 2', coverage: '£8,500,000', coverageAmount: 8500000, annualPremium: 19400, excessAmount: 1500, startDate: '2026-02-28', expiryDate: '2027-02-28', renewalDate: '2027-01-28', responsibleManager: 'James Okafor', manager: 'James Okafor', contactPerson: 'David Chen', emergencyPhone: '+44 800 456 7890', status: 'active', notes: 'Plant and machinery breakdown cover.' },
    { id: '5', policyNumber: 'POL-2026-005', insuranceType: 'Directors & Officers (D&O)', company: 'Chubb European Group', insuranceCompany: 'Chubb European Group', broker: 'Aon UK', property: 'Ravents Ait Island', hotel: 'Ravents Ait Island', coverage: '£10,000,000', coverageAmount: 10000000, annualPremium: 14200, excessAmount: 2500, startDate: '2025-10-31', expiryDate: '2026-10-31', renewalDate: '2026-09-30', responsibleManager: 'Priya Sharma', manager: 'Priya Sharma', contactPerson: 'Lisa Wong', emergencyPhone: '+44 800 567 8901', status: 'active', notes: 'Governance and director indemnity.' },
    { id: '6', policyNumber: 'POL-2026-006', insuranceType: 'Marine & Waterfront Risk', company: 'Navigators Underwriting', insuranceCompany: 'Navigators Underwriting', broker: 'Marsh UK', property: 'River Club', hotel: 'River Club', coverage: '£12,000,000', coverageAmount: 12000000, annualPremium: 22800, excessAmount: 5000, startDate: '2025-07-31', expiryDate: '2026-07-31', renewalDate: '2026-06-30', responsibleManager: 'David Thornton', manager: 'David Thornton', contactPerson: 'Mark Phillips', emergencyPhone: '+44 800 678 9012', status: 'expired', notes: 'Waterfront risk and marine hull liability.' },
  ],
  utilities: [
    { id: 'ut-001', accountNo: 'ELEC-CP-001', property: 'Crowne Plaza Kingston-south', utilityType: 'Electricity', supplier: 'British Gas Business', meterNo: 'MPAN-190002847192', contractEndDate: '2027-03-31', annualCost: 48200, status: 'active' },
    { id: 'ut-002', accountNo: 'GAS-CP-001', property: 'Crowne Plaza Kingston-south', utilityType: 'Gas', supplier: 'TotalEnergies Gas & Power', meterNo: 'MPRN-84729104', contractEndDate: '2026-11-30', annualCost: 26400, status: 'active' },
    { id: 'ut-003', accountNo: 'WAT-CP-001', property: 'Crowne Plaza Kingston-south', utilityType: 'Water', supplier: 'Thames Water Commercial', meterNo: 'SPID-301928471', contractEndDate: '2027-09-30', annualCost: 14800, status: 'active' },
    { id: 'ut-004', accountNo: 'ELEC-SC-001', property: 'Stanhill Court', utilityType: 'Electricity', supplier: 'EDF Energy', meterNo: 'MPAN-190008472910', contractEndDate: '2026-09-15', annualCost: 36500, status: 'expiring-soon' },
    { id: 'ut-005', accountNo: 'GAS-SC-001', property: 'Stanhill Court', utilityType: 'Gas', supplier: 'British Gas Business', meterNo: 'MPRN-49201847', contractEndDate: '2026-08-31', annualCost: 21000, status: 'expiring-soon' },
    { id: 'ut-006', accountNo: 'ELEC-H12-001', property: 'Hampton 1 & 2', utilityType: 'Electricity', supplier: 'E.ON Next', meterNo: 'MPAN-190003928174', contractEndDate: '2027-06-30', annualCost: 31200, status: 'active' },
  ],
  documents: [...DOCUMENTS],
  users: [
    { id: '1', name: 'Group Admin', email: 'admin@samkocentral.com', role: 'super-admin', hotel: 'All Properties', status: 'active', lastLogin: '2026-07-21', initials: 'GA' },
    { id: '2', name: 'Marcus Webb', email: 'm.webb@crowneplaza.com', role: 'hotel-manager', hotel: 'Crowne Plaza Kingston-south', status: 'active', lastLogin: '2026-07-20', initials: 'MW' },
    { id: '3', name: 'Tom Bradley', email: 't.bradley@stanhill.com', role: 'hotel-manager', hotel: 'Stanhill Court', status: 'active', lastLogin: '2026-07-19', initials: 'TB' },
    { id: '4', name: 'Priya Sharma', email: 'p.sharma@hampton.com', role: 'engineering-manager', hotel: 'Hampton 1 & 2', status: 'active', lastLogin: '2026-07-18', initials: 'PS' },
    { id: '5', name: 'James Okafor', email: 'j.okafor@ravents.com', role: 'maintenance-engineer', hotel: 'Ravents Ait Island', status: 'active', lastLogin: '2026-07-17', initials: 'JO' },
    { id: '6', name: 'Sarah Chen', email: 's.chen@riverclub.com', role: 'housekeeping-manager', hotel: 'River Club', status: 'active', lastLogin: '2026-07-16', initials: 'SC' },
    { id: '7', name: 'David Park', email: 'd.park@samkocentral.com', role: 'read-only', hotel: 'All Properties', status: 'inactive', lastLogin: '2026-06-30', initials: 'DP' },
    { id: '8', name: 'Rachel Green', email: 'r.green@samkocentral.com', role: 'admin', hotel: 'All Properties', status: 'active', lastLogin: '2026-07-20', initials: 'RG' },
  ],
};

const SEED_DB_PATH = path.join(process.cwd(), 'src', 'data', 'samko_db.json');
const RUNTIME_DB_DIR = process.env.NODE_ENV === 'production' && fs.existsSync('/tmp')
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
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    try {
      lastMtime = fs.statSync(DB_FILE_PATH).mtimeMs;
    } catch {}
  } catch (e) {
    console.warn('[serverData] Disk save warning:', e);
  }
}

function loadFromDisk(force = false): boolean {
  try {
    const targetPath = fs.existsSync(DB_FILE_PATH) ? DB_FILE_PATH : fs.existsSync(SEED_DB_PATH) ? SEED_DB_PATH : null;
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
  return (
    String(item.id || '').toLowerCase().trim() === target ||
    String(item.assetId || '').toLowerCase().trim() === target ||
    String(item.propertyId || '').toLowerCase().trim() === target ||
    String(item.hotelId || '').toLowerCase().trim() === target ||
    String(item.complianceId || '').toLowerCase().trim() === target ||
    String(item.contractId || '').toLowerCase().trim() === target ||
    String(item.policyNumber || '').toLowerCase().trim() === target ||
    String(item.accountNo || '').toLowerCase().trim() === target ||
    String(item.accountNumber || '').toLowerCase().trim() === target ||
    String(item.taskId || '').toLowerCase().trim() === target ||
    String(item.documentId || '').toLowerCase().trim() === target ||
    String(item.userId || '').toLowerCase().trim() === target
  );
}

async function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function getCollectionData(collectionName: string, forceRemote = false): Promise<any[]> {
  loadFromDisk();
  const cached = memoryStore[collectionName];

  // Return cached data immediately for sub-millisecond response
  if (!forceRemote && cached && cached.length > 0) {
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
  const docData = { ...data, id, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };

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
    try {
      await withTimeout(adminDb.collection(collectionName).doc(String(id)).set(docData, { merge: true }), 3000);
    } catch (e) {
      console.warn(`[serverData] Admin Firestore write to ${collectionName} failed:`, e);
    }
  } else {
    const clientDb = getDb();
    if (clientDb) {
      try {
        await withTimeout(setDoc(doc(clientDb, collectionName, String(id)), docData, { merge: true }), 3000);
      } catch (e) {
        console.warn(`[serverData] Client Firestore write to ${collectionName} failed:`, e);
      }
    }
  }

  return docData;
}

export async function bulkCreateDocuments(collectionName: string, items: any[]): Promise<{ count: number; data: any[] }> {
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

export async function updateDocument(collectionName: string, id: string, data: any): Promise<any | null> {
  loadFromDisk();
  const updatedAt = new Date().toISOString();
  const store = memoryStore[collectionName] || [];
  const idx = store.findIndex((item: any) => matchesId(item, id));
  
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
    try {
      await withTimeout(adminDb.collection(collectionName).doc(String(targetId)).set({ ...data, updatedAt }, { merge: true }), 3000);
    } catch (e) {
      console.warn(`[serverData] Admin Firestore update to ${collectionName}/${targetId} failed:`, e);
    }
  } else {
    const clientDb = getDb();
    if (clientDb) {
      try {
        await withTimeout(setDoc(doc(clientDb, collectionName, String(targetId)), { ...data, updatedAt }, { merge: true }), 3000);
      } catch (e) {
        console.warn(`[serverData] Client Firestore update to ${collectionName}/${targetId} failed:`, e);
      }
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
    try {
      await withTimeout(adminDb.collection(collectionName).doc(String(targetId)).delete(), 3000);
    } catch (e) {
      console.warn(`[serverData] Admin Firestore delete ${collectionName}/${targetId} failed:`, e);
    }
  } else {
    const clientDb = getDb();
    if (clientDb) {
      try {
        await withTimeout(deleteDoc(doc(clientDb, collectionName, String(targetId))), 3000);
      } catch (e) {
        console.warn(`[serverData] Client Firestore delete ${collectionName}/${targetId} failed:`, e);
      }
    }
  }

  return true;
}

export async function seedAllCollections(): Promise<{ success: boolean; counts: Record<string, number>; message: string }> {
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
