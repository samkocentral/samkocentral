'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Building2, Plus, Upload, Check, X, Loader2, AlertCircle,
  FileText, Shield, ScrollText, Zap, RefreshCw, ShieldCheck, Tag,
  FolderOpen, CheckSquare, Trash2, Layers, Package,
  FileUp, CheckCircle2, ChevronRight, AlertTriangle, Download,
  Table, Sparkles, PlusCircle, Columns, Paperclip, FileCheck, Eye, Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import { getLiveProperties, saveLivePropertiesToCache } from '@/hooks/useLiveProperties';
import { useAuth } from '@/lib/authContext';

interface PropertyItem {
  id: string;
  name: string;
  city?: string;
  address?: string;
  manager?: string;
  phone?: string;
  rooms?: number;
  status?: string;
  portal?: string;
}

type ModuleKey =
  | 'fixed-assets'
  | 'non-fixed-assets'
  | 'categories'
  | 'maintenance'
  | 'compliance'
  | 'insurance'
  | 'claims'
  | 'contracts'
  | 'utilities'
  | 'documents'
  | 'tasks';

export interface FormFieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'file';
  defaultValue?: string;
  required?: boolean;
  options?: string[];
  isCategory?: boolean;
  isDepartment?: boolean;
  isStatus?: boolean;
}

export interface GridColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'file';
  isCategory?: boolean;
  isDepartment?: boolean;
  isStatus?: boolean;
  options?: string[];
}

interface ModuleConfig {
  id: ModuleKey;
  label: string;
  sub: string;
  icon: React.ElementType;
  collection: string;
  filterType?: string;
  color: string;
  sidebarGroup: 'PROPCO' | 'OPCO' | 'CORE';
  quickFormFields: FormFieldDef[];
  defaultGridColumns: GridColumnDef[];
}

// ─── LIVE WEBSITE COMMON DROPDOWNS ──────────────────────────────────────────

export const LIVE_DEPARTMENTS = [
  'Kitchen',
  'Housekeeping',
  'Maintenance',
  'Engineering',
  'F&B',
  'Restaurant',
  'Reception',
  'Front Office',
  'Public Areas',
  'Plant Room',
  'Conference',
  'Laundry',
  'Back Office',
  'IT',
  'Security',
  'Finance',
  'General',
];

export const LIVE_STATUSES_BY_MODULE: Record<string, string[]> = {
  'fixed-assets': ['active', 'maintenance', 'repair', 'decommissioned', 'in-review'],
  'non-fixed-assets': ['active', 'maintenance', 'repair', 'decommissioned', 'in-review'],
  'categories': ['Active', 'Archived'],
  'maintenance': ['scheduled', 'due-today', 'overdue', 'completed', 'pending'],
  'compliance': ['compliant', 'overdue', 'pending', 'expiring-soon', 'non-compliant'],
  'insurance': ['active', 'expiring-soon', 'expired', 'cancelled'],
  'claims': ['open', 'in-progress', 'settled', 'rejected'],
  'contracts': ['active', 'expiring-soon', 'terminated', 'expired'],
  'utilities': ['active', 'inactive', 'suspended'],
  'documents': ['compliant', 'pending-review', 'expired', 'archived'],
  'tasks': ['open', 'in-progress', 'done', 'on-hold'],
};

export const LIVE_FREQUENCIES = [
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
  '6-Monthly',
  'Annual',
  '2-Yearly',
  '5-Yearly',
];

export const LIVE_PRIORITIES = ['urgent', 'high', 'medium', 'low'];

export const BASE_CATEGORIES_BY_MODULE: Record<string, string[]> = {
  'fixed-assets': [
    'HVAC & Refrigeration',
    'Boilers & Heating',
    'Lifts & Escalators',
    'Electrical & Switchgear',
    'Fire Safety',
    'Plumbing & Water Systems',
    'Plant Equipment',
    'Building Fabric & Roof',
    'Security Systems',
    'Mechanical',
    'Fixtures',
    'Other',
  ],
  'non-fixed-assets': [
    'Kitchen Equipment',
    'Guest Rooms & FF&E',
    'Furniture & Joinery',
    'Soft Furnishings',
    'Restaurant & Bar',
    'Housekeeping & Linen',
    'IT Equipment',
    'Bathroom Equipment',
    'Conference & Audio Visual',
    'Outdoor & Leisure',
    'Other',
  ],
  'categories': ['Fixed Assets', 'Non-Fixed Assets', 'Operations', 'Compliance', 'General'],
  'maintenance': [
    'HVAC Servicing',
    'Boiler Servicing',
    'Lift Maintenance',
    'Fire Safety Servicing',
    'Electrical Inspection',
    'Water Treatment',
    'Kitchen Equipment Maintenance',
    'General Maintenance',
  ],
  'compliance': [
    'Fire Safety',
    'Gas Safety',
    'Electrical Safety',
    'Water Hygiene & Legionella',
    'Lifting Operations (LOLER)',
    'Asbestos Management',
    'Food Hygiene',
    'Health & Safety',
  ],
  'insurance': [
    'Buildings & Plant',
    'Public & Employers Liability',
    'Business Interruption',
    'Machinery Breakdown',
    'Combined Commercial',
    'Directors & Officers',
  ],
  'claims': [
    'Water Damage',
    'Fire Damage',
    'Equipment Breakdown',
    'Guest Slip & Fall',
    'Storm / Weather Damage',
    'Theft / Burglary',
    'Other',
  ],
  'contracts': [
    'HVAC Maintenance',
    'Lift Servicing',
    'Waste Management',
    'Fire Safety & Security',
    'Pest Control',
    'Laundry Services',
    'IT & Telecoms',
    'Facilities Management',
  ],
  'utilities': ['Electricity', 'Gas', 'Water', 'Solar / Renewable', 'Biomass'],
  'documents': [
    'O&M Manual',
    'Architectural Drawings',
    'Fire Strategy',
    'Safety Certificate',
    'Property Lease',
    'Insurance Policy Document',
    'Floor Plans',
    'Contract Agreement',
  ],
  'tasks': [
    'Plant Inspection',
    'Daily Check',
    'Safety Audit',
    'Engineer Servicing',
    'Asset Verification',
    'Repair Work Order',
  ],
};

const MODULES: ModuleConfig[] = [
  {
    id: 'fixed-assets',
    label: 'Fixed Assets',
    sub: 'Plant, Chillers, Boilers & MEP',
    icon: Package,
    collection: 'assets',
    filterType: 'fixed',
    color: '#e8c97a',
    sidebarGroup: 'PROPCO',
    quickFormFields: [
      { key: 'name', label: 'Asset Name', placeholder: 'e.g. Carrier Chiller Unit 01', required: true },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'HVAC & Refrigeration' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Engineering' },
      { key: 'location', label: 'Location / Room', placeholder: 'e.g. Plant Room Basement' },
      { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. Carrier / Daikin' },
      { key: 'serialNumber', label: 'Serial Number', placeholder: 'e.g. SN-98234-MEP' },
      { key: 'value', label: 'Asset Value (£)', placeholder: 'e.g. 45000', type: 'number' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'active' },
    ],
    defaultGridColumns: [
      { key: 'name', label: 'Asset Name' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'location', label: 'Location / Room' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'value', label: 'Value (£)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'non-fixed-assets',
    label: 'Non-Fixed Assets',
    sub: 'FF&E, Rooms & Kitchen Gear',
    icon: Layers,
    collection: 'assets',
    filterType: 'non-fixed',
    color: '#60a5fa',
    sidebarGroup: 'OPCO',
    quickFormFields: [
      { key: 'name', label: 'Asset Name', placeholder: 'e.g. Commercial Range Cooker', required: true },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'Kitchen Equipment' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Kitchen' },
      { key: 'location', label: 'Location / Room', placeholder: 'e.g. Main Kitchen' },
      { key: 'quantity', label: 'Quantity', placeholder: '1', type: 'number', defaultValue: '1' },
      { key: 'value', label: 'Unit Value (£)', placeholder: 'e.g. 8500', type: 'number' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'active' },
    ],
    defaultGridColumns: [
      { key: 'name', label: 'Asset Name' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'location', label: 'Location / Room' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'value', label: 'Unit Value (£)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'categories',
    label: 'Asset Categories',
    sub: 'Taxonomy & Tagging',
    icon: Tag,
    collection: 'categories',
    color: '#a78bfa',
    sidebarGroup: 'OPCO',
    quickFormFields: [
      { key: 'name', label: 'Category Name', placeholder: 'e.g. Fire & Life Safety Systems', required: true },
      { key: 'description', label: 'Description', placeholder: 'e.g. Fire detection, alarms, sprinkler networks' },
      { key: 'type', label: 'Category Type', placeholder: 'Select Type', type: 'select', options: ['Fixed Assets', 'Non-Fixed Assets', 'Operations', 'Compliance', 'General'], defaultValue: 'Fixed Assets' },
    ],
    defaultGridColumns: [
      { key: 'name', label: 'Category Name' },
      { key: 'description', label: 'Description' },
      { key: 'type', label: 'Type', type: 'select', options: ['Fixed Assets', 'Non-Fixed Assets', 'Operations', 'Compliance', 'General'] },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance & PPM',
    sub: 'Servicing & Work Orders',
    icon: RefreshCw,
    collection: 'maintenance',
    color: '#3dd68c',
    sidebarGroup: 'OPCO',
    quickFormFields: [
      { key: 'title', label: 'PPM / Task Title', placeholder: 'e.g. Monthly Chiller Inspection & Fluid Test', required: true },
      { key: 'assetName', label: 'Target Asset', placeholder: 'e.g. Main Chiller Unit 01' },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'HVAC Servicing' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Maintenance' },
      { key: 'frequency', label: 'Frequency', placeholder: 'Select Frequency', type: 'select', options: LIVE_FREQUENCIES, defaultValue: 'Monthly' },
      { key: 'assignedTo', label: 'Assigned Engineer / Contractor', placeholder: 'e.g. Daikin UK Specialist' },
      { key: 'priority', label: 'Priority', placeholder: 'Select Priority', type: 'select', options: LIVE_PRIORITIES, defaultValue: 'high' },
      { key: 'nextDueDate', label: 'Next Due Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2026-12-15' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'scheduled' },
    ],
    defaultGridColumns: [
      { key: 'title', label: 'PPM / Task Title' },
      { key: 'assetName', label: 'Target Asset' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'frequency', label: 'Frequency', type: 'select', options: LIVE_FREQUENCIES },
      { key: 'assignedTo', label: 'Assigned Engineer' },
      { key: 'priority', label: 'Priority', type: 'select', options: LIVE_PRIORITIES },
      { key: 'nextDueDate', label: 'Next Due Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance Tracker',
    sub: 'Statutory Safety & Audits',
    icon: ShieldCheck,
    collection: 'compliance',
    color: '#f59e0b',
    sidebarGroup: 'OPCO',
    quickFormFields: [
      { key: 'name', label: 'Requirement / Item', placeholder: 'e.g. Fire Risk Assessment (FRA)', required: true },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'Fire Safety' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Maintenance' },
      { key: 'frequency', label: 'Inspection Frequency', placeholder: 'Select Frequency', type: 'select', options: LIVE_FREQUENCIES, defaultValue: 'Annual' },
      { key: 'responsiblePerson', label: 'Inspector / Officer', placeholder: 'e.g. Certified Fire Assessor' },
      { key: 'expiryDate', label: 'Expiry / Certificate Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2027-01-31' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'compliant' },
    ],
    defaultGridColumns: [
      { key: 'name', label: 'Requirement / Item' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'frequency', label: 'Frequency', type: 'select', options: LIVE_FREQUENCIES },
      { key: 'responsiblePerson', label: 'Inspector / Officer' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance Policies',
    sub: 'Building & Plant Cover',
    icon: Shield,
    collection: 'insurance',
    color: '#ec4899',
    sidebarGroup: 'PROPCO',
    quickFormFields: [
      { key: 'policyNumber', label: 'Policy Number', placeholder: 'e.g. POL-2026-UK-089', required: true },
      { key: 'provider', label: 'Underwriter / Insurer', placeholder: 'e.g. Aviva Commercial UK' },
      { key: 'type', label: 'Coverage Type', placeholder: 'Select Coverage Type', type: 'select', isCategory: true, defaultValue: 'Buildings & Plant' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Finance' },
      { key: 'coverageAmount', label: 'Total Coverage (£)', placeholder: 'e.g. 15000000', type: 'number' },
      { key: 'annualPremium', label: 'Annual Premium (£)', placeholder: 'e.g. 18500', type: 'number' },
      { key: 'expiryDate', label: 'Renewal Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2027-06-30' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'active' },
    ],
    defaultGridColumns: [
      { key: 'policyNumber', label: 'Policy Number' },
      { key: 'provider', label: 'Insurer / Provider' },
      { key: 'type', label: 'Coverage Type', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'coverageAmount', label: 'Coverage (£)', type: 'number' },
      { key: 'annualPremium', label: 'Annual Premium (£)', type: 'number' },
      { key: 'expiryDate', label: 'Renewal Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'claims',
    label: 'Insurance Claims',
    sub: 'Incident & Damage Claims',
    icon: FileText,
    collection: 'claims',
    color: '#f43f5e',
    sidebarGroup: 'PROPCO',
    quickFormFields: [
      { key: 'claimNumber', label: 'Claim Reference', placeholder: 'e.g. CLM-2026-004', required: true },
      { key: 'policyNumber', label: 'Linked Policy Number', placeholder: 'e.g. POL-2026-UK-089' },
      { key: 'category', label: 'Incident Type', placeholder: 'Select Incident Type', type: 'select', isCategory: true, defaultValue: 'Water Damage' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Operations' },
      { key: 'description', label: 'Damage / Incident Description', placeholder: 'e.g. Water damage to plant room boiler pipe' },
      { key: 'amount', label: 'Claim Amount (£)', placeholder: 'e.g. 12500', type: 'number' },
      { key: 'incidentDate', label: 'Incident Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2026-10-14' },
      { key: 'status', label: 'Claim Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'in-progress' },
    ],
    defaultGridColumns: [
      { key: 'claimNumber', label: 'Claim Ref' },
      { key: 'policyNumber', label: 'Policy Ref' },
      { key: 'category', label: 'Incident Type', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount (£)', type: 'number' },
      { key: 'incidentDate', label: 'Incident Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'contracts',
    label: 'Contracts Register',
    sub: 'Supplier & Legal Agreements',
    icon: ScrollText,
    collection: 'contracts',
    color: '#38bdf8',
    sidebarGroup: 'PROPCO',
    quickFormFields: [
      { key: 'title', label: 'Contract Title', placeholder: 'e.g. Comprehensive HVAC Maintenance Agreement', required: true },
      { key: 'supplier', label: 'Supplier / Contractor', placeholder: 'e.g. Daikin UK Commercial' },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'HVAC Maintenance' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Maintenance' },
      { key: 'annualValue', label: 'Annual Value (£)', placeholder: 'e.g. 24000', type: 'number' },
      { key: 'startDate', label: 'Start Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2026-01-01' },
      { key: 'expiryDate', label: 'Expiry Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2027-12-31' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'active' },
    ],
    defaultGridColumns: [
      { key: 'title', label: 'Contract Title' },
      { key: 'supplier', label: 'Supplier / Contractor' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'annualValue', label: 'Annual Value (£)', type: 'number' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities Register',
    sub: 'Meters, Tariffs & Costs',
    icon: Zap,
    collection: 'utilities',
    color: '#fbbf24',
    sidebarGroup: 'OPCO',
    quickFormFields: [
      { key: 'meterNumber', label: 'Meter Reference / Serial', placeholder: 'e.g. MPAN-220004928374', required: true },
      { key: 'utilityType', label: 'Utility Type', placeholder: 'Select Utility Type', type: 'select', isCategory: true, defaultValue: 'Electricity' },
      { key: 'supplier', label: 'Utility Supplier', placeholder: 'e.g. British Gas Commercial / E.ON' },
      { key: 'accountNumber', label: 'Account Number', placeholder: 'e.g. AC-984210' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Engineering' },
      { key: 'monthlyCost', label: 'Est. Monthly Cost (£)', placeholder: 'e.g. 4200', type: 'number' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'active' },
    ],
    defaultGridColumns: [
      { key: 'meterNumber', label: 'Meter Number' },
      { key: 'utilityType', label: 'Utility Type', type: 'select', isCategory: true },
      { key: 'supplier', label: 'Supplier' },
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'monthlyCost', label: 'Monthly Cost (£)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'documents',
    label: 'Documents & Vault',
    sub: 'O&M Manuals, Plans, Leases & Certs',
    icon: FolderOpen,
    collection: 'documents',
    color: '#34d399',
    sidebarGroup: 'CORE',
    quickFormFields: [
      { key: 'name', label: 'Document Title', placeholder: 'e.g. As-Built Plant Room Drawings & Schematics', required: true },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'O&M Manual' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Maintenance' },
      { key: 'status', label: 'Compliance Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'compliant' },
      { key: 'expiryDate', label: 'Expiry / Review Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2028-12-31' },
      { key: 'file', label: 'File Attachment', placeholder: 'Upload Document', type: 'file' },
    ],
    defaultGridColumns: [
      { key: 'name', label: 'Document Title' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'fileName', label: 'Attached File' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks & Inspections',
    sub: 'Daily Checks & Engineer Work',
    icon: CheckSquare,
    collection: 'tasks',
    color: '#818cf8',
    sidebarGroup: 'CORE',
    quickFormFields: [
      { key: 'title', label: 'Task Title', placeholder: 'e.g. Weekly Generator Fuel Level & Battery Test', required: true },
      { key: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', isCategory: true, defaultValue: 'Plant Inspection' },
      { key: 'department', label: 'Department', placeholder: 'Select Department', type: 'select', isDepartment: true, defaultValue: 'Engineering' },
      { key: 'assignedTo', label: 'Assigned Engineer', placeholder: 'e.g. Duty Engineer' },
      { key: 'priority', label: 'Priority', placeholder: 'Select Priority', type: 'select', options: LIVE_PRIORITIES, defaultValue: 'medium' },
      { key: 'dueDate', label: 'Due Date', placeholder: 'YYYY-MM-DD', type: 'date', defaultValue: '2026-11-20' },
      { key: 'status', label: 'Status', placeholder: 'Select Status', type: 'select', isStatus: true, defaultValue: 'open' },
    ],
    defaultGridColumns: [
      { key: 'title', label: 'Task Title' },
      { key: 'category', label: 'Category', type: 'select', isCategory: true },
      { key: 'department', label: 'Department', type: 'select', isDepartment: true },
      { key: 'assignedTo', label: 'Assigned Engineer' },
      { key: 'priority', label: 'Priority', type: 'select', options: LIVE_PRIORITIES },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', isStatus: true },
    ],
  },
];

export default function PropertyOnboardingHub() {
  const { isDigitalBot } = useAuth();
  const [properties, setProperties] = useState<PropertyItem[]>(() => getLiveProperties() as any);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    const live = getLiveProperties();
    return live[0]?.id || live[0]?.name || '';
  });
  const [activeModule, setActiveModule] = useState<ModuleKey>('fixed-assets');
  const [loadingProps, setLoadingProps] = useState(false);
  const [moduleRecords, setModuleRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Pagination for module records table
  const {
    currentPage: recordsPage,
    pageSize: recordsPageSize,
    totalRecords: totalModuleRecords,
    paginatedItems: paginatedModuleRecords,
    isPageLoading: isRecordsPageLoading,
    changePage: changeRecordsPage,
    changePageSize: changeRecordsPageSize,
  } = useLoadingPagination(moduleRecords, 10);

  // Dynamic live categories from DB
  const [liveDbCategories, setLiveDbCategories] = useState<string[]>([]);

  // Bulk Selection State
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // New Property Modal State
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [creatingProperty, setCreatingProperty] = useState(false);
  const [newPropForm, setNewPropForm] = useState({
    name: '',
    city: 'London',
    address: '',
    manager: '',
    phone: '+44 20 ',
    rooms: 120,
    portal: 'both',
    status: 'active',
  });

  // Edit Property Modal State
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [isUpdatingProperty, setIsUpdatingProperty] = useState(false);
  const [editPropertyForm, setEditPropertyForm] = useState({
    name: '',
    city: 'London',
    address: '',
    manager: '',
    phone: '+44 20 ',
    rooms: 120,
    portal: 'both',
    status: 'active',
  });

  // Delete Property Confirmation State
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyItem | null>(null);
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);

  // Edit Record Modal State (for all 11 modules)
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editRecordData, setEditRecordData] = useState<Record<string, any>>({});
  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);

  // Entry Mode: 'spreadsheet' or 'single'
  const [entryMode, setEntryMode] = useState<'single' | 'spreadsheet'>('single');
  const [showAddSection, setShowAddSection] = useState(false);

  // Quick Add Record Form State
  const [quickFormData, setQuickFormData] = useState<Record<string, any>>({});
  const [isSubmittingQuickForm, setIsSubmittingQuickForm] = useState(false);

  // ── SPREADSHEET / EXCEL MODAL & INLINE STATE ──
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState(false);
  const [gridColumns, setGridColumns] = useState<GridColumnDef[]>([]);
  const [gridRows, setGridRows] = useState<Record<string, any>[]>([]);
  const [isSavingGrid, setIsSavingGrid] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumnPrompt, setShowAddColumnPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active module config
  const currentModuleConfig = useMemo(
    () => MODULES.find((m) => m.id === activeModule) || MODULES[0],
    [activeModule]
  );

  // Active selected property (purely dynamic from DB)
  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId || p.name === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  // Load live categories from database
  const loadCategories = useCallback(async () => {
    try {
      const res = await api.categories.getAll();
      if (res.success && Array.isArray(res.data)) {
        const names = res.data.map((c: any) => c.name).filter(Boolean);
        setLiveDbCategories(names);
      }
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  }, []);

  // Compute live merged categories for active module
  const activeModuleCategories = useMemo(() => {
    const base = BASE_CATEGORIES_BY_MODULE[currentModuleConfig.id] || [];
    const merged = Array.from(new Set([...base, ...liveDbCategories]));
    return merged;
  }, [currentModuleConfig.id, liveDbCategories]);

  // Compute live statuses for active module
  const activeModuleStatuses = useMemo(() => {
    return LIVE_STATUSES_BY_MODULE[currentModuleConfig.id] || ['active', 'maintenance', 'pending'];
  }, [currentModuleConfig.id]);

  // Load properties dynamically from database
  const loadProperties = useCallback(async () => {
    try {
      setLoadingProps(true);
      const res = await api.properties.getAll();
      if (res.success && Array.isArray(res.data)) {
        setProperties((prev) => {
          if (
            prev.length === res.data.length &&
            prev.every((p, i) => p.id === res.data[i]?.id && p.name === res.data[i]?.name)
          ) {
            return prev;
          }
          return res.data;
        });
        saveLivePropertiesToCache(res.data as any);
        setSelectedPropertyId((current) => {
          if (!current && res.data.length > 0) {
            return res.data[0].id || res.data[0].name;
          }
          return current;
        });
      }
    } catch (e) {
      console.warn('Failed to load properties for onboarding hub:', e);
    } finally {
      setLoadingProps(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
    loadCategories();
    const handleDataChanged = (e: any) => {
      if (e?.detail?.type === 'properties' || e?.detail?.type === 'property-created' || e?.detail?.type === 'property-deleted') {
        loadProperties();
      }
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [loadProperties, loadCategories]);

  // Stable primitives for loading module records
  const activePropertyId = selectedProperty?.id || selectedPropertyId;
  const activePropertyName = selectedProperty?.name || '';
  const activeModuleId = currentModuleConfig.id;
  const activeModuleCol = currentModuleConfig.collection;

  // Load records dynamically for active module and selected property
  const loadModuleRecords = useCallback(async () => {
    if (!activePropertyId && !activePropertyName) return;
    try {
      setLoadingRecords(true);
      const col = activeModuleCol;
      let allRecords: any[] = [];

      if ((api as any)[col]?.getAll) {
        const res = await (api as any)[col].getAll();
        if (res.success && Array.isArray(res.data)) {
          allRecords = res.data;
        }
      }

      // Filter dynamically to records belonging to selected property
      const pName = activePropertyName.toLowerCase().trim();
      const pId = activePropertyId.toLowerCase().trim();

      const filtered = allRecords.filter((rec: any) => {
        // Strict fixed vs non-fixed check
        const isNonFixed =
          rec.isFixed === false ||
          String(rec.type || rec.assetType || '').toLowerCase().includes('non-fixed') ||
          String(rec.id || '').toUpperCase().startsWith('NON-') ||
          String(rec.id || '').toUpperCase().startsWith('NFX-');

        if (activeModuleId === 'fixed-assets') {
          if (isNonFixed) return false;
        } else if (activeModuleId === 'non-fixed-assets') {
          if (!isNonFixed) return false;
        }

        if (activeModuleId === 'categories') {
          if (!rec.property && !rec.site && !rec.hotel) return true;
        }

        const rProp = String(rec.property || rec.site || rec.hotel || rec.hotelName || '').toLowerCase().trim();
        const rId = String(rec.hotelId || rec.propertyId || '').toLowerCase().trim();

        if (!rProp && !rId) return false;
        return (
          rProp === pName ||
          rProp.includes(pName) ||
          pName.includes(rProp) ||
          (pId && rId === pId)
        );
      });

      const normalizedRecords = filtered.map((rec: any) => ({
        ...rec,
        title: rec.title || rec.contractName || rec.item || rec.assetName || rec.meterNumber || rec.name || '',
        name: rec.name || rec.title || rec.contractName || rec.item || rec.assetName || '',
        supplier: rec.supplier || rec.supplierName || rec.provider || '',
        supplierName: rec.supplierName || rec.supplier || rec.provider || '',
      }));

      setModuleRecords(normalizedRecords);
      setSelectedRecordIds([]);
    } catch (err) {
      console.warn('Failed to load module records for property hub:', err);
      setModuleRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [activePropertyId, activePropertyName, activeModuleId, activeModuleCol]);

  useEffect(() => {
    loadModuleRecords();
  }, [loadModuleRecords]);

  // Helper to create an empty row for the spreadsheet grid
  const createEmptyRow = useCallback(() => {
    const row: Record<string, any> = { _rowId: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    currentModuleConfig.defaultGridColumns.forEach((col) => {
      if (col.isCategory) row[col.key] = activeModuleCategories[0] || '';
      else if (col.isDepartment) row[col.key] = LIVE_DEPARTMENTS[0] || 'Kitchen';
      else if (col.isStatus) row[col.key] = activeModuleStatuses[0] || 'active';
      else if (col.type === 'number') row[col.key] = col.key === 'quantity' ? 1 : '';
      else row[col.key] = '';
    });
    return row;
  }, [currentModuleConfig, activeModuleCategories, activeModuleStatuses]);

  // Reset quick form and spreadsheet grid when module changes
  useEffect(() => {
    const defaults: Record<string, any> = {};
    currentModuleConfig.quickFormFields.forEach((f) => {
      if (f.isCategory) defaults[f.key] = activeModuleCategories[0] || f.defaultValue || '';
      else if (f.isDepartment) defaults[f.key] = LIVE_DEPARTMENTS[0] || 'Kitchen';
      else if (f.isStatus) defaults[f.key] = activeModuleStatuses[0] || 'active';
      else if (f.defaultValue) defaults[f.key] = f.defaultValue;
    });
    setQuickFormData(defaults);
    setShowAddSection(false);
    setSelectedRecordIds([]);

    // Initialize spreadsheet grid with 3 blank rows and default columns
    setGridColumns([...currentModuleConfig.defaultGridColumns]);
    setGridRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  }, [currentModuleConfig, activeModuleCategories, activeModuleStatuses, createEmptyRow]);

  // ── SPREADSHEET ACTIONS ──

  const handleAddGridRow = () => {
    setGridRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleDeleteGridRow = (rowId: string) => {
    setGridRows((prev) => {
      const remaining = prev.filter((r) => r._rowId !== rowId);
      return remaining.length > 0 ? remaining : [createEmptyRow()];
    });
  };

  const handleUpdateGridCell = (rowId: string, colKey: string, val: any) => {
    setGridRows((prev) =>
      prev.map((r) => (r._rowId === rowId ? { ...r, [colKey]: val } : r))
    );
  };

  const handleAddColumn = () => {
    const clean = newColumnName.trim();
    if (!clean) return;
    const key = clean.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (gridColumns.some((c) => c.key === key)) {
      toast.error('Column already exists');
      return;
    }
    setGridColumns((prev) => [...prev, { key, label: clean, type: 'text' }]);
    setNewColumnName('');
    setShowAddColumnPrompt(false);
    toast.success(`Added column "${clean}" to spreadsheet`);
  };

  // Upload Excel (.xlsx, .xls) or CSV into Spreadsheet Grid
  const handleSpreadsheetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (!json.length) {
            toast.error('Excel sheet is empty');
            return;
          }

          // Auto-discover extra columns from file
          const fileHeaders = Object.keys(json[0]);
          const currentKeys = new Set(gridColumns.map((c) => c.key.toLowerCase()));
          const extraCols = fileHeaders
            .filter((h) => !currentKeys.has(h.toLowerCase()))
            .map((h) => ({ key: h.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: h, type: 'text' as const }));

          if (extraCols.length > 0) {
            setGridColumns((prev) => [...prev, ...extraCols]);
          }

          const parsedRows = json.map((item, idx) => ({
            ...item,
            _rowId: `excel-row-${Date.now()}-${idx}`,
          }));

          setGridRows(parsedRows);
          toast.success(`Loaded ${parsedRows.length} rows from Excel "${file.name}"!`);
        } catch (err: any) {
          console.error('Excel parse error:', err);
          toast.error('Failed to read Excel file', { description: err?.message });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const workbook = XLSX.read(text, { type: 'string' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (!json.length) {
            toast.error('CSV file is empty');
            return;
          }

          const parsedRows = json.map((item, idx) => ({
            ...item,
            _rowId: `csv-row-${Date.now()}-${idx}`,
          }));

          setGridRows(parsedRows);
          toast.success(`Loaded ${parsedRows.length} rows from CSV "${file.name}"!`);
        } catch (err: any) {
          console.error('CSV parse error:', err);
          toast.error('Failed to read CSV file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Download Excel Template for this module
  const handleDownloadExcelTemplate = () => {
    try {
      const sampleRow: Record<string, any> = {};
      gridColumns.forEach((c) => {
        if (c.isCategory) sampleRow[c.label] = activeModuleCategories[0] || 'General';
        else if (c.isDepartment) sampleRow[c.label] = 'Kitchen';
        else if (c.isStatus) sampleRow[c.label] = activeModuleStatuses[0] || 'active';
        else if (c.type === 'number') sampleRow[c.label] = 100;
        else sampleRow[c.label] = `Sample ${c.label}`;
      });

      const ws = XLSX.utils.json_to_sheet([sampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, currentModuleConfig.label.substring(0, 31));
      const filename = `${currentModuleConfig.id}_${(selectedProperty?.name || 'property').replace(/\s+/g, '_')}_template.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Downloaded Excel template: ${filename}`);
    } catch (err: any) {
      console.error('Excel template download error:', err);
      toast.error('Failed to generate template');
    }
  };

  // Save all non-empty spreadsheet rows to database
  const handleSaveGridToDatabase = async () => {
    if (!selectedProperty) {
      toast.error('Please select a property first');
      return;
    }

    const validRows = gridRows.filter((r) => {
      const title = r.name || r.title || r.policyNumber || r.meterNumber || r.claimNumber;
      return Boolean(title && String(title).trim().length > 0);
    });

    if (validRows.length === 0) {
      toast.error('No valid records to save. Please fill in at least the Name / Title column.');
      return;
    }

    setIsSavingGrid(true);
    const col = currentModuleConfig.collection;
    const p = selectedProperty.name;
    const pid = selectedProperty.id;

    try {
      const mapped = validRows.map((raw, idx) => {
        const { _rowId, ...rest } = raw;
        const payload: any = {
          ...rest,
          id: raw.id || `${currentModuleConfig.id.slice(0, 3).toUpperCase()}-${Date.now()}-${idx + 1}`,
          property: p,
          site: p,
          hotel: p,
          hotelName: p,
          hotelId: pid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (currentModuleConfig.id === 'fixed-assets') {
          payload.type = 'fixed';
          payload.assetType = 'fixed';
          payload.isFixed = true;
          payload.assetId = raw.assetId || `FIX-${Date.now().toString().slice(-6)}`;
        } else if (currentModuleConfig.id === 'non-fixed-assets') {
          payload.type = 'non-fixed';
          payload.assetType = 'non-fixed';
          payload.isFixed = false;
          payload.assetId = raw.assetId || `NFX-${Date.now().toString().slice(-6)}`;
        } else if (currentModuleConfig.id === 'contracts') {
          const cName = raw.title || raw.contractName || raw.name || 'Commercial Agreement';
          const sName = raw.supplier || raw.supplierName || 'Contractor';
          payload.contractName = cName;
          payload.title = cName;
          payload.name = cName;
          payload.supplierName = sName;
          payload.supplier = sName;
          payload.contractId = raw.contractId || `CON-${Date.now().toString().slice(-4)}-${idx + 1}`;
        } else if (currentModuleConfig.id === 'insurance') {
          payload.policyNumber = raw.policyNumber || raw.name || raw.title || `POL-${Date.now().toString().slice(-4)}-${idx + 1}`;
          payload.insuranceType = raw.type || raw.insuranceType || 'Buildings & Plant';
          payload.provider = raw.provider || 'Aviva Commercial UK';
        } else if (currentModuleConfig.id === 'compliance') {
          payload.item = raw.title || raw.item || raw.name || 'Compliance Inspection';
          payload.name = payload.item;
        } else if (currentModuleConfig.id === 'maintenance') {
          payload.assetName = raw.assetName || raw.title || raw.name || 'General Equipment';
          payload.title = raw.title || payload.assetName;
          payload.assetId = raw.assetId || `AST-${Date.now().toString().slice(-4)}-${idx + 1}`;
        } else if (currentModuleConfig.id === 'utilities') {
          payload.accountNo = raw.accountNumber || raw.accountNo || raw.meterNumber || `ACC-${Date.now().toString().slice(-4)}`;
          payload.accountNumber = payload.accountNo;
          payload.meterNumber = raw.meterNumber || payload.accountNo;
          payload.utilityType = raw.utilityType || raw.type || 'Electricity';
        }

        return payload;
      });

      const res = await api.bulkImport(col, mapped);
      if (res.success) {
        toast.success(`Successfully saved ${mapped.length} records into ${p} in the database!`);
        setModuleRecords((prev) => [...mapped, ...prev]);
        setShowSpreadsheetModal(false);
        setShowAddSection(false);
        setGridRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: col } }));
        }
      } else {
        toast.error((res as any)?.error || 'Failed to save spreadsheet records');
      }
    } catch (err: any) {
      console.error('Grid save error:', err);
      toast.error('Error saving records to database', { description: err?.message });
    } finally {
      setIsSavingGrid(false);
    }
  };

  // ── QUICK ADD SINGLE RECORD ──
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) {
      toast.error('Please select a property first');
      return;
    }

    const titleField = currentModuleConfig.quickFormFields[0].key;
    if (!quickFormData[titleField]) {
      toast.error(`${currentModuleConfig.quickFormFields[0].label} is required`);
      return;
    }

    setIsSubmittingQuickForm(true);
    const col = currentModuleConfig.collection;
    const prefix = currentModuleConfig.id.slice(0, 3).toUpperCase();
    const newId = `${prefix}-${Date.now().toString().slice(-6)}`;

    const payload: any = {
      ...quickFormData,
      id: newId,
      property: selectedProperty.name,
      site: selectedProperty.name,
      hotel: selectedProperty.name,
      hotelName: selectedProperty.name,
      hotelId: selectedProperty.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentModuleConfig.id === 'fixed-assets') {
      payload.type = 'fixed';
      payload.assetType = 'fixed';
      payload.isFixed = true;
      payload.assetId = quickFormData.assetId || `FIX-${Date.now().toString().slice(-6)}`;
    } else if (currentModuleConfig.id === 'non-fixed-assets') {
      payload.type = 'non-fixed';
      payload.assetType = 'non-fixed';
      payload.isFixed = false;
      payload.assetId = quickFormData.assetId || `NFX-${Date.now().toString().slice(-6)}`;
    } else if (currentModuleConfig.id === 'contracts') {
      const cName = quickFormData.title || quickFormData.contractName || quickFormData.name || 'Commercial Agreement';
      const sName = quickFormData.supplier || quickFormData.supplierName || 'Contractor';
      payload.contractName = cName;
      payload.title = cName;
      payload.name = cName;
      payload.supplierName = sName;
      payload.supplier = sName;
      payload.contractId = quickFormData.contractId || `CON-${Date.now().toString().slice(-4)}`;
    } else if (currentModuleConfig.id === 'insurance') {
      payload.policyNumber = quickFormData.policyNumber || quickFormData.name || quickFormData.title || `POL-${Date.now().toString().slice(-4)}`;
      payload.insuranceType = quickFormData.type || quickFormData.insuranceType || 'Buildings & Plant';
      payload.provider = quickFormData.provider || 'Aviva Commercial UK';
    } else if (currentModuleConfig.id === 'compliance') {
      payload.item = quickFormData.title || quickFormData.item || quickFormData.name || 'Compliance Inspection';
      payload.name = payload.item;
    } else if (currentModuleConfig.id === 'maintenance') {
      payload.assetName = quickFormData.assetName || quickFormData.title || quickFormData.name || 'General Equipment';
      payload.title = quickFormData.title || payload.assetName;
      payload.assetId = quickFormData.assetId || `AST-${Date.now().toString().slice(-4)}`;
    } else if (currentModuleConfig.id === 'utilities') {
      payload.accountNo = quickFormData.accountNumber || quickFormData.accountNo || quickFormData.meterNumber || `ACC-${Date.now().toString().slice(-4)}`;
      payload.accountNumber = payload.accountNo;
      payload.meterNumber = quickFormData.meterNumber || payload.accountNo;
      payload.utilityType = quickFormData.utilityType || quickFormData.type || 'Electricity';
    }

    try {
      if ((api as any)[col]?.create) {
        const res = await (api as any)[col].create(payload);
        if (res.success) {
          toast.success(`Added ${currentModuleConfig.label} item to ${selectedProperty.name}`, {
            description: payload.name || payload.title || payload.contractName || payload.policyNumber || payload.meterNumber || 'Record saved to DB',
          });
          setModuleRecords((prev) => [payload, ...prev]);
          setShowAddSection(false);

          // Reset form to defaults
          const defaults: Record<string, any> = {};
          currentModuleConfig.quickFormFields.forEach((f) => {
            if (f.isCategory) defaults[f.key] = activeModuleCategories[0] || f.defaultValue || '';
            else if (f.isDepartment) defaults[f.key] = LIVE_DEPARTMENTS[0] || 'Kitchen';
            else if (f.isStatus) defaults[f.key] = activeModuleStatuses[0] || 'active';
            else if (f.defaultValue) defaults[f.key] = f.defaultValue;
          });
          setQuickFormData(defaults);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: col } }));
          }
        } else {
          toast.error(res?.error || 'Failed to save record to database');
        }
      } else {
        toast.error(`API create handler not found for ${col}`);
      }
    } catch (err: any) {
      console.error('Error saving record:', err);
      toast.error(err?.message || 'Failed to save record to database');
    } finally {
      setIsSubmittingQuickForm(false);
    }
  };

  // ── CREATE PROPERTY ──
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newPropForm.name.trim();
    if (!cleanName) {
      toast.error('Property name is required');
      return;
    }

    setCreatingProperty(true);
    const newPropId = `hotel-${Date.now().toString().slice(-4)}`;
    const propPayload = {
      id: newPropId,
      name: cleanName,
      city: newPropForm.city.trim() || 'London',
      address: newPropForm.address.trim() || `${cleanName}, United Kingdom`,
      manager: newPropForm.manager.trim() || 'Marcus Webb',
      phone: newPropForm.phone.trim(),
      rooms: Number(newPropForm.rooms) || 100,
      portal: newPropForm.portal || 'both',
      status: 'active',
      type: 'Hotel & Estate',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.properties.create(propPayload);
      if (res.success) {
        const savedProp = res.data || propPayload;
        toast.success(`Property "${cleanName}" created in database!`, {
          description: 'All 11 sidebar modules are ready for this property.',
        });
        setProperties((prev) => {
          const next = [savedProp, ...prev.filter((p) => p.id !== savedProp.id)];
          saveLivePropertiesToCache(next as any);
          return next;
        });
        setSelectedPropertyId(savedProp.id || savedProp.name);
        setShowAddPropertyModal(false);
        setNewPropForm({
          name: '',
          city: 'London',
          address: '',
          manager: '',
          phone: '+44 20 ',
          rooms: 120,
          portal: 'both',
          status: 'active',
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'properties' } }));
        }
      } else {
        toast.error((res as any)?.error || 'Failed to create property in DB');
      }
    } catch (err: any) {
      console.error('Error creating property:', err);
      toast.error(err?.message || 'Failed to create property in DB');
    } finally {
      setCreatingProperty(false);
    }
  };

  // ── UPDATE RECORD HELPER ──
  const updateRecordInDb = async (col: string, id: string, payload: any): Promise<any> => {
    switch (col) {
      case 'assets':
        return api.assets.update(id, payload);
      case 'categories':
        return api.categories.update(id, payload);
      case 'maintenance':
        return api.maintenance.update(id, payload);
      case 'compliance':
        return api.compliance.update(id, payload);
      case 'insurance':
        return api.insurance.update(id, payload);
      case 'claims':
        return api.claims.update(id, payload);
      case 'contracts':
        return api.contracts.update(id, payload);
      case 'utilities':
        return api.utilities.update(id, payload);
      case 'documents':
        return api.documents.update(id, payload);
      case 'tasks':
        return api.tasks.update(id, payload);
      default:
        const res = await fetch(`/api/${col}/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return res.json();
    }
  };

  // ── EDIT PROPERTY ──
  const handleOpenEditProperty = () => {
    if (!selectedProperty) return;
    setEditPropertyForm({
      name: selectedProperty.name || '',
      city: selectedProperty.city || 'London',
      address: selectedProperty.address || '',
      manager: selectedProperty.manager || '',
      phone: selectedProperty.phone || '+44 20 ',
      rooms: selectedProperty.rooms || 120,
      portal: selectedProperty.portal || 'both',
      status: selectedProperty.status || 'active',
    });
    setShowEditPropertyModal(true);
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty?.id) return;
    setIsUpdatingProperty(true);
    try {
      const res = await api.properties.update(selectedProperty.id, editPropertyForm);
      if (res.success && res.data) {
        const updated = res.data;
        setProperties((prev) => prev.map((p) => (p.id === selectedProperty.id ? { ...p, ...updated } : p)));
        toast.success(`Property "${updated.name}" updated successfully!`);
        setShowEditPropertyModal(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'properties' } }));
        }
      } else {
        toast.error((res as any)?.error || 'Failed to update property');
      }
    } catch (err: any) {
      console.error('Error updating property:', err);
      toast.error(err?.message || 'Failed to update property in database');
    } finally {
      setIsUpdatingProperty(false);
    }
  };

  // ── DELETE PROPERTY ──
  const handleDeletePropertyConfirm = async () => {
    if (!propertyToDelete?.id) return;
    setIsDeletingProperty(true);
    try {
      const propId = propertyToDelete.id;
      const propName = propertyToDelete.name;
      const res = await api.properties.delete(propId);
      if (res.success) {
        toast.success(`Property "${propName}" deleted from database`);
        const remaining = properties.filter((p) => p.id !== propId);
        setProperties(remaining);
        if (selectedPropertyId === propId) {
          setSelectedPropertyId(remaining[0]?.id || '');
        }
        setPropertyToDelete(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'properties' } }));
        }
      } else {
        toast.error('Failed to delete property from database');
      }
    } catch (err: any) {
      console.error('Error deleting property:', err);
      toast.error(err?.message || 'Failed to delete property');
    } finally {
      setIsDeletingProperty(false);
    }
  };

  // ── EDIT RECORD (ANY MODULE) ──
  const handleStartEditRecord = (rec: any) => {
    setEditingRecord(rec);
    setEditRecordData({ ...rec });
  };

  const handleSaveEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord?.id) return;
    setIsUpdatingRecord(true);
    try {
      const col = currentModuleConfig.collection;
      const recId = editingRecord.id;
      const payload = {
        ...editingRecord,
        ...editRecordData,
        updatedAt: new Date().toISOString(),
      };

      const res = await updateRecordInDb(col, recId, payload);
      if (res.success || res.data) {
        toast.success(`Record updated successfully in database!`);
        setModuleRecords((prev) =>
          prev.map((r) => (r.id === recId ? { ...r, ...payload } : r))
        );
        setEditingRecord(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: col } }));
        }
      } else {
        toast.error('Failed to update record in database');
      }
    } catch (err: any) {
      console.error('Error updating record:', err);
      toast.error(err?.message || 'Failed to update record');
    } finally {
      setIsUpdatingRecord(false);
    }
  };

  // ── SELECTION & BULK DELETE ──
  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedRecordIds.length === moduleRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(moduleRecords.map((r) => r.id));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteTarget || !bulkDeleteTarget.ids.length) return;
    setIsDeletingBulk(true);
    try {
      const col = currentModuleConfig.collection;
      const res = await api.bulkDelete(col, bulkDeleteTarget.ids);
      if (res.success) {
        toast.success(`Deleted ${bulkDeleteTarget.ids.length} records from ${selectedProperty?.name}`);
        const deletedSet = new Set(bulkDeleteTarget.ids);
        setModuleRecords((prev) => prev.filter((r) => !deletedSet.has(r.id)));
        setSelectedRecordIds([]);
        setBulkDeleteTarget(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: col } }));
        }
      } else {
        toast.error('Failed to delete records from database');
      }
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err?.message || 'Error deleting records from database');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER & PROPERTY SELECTOR ── */}
      <div className="rounded-2xl border border-cyan-500/30 p-5 shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(15,23,42,0.9) 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex-shrink-0 shadow-inner">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-head font-bold text-lg text-foreground tracking-tight">Property Data &amp; Setup CMS</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CMS Hub
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dynamic live database manager — assign records, departments, documents, Excel spreadsheets, and manage all 11 sidebar modules for any property.
              </p>
            </div>
          </div>

          {/* Quick Create Property Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddPropertyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} /> Create New Property
            </button>
          </div>
        </div>

        {/* Dynamic Property Selector Bar */}
        <div className="mt-5 pt-4 border-t border-cyan-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 max-w-xl">
            <label className="text-xs font-semibold text-cyan-200 whitespace-nowrap flex items-center gap-1.5">
              <Building2 size={13} className="text-cyan-400" /> Active Property:
            </label>
            <div className="flex-1 min-w-[200px]">
              <CustomDropdown
                value={selectedProperty?.id || selectedProperty?.name}
                options={properties.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.city || 'UK'})`,
                }))}
                onChange={(val) => setSelectedPropertyId(val)}
                className="w-full text-xs"
              />
            </div>
            {selectedProperty && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOpenEditProperty}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-400/40 text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
                  title="Edit details of this property"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyToDelete(selectedProperty)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete this property from database"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>

          {selectedProperty && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-medium">
                {selectedProperty.city || 'United Kingdom'}
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> {selectedProperty.status || 'Active'}
              </span>
              <span>·</span>
              <span>{selectedProperty.rooms || 100} Rooms</span>
              {selectedProperty.manager && (
                <>
                  <span>·</span>
                  <span className="text-muted-foreground">GM: {selectedProperty.manager}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── SIDEBAR MODULES NAVIGATION (ALL 11 TABS FROM SIDEBAR) ── */}
      <div className="rounded-2xl border border-border p-3" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-border/60">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-primary" /> Sidebar Modules for: <strong className="text-foreground">{selectedProperty?.name || 'Selected Property'}</strong>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {MODULES.length} Sidebar Sections
          </span>
        </div>

        {/* Horizontal scrollable modules tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const active = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border"
                style={{
                  background: active ? `${mod.color}18` : 'transparent',
                  borderColor: active ? `${mod.color}60` : 'transparent',
                  color: active ? mod.color : 'var(--text2)',
                }}
              >
                <Icon size={14} style={{ color: active ? mod.color : undefined }} />
                <span>{mod.label}</span>
                <span
                  className="text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider"
                  style={{
                    background: mod.sidebarGroup === 'PROPCO' ? 'rgba(232,201,122,0.15)' : mod.sidebarGroup === 'OPCO' ? 'rgba(96,165,250,0.15)' : 'rgba(148,163,184,0.15)',
                    color: mod.sidebarGroup === 'PROPCO' ? '#e8c97a' : mod.sidebarGroup === 'OPCO' ? '#60a5fa' : '#94a3b8',
                  }}
                >
                  {mod.sidebarGroup}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE MODULE CONTENT & ACTIONS ── */}
      <div className="rounded-2xl border border-border p-5 space-y-5" style={{ background: 'var(--surface)' }}>
        {/* Module Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                background: `${currentModuleConfig.color}18`,
                borderColor: `${currentModuleConfig.color}40`,
                color: currentModuleConfig.color,
              }}
            >
              <currentModuleConfig.icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-head font-bold text-base text-foreground">
                  {currentModuleConfig.label}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
                  {moduleRecords.length} records in {selectedProperty?.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{currentModuleConfig.sub}</p>
            </div>
          </div>

          {/* Action Buttons: Spreadsheet Table & Single Item */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSpreadsheetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors cursor-pointer shadow-sm"
              title="Add rows, add columns, or upload Excel spreadsheet"
            >
              <Table size={13} /> Excel / Spreadsheet Entry
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddSection(!showAddSection);
                if (!showAddSection) setEntryMode('single');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-black transition-all cursor-pointer shadow-sm"
              style={{ background: currentModuleConfig.color }}
            >
              {showAddSection ? (
                <>
                  <X size={13} /> Close Form
                </>
              ) : (
                <>
                  <Plus size={13} /> Add {currentModuleConfig.label} Record
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── EXPANDABLE ADD SECTION (TOGGLE BETWEEN SPREADSHEET TABLE & FORM) ── */}
        {showAddSection && (
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.03] space-y-4 animate-in fade-in duration-150">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Select Entry Mode:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-black/40 border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setEntryMode('single')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      entryMode === 'single' ? 'bg-cyan-400 text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Single Record Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('spreadsheet')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      entryMode === 'spreadsheet' ? 'bg-cyan-400 text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Multi-Row Spreadsheet Grid
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-cyan-300 font-mono">
                Assigned to: {selectedProperty?.name}
              </span>
            </div>

            {/* Mode 1: Single Record Form */}
            {entryMode === 'single' ? (
              <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentModuleConfig.quickFormFields.map((f) => {
                    let selectOptions: string[] = f.options || [];
                    if (f.isCategory) {
                      selectOptions = activeModuleCategories;
                    } else if (f.isDepartment) {
                      selectOptions = LIVE_DEPARTMENTS;
                    } else if (f.isStatus) {
                      selectOptions = activeModuleStatuses;
                    }

                    // Special Computer File Upload for Documents
                    if (f.type === 'file') {
                      return (
                        <div key={f.key} className="sm:col-span-2 md:col-span-3">
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                            {f.label} (Upload from Computer)
                          </label>
                          <div className="p-3 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <FileUp size={18} className="text-cyan-400 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-foreground">
                                  {quickFormData.fileName ? quickFormData.fileName : 'No file chosen from computer'}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {quickFormData.fileSize ? `Size: ${quickFormData.fileSize}` : 'Supports PDF, Word (.docx), Excel (.xlsx), Images'}
                                </div>
                              </div>
                            </div>

                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 cursor-pointer">
                              <Paperclip size={13} />
                              {quickFormData.fileName ? 'Change File' : 'Browse File from Computer'}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
                                  setQuickFormData({
                                    ...quickFormData,
                                    fileName: file.name,
                                    fileSize: sizeStr,
                                    fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
                                    name: quickFormData.name || file.name.replace(/\.[^/.]+$/, ''),
                                  });
                                  toast.success(`Attached: ${file.name}`);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={f.key}>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          {f.label} {f.required && <span className="text-rose-400">*</span>}
                        </label>

                        {f.type === 'select' ? (
                          <select
                            required={f.required}
                            value={quickFormData[f.key] || selectOptions[0] || ''}
                            onChange={(e) => setQuickFormData({ ...quickFormData, [f.key]: e.target.value })}
                            className="samko-input w-full text-xs cursor-pointer py-1.5"
                          >
                            {selectOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type || 'text'}
                            required={f.required}
                            value={quickFormData[f.key] || ''}
                            onChange={(e) => setQuickFormData({ ...quickFormData, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            className="samko-input w-full text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowAddSection(false)}
                    className="samko-btn-ghost text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuickForm}
                    className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    {isSubmittingQuickForm ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save to {selectedProperty?.name}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Multi-Row Spreadsheet Table */
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddGridRow}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 cursor-pointer shadow-sm"
                    >
                      <Plus size={13} /> Add Row
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddColumnPrompt(!showAddColumnPrompt)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-surface2 cursor-pointer"
                    >
                      <Columns size={13} /> Add Column
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer"
                    >
                      <FileUp size={13} /> Upload Excel / CSV
                    </button>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    {gridRows.length} rows ready
                  </span>
                </div>

                {showAddColumnPrompt && (
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Column Header Name (e.g. Model, Warranty, Serial No)"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="samko-input flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      className="samko-btn-primary text-xs py-1 px-3"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddColumnPrompt(false)}
                      className="samko-btn-ghost text-xs py-1 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto max-h-[300px] rounded-xl border border-border bg-black/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#0f172a] z-10 border-b border-border shadow-sm">
                      <tr>
                        <th className="px-2 py-2 w-8 text-center text-muted-foreground font-mono">#</th>
                        {gridColumns.map((col) => (
                          <th key={col.key} className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                        <th className="px-2 py-2 w-8 text-center text-muted-foreground">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-sans">
                      {gridRows.map((row, rowIdx) => (
                        <tr key={row._rowId} className="hover:bg-white/[0.02]">
                          <td className="px-2 py-1.5 text-center text-muted-foreground font-mono text-[11px]">
                            {rowIdx + 1}
                          </td>
                          {gridColumns.map((col) => {
                            let selectOpts: string[] = col.options || [];
                            if (col.isCategory) selectOpts = activeModuleCategories;
                            else if (col.isDepartment) selectOpts = LIVE_DEPARTMENTS;
                            else if (col.isStatus) selectOpts = activeModuleStatuses;

                            return (
                              <td key={col.key} className="p-1 min-w-[130px]">
                                {col.type === 'select' ? (
                                  <select
                                    value={row[col.key] || selectOpts[0] || ''}
                                    onChange={(e) => handleUpdateGridCell(row._rowId, col.key, e.target.value)}
                                    className="w-full px-2 py-1 rounded bg-[#1e293b] border border-border text-foreground text-xs outline-none focus:border-cyan-400 cursor-pointer"
                                  >
                                    {selectOpts.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={col.type || 'text'}
                                    value={row[col.key] ?? ''}
                                    onChange={(e) => handleUpdateGridCell(row._rowId, col.key, e.target.value)}
                                    placeholder={`Enter ${col.label}...`}
                                    className="w-full px-2 py-1 rounded bg-[#1e293b]/60 border border-border/80 text-foreground text-xs outline-none focus:border-cyan-400"
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGridRow(row._rowId)}
                              className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowAddSection(false)}
                    className="samko-btn-ghost text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGridToDatabase}
                    disabled={isSavingGrid}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition-all cursor-pointer shadow-md"
                  >
                    {isSavingGrid ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save All Rows to Database
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BATCH SELECTION ACTION BAR ── */}
        {moduleRecords.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-border text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                <input
                  type="checkbox"
                  checked={selectedRecordIds.length > 0 && selectedRecordIds.length === moduleRecords.length}
                  onChange={handleToggleSelectAll}
                  className="rounded border-border text-cyan-400 focus:ring-cyan-400"
                />
                <span>Select All ({moduleRecords.length} records)</span>
              </label>

              {selectedRecordIds.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {selectedRecordIds.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedRecordIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkDeleteTarget({
                        ids: selectedRecordIds,
                        label: `${selectedRecordIds.length} selected record(s)`,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Selected ({selectedRecordIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRecordIds([])}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() =>
                  setBulkDeleteTarget({
                    ids: moduleRecords.map((r) => r.id),
                    label: `all ${moduleRecords.length} records for ${selectedProperty?.name}`,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-border hover:border-rose-500/30 transition-colors cursor-pointer"
              >
                <Trash2 size={12} /> Delete All for this Property
              </button>
            </div>
          </div>
        )}

        {/* ── RECORDS LIST FOR THIS PROPERTY (FULL RICH COLUMNS MATCHING SPREADSHEET) ── */}
        <div>
          {loadingRecords ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-xs font-medium">Loading {currentModuleConfig.label} records for {selectedProperty?.name}...</span>
            </div>
          ) : moduleRecords.length === 0 ? (
            <div className="py-12 px-4 rounded-xl border border-dashed border-border text-center flex flex-col items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{
                  background: `${currentModuleConfig.color}10`,
                  borderColor: `${currentModuleConfig.color}30`,
                  color: currentModuleConfig.color,
                }}
              >
                <currentModuleConfig.icon size={22} />
              </div>
              <div>
                <h4 className="font-head font-bold text-sm text-foreground">
                  No {currentModuleConfig.label} found for {selectedProperty?.name}
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                  This property currently has 0 records in this module. Add single records with the form above, or open the Excel Spreadsheet Entry to add rows and upload an Excel workbook.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSection(true);
                    setEntryMode('single');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-black cursor-pointer"
                  style={{ background: currentModuleConfig.color }}
                >
                  <Plus size={12} className="inline mr-1" /> Add Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpreadsheetModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                >
                  <Table size={12} className="inline mr-1" /> Open Spreadsheet Grid
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-white/[0.02] text-muted-foreground">
                    <th className="px-3 py-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.length === moduleRecords.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-border text-cyan-400 focus:ring-cyan-400"
                      />
                    </th>
                    <th className="px-3 py-2.5 font-semibold font-mono text-[11px]">ID</th>
                    {/* Render every column dynamically */}
                    {currentModuleConfig.defaultGridColumns.map((col) => (
                      <th key={col.key} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedModuleRecords.map((rec) => {
                    const title = rec.name || rec.title || rec.policyNumber || rec.meterNumber || rec.claimNumber || rec.id;
                    const isChecked = selectedRecordIds.includes(rec.id);

                    return (
                      <tr
                        key={rec.id}
                        className={`transition-colors ${isChecked ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRecord(rec.id)}
                            className="rounded border-border text-cyan-400 focus:ring-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                          {rec.assetId || rec.id}
                        </td>
                        {currentModuleConfig.defaultGridColumns.map((col) => {
                          const val = rec[col.key];

                          if (col.isCategory) {
                            return (
                              <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-foreground">
                                  <Tag size={10} className="text-primary" /> {val || 'General'}
                                </span>
                              </td>
                            );
                          }

                          if (col.isDepartment) {
                            return (
                              <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  {val || 'General'}
                                </span>
                              </td>
                            );
                          }

                          if (col.isStatus) {
                            const status = String(val || 'active');
                            const isGood = status === 'active' || status === 'compliant' || status === 'done';
                            const isBad = status === 'urgent' || status === 'overdue' || status === 'non-compliant';
                            return (
                              <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    isGood
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : isBad
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                            );
                          }

                          if (col.type === 'number') {
                            const num = Number(val);
                            const formatted = !isNaN(num) ? num.toLocaleString() : val;
                            const isMoney = col.key.includes('value') || col.key.includes('cost') || col.key.includes('amount') || col.key.includes('premium');
                            return (
                              <td key={col.key} className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">
                                {val ? (isMoney ? `£${formatted}` : formatted) : '—'}
                              </td>
                            );
                          }

                          if (col.key === 'fileName' || col.key === 'url') {
                            const fileName = rec.fileName || rec.url;
                            return (
                              <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                                {fileName ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px]">
                                    <Paperclip size={10} /> {fileName}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} className="px-3 py-2.5 text-foreground max-w-[200px] truncate">
                              {val ?? '—'}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleStartEditRecord(rec)}
                            className="p-1 rounded text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors mr-1 cursor-pointer"
                            title="Edit this record"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBulkDeleteTarget({
                                ids: [rec.id],
                                label: `"${title}"`,
                              })
                            }
                            className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this record from property in DB"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <LoadingPagination
              currentPage={recordsPage}
              totalRecords={totalModuleRecords}
              pageSize={recordsPageSize}
              onPageChange={changeRecordsPage}
              onPageSizeChange={changeRecordsPageSize}
              isLoading={isRecordsPageLoading || loadingRecords}
              recordName={`${currentModuleConfig.label.toLowerCase()} records`}
            />
          </div>
          )}
        </div>
      </div>

      {/* ── STANDALONE INTERACTIVE EXCEL SPREADSHEET MODAL ── */}
      {showSpreadsheetModal && (
        <Modal
          open={showSpreadsheetModal}
          onClose={() => setShowSpreadsheetModal(false)}
          title={`Spreadsheet & Excel Entry for ${selectedProperty?.name || 'Property'}`}
          width={980}
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Table size={14} className="text-cyan-400" />
                  <span>Module: <strong>{currentModuleConfig.label}</strong></span>
                  <span className="text-muted-foreground font-normal">·</span>
                  <span className="text-cyan-300 font-medium">Assigned to: {selectedProperty?.name}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Directly edit rows, add/delete rows, add custom columns, or upload an Excel (.xlsx) workbook.
                </div>
              </div>

              {/* Excel Template & Upload Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleSpreadsheetFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer"
                >
                  <FileUp size={13} /> Upload Excel (.xlsx) / CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-surface2 cursor-pointer"
                  title="Download pre-formatted Excel template"
                >
                  <Download size={13} /> Download Template (.xlsx)
                </button>
              </div>
            </div>

            {/* Grid Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-border text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddGridRow}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 cursor-pointer shadow-sm"
                >
                  <Plus size={13} /> Add Row
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddColumnPrompt(!showAddColumnPrompt)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-surface2 cursor-pointer"
                >
                  <Columns size={13} /> Add Column
                </button>

                <span className="text-[11px] text-muted-foreground ml-2">
                  {gridRows.length} rows in spreadsheet
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGridRows([createEmptyRow()])}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Reset to 1 Row
                </button>
              </div>
            </div>

            {/* Prompt for adding new column */}
            {showAddColumnPrompt && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 animate-in fade-in text-xs">
                <input
                  type="text"
                  placeholder="Enter column header name (e.g. Model, Warranty, Serial No)"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="samko-input flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="samko-btn-primary text-xs py-1.5 px-3 font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddColumnPrompt(false)}
                  className="samko-btn-ghost text-xs py-1.5 px-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── THE INTERACTIVE SPREADSHEET TABLE ── */}
            <div className="overflow-x-auto max-h-[360px] rounded-xl border border-border bg-black/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#0f172a] z-10 border-b border-border shadow-sm">
                  <tr>
                    <th className="px-2 py-2 w-8 text-center text-muted-foreground font-mono">#</th>
                    {gridColumns.map((col) => (
                      <th key={col.key} className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-2 py-2 w-8 text-center text-muted-foreground">✕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans">
                  {gridRows.map((row, rowIdx) => (
                    <tr key={row._rowId} className="hover:bg-white/[0.02] group">
                      <td className="px-2 py-1.5 text-center text-muted-foreground font-mono text-[11px]">
                        {rowIdx + 1}
                      </td>
                      {gridColumns.map((col) => {
                        let selectOpts: string[] = col.options || [];
                        if (col.isCategory) selectOpts = activeModuleCategories;
                        else if (col.isDepartment) selectOpts = LIVE_DEPARTMENTS;
                        else if (col.isStatus) selectOpts = activeModuleStatuses;

                        return (
                          <td key={col.key} className="p-1 min-w-[140px]">
                            {col.type === 'select' ? (
                              <select
                                value={row[col.key] || selectOpts[0] || ''}
                                onChange={(e) => handleUpdateGridCell(row._rowId, col.key, e.target.value)}
                                className="w-full px-2 py-1 rounded bg-[#1e293b] border border-border text-foreground text-xs outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                {selectOpts.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type || 'text'}
                                value={row[col.key] ?? ''}
                                onChange={(e) => handleUpdateGridCell(row._rowId, col.key, e.target.value)}
                                placeholder={`Enter ${col.label}...`}
                                className="w-full px-2 py-1 rounded bg-[#1e293b]/60 border border-border/80 text-foreground text-xs outline-none focus:border-cyan-400"
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteGridRow(row._rowId)}
                          className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Remove row"
                        >
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Only rows with a filled Name / Title will be saved to the database.
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSpreadsheetModal(false)}
                  className="samko-btn-ghost text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGridToDatabase}
                  disabled={isSavingGrid}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition-all cursor-pointer shadow-md"
                >
                  {isSavingGrid ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save All Rows to Database
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CREATE PROPERTY MODAL ── */}
      {showAddPropertyModal && (
        <Modal
          open={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          title="Create New Property"
          width={520}
        >
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div>
              <label className="samko-label">Property / Hotel Name *</label>
              <input
                type="text"
                required
                value={newPropForm.name}
                onChange={(e) => setNewPropForm({ ...newPropForm, name: e.target.value })}
                placeholder="e.g. Grand Hotel Brighton"
                className="samko-input w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="samko-label">City / Region</label>
                <input
                  type="text"
                  value={newPropForm.city}
                  onChange={(e) => setNewPropForm({ ...newPropForm, city: e.target.value })}
                  placeholder="e.g. Brighton / Sussex"
                  className="samko-input w-full text-xs"
                />
              </div>
              <div>
                <label className="samko-label">Total Rooms</label>
                <input
                  type="number"
                  value={newPropForm.rooms}
                  onChange={(e) => setNewPropForm({ ...newPropForm, rooms: Number(e.target.value) })}
                  className="samko-input w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="samko-label">Full Address</label>
              <input
                type="text"
                value={newPropForm.address}
                onChange={(e) => setNewPropForm({ ...newPropForm, address: e.target.value })}
                placeholder="e.g. 97 Kings Road, Brighton BN1 2FW"
                className="samko-input w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="samko-label">General Manager</label>
                <input
                  type="text"
                  value={newPropForm.manager}
                  onChange={(e) => setNewPropForm({ ...newPropForm, manager: e.target.value })}
                  placeholder="e.g. David Thornton"
                  className="samko-input w-full text-xs"
                />
              </div>
              <div>
                <label className="samko-label">Contact Phone</label>
                <input
                  type="text"
                  value={newPropForm.phone}
                  onChange={(e) => setNewPropForm({ ...newPropForm, phone: e.target.value })}
                  placeholder="+44 20 ..."
                  className="samko-input w-full text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddPropertyModal(false)}
                className="samko-btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingProperty}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                {creatingProperty ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={13} />}
                Create &amp; Open Property
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── EDIT PROPERTY MODAL ── */}
      {showEditPropertyModal && (
        <Modal
          open={showEditPropertyModal}
          onClose={() => setShowEditPropertyModal(false)}
          title={`Edit Property: ${selectedProperty?.name}`}
          width={520}
        >
          <form onSubmit={handleUpdateProperty} className="space-y-4">
            <div>
              <label className="samko-label">Property / Hotel Name *</label>
              <input
                type="text"
                required
                value={editPropertyForm.name}
                onChange={(e) => setEditPropertyForm({ ...editPropertyForm, name: e.target.value })}
                placeholder="e.g. Grand Hotel Brighton"
                className="samko-input w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="samko-label">City / Region</label>
                <input
                  type="text"
                  value={editPropertyForm.city}
                  onChange={(e) => setEditPropertyForm({ ...editPropertyForm, city: e.target.value })}
                  placeholder="e.g. Brighton / Sussex"
                  className="samko-input w-full text-xs"
                />
              </div>
              <div>
                <label className="samko-label">Total Rooms</label>
                <input
                  type="number"
                  value={editPropertyForm.rooms}
                  onChange={(e) => setEditPropertyForm({ ...editPropertyForm, rooms: Number(e.target.value) })}
                  className="samko-input w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="samko-label">Full Address</label>
              <input
                type="text"
                value={editPropertyForm.address}
                onChange={(e) => setEditPropertyForm({ ...editPropertyForm, address: e.target.value })}
                placeholder="e.g. 97 Kings Road, Brighton BN1 2FW"
                className="samko-input w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="samko-label">General Manager</label>
                <input
                  type="text"
                  value={editPropertyForm.manager}
                  onChange={(e) => setEditPropertyForm({ ...editPropertyForm, manager: e.target.value })}
                  placeholder="e.g. David Thornton"
                  className="samko-input w-full text-xs"
                />
              </div>
              <div>
                <label className="samko-label">Contact Phone</label>
                <input
                  type="text"
                  value={editPropertyForm.phone}
                  onChange={(e) => setEditPropertyForm({ ...editPropertyForm, phone: e.target.value })}
                  placeholder="+44 20 ..."
                  className="samko-input w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="samko-label">Operational Status</label>
                <CustomDropdown
                  value={editPropertyForm.status}
                  options={[
                    { value: 'active', label: 'Active', color: '#3dd68c' },
                    { value: 'inactive', label: 'Inactive', color: '#f59e0b' },
                  ]}
                  onChange={(val) => setEditPropertyForm({ ...editPropertyForm, status: val })}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="samko-label">Portal Assignment</label>
                <CustomDropdown
                  value={editPropertyForm.portal}
                  options={[
                    { value: 'both', label: 'PropCo & OpCo' },
                    { value: 'propco', label: 'PropCo Only' },
                    { value: 'opco', label: 'OpCo Only' },
                  ]}
                  onChange={(val) => setEditPropertyForm({ ...editPropertyForm, portal: val })}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowEditPropertyModal(false)}
                className="samko-btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingProperty}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                {isUpdatingProperty ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes to DB
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── EDIT RECORD MODAL (ANY OF 11 MODULES) ── */}
      {editingRecord && (
        <Modal
          open={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          title={`Edit ${currentModuleConfig.label} Record`}
          width={640}
        >
          <form onSubmit={handleSaveEditRecord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentModuleConfig.quickFormFields.map((f) => {
                let selectOptions: string[] = f.options || [];
                if (f.isCategory) {
                  selectOptions = activeModuleCategories;
                } else if (f.isDepartment) {
                  selectOptions = LIVE_DEPARTMENTS;
                } else if (f.isStatus) {
                  selectOptions = activeModuleStatuses;
                }

                if (f.type === 'file') {
                  return (
                    <div key={f.key} className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Attached Document File
                      </label>
                      <input
                        type="text"
                        value={editRecordData.fileName || editRecordData.name || ''}
                        onChange={(e) =>
                          setEditRecordData({ ...editRecordData, fileName: e.target.value })
                        }
                        className="samko-input w-full text-xs"
                      />
                    </div>
                  );
                }

                if (f.type === 'select') {
                  return (
                    <div key={f.key}>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        {f.label} {f.required && <span className="text-rose-400">*</span>}
                      </label>
                      <CustomDropdown
                        value={editRecordData[f.key] || selectOptions[0] || ''}
                        options={selectOptions.map((opt) => ({ value: opt, label: opt }))}
                        onChange={(val) => setEditRecordData({ ...editRecordData, [f.key]: val })}
                        className="w-full text-xs"
                      />
                    </div>
                  );
                }

                return (
                  <div key={f.key} className={f.key === 'title' || f.key === 'name' || f.key === 'description' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      {f.label} {f.required && <span className="text-rose-400">*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      required={f.required}
                      value={editRecordData[f.key] ?? ''}
                      onChange={(e) =>
                        setEditRecordData({
                          ...editRecordData,
                          [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                        })
                      }
                      placeholder={f.placeholder}
                      className="samko-input w-full text-xs"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="samko-btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingRecord}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              >
                {isUpdatingRecord ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes to DB
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── DELETE PROPERTY CONFIRMATION MODAL ── */}
      <ConfirmDeleteModal
        isOpen={Boolean(propertyToDelete)}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={handleDeletePropertyConfirm}
        isDeleting={isDeletingProperty}
        title="Confirm Property Deletion"
        itemName={propertyToDelete?.name || 'Selected Property'}
        registerName="Portfolio Properties"
        confirmButtonText="Permanently Delete Property"
        customWarning={`Are you sure you want to delete "${propertyToDelete?.name}"? All assigned assets, contracts, compliance items, and operational records will be unlinked, and the property will be completely removed from the live database and all application dropdowns.`}
      />

      {/* ── BULK / SINGLE DELETE CONFIRMATION MODAL ── */}
      <ConfirmDeleteModal
        isOpen={Boolean(bulkDeleteTarget)}
        onClose={() => setBulkDeleteTarget(null)}
        onConfirm={handleConfirmBulkDelete}
        isDeleting={isDeletingBulk}
        title="Confirm Permanent Deletion"
        itemName={bulkDeleteTarget?.label || 'Selected items'}
        registerName={currentModuleConfig.label}
        confirmButtonText={`Permanently Delete ${bulkDeleteTarget?.ids.length || 0} Record(s)`}
        customWarning={`Are you sure you want to delete ${bulkDeleteTarget?.label} from ${selectedProperty?.name}? This will permanently remove them from the database across the application.`}
      />
    </div>
  );
}
