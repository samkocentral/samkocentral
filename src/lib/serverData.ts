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
  compliance: [
    {
        "id": "comp-cp-1",
        "complianceId": "FRA-2026-CPS",
        "name": "Fire Risk Assessment (FRA)",
        "item": "Fire Risk Assessment (FRA)",
        "title": "Fire Risk Assessment (FRA)",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Fire Risk Assessment (FRA) under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "FRA-2026-CPS",
        "certificateRef": "FRA-2026-CPS",
        "issueDate": "2026-04-27",
        "lastInspection": "2026-04-27",
        "lastReviewed": "2026-04-27",
        "expiryDate": "2027-04-27",
        "dueDate": "2027-04-27",
        "renewalDate": "2027-04-27",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Peninsula",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Peninsula. Frequency: Yearly."
    },
    {
        "id": "comp-cp-2",
        "complianceId": "COMP-CP-002",
        "name": "Fire Alarm Service",
        "item": "Fire Alarm Service",
        "title": "Fire Alarm Service",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Fire Alarm Service under BS 5839",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "BS 5839",
        "standard": "BS 5839",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-04-14",
        "lastInspection": "2026-04-14",
        "lastReviewed": "2026-04-14",
        "expiryDate": "2026-10-14",
        "dueDate": "2026-10-14",
        "renewalDate": "2026-10-14",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "City Fire",
        "status": "overdue",
        "riskRating": "critical",
        "notes": "Standard: BS 5839. Contractor: City Fire. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-3",
        "complianceId": "COMP-CP-003",
        "name": "Emergency Lighting Service",
        "item": "Emergency Lighting Service",
        "title": "Emergency Lighting Service",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Emergency Lighting Service under BS 5266-1:2025 / BS EN 50172 / BS EN 1838",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "BS 5266-1:2025 / BS EN 50172 / BS EN 1838",
        "standard": "BS 5266-1:2025 / BS EN 50172 / BS EN 1838",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-04-14",
        "lastInspection": "2026-04-14",
        "lastReviewed": "2026-04-14",
        "expiryDate": "2027-04-14",
        "dueDate": "2027-04-14",
        "renewalDate": "2027-04-14",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "City Fire",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: BS 5266-1:2025 / BS EN 50172 / BS EN 1838. Contractor: City Fire. Frequency: Yearly."
    },
    {
        "id": "comp-cp-4",
        "complianceId": "COMP-CP-004",
        "name": "Dry Riser Test",
        "item": "Dry Riser Test",
        "title": "Dry Riser Test",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Dry Riser Test under BS 9990:2015",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "BS 9990:2015",
        "standard": "BS 9990:2015",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-01-30",
        "lastInspection": "2026-01-30",
        "lastReviewed": "2026-01-30",
        "expiryDate": "2027-01-30",
        "dueDate": "2027-01-30",
        "renewalDate": "2027-01-30",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Dry Risers Direct",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: BS 9990:2015. Contractor: Dry Risers Direct. Frequency: Yearly."
    },
    {
        "id": "comp-cp-5",
        "complianceId": "COMP-CP-005",
        "name": "Fire Door Inspectation",
        "item": "Fire Door Inspectation",
        "title": "Fire Door Inspectation",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Fire Door Inspectation under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-02-27",
        "lastInspection": "2026-02-27",
        "lastReviewed": "2026-02-27",
        "expiryDate": "2026-08-29",
        "dueDate": "2026-08-29",
        "renewalDate": "2026-08-29",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Internal team",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Internal team. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-6",
        "complianceId": "COMP-CP-006",
        "name": "Fire Extinguisher",
        "item": "Fire Extinguisher",
        "title": "Fire Extinguisher",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Fire Extinguisher under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-03-13",
        "lastInspection": "2026-03-13",
        "lastReviewed": "2026-03-13",
        "expiryDate": "2027-03-13",
        "dueDate": "2027-03-13",
        "renewalDate": "2027-03-13",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "City Fire",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: City Fire. Frequency: Yearly."
    },
    {
        "id": "comp-cp-7",
        "complianceId": "COMP-CP-007",
        "name": "Fire Drill Evacuation",
        "item": "Fire Drill Evacuation",
        "title": "Fire Drill Evacuation",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Fire Drill Evacuation under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-04-14",
        "lastInspection": "2026-04-14",
        "lastReviewed": "2026-04-14",
        "expiryDate": "2026-10-14",
        "dueDate": "2026-10-14",
        "renewalDate": "2026-10-14",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Internal team",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Internal team. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-8",
        "complianceId": "COMP-CP-008",
        "name": "Kitchen Fire Supression System Inspections",
        "item": "Kitchen Fire Supression System Inspections",
        "title": "Kitchen Fire Supression System Inspections",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Kitchen Fire Supression System Inspections under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Kitchen",
        "area": "Commercial Kitchen & Extraction",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-03-12",
        "lastInspection": "2026-03-12",
        "lastReviewed": "2026-03-12",
        "expiryDate": "2026-09-11",
        "dueDate": "2026-09-11",
        "renewalDate": "2026-09-11",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Ansul",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Ansul. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-9",
        "complianceId": "COMP-CP-009",
        "name": "Duct Cleaning",
        "item": "Duct Cleaning",
        "title": "Duct Cleaning",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Duct Cleaning under BESA TR19 Grease",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Kitchen",
        "area": "Commercial Kitchen & Extraction",
        "regulatoryAuthority": "BESA TR19 Grease",
        "standard": "BESA TR19 Grease",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-03-11",
        "lastInspection": "2026-03-11",
        "lastReviewed": "2026-03-11",
        "expiryDate": "2026-09-10",
        "dueDate": "2026-09-10",
        "renewalDate": "2026-09-10",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Approved Contractor",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: BESA TR19 Grease. Contractor: Internal. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-10",
        "complianceId": "COMP-CP-010",
        "name": "Linen Chute Inspectation",
        "item": "Linen Chute Inspectation",
        "title": "Linen Chute Inspectation",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Linen Chute Inspectation under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-12-10",
        "lastInspection": "2025-12-10",
        "lastReviewed": "2025-12-10",
        "expiryDate": "2026-12-10",
        "dueDate": "2026-12-10",
        "renewalDate": "2026-12-10",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Hardall International Limited",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Hardall International Limited. Frequency: Yearly."
    },
    {
        "id": "comp-cp-11",
        "complianceId": "COMP-CP-011",
        "name": "Boiler Service",
        "item": "Boiler Service",
        "title": "Boiler Service",
        "type": "Statutory",
        "category": "Gas Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Boiler Service under Gas Safety (Installation and Use) Regulations 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Basement Boiler Plant Room",
        "regulatoryAuthority": "Gas Safety (Installation and Use) Regulations 1998",
        "standard": "Gas Safety (Installation and Use) Regulations 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-10-02",
        "lastInspection": "2025-10-02",
        "lastReviewed": "2025-10-02",
        "expiryDate": "2026-10-02",
        "dueDate": "2026-10-02",
        "renewalDate": "2026-10-02",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Industraheat",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: Industraheat. Frequency: Yearly."
    },
    {
        "id": "comp-cp-12",
        "complianceId": "COMP-CP-012",
        "name": "Boiler Service",
        "item": "Boiler Service",
        "title": "Boiler Service",
        "type": "Statutory",
        "category": "Gas Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Boiler Service under Gas Safety (Installation and Use) Regulations 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Basement Boiler Plant Room",
        "regulatoryAuthority": "Gas Safety (Installation and Use) Regulations 1998",
        "standard": "Gas Safety (Installation and Use) Regulations 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-10-02",
        "lastInspection": "2025-10-02",
        "lastReviewed": "2025-10-02",
        "expiryDate": "2026-10-02",
        "dueDate": "2026-10-02",
        "renewalDate": "2026-10-02",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Industraheat",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: Industraheat. Frequency: Yearly."
    },
    {
        "id": "comp-cp-13",
        "complianceId": "COMP-CP-013",
        "name": "Commercial Gas Safety Certificate – Boilers (CP15)",
        "item": "Commercial Gas Safety Certificate – Boilers (CP15)",
        "title": "Commercial Gas Safety Certificate – Boilers (CP15)",
        "type": "Statutory",
        "category": "Gas Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Commercial Gas Safety Certificate – Boilers (CP15) under Gas Safety (Installation and Use) Regulations 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Basement Boiler Plant Room",
        "regulatoryAuthority": "Gas Safety (Installation and Use) Regulations 1998",
        "standard": "Gas Safety (Installation and Use) Regulations 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-04-15",
        "lastInspection": "2025-04-15",
        "lastReviewed": "2025-04-15",
        "expiryDate": "2026-04-15",
        "dueDate": "2026-04-15",
        "renewalDate": "2026-04-15",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "First Call Limited",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: First Call Limited. Frequency: Yearly."
    },
    {
        "id": "comp-cp-14",
        "complianceId": "COMP-CP-014",
        "name": "Commercial Catering Gas Safety Certificate – Kitchen (CP42)",
        "item": "Commercial Catering Gas Safety Certificate – Kitchen (CP42)",
        "title": "Commercial Catering Gas Safety Certificate – Kitchen (CP42)",
        "type": "Statutory",
        "category": "Gas Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Commercial Catering Gas Safety Certificate – Kitchen (CP42) under Gas Safety (Installation and Use) Regulations 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Kitchen",
        "area": "Commercial Kitchen & Extraction",
        "regulatoryAuthority": "Gas Safety (Installation and Use) Regulations 1998",
        "standard": "Gas Safety (Installation and Use) Regulations 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-04-15",
        "lastInspection": "2025-04-15",
        "lastReviewed": "2025-04-15",
        "expiryDate": "2026-04-15",
        "dueDate": "2026-04-15",
        "renewalDate": "2026-04-15",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "First Call Limited",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: First Call Limited. Frequency: Yearly."
    },
    {
        "id": "comp-cp-15",
        "complianceId": "COMP-CP-015",
        "name": "Lift Service",
        "item": "Lift Service",
        "title": "Lift Service",
        "type": "Statutory",
        "category": "Lifting Equipment",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Lift Service under LOLER 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Lifts & Escalators",
        "regulatoryAuthority": "LOLER 1998",
        "standard": "LOLER 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-04-02",
        "lastInspection": "2026-04-02",
        "lastReviewed": "2026-04-02",
        "expiryDate": "2026-10-02",
        "dueDate": "2026-10-02",
        "renewalDate": "2026-10-02",
        "inspectionFrequency": "6 months",
        "frequency": "6 months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Schindler",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: LOLER 1998. Contractor: Schindler. Frequency: 6 months."
    },
    {
        "id": "comp-cp-16",
        "complianceId": "COMP-CP-016",
        "name": "Lift Service",
        "item": "Lift Service",
        "title": "Lift Service",
        "type": "Statutory",
        "category": "Lifting Equipment",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Lift Service under LOLER 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Lifts & Escalators",
        "regulatoryAuthority": "LOLER 1998",
        "standard": "LOLER 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-04-02",
        "lastInspection": "2026-04-02",
        "lastReviewed": "2026-04-02",
        "expiryDate": "2026-10-02",
        "dueDate": "2026-10-02",
        "renewalDate": "2026-10-02",
        "inspectionFrequency": "6 months",
        "frequency": "6 months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Schindler",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: LOLER 1998. Contractor: Schindler. Frequency: 6 months."
    },
    {
        "id": "comp-cp-17",
        "complianceId": "COMP-CP-017",
        "name": "Lift Service",
        "item": "Lift Service",
        "title": "Lift Service",
        "type": "Statutory",
        "category": "Lifting Equipment",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Lift Service under LOLER 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Lifts & Escalators",
        "regulatoryAuthority": "LOLER 1998",
        "standard": "LOLER 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-04-02",
        "lastInspection": "2026-04-02",
        "lastReviewed": "2026-04-02",
        "expiryDate": "2026-10-02",
        "dueDate": "2026-10-02",
        "renewalDate": "2026-10-02",
        "inspectionFrequency": "6 months",
        "frequency": "6 months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Schindler",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: LOLER 1998. Contractor: Schindler. Frequency: 6 months."
    },
    {
        "id": "comp-cp-18",
        "complianceId": "COMP-CP-018",
        "name": "Health & Safety Visit",
        "item": "Health & Safety Visit",
        "title": "Health & Safety Visit",
        "type": "Non-Statutory",
        "category": "Health & Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Health & Safety Visit under Health & Safety Visit Act 1974",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Health & Safety Visit Act 1974",
        "standard": "Health & Safety Visit Act 1974",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-01-27",
        "lastInspection": "2026-01-27",
        "lastReviewed": "2026-01-27",
        "expiryDate": "2027-01-27",
        "dueDate": "2027-01-27",
        "renewalDate": "2027-01-27",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Peninsula",
        "status": "compliant",
        "riskRating": "medium",
        "notes": "Standard: Health & Safety Visit Act 1974. Contractor: Peninsula. Frequency: Yearly."
    },
    {
        "id": "comp-cp-19",
        "complianceId": "COMP-CP-019",
        "name": "PAT Test",
        "item": "PAT Test",
        "title": "PAT Test",
        "type": "Statutory",
        "category": "Electrical Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "PAT Test under Electricity at Work Regulations 1989",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Plant Rooms & Distribution Boards",
        "regulatoryAuthority": "Electricity at Work Regulations 1989",
        "standard": "Electricity at Work Regulations 1989",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-05-21",
        "lastInspection": "2026-05-21",
        "lastReviewed": "2026-05-21",
        "expiryDate": "2027-05-21",
        "dueDate": "2027-05-21",
        "renewalDate": "2027-05-21",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Blacksure Services",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: Electricity at Work Regulations 1989. Contractor: Blacksure Services. Frequency: Yearly."
    },
    {
        "id": "comp-cp-20",
        "complianceId": "COMP-CP-020",
        "name": "Food Hygiene Rating",
        "item": "Food Hygiene Rating",
        "title": "Food Hygiene Rating",
        "type": "Statutory",
        "category": "Food Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Food Hygiene Rating under Food Safety Act 1990",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Kitchen",
        "area": "Commercial Kitchen & Extraction",
        "regulatoryAuthority": "Food Safety Act 1990",
        "standard": "Food Safety Act 1990",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2024-06-04",
        "lastInspection": "2024-06-04",
        "lastReviewed": "2024-06-04",
        "expiryDate": "2027-12-31",
        "dueDate": "2027-12-31",
        "renewalDate": "2027-12-01",
        "inspectionFrequency": "N/A",
        "frequency": "N/A",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Elmbridge Council",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: Food Safety Act 1990. Contractor: Elmbridge Council. Frequency: N/A."
    },
    {
        "id": "comp-cp-21",
        "complianceId": "COMP-CP-021",
        "name": "Air Conditioning Service",
        "item": "Air Conditioning Service",
        "title": "Air Conditioning Service",
        "type": "Statutory",
        "category": "HVAC",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Air Conditioning Service under Gas Regulations 2015",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Gas Regulations 2015",
        "standard": "Gas Regulations 2015",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-01-01",
        "lastInspection": "2025-01-01",
        "lastReviewed": "2025-01-01",
        "expiryDate": "2026-01-01",
        "dueDate": "2026-01-01",
        "renewalDate": "2026-01-01",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Baseline",
        "status": "overdue",
        "riskRating": "high",
        "notes": "Standard: Gas Regulations 2015. Contractor: Baseline. Frequency: Yearly."
    },
    {
        "id": "comp-cp-22",
        "complianceId": "COMP-CP-022",
        "name": "PPL PRS Licence",
        "item": "PPL PRS Licence",
        "title": "PPL PRS Licence",
        "type": "Statutory",
        "category": "Licensing",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "PPL PRS Licence under Copyright, Designs and Patents Act 1988",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Front Office",
        "area": "Whole Building",
        "regulatoryAuthority": "Copyright, Designs and Patents Act 1988",
        "standard": "Copyright, Designs and Patents Act 1988",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-01-21",
        "lastInspection": "2026-01-21",
        "lastReviewed": "2026-01-21",
        "expiryDate": "2027-01-20",
        "dueDate": "2027-01-20",
        "renewalDate": "2027-01-20",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "PPL PRS",
        "status": "compliant",
        "riskRating": "medium",
        "notes": "Standard: Copyright, Designs and Patents Act 1988. Contractor: PPL PRS. Frequency: Yearly."
    },
    {
        "id": "comp-cp-23",
        "complianceId": "COMP-CP-023",
        "name": "MPLC",
        "item": "MPLC",
        "title": "MPLC",
        "type": "Statutory",
        "category": "Licensing",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "MPLC under Copyright, Designs and Patents Act 1988",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Front Office",
        "area": "Whole Building",
        "regulatoryAuthority": "Copyright, Designs and Patents Act 1988",
        "standard": "Copyright, Designs and Patents Act 1988",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-09-21",
        "lastInspection": "2025-09-21",
        "lastReviewed": "2025-09-21",
        "expiryDate": "2026-09-21",
        "dueDate": "2026-09-21",
        "renewalDate": "2026-09-21",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "MPLC",
        "status": "overdue",
        "riskRating": "medium",
        "notes": "Standard: Copyright, Designs and Patents Act 1988. Contractor: MPLC. Frequency: Yearly."
    },
    {
        "id": "comp-cp-24",
        "complianceId": "COMP-CP-024",
        "name": "Wedding License",
        "item": "Wedding License",
        "title": "Wedding License",
        "type": "Statutory",
        "category": "Licensing",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Wedding License under Marriages and Civil Partnerships (Approved Premises) Regulations 200",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Front Office",
        "area": "Whole Building",
        "regulatoryAuthority": "Marriages and Civil Partnerships (Approved Premises) Regulations 200",
        "standard": "Marriages and Civil Partnerships (Approved Premises) Regulations 200",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-12-13",
        "lastInspection": "2025-12-13",
        "lastReviewed": "2025-12-13",
        "expiryDate": "2026-12-13",
        "dueDate": "2026-12-13",
        "renewalDate": "2026-12-13",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Elmbridge Council",
        "status": "compliant",
        "riskRating": "medium",
        "notes": "Standard: Marriages and Civil Partnerships (Approved Premises) Regulations 200. Contractor: Elmbridge Council. Frequency: Yearly."
    },
    {
        "id": "comp-cp-25",
        "complianceId": "COMP-CP-025",
        "name": "TV License",
        "item": "TV License",
        "title": "TV License",
        "type": "Statutory",
        "category": "Licensing",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "TV License under Communications Act 2003",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Front Office",
        "area": "Whole Building",
        "regulatoryAuthority": "Communications Act 2003",
        "standard": "Communications Act 2003",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-01-01",
        "lastInspection": "2025-01-01",
        "lastReviewed": "2025-01-01",
        "expiryDate": "2026-01-01",
        "dueDate": "2026-01-01",
        "renewalDate": "2026-01-01",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Tv Licensing",
        "status": "overdue",
        "riskRating": "medium",
        "notes": "Standard: Communications Act 2003. Contractor: Tv Licensing. Frequency: Yearly."
    },
    {
        "id": "comp-cp-26",
        "complianceId": "COMP-CP-026",
        "name": "Data Protection Registration  Certificate",
        "item": "Data Protection Registration  Certificate",
        "title": "Data Protection Registration  Certificate",
        "type": "Statutory",
        "category": "Licensing",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Data Protection Registration  Certificate under Data Protection (Charges and Information) Regulations 2018",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Front Office",
        "area": "Whole Building",
        "regulatoryAuthority": "Data Protection (Charges and Information) Regulations 2018",
        "standard": "Data Protection (Charges and Information) Regulations 2018",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-01-01",
        "lastInspection": "2025-01-01",
        "lastReviewed": "2025-01-01",
        "expiryDate": "2026-01-01",
        "dueDate": "2026-01-01",
        "renewalDate": "2026-01-01",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "DPRC",
        "status": "overdue",
        "riskRating": "medium",
        "notes": "Standard: Data Protection (Charges and Information) Regulations 2018. Contractor: DPRC. Frequency: Yearly."
    },
    {
        "id": "comp-cp-27",
        "complianceId": "COMP-CP-027",
        "name": "Pest Control",
        "item": "Pest Control",
        "title": "Pest Control",
        "type": "Statutory",
        "category": "Food Safety",
        "complianceType": "OpCo",
        "section": "OpCo",
        "description": "Pest Control under Food Safety Act 1990",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Kitchen",
        "area": "Commercial Kitchen & Extraction",
        "regulatoryAuthority": "Food Safety Act 1990",
        "standard": "Food Safety Act 1990",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-01-26",
        "lastInspection": "2026-01-26",
        "lastReviewed": "2026-01-26",
        "expiryDate": "2026-04-26",
        "dueDate": "2026-04-26",
        "renewalDate": "2026-04-26",
        "inspectionFrequency": "3 Months",
        "frequency": "3 Months",
        "responsiblePerson": "Nathan Coote",
        "assignee": "Nathan Coote",
        "contractor": "Nuture",
        "status": "overdue",
        "riskRating": "medium",
        "notes": "Standard: Food Safety Act 1990. Contractor: Nuture. Frequency: 3 Months."
    },
    {
        "id": "comp-cp-28",
        "complianceId": "COMP-CP-028",
        "name": "Legionella Bacteria Water Risk Assessment",
        "item": "Legionella Bacteria Water Risk Assessment",
        "title": "Legionella Bacteria Water Risk Assessment",
        "type": "Statutory",
        "category": "Water Safety",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "Legionella Bacteria Water Risk Assessment under HSE ACOP L8 / HSG274",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Facilities",
        "area": "Calorifiers & Water Storage",
        "regulatoryAuthority": "HSE ACOP L8 / HSG274",
        "standard": "HSE ACOP L8 / HSG274",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-01-22",
        "lastInspection": "2025-01-22",
        "lastReviewed": "2025-01-22",
        "expiryDate": "2027-01-22",
        "dueDate": "2027-01-22",
        "renewalDate": "2027-01-22",
        "inspectionFrequency": "2 Years",
        "frequency": "2 Years",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "Guardian",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: HSE ACOP L8 / HSG274. Contractor: Guardian. Frequency: 2 Years."
    },
    {
        "id": "comp-cp-29",
        "complianceId": "COMP-CP-029",
        "name": "Asbestos",
        "item": "Asbestos",
        "title": "Asbestos",
        "type": "Statutory",
        "category": "Asbestos Managenment",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "Asbestos under Control of Asbestos Regulations 2012",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Control of Asbestos Regulations 2012",
        "standard": "Control of Asbestos Regulations 2012",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-09-18",
        "lastInspection": "2025-09-18",
        "lastReviewed": "2025-09-18",
        "expiryDate": "2027-12-31",
        "dueDate": "2027-12-31",
        "renewalDate": "2027-12-01",
        "inspectionFrequency": "N/A",
        "frequency": "N/A",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "PCA",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: Control of Asbestos Regulations 2012. Contractor: PCA. Frequency: N/A."
    },
    {
        "id": "comp-cp-30",
        "complianceId": "COMP-CP-030",
        "name": "LOLER",
        "item": "LOLER",
        "title": "LOLER",
        "type": "Statutory",
        "category": "Lifting Equipment",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "LOLER under LOLER 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Lifts & Escalators",
        "regulatoryAuthority": "LOLER 1998",
        "standard": "LOLER 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-08-18",
        "lastInspection": "2026-08-18",
        "lastReviewed": "2026-08-18",
        "expiryDate": "2027-02-17",
        "dueDate": "2027-02-17",
        "renewalDate": "2027-02-17",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "Allianz",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: LOLER 1998. Contractor: Allianz. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-31",
        "complianceId": "COMP-CP-031",
        "name": "LOLER",
        "item": "LOLER",
        "title": "LOLER",
        "type": "Statutory",
        "category": "Lifting Equipment",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "LOLER under LOLER 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Lifts & Escalators",
        "regulatoryAuthority": "LOLER 1998",
        "standard": "LOLER 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-08-18",
        "lastInspection": "2026-08-18",
        "lastReviewed": "2026-08-18",
        "expiryDate": "2027-02-17",
        "dueDate": "2027-02-17",
        "renewalDate": "2027-02-17",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "Allianz",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: LOLER 1998. Contractor: Allianz. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-32",
        "complianceId": "COMP-CP-032",
        "name": "LOLER",
        "item": "LOLER",
        "title": "LOLER",
        "type": "Statutory",
        "category": "Lifting Equipment",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "LOLER under LOLER 1998",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Lifts & Escalators",
        "regulatoryAuthority": "LOLER 1998",
        "standard": "LOLER 1998",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2026-08-18",
        "lastInspection": "2026-08-18",
        "lastReviewed": "2026-08-18",
        "expiryDate": "2027-02-17",
        "dueDate": "2027-02-17",
        "renewalDate": "2027-02-17",
        "inspectionFrequency": "6 Months",
        "frequency": "6 Months",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "Allianz",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: LOLER 1998. Contractor: Allianz. Frequency: 6 Months."
    },
    {
        "id": "comp-cp-33",
        "complianceId": "COMP-CP-033",
        "name": "Lightning Protection",
        "item": "Lightning Protection",
        "title": "Lightning Protection",
        "type": "Statutory",
        "category": "Electrical Safety",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "Lightning Protection under BS EN 62305",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Plant Rooms & Distribution Boards",
        "regulatoryAuthority": "BS EN 62305",
        "standard": "BS EN 62305",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-08-05",
        "lastInspection": "2025-08-05",
        "lastReviewed": "2025-08-05",
        "expiryDate": "2026-08-05",
        "dueDate": "2026-08-05",
        "renewalDate": "2026-08-05",
        "inspectionFrequency": "Yearly",
        "frequency": "Yearly",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "Strike Control",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: BS EN 62305. Contractor: Strike Control. Frequency: Yearly."
    },
    {
        "id": "comp-cp-34",
        "complianceId": "COMP-CP-034",
        "name": "External Wall Assessment FRAEW",
        "item": "External Wall Assessment FRAEW",
        "title": "External Wall Assessment FRAEW",
        "type": "Statutory",
        "category": "Fire Safety",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "External Wall Assessment FRAEW under Regulatory Reform (Fire Safety) Order 2005",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Whole Building",
        "regulatoryAuthority": "Regulatory Reform (Fire Safety) Order 2005",
        "standard": "Regulatory Reform (Fire Safety) Order 2005",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2025-08-19",
        "lastInspection": "2025-08-19",
        "lastReviewed": "2025-08-19",
        "expiryDate": "2027-12-31",
        "dueDate": "2027-12-31",
        "renewalDate": "2027-12-01",
        "inspectionFrequency": "N/A",
        "frequency": "N/A",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "City Fire",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: City Fire. Frequency: N/A."
    },
    {
        "id": "comp-cp-35",
        "complianceId": "COMP-CP-035",
        "name": "Energy Performance Certificate",
        "item": "Energy Performance Certificate",
        "title": "Energy Performance Certificate",
        "type": "Statutory",
        "category": "Electrical Safety",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "Energy Performance Certificate under BS EN 62305",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Plant Rooms & Distribution Boards",
        "regulatoryAuthority": "BS EN 62305",
        "standard": "BS EN 62305",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2018-04-16",
        "lastInspection": "2018-04-16",
        "lastReviewed": "2018-04-16",
        "expiryDate": "2028-04-13",
        "dueDate": "2028-04-13",
        "renewalDate": "2028-04-13",
        "inspectionFrequency": "10 years",
        "frequency": "10 years",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "Elmbridge Conuncil",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: BS EN 62305. Contractor: Elmbridge Conuncil. Frequency: 10 years."
    },
    {
        "id": "comp-cp-36",
        "complianceId": "COMP-CP-036",
        "name": "Electrical Installation Condition Report",
        "item": "Electrical Installation Condition Report",
        "title": "Electrical Installation Condition Report",
        "type": "Statutory",
        "category": "Electrical Safety",
        "complianceType": "PropCo",
        "section": "PropCo",
        "description": "Electrical Installation Condition Report under BS EN 62305",
        "property": "Crowne Plaza Kingston-south",
        "hotel": "Crowne Plaza Kingston-south",
        "site": "Crowne Plaza Kingston-south",
        "hotelName": "Crowne Plaza Kingston-south",
        "hotelId": "hotel-001",
        "propertyId": "hotel-001",
        "department": "Engineering",
        "area": "Plant Rooms & Distribution Boards",
        "regulatoryAuthority": "BS EN 62305",
        "standard": "BS EN 62305",
        "certificateNumber": "",
        "certificateRef": "",
        "issueDate": "2024-09-16",
        "lastInspection": "2024-09-16",
        "lastReviewed": "2024-09-16",
        "expiryDate": "2029-09-15",
        "dueDate": "2029-09-15",
        "renewalDate": "2029-09-15",
        "inspectionFrequency": "5 Years",
        "frequency": "5 Years",
        "responsiblePerson": "Kevin Davis",
        "assignee": "Kevin Davis",
        "contractor": "NICEIC",
        "status": "compliant",
        "riskRating": "high",
        "notes": "Standard: BS EN 62305. Contractor: NICEIC. Frequency: 5 Years."
    }
],
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
    } catch {}
    try {
      lastMtime = fs.statSync(DB_FILE_PATH).mtimeMs;
    } catch {}
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
