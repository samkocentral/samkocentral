'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  FileText,
  Bell,
  ChevronDown,
  Loader2,
  Trash2,
  X,
  Check,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import StatusDropdown from '@/components/ui/StatusDropdown';
import {
  useDeepPageCms,
  DEFAULT_COMPLIANCE_CATEGORIES,
  addDropdownOption,
  removeDropdownOptionByName,
} from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { getLivePropertyNames } from '@/hooks/useLiveProperties';

type ComplianceStatus = 'compliant' | 'expiring-soon' | 'overdue' | 'pending';
type RiskRating = 'low' | 'medium' | 'high' | 'critical';

interface ComplianceItem {
  id: string;
  complianceId: string;
  name: string;
  item?: string;
  title?: string;
  type: string;
  category: string;
  description: string;
  hotel: string;
  property?: string;
  site?: string;
  hotelName?: string;
  hotelId?: string;
  propertyId?: string;
  department: string;
  area: string;
  relatedAsset?: string;
  regulatoryAuthority: string;
  standard?: string;
  certificateNumber?: string;
  certificateRef?: string;
  issueDate: string;
  lastInspection?: string;
  lastReviewed?: string;
  expiryDate: string;
  dueDate?: string;
  renewalDate: string;
  inspectionFrequency: string;
  frequency?: string;
  responsiblePerson: string;
  assignee?: string;
  contractor?: string;
  status: ComplianceStatus;
  riskRating: RiskRating;
  notes?: string;
  complianceType?: string;
  section?: string;
}

const COMPLIANCE_CATEGORIES = [
  'Fire Risk Assessment',
  'Fire Alarm Certificate',
  'Emergency Lighting',
  'PAT Testing',
  'Fixed Wire Testing',
  'Gas Safety',
  'Water Hygiene',
  'Legionella',
  'Lift Inspection',
  'Pressure Systems',
  'Kitchen Extraction',
  'HVAC Certification',
  'Asbestos Survey',
  'Electrical Compliance',
  'Health & Safety',
  'Food Hygiene',
  'Environmental',
  'Insurance Compliance',
  'Hotel Brand Standards',
  'Local Authority Requirements',
];

const DEFAULT_HOTELS = ['Crowne Plaza Kingston-south', 'Stanhill Court'];

const MOCK_COMPLIANCE: ComplianceItem[] = [
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
];

const STATUS_CONFIG: Record<
  ComplianceStatus,
  { label: string; bg: string; color: string; icon: React.ElementType }
> = {
  compliant: {
    label: 'Compliant',
    bg: 'rgba(61,214,140,0.12)',
    color: '#3dd68c',
    icon: CheckCircle2,
  },
  'expiring-soon': {
    label: 'Expiring Soon',
    bg: 'rgba(245,158,11,0.12)',
    color: '#f59e0b',
    icon: Clock,
  },
  overdue: { label: 'Overdue', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', icon: AlertTriangle },
  pending: { label: 'Pending', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', icon: Clock },
};

const RISK_CONFIG: Record<RiskRating, { bg: string; color: string }> = {
  low: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  high: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  critical: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date('2025-07-21');
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function KPICard({
  label,
  value,
  sub,
  color,
  icon: IconComponent,
}: {
  label: string;
  value: number | string;
  sub: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title={label}
          >
            {label}
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight truncate"
            style={{ color }}
          >
            {value}
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">{sub}</div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <IconComponent size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function ComplianceRegisterClient() {
  const {
    isViewer,
    canEdit,
    canDelete,
    canWriteTab,
    isPropertyAccessible,
    activePortal,
    setActivePortal,
  } = useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('compliance');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('compliance');
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    columns: cmsColumns,
    items: cmsItems,
    dropdowns: cmsDropdowns,
  } = useDeepPageCms('compliance');

  // Dynamic custom categories synced with deepPageCms and localStorage
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_compliance_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    const handleCategorySync = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('samko_compliance_categories');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setCustomCategories(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('samko:compliance_categories_updated', handleCategorySync);
    window.addEventListener('samko:deep-cms-updated', handleCategorySync);
    window.addEventListener('samko:data-changed', handleCategorySync);
    return () => {
      window.removeEventListener('samko:compliance_categories_updated', handleCategorySync);
      window.removeEventListener('samko:deep-cms-updated', handleCategorySync);
      window.removeEventListener('samko:data-changed', handleCategorySync);
    };
  }, []);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const c = newCatName.trim();
    if (!c) return;
    addDropdownOption('compliance', 'category', c);
    if (!customCategories.includes(c)) {
      const updated = [...customCategories, c];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_compliance_categories', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('samko:compliance_categories_updated', {
            detail: { categories: updated },
          })
        );
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'compliance_category', name: c },
          })
        );
      }
    }
    toast.success('Compliance Category Created', {
      description: `Added "${c}" to compliance categories`,
    });
    setNewCatName('');
  };

  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('compliance', 'category', catName);
    const updated = customCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
    setCustomCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_compliance_categories', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('samko:compliance_categories_updated', { detail: { categories: updated } })
      );
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'compliance_category_deleted', name: catName },
        })
      );
    }
    setFilterCategory((prev) => prev.filter((c) => c !== catName));
    toast.success(`Removed category "${catName}"`);
  };

  const handleViewCategoryRecords = (catName: string) => {
    setFilterCategory([catName]);
    setShowAddCategoryModal(false);
    const count = items.filter(
      (c) =>
        isPropertyAccessible(c.hotel || (c as any).property || (c as any).site) &&
        c.category === catName
    ).length;
    toast.info(`Filtered to ${catName}`, {
      description: `Showing ${count} item(s) matching category "${catName}"`,
    });
  };

  const handleSaveEditCategory = () => {
    if (!editingCat) return;
    const oldName = editingCat.oldName.trim();
    const newName = editingCat.newName.trim();
    if (!newName || oldName === newName) {
      setEditingCat(null);
      return;
    }
    const updatedCustom = customCategories.map((c) =>
      c.toLowerCase() === oldName.toLowerCase() ? newName : c
    );
    if (!updatedCustom.includes(newName)) {
      updatedCustom.push(newName);
    }
    setCustomCategories(updatedCustom);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_compliance_categories', JSON.stringify(updatedCustom));
      } catch {}
    }
    removeDropdownOptionByName('compliance', 'category', oldName);
    addDropdownOption('compliance', 'category', newName);

    const updatedItems = items.map((c) => {
      if (c.category === oldName) {
        return { ...c, category: newName };
      }
      return c;
    });
    setItems(updatedItems);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_compliance_items', JSON.stringify(updatedItems));
      } catch {}
    }
    setEditingCat(null);
    toast.success(`Renamed category "${oldName}" to "${newName}"`);
  };

  const handleConfirmDeleteCategory = () => {
    if (!catToDelete) return;
    handleDeleteCategory(catToDelete);
    setCatToDelete(null);
  };

  const DEFAULT_COMPLIANCE_COLUMNS = useMemo(
    () => [
      { id: 'name', label: 'Compliance Item', originalLabel: 'Name', visible: true, order: 1 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 2 },
      { id: 'property', label: 'Property', originalLabel: 'Property', visible: true, order: 3 },
      { id: 'standard', label: 'Standard', originalLabel: 'Standard', visible: true, order: 4 },
      { id: 'contractor', label: 'Contractor', originalLabel: 'Contractor', visible: true, order: 5 },
      { id: 'frequency', label: 'Frequency', originalLabel: 'Frequency', visible: true, order: 6 },
      {
        id: 'lastInspection',
        label: 'Last Inspection',
        originalLabel: 'Last Inspection',
        visible: true,
        order: 7,
      },
      {
        id: 'expiryDate',
        label: 'Expiry Date',
        originalLabel: 'Expiry Date',
        visible: true,
        order: 8,
      },
      {
        id: 'certificateRef',
        label: 'Certificate Ref',
        originalLabel: 'Certificate Ref',
        visible: true,
        order: 9,
      },
      {
        id: 'responsiblePerson',
        label: 'Responsible',
        originalLabel: 'Responsible',
        visible: true,
        order: 10,
      },
      { id: 'riskRating', label: 'Risk Rating', originalLabel: 'Risk', visible: true, order: 11 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 12 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 13 },
    ],
    []
  );

  const activeColumns = useMemo(() => {
    let cols: any[] = [];
    if (cmsColumns && cmsColumns.length > 0) {
      const existingIds = new Set(cmsColumns.map((c: any) => c.id.toLowerCase()));
      const missingDefaults = DEFAULT_COMPLIANCE_COLUMNS.filter(
        (dc) => !existingIds.has(dc.id.toLowerCase())
      );
      cols = [...cmsColumns, ...missingDefaults].filter(
        (c) => c.visible !== false && c.id.toLowerCase() !== 'id'
      );
    } else {
      cols = DEFAULT_COMPLIANCE_COLUMNS.filter((c) => c.visible !== false);
    }

    // Separate actions column to GUARANTEE it is ALWAYS the last column!
    const nonActions = cols
      .filter((c) => c.id.toLowerCase() !== 'actions')
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const actionsCol = cols.find((c) => c.id.toLowerCase() === 'actions') || {
      id: 'actions',
      label: 'Actions',
      originalLabel: 'Actions',
      visible: true,
      order: 999,
    };

    return [...nonActions, actionsCol];
  }, [cmsColumns, DEFAULT_COMPLIANCE_COLUMNS]);

  const [items, setItems] = useState<ComplianceItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_compliance_v3');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 30) return parsed;
        }
      } catch {}
    }
    return MOCK_COMPLIANCE;
  });
  const [propertyList, setPropertyList] = useState<string[]>(() => getLivePropertyNames());
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get('tab');
  const portalParam = searchParams?.get('portal');

  // Determine portal: PropCo vs OpCo (keep strictly separate)
  const isPropcoPortal =
    portalParam === 'propco' ||
    tabParam === 'propco' ||
    (!portalParam && !tabParam && activePortal === 'propco');

  const currentPortal: 'propco' | 'opco' = isPropcoPortal ? 'propco' : 'opco';

  const initialTab: 'register' | 'certifications' | 'statutory' | 'expiry' =
    tabParam === 'certifications' || tabParam === 'statutory' || tabParam === 'expiry'
      ? tabParam
      : 'register';

  const [activeTab, setActiveTab] =
    useState<'register' | 'certifications' | 'statutory' | 'expiry'>(initialTab);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'certifications' || t === 'statutory' || t === 'expiry') {
      setActiveTab(t);
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleTabChange = (t: 'register' | 'certifications' | 'statutory' | 'expiry') => {
    setActiveTab(t);
    const params = new URLSearchParams();
    if (t !== 'register') params.set('tab', t);
    params.set('portal', currentPortal);
    router.push(`/compliance-register?${params.toString()}`, { scroll: false });
  };
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterHotel, setFilterHotel] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);

  const allTypes = useMemo(() => {
    const types = new Set<string>([
      'OpCo',
      'PropCo',
      'Statutory',
      'Internal',
      'Mandatory',
      'Operational',
      'Brand Standard',
    ]);
    items.forEach((i) => {
      if (i.complianceType) types.add(i.complianceType.trim());
      if (i.section) types.add(i.section.trim());
      if (i.type) types.add(i.type.trim());
    });
    return Array.from(types).sort();
  }, [items]);

  const propertyOptions = useMemo(() => {
    return Array.from(new Set([...propertyList, ...items.map((i) => i.hotel).filter(Boolean), ...DEFAULT_HOTELS])).filter((p) => p && p.toLowerCase() !== 'gow' && isPropertyAccessible(p))
      .sort();
  }, [propertyList, items, isPropertyAccessible]);

  const categoryDropdown = (cmsDropdowns || []).find((d) => d.id === 'category');
  const allCategories = useMemo(() => {
    const cmsOptions = categoryDropdown?.options || [];
    const deleted = new Set((categoryDropdown?.deletedOptions || []).map((o) => o.toLowerCase()));
    const merged = new Set<string>();

    cmsOptions.forEach((o) => {
      const clean = o.trim();
      if (clean && !clean.toLowerCase().startsWith('all ') && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    DEFAULT_COMPLIANCE_CATEGORIES.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    customCategories.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    items.forEach((i) => {
      const clean = (i.category || '').trim();
      if (clean && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    return Array.from(merged).sort();
  }, [categoryDropdown, customCategories, items]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ComplianceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'Statutory',
    category: 'Fire Risk Assessment',
    hotel: DEFAULT_HOTELS[0],
    department: 'Engineering',
    area: 'Whole Building',
    regulatoryAuthority: 'Fire & Rescue Service',
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 335 * 86400000).toISOString().split('T')[0],
    inspectionFrequency: 'Yearly',
    responsiblePerson: 'Marcus Webb',
    contractor: '',
    riskRating: 'medium' as RiskRating,
    status: 'compliant' as ComplianceStatus,
    notes: '',
  });

  const fetchCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, propsRes] = await Promise.allSettled([
        api.compliance.getAll(),
        api.properties.getAll(),
      ]);

      if (
        compRes.status === 'fulfilled' &&
        compRes.value.success &&
        compRes.value.data &&
        compRes.value.data.length > 0
      ) {
        setItems(compRes.value.data);
        try {
          sessionStorage.setItem('samko_cache_compliance_v3', JSON.stringify(compRes.value.data));
        } catch {}
      }
      if (
        propsRes.status === 'fulfilled' &&
        propsRes.value.success &&
        propsRes.value.data &&
        propsRes.value.data.length > 0
      ) {
        setPropertyList(propsRes.value.data.map((p: any) => p.name));
      }
    } catch (err) {
      console.warn('Using local fallback compliance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cache validation check passed
    fetchCompliance();
    const handleDataChanged = () => {
      fetchCompliance();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchCompliance]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus as ComplianceStatus } : item
      )
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'compliance', id, status: newStatus },
        })
      );
    }

    try {
      await api.compliance.update(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to sync compliance status:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const complianceId = `COMP-${String(items.length + 1).padStart(3, '0')}`;
    const compType = isPropcoPortal ? 'PropCo' : 'OpCo';
    const payload = {
      ...addForm,
      complianceType: compType,
      section: compType,
      responsiblePerson: addForm.responsiblePerson || (isPropcoPortal ? 'Kevin Davis' : 'Nathan Coote'),
      complianceId,
      description: `${addForm.name} for ${addForm.hotel}`,
    };

    try {
      const res = await api.compliance.create(payload);
      const created = res.data || { ...payload, id: `comp-${Date.now()}` };
      setItems((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success('Compliance item created', {
        description: `${created.name} (${created.complianceId}) added successfully`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'compliance' } })
        );
      }
    } catch (err: any) {
      toast.error('Failed to create compliance item', { description: err.message });
    }
  };

  const handleOpenEdit = (item: ComplianceItem) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const updated = { ...editingItem };
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (selectedItem?.id === updated.id) {
        setSelectedItem(updated);
      }
      setShowEditModal(false);
      toast.success('Compliance updated', { description: `${updated.name} updated successfully` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'compliance', id: updated.id } })
        );
      }
      await api.compliance.update(updated.id, updated);
    } catch (err: any) {
      toast.error('Failed to update compliance item');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    setDeletingItem(true);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      toast.success('Compliance item deleted', {
        description: `${itemToDelete.name} has been removed`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'compliance', id } })
        );
      }
      await api.compliance.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete compliance item');
    } finally {
      setDeletingItem(false);
      setItemToDelete(null);
    }
  };

  const accessibleItems = useMemo(() => {
    return items.filter((c) => {
      const isAccessible = isPropertyAccessible(c.hotel || (c as any).property || (c as any).site);
      if (!isAccessible) return false;
      const type = (c.complianceType || c.section || (c as any).portal || '').toLowerCase();
      if (isPropcoPortal) return type === 'propco';
      return type !== 'propco';
    });
  }, [items, isPropertyAccessible, isPropcoPortal]);

  const totalItems = accessibleItems.length;
  const expiringIn30 = accessibleItems.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d >= 0 && d <= 30;
  }).length;
  const overdue = accessibleItems.filter((c) => c.status === 'overdue').length;
  const compliant = accessibleItems.filter((c) => c.status === 'compliant').length;
  const highRisk = accessibleItems.filter(
    (c) => c.riskRating === 'high' || c.riskRating === 'critical'
  ).length;

  const filtered = accessibleItems.filter((c) => {
    const matchSearch =
      !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.hotel || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.type || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.complianceType || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.section || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.responsiblePerson || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.assignee || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contractor || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.standard || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.complianceId || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus.length === 0 ||
      filterStatus.some((s) => {
        const val = s.trim().toLowerCase();
        return (
          val === '' ||
          val === 'all' ||
          val.startsWith('all ') ||
          val === (c.status || '').trim().toLowerCase()
        );
      });
    const matchHotel =
      filterHotel.length === 0 ||
      filterHotel.some((h) => {
        const val = h.trim().toLowerCase();
        return (
          val === '' ||
          val === 'all' ||
          val.startsWith('all ') ||
          val === (c.hotel || '').trim().toLowerCase()
        );
      });
    const matchCat =
      filterCategory.length === 0 ||
      filterCategory.some((cat) => {
        const val = cat.trim().toLowerCase();
        return (
          val === '' ||
          val === 'all' ||
          val.startsWith('all ') ||
          val === (c.category || '').trim().toLowerCase()
        );
      });
    const matchType =
      filterType.length === 0 ||
      filterType.some((t) => {
        const tLower = t.trim().toLowerCase();
        if (tLower === '' || tLower === 'all' || tLower.startsWith('all ')) return true;
        const itemType = (c.type || '').trim().toLowerCase();
        const itemCompType = (c.complianceType || '').trim().toLowerCase();
        const itemSection = (c.section || '').trim().toLowerCase();
        return (
          tLower === itemType ||
          tLower === itemCompType ||
          tLower === itemSection ||
          (tLower.includes('opco') && (itemCompType === 'opco' || itemSection === 'opco')) ||
          (tLower.includes('propco') && (itemCompType === 'propco' || itemSection === 'propco'))
        );
      });
    return matchSearch && matchStatus && matchHotel && matchCat && matchType;
  });

  const tabs = [
    { id: 'register', label: 'Compliance Register' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'statutory', label: 'Statutory Inspections' },
    { id: 'expiry', label: 'Expiry Dashboard' },
  ];

  const displayItems =
    activeTab === 'certifications'
      ? filtered.filter((c) => c.certificateNumber || c.certificateRef)
      : activeTab === 'statutory'
        ? filtered.filter((c) => (c.type || '').toLowerCase() === 'statutory')
        : activeTab === 'expiry'
          ? [...filtered].sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
          : filtered;

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedCompliance,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(displayItems, 10);

  // Multi-select Compliance State
  const [selectedComplianceIds, setSelectedComplianceIds] = useState<string[]>([]);
  const [isBulkDeletingCompliance, setIsBulkDeletingCompliance] = useState(false);
  const [showBulkDeleteComplianceModal, setShowBulkDeleteComplianceModal] = useState(false);
  const [selectedComplianceTypeFilter, setSelectedComplianceTypeFilter] = useState('');

  const isAllCompliancePageSelected =
    paginatedCompliance.length > 0 &&
    paginatedCompliance.every((c) => selectedComplianceIds.includes(c.id));
  const isSomeCompliancePageSelected =
    paginatedCompliance.some((c) => selectedComplianceIds.includes(c.id)) &&
    !isAllCompliancePageSelected;

  const handleToggleSelectAllCompliancePage = () => {
    if (isAllCompliancePageSelected) {
      const pageIds = new Set(paginatedCompliance.map((c) => c.id));
      setSelectedComplianceIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedCompliance.map((c) => c.id);
      setSelectedComplianceIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleComplianceSelect = (id: string) => {
    setSelectedComplianceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredCompliance = () => {
    setSelectedComplianceIds(displayItems.map((c) => c.id));
  };

  const handleClearComplianceSelection = () => {
    setSelectedComplianceIds([]);
    setSelectedComplianceTypeFilter('');
  };

  const complianceTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    displayItems.forEach((c) => {
      counts[`type:${c.type}`] = (counts[`type:${c.type}`] || 0) + 1;
      counts[`cat:${c.category}`] = (counts[`cat:${c.category}`] || 0) + 1;
      const hotel = c.hotel || (c as any).property;
      if (hotel) counts[`hotel:${hotel}`] = (counts[`hotel:${hotel}`] || 0) + 1;
      counts[`status:${c.status}`] = (counts[`status:${c.status}`] || 0) + 1;
      counts[`risk:${c.riskRating}`] = (counts[`risk:${c.riskRating}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    ['Statutory', 'Internal', 'Insurance'].forEach((t) => {
      if (counts[`type:${t}`])
        opts.push({ label: `Type: ${t}`, value: `type:${t}`, count: counts[`type:${t}`] });
    });
    allCategories.forEach((cat) => {
      if (counts[`cat:${cat}`])
        opts.push({ label: `Category: ${cat}`, value: `cat:${cat}`, count: counts[`cat:${cat}`] });
    });
    DEFAULT_HOTELS.forEach((h) => {
      if (counts[`hotel:${h}`])
        opts.push({ label: `Property: ${h}`, value: `hotel:${h}`, count: counts[`hotel:${h}`] });
    });
    if (counts['status:compliant'])
      opts.push({
        label: 'Status: Compliant',
        value: 'status:compliant',
        count: counts['status:compliant'],
      });
    if (counts['status:expiring-soon'])
      opts.push({
        label: 'Status: Expiring Soon',
        value: 'status:expiring-soon',
        count: counts['status:expiring-soon'],
      });
    if (counts['status:overdue'])
      opts.push({
        label: 'Status: Overdue',
        value: 'status:overdue',
        count: counts['status:overdue'],
      });
    if (counts['risk:critical'])
      opts.push({
        label: 'Risk: Critical',
        value: 'risk:critical',
        count: counts['risk:critical'],
      });
    if (counts['risk:high'])
      opts.push({ label: 'Risk: High', value: 'risk:high', count: counts['risk:high'] });

    return opts;
  }, [displayItems, allCategories]);

  const handleSelectComplianceByType = (typeKey: string) => {
    setSelectedComplianceTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedComplianceIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = displayItems.filter((c) => {
      if (kind === 'type') return c.type === val;
      if (kind === 'cat') return c.category === val;
      if (kind === 'hotel') return (c.hotel || (c as any).property) === val;
      if (kind === 'status') return c.status === val;
      if (kind === 'risk') return c.riskRating === val;
      return false;
    });
    setSelectedComplianceIds(matched.map((c) => c.id));
    toast.info(
      `Selected ${matched.length} compliance items matching ${typeKey.replace(':', ': ')}`
    );
  };

  const handleConfirmBulkDeleteCompliance = async () => {
    if (selectedComplianceIds.length === 0) return;
    setIsBulkDeletingCompliance(true);
    try {
      const ids = [...selectedComplianceIds];
      const count = ids.length;
      setItems((prev) => prev.filter((c: any) => !ids.includes(c.id)));
      setSelectedComplianceIds([]);
      setSelectedComplianceTypeFilter('');
      setShowBulkDeleteComplianceModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'compliance' } })
        );
      }
      await Promise.allSettled(ids.map((id) => api.compliance.delete(id)));
      toast.success(`Deleted ${count} compliance items successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete compliance items');
    } finally {
      setIsBulkDeletingCompliance(false);
    }
  };

  const handleExport = () => {
    const headers = [
      'Compliance ID',
      'Regulation Title',
      'Section',
      'Category',
      'Check Type',
      'Standard / Authority',
      'Contractor',
      'Responsible Person',
      'Frequency',
      'Last Inspection',
      'Expiry Date',
      'Status',
      'Risk Rating',
      'Property',
      'Department',
      'Area',
      'Certificate Ref',
      'Notes',
    ];
    const rows = displayItems.map((c: any) => [
      `"${c.complianceId || c.id || ''}"`,
      `"${(c.name || c.title || c.item || '').replace(/"/g, '""')}"`,
      `"${c.complianceType || c.section || 'OpCo'}"`,
      `"${c.category || ''}"`,
      `"${c.type || 'Statutory'}"`,
      `"${(c.standard || c.regulatoryAuthority || '').replace(/"/g, '""')}"`,
      `"${(c.contractor || '').replace(/"/g, '""')}"`,
      `"${(c.responsiblePerson || c.assignee || '').replace(/"/g, '""')}"`,
      `"${c.frequency || c.inspectionFrequency || ''}"`,
      `"${c.lastInspection || c.issueDate || ''}"`,
      `"${c.expiryDate || c.dueDate || ''}"`,
      `"${c.status || ''}"`,
      `"${c.riskRating || ''}"`,
      `"${c.hotel || c.property || ''}"`,
      `"${c.department || ''}"`,
      `"${c.area || ''}"`,
      `"${c.certificateNumber || c.certificateRef || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'compliance_register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${displayItems.length} compliance items to CSV`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-head font-bold text-xl">
              {isPropcoPortal
                ? 'PropCo Compliance & Certification Register'
                : 'OpCo Compliance & Certification Register'}
            </h1>
            {isPropcoPortal ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-[#e8c97a]/40 bg-[#e8c97a]/15 text-[#e8c97a] uppercase">
                PropCo Asset Co
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-[#60a5fa]/40 bg-[#60a5fa]/15 text-[#60a5fa] uppercase">
                OpCo Operations
              </span>
            )}
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPropcoPortal
              ? 'Manage statutory and property asset compliance requirements across properties'
              : 'Manage statutory and operational compliance requirements across properties'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="compliance" pageName="Compliance Register" />

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-surface2 transition-all active:scale-95 cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            <Download size={13} /> Export
          </button>
          {hasWriteAccess && (
            <>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <Tag size={13} style={{ color: 'var(--primary)' }} />
                Add Category
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Plus size={14} />{' '}
                {(cmsPrimaryActionLabel || 'Add Compliance Item').replace(/^[\+\s]+/, '').trim()}
              </button>
            </>
          )}
          {isViewer && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: 'rgba(148,163,184,0.12)',
                color: '#94a3b8',
                border: '1px solid rgba(148,163,184,0.25)',
              }}
            >
              L4 · Read-Only Access
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        className="grid gap-3 px-6 pt-5 pb-4 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
      >
        <KPICard
          label="Total Items"
          value={totalItems}
          sub="All compliance items"
          color="#60a5fa"
          icon={ShieldCheck}
        />
        <KPICard
          label="Expiring in 30 Days"
          value={expiringIn30}
          sub="Requires attention"
          color="#f59e0b"
          icon={Clock}
        />
        <KPICard
          label="Overdue"
          value={overdue}
          sub="Immediate action needed"
          color="#f43f5e"
          icon={AlertTriangle}
        />
        <KPICard
          label="Compliant"
          value={compliant}
          sub="Up to date"
          color="#3dd68c"
          icon={CheckCircle2}
        />
        <KPICard
          label="High Risk"
          value={highRisk}
          sub="High & critical risk"
          color="#f97316"
          icon={TrendingUp}
        />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer"
            style={{
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
              background: 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 px-6 py-2.5 border-b border-border flex-shrink-0 flex-wrap"
        style={{ background: 'var(--surface2)' }}
      >
        <div
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-xs"
          style={{ background: 'var(--surface)' }}
        >
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-xs outline-none flex-1"
            placeholder={cmsSearchPlaceholder || 'Search compliance, property, authority...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <CustomDropdown
          label="All Categories"
          value={filterCategory}
          multiple
          options={allCategories.map((c) => ({ value: c, label: c }))}
          onChange={setFilterCategory}
        />
        <CustomDropdown
          label="All Properties"
          value={filterHotel}
          multiple
          options={propertyOptions.map((h) => ({ value: h, label: h }))}
          onChange={setFilterHotel}
        />
        <CustomDropdown
          label="All Types"
          value={filterType}
          multiple
          options={allTypes.map((t) => ({ value: t, label: t }))}
          onChange={setFilterType}
        />
        <CustomDropdown
          label="All Statuses"
          value={filterStatus}
          multiple
          options={[
            { value: 'compliant', label: 'Compliant', color: '#3dd68c' },
            { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
            { value: 'overdue', label: 'Overdue', color: '#f43f5e' },
            { value: 'pending', label: 'Pending', color: '#60a5fa' },
          ]}
          onChange={setFilterStatus}
        />
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div
          className="rounded-xl border border-border shadow-sm flex flex-col"
          style={{ background: 'var(--surface)' }}
        >
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {hasDeleteAccess && (
                  <th className="px-3 py-3 w-10 text-center">
                    <TableCheckbox
                      checked={isAllCompliancePageSelected}
                      indeterminate={isSomeCompliancePageSelected}
                      onChange={handleToggleSelectAllCompliancePage}
                      title="Select all on this page"
                    />
                  </th>
                )}
                {activeColumns.map((col: any) => (
                  <th
                    key={col.id}
                    className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                      col.id.toLowerCase() === 'actions' ? 'text-right' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCompliance.map((item) => {
                const days = daysUntil(item.expiryDate);
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.compliant;
                const riskCfg = RISK_CONFIG[item.riskRating] || RISK_CONFIG.low;

                return (
                  <tr
                    key={item.id}
                    className={`border-t border-border cursor-pointer transition-colors ${selectedComplianceIds.includes(item.id) ? 'bg-[#e8c97a]/5' : ''}`}
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = selectedComplianceIds.includes(item.id)
                        ? 'rgba(232,201,122,0.08)'
                        : 'var(--surface2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = selectedComplianceIds.includes(item.id)
                        ? 'rgba(232,201,122,0.05)'
                        : 'transparent')
                    }
                    onClick={() => setSelectedItem(item)}
                  >
                    {hasDeleteAccess && (
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <TableCheckbox
                          checked={selectedComplianceIds.includes(item.id)}
                          onChange={() => handleToggleComplianceSelect(item.id)}
                          title={`Select ${item.name}`}
                        />
                      </td>
                    )}
                    {activeColumns.map((col: any) => {
                      const colKey = col.id.toLowerCase();
                      if (colKey === 'id' || colKey === 'complianceid') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap"
                          >
                            {item.complianceId || item.id}
                          </td>
                        );
                      }
                      if (colKey === 'name' || colKey === 'complianceitem') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.type}</div>
                          </td>
                        );
                      }
                      if (colKey === 'category') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                            >
                              {item.category}
                            </span>
                          </td>
                        );
                      }
                      if (colKey === 'property' || colKey === 'hotel') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap"
                          >
                            {item.hotel || (item as any).property}
                          </td>
                        );
                      }
                      if (colKey === 'department') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground">
                            {item.department}
                          </td>
                        );
                      }
                      if (
                        colKey === 'standard' ||
                        colKey === 'regulatoryauthority' ||
                        colKey === 'authority'
                      ) {
                        const std = item.standard || item.regulatoryAuthority;
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap max-w-[220px] truncate"
                            title={std}
                          >
                            {std || '—'}
                          </td>
                        );
                      }
                      if (colKey === 'contractor') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                            {item.contractor ? (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border border-border"
                                style={{ background: 'var(--surface2)', color: 'var(--text)' }}
                              >
                                {item.contractor}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        );
                      }
                      if (colKey === 'frequency' || colKey === 'inspectionfrequency') {
                        const freq = item.frequency || item.inspectionFrequency || 'Yearly';
                        return (
                          <td key={col.id} className="px-4 py-3 text-xs whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded font-medium border border-border text-xs"
                              style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                            >
                              {freq}
                            </span>
                          </td>
                        );
                      }
                      if (
                        colKey === 'lastinspection' ||
                        colKey === 'issuedate' ||
                        colKey === 'lastreviewed'
                      ) {
                        const dateStr = item.lastInspection || item.issueDate || item.lastReviewed;
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap"
                          >
                            {dateStr && dateStr !== 'N/A'
                              ? new Date(dateStr).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        );
                      }
                      if (
                        colKey === 'certificateref' ||
                        colKey === 'certificatenumber' ||
                        colKey === 'certref'
                      ) {
                        const rawRef = item.certificateRef || item.certificateNumber;
                        const ref =
                          rawRef &&
                          rawRef !== 'N/A' &&
                          !rawRef.startsWith('COMP-CP-') &&
                          !rawRef.startsWith('comp-cp-')
                            ? rawRef
                            : null;
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap"
                          >
                            {ref ? (
                              <span
                                className="px-2 py-0.5 rounded border border-border text-xs"
                                style={{ background: 'var(--surface2)', color: 'var(--text)' }}
                              >
                                {ref}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        );
                      }
                      if (colKey === 'expirydate') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        );
                      }
                      if (colKey === 'daysleft') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                            style={{
                              color:
                                days < 0
                                  ? '#f43f5e'
                                  : days <= 30
                                    ? '#f59e0b'
                                    : days <= 90
                                      ? '#f97316'
                                      : '#3dd68c',
                            }}
                          >
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                          </td>
                        );
                      }
                      if (colKey === 'responsible' || colKey === 'responsibleperson') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap"
                          >
                            {item.responsiblePerson}
                          </td>
                        );
                      }
                      if (colKey === 'risk' || colKey === 'riskrating') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: riskCfg.bg, color: riskCfg.color }}
                            >
                              {item.riskRating}
                            </span>
                          </td>
                        );
                      }
                      if (colKey === 'status') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <StatusDropdown
                              value={item.status}
                              disabled={isViewer || !canEdit}
                              options={[
                                {
                                  value: 'compliant',
                                  label: 'Compliant',
                                  color: '#3dd68c',
                                  bg: 'rgba(61,214,140,0.12)',
                                },
                                {
                                  value: 'expiring-soon',
                                  label: 'Expiring Soon',
                                  color: '#f59e0b',
                                  bg: 'rgba(245,158,11,0.12)',
                                },
                                {
                                  value: 'overdue',
                                  label: 'Overdue',
                                  color: '#f43f5e',
                                  bg: 'rgba(244,63,94,0.12)',
                                },
                                {
                                  value: 'pending',
                                  label: 'Pending',
                                  color: '#60a5fa',
                                  bg: 'rgba(96,165,250,0.12)',
                                },
                              ]}
                              onChange={(val) => handleStatusChange(item.id, val)}
                            />
                          </td>
                        );
                      }
                      if (colKey === 'actions') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors cursor-pointer"
                                style={{ color: 'var(--text2)' }}
                                title="View Details"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Eye size={13} />
                              </button>
                              {hasWriteAccess && (
                                <button
                                  className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                                  title="Edit Compliance Item"
                                  onClick={() => handleOpenEdit(item)}
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {hasDeleteAccess && (
                                <button
                                  className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                  title="Delete Compliance Item"
                                  onClick={() => setItemToDelete(item)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Dynamic custom columns
                      const val = (item as any)[col.id] ?? (item as any)[colKey];
                      return (
                        <td
                          key={col.id}
                          className="px-4 py-3 text-sm text-foreground whitespace-nowrap"
                        >
                          {val !== undefined && val !== null && String(val).trim() !== ''
                            ? String(val)
                            : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShieldCheck size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No compliance items found</p>
            </div>
          )}
          </div>
          <LoadingPagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 15, 20, 50]}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            isLoading={loading || isPageLoading}
            recordName="compliance items"
          />
        </div>

        {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
        {hasDeleteAccess && (
          <div className="mt-4">
            <BulkActionBar
              selectedCount={selectedComplianceIds.length}
              totalCount={displayItems.length}
              onClearSelection={handleClearComplianceSelection}
              onSelectAll={handleSelectAllFilteredCompliance}
              onDeleteSelected={() => setShowBulkDeleteComplianceModal(true)}
              typeOptions={complianceTypeOptions}
              onSelectByType={handleSelectComplianceByType}
              selectedTypeValue={selectedComplianceTypeFilter}
              typePlaceholder="Select all of type (Statutory/Internal, Category, Property)..."
              recordName="compliance items"
              isDeleting={isBulkDeletingCompliance}
            />
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                  >
                    {selectedItem.complianceId}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: STATUS_CONFIG[selectedItem.status]?.bg,
                      color: STATUS_CONFIG[selectedItem.status]?.color,
                    }}
                  >
                    {STATUS_CONFIG[selectedItem.status]?.label}
                  </span>
                </div>
                <h2 className="font-head font-bold text-lg">{selectedItem.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedItem.description}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
              >
                ×
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Category', selectedItem.category],
                ['Type', selectedItem.type],
                ['Property', selectedItem.hotel],
                ['Department', selectedItem.department],
                ['Area', selectedItem.area],
                ['Regulatory Authority', selectedItem.regulatoryAuthority],
                ['Certificate Number', selectedItem.certificateNumber || '—'],
                ['Issue Date', new Date(selectedItem.issueDate).toLocaleDateString('en-GB')],
                ['Expiry Date', new Date(selectedItem.expiryDate).toLocaleDateString('en-GB')],
                ['Renewal Date', new Date(selectedItem.renewalDate).toLocaleDateString('en-GB')],
                ['Inspection Frequency', selectedItem.inspectionFrequency],
                ['Responsible Person', selectedItem.responsiblePerson],
                ['Contractor', selectedItem.contractor || '—'],
                ['Risk Rating', selectedItem.riskRating],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
            {selectedItem.notes && (
              <div className="px-6 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  {selectedItem.notes}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-6 pt-0 border-t border-border mt-4">
              <div className="flex items-center gap-2">
                {hasWriteAccess && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedItem)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 text-foreground transition-colors"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <Edit2 size={13} /> Edit Item
                  </button>
                )}
                {hasDeleteAccess && (
                  <button
                    type="button"
                    onClick={() => setItemToDelete(selectedItem)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors"
                  >
                    <Trash2 size={13} /> Delete Item
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-head font-bold text-lg">Add Compliance Item</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Compliance Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <CustomDropdown
                    value={addForm.type}
                    onChange={(val) => setAddForm({ ...addForm, type: val })}
                    options={[
                      { value: 'Statutory', label: 'Statutory' },
                      { value: 'Internal', label: 'Internal' },
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <CustomDropdown
                    value={addForm.category}
                    onChange={(val) => setAddForm({ ...addForm, category: val })}
                    options={allCategories.map((c) => ({ value: c, label: c }))}
                    placeholder="Select Category"
                    variant="form"
                    width="100%"
                    searchable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Property</label>
                  <CustomDropdown
                    value={addForm.hotel}
                    onChange={(val) => setAddForm({ ...addForm, hotel: val })}
                    options={propertyList.map((h) => ({ value: h, label: h }))}
                    placeholder="Select Property"
                    variant="form"
                    width="100%"
                    searchable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Area / Location
                  </label>
                  <input
                    type="text"
                    value={addForm.area}
                    onChange={(e) => setAddForm({ ...addForm, area: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Regulatory Authority
                  </label>
                  <input
                    type="text"
                    value={addForm.regulatoryAuthority}
                    onChange={(e) =>
                      setAddForm({ ...addForm, regulatoryAuthority: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    value={addForm.certificateNumber}
                    onChange={(e) => setAddForm({ ...addForm, certificateNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Issue Date</label>
                  <input
                    type="date"
                    value={addForm.issueDate}
                    onChange={(e) => setAddForm({ ...addForm, issueDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Expiry Date</label>
                  <input
                    type="date"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Responsible Person
                  </label>
                  <input
                    type="text"
                    value={addForm.responsiblePerson}
                    onChange={(e) => setAddForm({ ...addForm, responsiblePerson: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Risk Rating</label>
                  <CustomDropdown
                    value={addForm.riskRating}
                    onChange={(val) => setAddForm({ ...addForm, riskRating: val as RiskRating })}
                    options={[
                      { value: 'low', label: 'Low', color: '#3dd68c' },
                      { value: 'medium', label: 'Medium', color: '#f59e0b' },
                      { value: 'high', label: 'High', color: '#f97316' },
                      { value: 'critical', label: 'Critical', color: '#f43f5e' },
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Initial Status
                  </label>
                  <CustomDropdown
                    value={addForm.status}
                    onChange={(val) => setAddForm({ ...addForm, status: val as ComplianceStatus })}
                    options={[
                      { value: 'compliant', label: 'Compliant', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'overdue', label: 'Overdue', color: '#f43f5e' },
                      { value: 'pending', label: 'Pending', color: '#94a3b8' },
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    rows={2}
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0 border-t border-border mt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  Save Compliance Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="font-head font-bold text-base text-foreground">
                    Edit Compliance Item
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editingItem.complianceId} · Update compliance record dynamically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Compliance Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Type
                  </label>
                  <CustomDropdown
                    value={editingItem.type}
                    onChange={(val) => setEditingItem({ ...editingItem, type: val })}
                    options={[
                      { value: 'Statutory', label: 'Statutory' },
                      { value: 'Internal', label: 'Internal' },
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Category
                  </label>
                  <CustomDropdown
                    value={editingItem.category}
                    onChange={(val) => setEditingItem({ ...editingItem, category: val })}
                    options={allCategories.map((c) => ({ value: c, label: c }))}
                    placeholder="Select Category"
                    variant="form"
                    width="100%"
                    searchable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Property
                  </label>
                  <CustomDropdown
                    value={editingItem.hotel}
                    onChange={(val) => setEditingItem({ ...editingItem, hotel: val })}
                    options={propertyList.map((h) => ({ value: h, label: h }))}
                    placeholder="Select Property"
                    variant="form"
                    width="100%"
                    searchable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingItem.department}
                    onChange={(e) => setEditingItem({ ...editingItem, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Area / Location
                  </label>
                  <input
                    type="text"
                    value={editingItem.area}
                    onChange={(e) => setEditingItem({ ...editingItem, area: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Regulatory Authority
                  </label>
                  <input
                    type="text"
                    value={editingItem.regulatoryAuthority}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, regulatoryAuthority: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    value={editingItem.certificateNumber || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, certificateNumber: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Responsible Person
                  </label>
                  <input
                    type="text"
                    value={editingItem.responsiblePerson}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, responsiblePerson: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Contractor / Auditor
                  </label>
                  <input
                    type="text"
                    value={editingItem.contractor || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, contractor: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Renewal Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.renewalDate}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, renewalDate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Risk Rating
                  </label>
                  <CustomDropdown
                    value={editingItem.riskRating}
                    onChange={(val) =>
                      setEditingItem({ ...editingItem, riskRating: val as RiskRating })
                    }
                    options={[
                      { value: 'low', label: 'Low', color: '#3dd68c' },
                      { value: 'medium', label: 'Medium', color: '#f59e0b' },
                      { value: 'high', label: 'High', color: '#f97316' },
                      { value: 'critical', label: 'Critical', color: '#f43f5e' },
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </label>
                  <CustomDropdown
                    value={editingItem.status}
                    onChange={(val) =>
                      setEditingItem({ ...editingItem, status: val as ComplianceStatus })
                    }
                    options={[
                      { value: 'compliant', label: 'Compliant', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'overdue', label: 'Overdue', color: '#f43f5e' },
                      { value: 'pending', label: 'Pending', color: '#94a3b8' },
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 pt-0 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingEdit ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Compliance Categories Modal */}
      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Manage Compliance Categories
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new categories, view assigned records, rename or delete
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={handleSaveCategory} className="space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none focus:border-primary"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    placeholder="e.g. Facilities Management, Legionella Control, Kitchen Extraction"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newCatName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Categories ({allCategories.length})
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Eye to view · Pencil to edit · Trash to delete
                  </span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {allCategories.map((c) => {
                    const count = accessibleItems.filter((x) => x.category === c).length;
                    const isEditing = editingCat?.oldName === c;
                    return (
                      <div
                        key={c}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-border transition-all"
                        style={{ background: 'var(--surface2)' }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingCat.newName}
                              onChange={(e) =>
                                setEditingCat({ ...editingCat, newName: e.target.value })
                              }
                              className="flex-1 px-2.5 py-1 rounded-lg border border-primary text-xs outline-none bg-surface text-foreground"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditCategory}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-black cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCat(null)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: 'rgba(232,201,122,0.15)',
                                  color: 'var(--primary)',
                                }}
                              >
                                <Tag size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {c}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {count} {count === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewCategoryRecords(c)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-surface transition-colors cursor-pointer"
                                style={{
                                  color: 'var(--primary)',
                                  borderColor: 'rgba(232,201,122,0.25)',
                                  background: 'rgba(232,201,122,0.08)',
                                }}
                                title={`See records for ${c}`}
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">Records</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCat({ oldName: c, newName: c })}
                                className="p-1.5 rounded-lg border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Rename category"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCatToDelete(c)}
                                className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Dialog */}
      {catToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">
                  Delete Compliance Category
                </h3>
                <p className="text-xs text-muted-foreground">{catToDelete}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to delete the category{' '}
              <strong className="text-foreground">{catToDelete}</strong>?
              <span className="block mt-2 text-emerald-400 font-medium">
                Note: All {items.filter((c) => c.category === catToDelete).length} existing
                compliance records will safely stay in the database. Only this category option will
                be removed from future dropdown selections.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{itemToDelete.complianceId}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">{itemToDelete.name}</strong> from the compliance
              register? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingItem}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingItem ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Compliance Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteComplianceModal}
        onClose={() => setShowBulkDeleteComplianceModal(false)}
        onConfirm={handleConfirmBulkDeleteCompliance}
        title="Confirm Bulk Deletion"
        itemName={`${selectedComplianceIds.length} Selected Compliance Items`}
        registerName="compliance register"
        customWarning={`Are you sure you want to permanently delete these ${selectedComplianceIds.length} selected compliance items? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedComplianceIds.length} Items`}
        isDeleting={isBulkDeletingCompliance}
      />
    </div>
  );
}
