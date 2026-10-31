'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight,
  Download, Eye, Loader2, ArrowLeft, RefreshCw, FileText, Check,
  Search, Database, Building2, Layers, ShieldCheck, FileSignature,
  Zap, FolderArchive, ListTodo, Wrench, Shield, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { HOTELS } from '@/lib/assetData';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAppCms } from '@/lib/appCmsConfig';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';

type Step = 1 | 2 | 3 | 4 | 5;

export interface DestinationConfig {
  id: string;
  name: string;
  shortLabel: string;
  categoryDesc: string;
  collection: string;
  isFixed?: boolean;
  viewHref: string;
  icon: React.ReactNode;
  systemFields: { key: string; label: string; required?: boolean }[];
  sampleData: Record<string, any>[];
  autoGuess: (header: string) => string | undefined;
  transform: (row: Record<string, any>, defaultProperty: string, idx: number) => Record<string, any>;
}

const DESTINATIONS: DestinationConfig[] = [
  {
    id: 'fixed-assets',
    name: 'Fixed Assets (Plant, Machinery & HVAC)',
    shortLabel: 'Fixed Assets',
    categoryDesc: 'Lifts, HVAC, Chillers, Boilers, Generators, Fire Systems & Building Infrastructure',
    collection: 'assets',
    isFixed: true,
    viewHref: '/asset-management/assets?type=fixed',
    icon: <Building2 size={16} className="text-amber-400" />,
    systemFields: [
      { key: 'name', label: 'Asset Name', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'hotelName', label: 'Property / Hotel' },
      { key: 'department', label: 'Department' },
      { key: 'location', label: 'Location / Room' },
      { key: 'floor', label: 'Floor' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'condition', label: 'Condition (excellent/good/fair/poor/critical)' },
      { key: 'riskLevel', label: 'Risk Level (low/medium/high/critical)' },
      { key: 'status', label: 'Status (active/under-maintenance/inactive)' },
      { key: 'assetId', label: 'Asset ID' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'purchaseCost', label: 'Purchase Cost (£)' },
      { key: 'purchaseDate', label: 'Purchase Date' },
      { key: 'nextInspection', label: 'Next Inspection Date' },
      { key: 'notes', label: 'Notes / Description' },
    ],
    sampleData: [
      {
        'Asset ID': 'AST-101',
        'Asset Name': 'Daikin VRV Air Conditioning Unit',
        'Category': 'HVAC',
        'Property': 'Crowne Plaza Kingston-south',
        'Department': 'Engineering',
        'Location': 'Plant Room 2',
        'Floor': 'Basement',
        'Quantity': 2,
        'Condition': 'good',
        'Risk Level': 'medium',
        'Status': 'active',
        'Serial Number': 'DK-99281-A',
        'Purchase Cost': 4500,
        'Next Inspection': '2026-12-15',
        'Notes': 'Quarterly filter check scheduled',
      },
      {
        'Asset ID': 'AST-102',
        'Asset Name': 'Chubb Commercial Fire Alarm Panel',
        'Category': 'Fire Safety',
        'Property': 'Stanhill Court',
        'Department': 'Engineering',
        'Location': 'Main Reception',
        'Floor': 'Ground Floor',
        'Quantity': 1,
        'Condition': 'excellent',
        'Risk Level': 'low',
        'Status': 'active',
        'Serial Number': 'CHB-2025-09',
        'Purchase Cost': 7800,
        'Next Inspection': '2026-11-01',
        'Notes': 'Annual statutory certification current',
      },
      {
        'Asset ID': 'AST-103',
        'Asset Name': 'Otis Passenger Lift 8-Person',
        'Category': 'Plant & Machinery',
        'Property': 'Ravens Ait Island',
        'Department': 'Engineering',
        'Location': 'Main Lobby',
        'Floor': 'All Floors',
        'Quantity': 1,
        'Condition': 'good',
        'Risk Level': 'high',
        'Status': 'active',
        'Serial Number': 'OTIS-8P-77',
        'Purchase Cost': 55000,
        'Next Inspection': '2026-09-30',
        'Notes': 'Statutory LOLER 6-monthly thorough exam',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('assetid') || c === 'id' || c === 'code') return 'assetId';
      if (c.includes('assetname') || c === 'name' || c === 'title' || c === 'equipment') return 'name';
      if (c.includes('category') || c === 'cat' || c === 'type') return 'category';
      if (c.includes('property') || c.includes('hotel') || c.includes('site')) return 'hotelName';
      if (c.includes('dept') || c.includes('department')) return 'department';
      if (c.includes('location') || c.includes('room') || c.includes('area')) return 'location';
      if (c.includes('floor') || c.includes('level')) return 'floor';
      if (c.includes('qty') || c.includes('quantity') || c.includes('count')) return 'quantity';
      if (c.includes('condition')) return 'condition';
      if (c.includes('risk')) return 'riskLevel';
      if (c.includes('status')) return 'status';
      if (c.includes('serial')) return 'serialNumber';
      if (c.includes('cost') || c.includes('price')) return 'purchaseCost';
      if (c.includes('purchasedate')) return 'purchaseDate';
      if (c.includes('inspection') || c.includes('nextdue')) return 'nextInspection';
      if (c.includes('note') || c.includes('desc')) return 'notes';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: row.assetId || `AST-FX-${Date.now().toString().slice(-4)}-${idx + 1}`,
      assetId: row.assetId || `AST-FX-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: row.name || `Fixed Asset ${idx + 1}`,
      category: row.category || 'Plant & Machinery',
      hotelName: row.hotelName || defaultProp || 'Crowne Plaza Kingston-south',
      department: row.department || 'Engineering',
      location: row.location || 'Plant Room',
      floor: row.floor || 'Ground Floor',
      quantity: Number(row.quantity) || 1,
      condition: (row.condition || 'good').toLowerCase(),
      riskLevel: (row.riskLevel || 'medium').toLowerCase(),
      status: (row.status || 'active').toLowerCase(),
      serialNumber: row.serialNumber || '',
      purchaseCost: Number(row.purchaseCost) || 0,
      purchaseDate: row.purchaseDate || new Date().toISOString().slice(0, 10),
      nextInspection: row.nextInspection || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      notes: row.notes || 'Bulk imported Fixed Asset',
      isFixed: true,
      assetType: 'fixed',
    }),
  },
  {
    id: 'non-fixed-assets',
    name: 'Non-Fixed Assets (FF&E, Furniture & Loose Items)',
    shortLabel: 'Non-Fixed Assets',
    categoryDesc: 'Beds, Chairs, Tables, Kitchenware, Appliances, TVs, Audio & Loose FF&E',
    collection: 'assets',
    isFixed: false,
    viewHref: '/asset-management/assets?type=non-fixed',
    icon: <Layers size={16} className="text-cyan-400" />,
    systemFields: [
      { key: 'name', label: 'Item Name / Description', required: true },
      { key: 'category', label: 'Category (Furniture/Linen/Electronics/Kitchen)', required: true },
      { key: 'hotelName', label: 'Property / Hotel' },
      { key: 'department', label: 'Department' },
      { key: 'location', label: 'Location / Room' },
      { key: 'floor', label: 'Floor' },
      { key: 'quantity', label: 'Quantity', required: true },
      { key: 'condition', label: 'Condition' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'status', label: 'Status' },
      { key: 'assetId', label: 'Item Code / Barcode' },
      { key: 'purchaseCost', label: 'Unit Replacement Cost (£)' },
      { key: 'notes', label: 'Notes' },
    ],
    sampleData: [
      {
        'Item Code': 'NFA-201',
        'Item Name': 'Hypnos King Bed Base & Mattress Set',
        'Category': 'Furniture & Joinery',
        'Property': 'River Club',
        'Department': 'Housekeeping',
        'Location': 'Guest Rooms 201-220',
        'Floor': '2nd Floor',
        'Quantity': 20,
        'Condition': 'excellent',
        'Risk Level': 'low',
        'Status': 'active',
        'Unit Cost': 800,
        'Notes': 'Brand new luxury bedding installed',
      },
      {
        'Item Code': 'NFA-202',
        'Item Name': 'Samsung 55-inch 4K Smart Hospitality TV',
        'Category': 'Electronics & AV',
        'Property': 'Crowne Plaza Kingston-south',
        'Department': 'IT & Guest Services',
        'Location': 'Executive Suites',
        'Floor': '3rd Floor',
        'Quantity': 15,
        'Condition': 'good',
        'Risk Level': 'low',
        'Status': 'active',
        'Unit Cost': 450,
        'Notes': 'Mounted with anti-tamper brackets',
      },
      {
        'Item Code': 'NFA-203',
        'Item Name': 'Rational Combi Oven Pro Countertop',
        'Category': 'Kitchen Equipment',
        'Property': 'Hampton 1 & 2',
        'Department': 'Food & Beverage',
        'Location': 'Main Kitchen',
        'Floor': 'Ground Floor',
        'Quantity': 2,
        'Condition': 'good',
        'Risk Level': 'medium',
        'Status': 'active',
        'Unit Cost': 5750,
        'Notes': 'Descaling service completed quarterly',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('itemcode') || c.includes('barcode') || c === 'id') return 'assetId';
      if (c.includes('itemname') || c.includes('description') || c === 'name') return 'name';
      if (c.includes('category') || c === 'type') return 'category';
      if (c.includes('property') || c.includes('hotel')) return 'hotelName';
      if (c.includes('dept') || c.includes('department')) return 'department';
      if (c.includes('location') || c.includes('room')) return 'location';
      if (c.includes('floor')) return 'floor';
      if (c.includes('qty') || c.includes('quantity') || c.includes('count')) return 'quantity';
      if (c.includes('condition')) return 'condition';
      if (c.includes('risk')) return 'riskLevel';
      if (c.includes('status')) return 'status';
      if (c.includes('cost') || c.includes('price')) return 'purchaseCost';
      if (c.includes('notes')) return 'notes';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: row.assetId || `AST-NF-${Date.now().toString().slice(-4)}-${idx + 1}`,
      assetId: row.assetId || `AST-NF-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: row.name || `Non-Fixed Item ${idx + 1}`,
      category: row.category || 'FF&E',
      hotelName: row.hotelName || defaultProp || 'Crowne Plaza Kingston-south',
      department: row.department || 'Housekeeping',
      location: row.location || 'Guest Rooms',
      floor: row.floor || '1st Floor',
      quantity: Number(row.quantity) || 1,
      condition: (row.condition || 'good').toLowerCase(),
      riskLevel: (row.riskLevel || 'low').toLowerCase(),
      status: (row.status || 'active').toLowerCase(),
      serialNumber: '',
      purchaseCost: Number(row.purchaseCost) || 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      nextInspection: '',
      notes: row.notes || 'Bulk imported Non-Fixed FF&E asset',
      isFixed: false,
      assetType: 'non-fixed',
    }),
  },
  {
    id: 'maintenance',
    name: 'Maintenance Records & PPM Schedules',
    shortLabel: 'Maintenance',
    categoryDesc: 'Planned Preventative Maintenance (PPM), Remedial Services & Callouts',
    collection: 'maintenance',
    viewHref: '/asset-management/maintenance',
    icon: <Wrench size={16} className="text-emerald-400" />,
    systemFields: [
      { key: 'title', label: 'Service Title / Task', required: true },
      { key: 'assetName', label: 'Asset / Equipment', required: true },
      { key: 'property', label: 'Property / Hotel' },
      { key: 'category', label: 'Category' },
      { key: 'frequency', label: 'Frequency (Monthly/Quarterly/Annual)' },
      { key: 'priority', label: 'Priority (low/medium/high/critical)' },
      { key: 'status', label: 'Status (scheduled/due-today/overdue/completed)' },
      { key: 'contractor', label: 'Contractor / Technician' },
      { key: 'cost', label: 'Estimated Cost (£)' },
      { key: 'nextDue', label: 'Next Due Date' },
      { key: 'lastCompleted', label: 'Last Completed Date' },
      { key: 'description', label: 'Scope of Work / Notes' },
    ],
    sampleData: [
      {
        'Service Title': 'VRV Air Conditioning Quarterly Service',
        'Asset / Equipment': 'Daikin VRV System A',
        'Property': 'Crowne Plaza Kingston-south',
        'Category': 'HVAC',
        'Frequency': 'Quarterly',
        'Priority': 'medium',
        'Status': 'scheduled',
        'Contractor': 'CoolTech Solutions Ltd',
        'Cost': 650,
        'Next Due Date': '2026-11-15',
        'Last Completed Date': '2026-08-10',
        'Scope of Work': 'Clean coils, replace filters, check refrigerant levels',
      },
      {
        'Service Title': 'Fire Damper Inspection & Drop Test',
        'Asset / Equipment': 'Ductwork Fire Dampers (32 Units)',
        'Property': 'Stanhill Court',
        'Category': 'Fire Safety',
        'Frequency': 'Annual',
        'Priority': 'critical',
        'Status': 'scheduled',
        'Contractor': 'SafeAir Engineering',
        'Cost': 1400,
        'Next Due Date': '2026-12-01',
        'Last Completed Date': '2025-12-05',
        'Scope of Work': 'Statutory BS 9999 annual mechanical drop test & lubricate seals',
      },
      {
        'Service Title': 'Commercial Kitchen Grease Trap Emptying',
        'Asset / Equipment': 'Under-Sink Grease Interceptor',
        'Property': 'River Club',
        'Category': 'Plumbing & Drainage',
        'Frequency': 'Monthly',
        'Priority': 'high',
        'Status': 'scheduled',
        'Contractor': 'ClearDrain UK',
        'Cost': 320,
        'Next Due Date': '2026-10-30',
        'Last Completed Date': '2026-09-28',
        'Scope of Work': 'Pump out, steam sanitize and replenish biological enzyme dosing',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('servicetitle') || c.includes('task') || c === 'title') return 'title';
      if (c.includes('asset') || c.includes('equipment')) return 'assetName';
      if (c.includes('property') || c.includes('hotel')) return 'property';
      if (c.includes('cat') || c.includes('category')) return 'category';
      if (c.includes('freq')) return 'frequency';
      if (c.includes('priority')) return 'priority';
      if (c.includes('status')) return 'status';
      if (c.includes('contractor') || c.includes('tech') || c.includes('vendor')) return 'contractor';
      if (c.includes('cost') || c.includes('price')) return 'cost';
      if (c.includes('nextdue') || c.includes('duedate')) return 'nextDue';
      if (c.includes('lastcomp') || c.includes('completed')) return 'lastCompleted';
      if (c.includes('scope') || c.includes('desc') || c.includes('note')) return 'description';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `mnt-${Date.now().toString().slice(-5)}-${idx + 1}`,
      title: row.title || `Maintenance Task ${idx + 1}`,
      assetName: row.assetName || 'General Equipment',
      hotel: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      property: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      category: row.category || 'Mechanical',
      frequency: row.frequency || 'Monthly',
      priority: (row.priority || 'medium').toLowerCase(),
      status: (row.status || 'scheduled').toLowerCase(),
      contractor: row.contractor || 'Internal Engineering',
      cost: Number(row.cost) || 0,
      nextDue: row.nextDue || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      lastCompleted: row.lastCompleted || new Date().toISOString().slice(0, 10),
      description: row.description || 'Imported maintenance schedule',
    }),
  },
  {
    id: 'compliance',
    name: 'Compliance & Statutory Register',
    shortLabel: 'Compliance',
    categoryDesc: 'Fire Risk Assessments, Legionella, EICR Electrical, LOLER Lifts, Gas Safety',
    collection: 'compliance',
    viewHref: '/compliance-register',
    icon: <ShieldCheck size={16} className="text-blue-400" />,
    systemFields: [
      { key: 'name', label: 'Compliance Check / Regulation Title', required: true },
      { key: 'category', label: 'Category (Fire, Legionella, Electrical, Lifts)', required: true },
      { key: 'property', label: 'Property / Hotel' },
      { key: 'type', label: 'Check Type (Statutory / Operational)' },
      { key: 'regulatoryAuthority', label: 'Regulatory Standard / Code' },
      { key: 'certificateNumber', label: 'Certificate / Report Ref' },
      { key: 'responsiblePerson', label: 'Responsible Person' },
      { key: 'contractor', label: 'Inspecting Contractor / Body' },
      { key: 'inspectionFrequency', label: 'Frequency' },
      { key: 'lastInspection', label: 'Last Inspection Date' },
      { key: 'expiryDate', label: 'Expiry / Next Due Date' },
      { key: 'status', label: 'Status (compliant/expiring-soon/overdue)' },
      { key: 'riskRating', label: 'Risk Rating (low/medium/high/critical)' },
    ],
    sampleData: [
      {
        'Regulation Title': 'Fire Risk Assessment (FRA)',
        'Category': 'Fire Safety',
        'Property': 'Crowne Plaza Kingston-south',
        'Check Type': 'Statutory',
        'Standard': 'Regulatory Reform (Fire Safety) Order 2005',
        'Certificate Ref': 'FRA-2026-CPS',
        'Responsible Person': 'Marcus Webb',
        'Contractor': 'FireGuard Systems UK',
        'Frequency': 'Yearly',
        'Last Inspection': '2025-05-10',
        'Expiry Date': '2026-05-10',
        'Status': 'compliant',
        'Risk Rating': 'high',
      },
      {
        'Regulation Title': 'Commercial Gas Safety Inspection (CP12)',
        'Category': 'Gas Safety',
        'Property': 'Stanhill Court',
        'Check Type': 'Statutory',
        'Standard': 'Gas Safety (Installation and Use) Regulations 1998',
        'Certificate Ref': 'GAS-2026-STH',
        'Responsible Person': 'Sarah Chen',
        'Contractor': 'GasSafe Pro Heating',
        'Frequency': 'Yearly',
        'Last Inspection': '2025-09-18',
        'Expiry Date': '2026-09-18',
        'Status': 'compliant',
        'Risk Rating': 'critical',
      },
      {
        'Regulation Title': 'Legionella Bacteria Water Risk Assessment',
        'Category': 'Water Hygiene',
        'Property': 'Hampton 1 & 2',
        'Check Type': 'Statutory',
        'Standard': 'HSE ACOP L8 / HSG274',
        'Certificate Ref': 'LEG-2025-HMP',
        'Responsible Person': 'James Okafor',
        'Contractor': 'AquaSafe Environmental Ltd',
        'Frequency': '2-Yearly',
        'Last Inspection': '2025-02-14',
        'Expiry Date': '2027-02-14',
        'Status': 'compliant',
        'Risk Rating': 'high',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('title') || c.includes('check') || c === 'name') return 'name';
      if (c.includes('cat') || c.includes('regulation')) return 'category';
      if (c.includes('prop') || c.includes('hotel')) return 'property';
      if (c.includes('type')) return 'type';
      if (c.includes('standard') || c.includes('auth')) return 'regulatoryAuthority';
      if (c.includes('cert') || c.includes('ref')) return 'certificateNumber';
      if (c.includes('person') || c.includes('officer')) return 'responsiblePerson';
      if (c.includes('contractor') || c.includes('body')) return 'contractor';
      if (c.includes('freq')) return 'inspectionFrequency';
      if (c.includes('last')) return 'lastInspection';
      if (c.includes('expir') || c.includes('due')) return 'expiryDate';
      if (c.includes('status')) return 'status';
      if (c.includes('risk')) return 'riskRating';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `comp-${Date.now().toString().slice(-5)}-${idx + 1}`,
      complianceId: `COMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: row.name || `Compliance Inspection ${idx + 1}`,
      category: row.category || 'Statutory Compliance',
      hotel: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      property: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      type: row.type || 'Statutory',
      regulatoryAuthority: row.regulatoryAuthority || 'UK Statutory Standard',
      certificateNumber: row.certificateNumber || `CERT-${idx + 100}`,
      responsiblePerson: row.responsiblePerson || 'Operations Manager',
      contractor: row.contractor || 'Accredited Inspector',
      inspectionFrequency: row.inspectionFrequency || 'Yearly',
      issueDate: row.lastInspection || new Date().toISOString().slice(0, 10),
      lastInspection: row.lastInspection || new Date().toISOString().slice(0, 10),
      expiryDate: row.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      renewalDate: row.expiryDate || new Date(Date.now() + 335 * 86400000).toISOString().slice(0, 10),
      status: (row.status || 'compliant').toLowerCase(),
      riskRating: (row.riskRating || 'medium').toLowerCase(),
    }),
  },
  {
    id: 'insurance',
    name: 'Insurance Policies Register',
    shortLabel: 'Insurance',
    categoryDesc: 'Property Damage, Public & Employers Liability, Business Interruption, Cyber',
    collection: 'insurance',
    viewHref: '/insurance-register',
    icon: <Shield size={16} className="text-purple-400" />,
    systemFields: [
      { key: 'policyName', label: 'Policy Name / Title', required: true },
      { key: 'policyNumber', label: 'Policy Number', required: true },
      { key: 'insurer', label: 'Insurer / Underwriter', required: true },
      { key: 'property', label: 'Insured Property / Scope' },
      { key: 'policyType', label: 'Policy Type (Property/Liability/Cyber/Fleet)' },
      { key: 'coverageAmount', label: 'Coverage Limit (£)' },
      { key: 'premium', label: 'Annual Premium (£)' },
      { key: 'renewalDate', label: 'Renewal Date' },
      { key: 'startDate', label: 'Effective Date' },
      { key: 'broker', label: 'Broker Contact' },
      { key: 'status', label: 'Status (active/review/renewing/expired)' },
    ],
    sampleData: [
      {
        'Policy Name': 'Property Damage & Business Interruption',
        'Policy Number': 'AV-PROP-2026-99',
        'Insurer': 'Aviva Commercial',
        'Property': 'Crowne Plaza Kingston-south',
        'Policy Type': 'Property & Assets',
        'Coverage Limit (£)': 25000000,
        'Annual Premium (£)': 48500,
        'Renewal Date': '2027-01-31',
        'Effective Date': '2026-02-01',
        'Broker': 'Marsh McLennan Commercial',
        'Status': 'active',
      },
      {
        'Policy Name': 'Public & Products Liability (£10M)',
        'Policy Number': 'AXA-PL-88301',
        'Insurer': 'AXA Insurance UK',
        'Property': 'All Properties',
        'Policy Type': 'Public Liability',
        'Coverage Limit (£)': 10000000,
        'Annual Premium (£)': 14200,
        'Renewal Date': '2026-11-30',
        'Effective Date': '2025-12-01',
        'Broker': 'Howden Insurance Brokers',
        'Status': 'active',
      },
      {
        'Policy Name': 'Employers Liability Statutory (£20M)',
        'Policy Number': 'ZUR-EL-44021',
        'Insurer': 'Zurich Insurance',
        'Property': 'All Properties',
        'Policy Type': 'Employers Liability',
        'Coverage Limit (£)': 20000000,
        'Annual Premium (£)': 22800,
        'Renewal Date': '2026-12-15',
        'Effective Date': '2025-12-16',
        'Broker': 'Aon UK Limited',
        'Status': 'active',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('policyname') || c.includes('title') || c === 'name') return 'policyName';
      if (c.includes('policynumber') || c.includes('policyno') || c.includes('number')) return 'policyNumber';
      if (c.includes('insurer') || c.includes('underwriter')) return 'insurer';
      if (c.includes('prop') || c.includes('hotel') || c.includes('scope')) return 'property';
      if (c.includes('type')) return 'policyType';
      if (c.includes('cover') || c.includes('limit')) return 'coverageAmount';
      if (c.includes('premium') || c.includes('cost')) return 'premium';
      if (c.includes('renewal')) return 'renewalDate';
      if (c.includes('start') || c.includes('effective')) return 'startDate';
      if (c.includes('broker')) return 'broker';
      if (c.includes('status')) return 'status';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `ins-${Date.now().toString().slice(-5)}-${idx + 1}`,
      policyName: row.policyName || `Insurance Policy ${idx + 1}`,
      policyNumber: row.policyNumber || `POL-${Date.now().toString().slice(-4)}-${idx + 1}`,
      insurer: row.insurer || 'Commercial Underwriters UK',
      property: row.property || defaultProp || 'All Properties',
      hotel: row.property || defaultProp || 'All Properties',
      policyType: row.policyType || 'Comprehensive Commercial',
      coverageAmount: Number(row.coverageAmount) || 5000000,
      coverageLimit: Number(row.coverageAmount) || 5000000,
      annualPremium: Number(row.premium) || 12000,
      premium: Number(row.premium) || 12000,
      renewalDate: row.renewalDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      expiryDate: row.renewalDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      startDate: row.startDate || new Date().toISOString().slice(0, 10),
      broker: row.broker || 'Commercial Insurance Broker',
      status: (row.status || 'active').toLowerCase(),
    }),
  },
  {
    id: 'contracts',
    name: 'Contracts & Supplier Agreements',
    shortLabel: 'Contracts',
    categoryDesc: 'Lifts, Waste, Laundry, Security, Maintenance SLAs & Supplier Terms',
    collection: 'contracts',
    viewHref: '/contracts-register',
    icon: <FileSignature size={16} className="text-teal-400" />,
    systemFields: [
      { key: 'title', label: 'Contract Name', required: true },
      { key: 'contractor', label: 'Vendor / Contractor Name', required: true },
      { key: 'property', label: 'Property / Scope' },
      { key: 'category', label: 'Service Category' },
      { key: 'annualValue', label: 'Annual Value (£)' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'expiryDate', label: 'End / Expiry Date' },
      { key: 'noticePeriodDays', label: 'Notice Period (Days)' },
      { key: 'noticeDate', label: 'Break / Notice Date' },
      { key: 'sla', label: 'SLA / Key Terms' },
      { key: 'status', label: 'Status (active/under-review/expiring-soon/terminated)' },
    ],
    sampleData: [
      {
        'Contract Name': 'Otis Lifts Full Comprehensive Maintenance Agreement',
        'Vendor': 'Otis Elevators UK Ltd',
        'Property': 'Crowne Plaza Kingston-south',
        'Category': 'Vertical Transport',
        'Annual Value (£)': 18500,
        'Start Date': '2024-04-01',
        'Expiry Date': '2027-03-31',
        'Notice Period (Days)': 90,
        'Notice Date': '2026-12-31',
        'SLA': '2-hour response for entrapments, 4-hour for breakdowns',
        'Status': 'active',
      },
      {
        'Contract Name': 'Commercial Linen & Laundry Rental Agreement',
        'Vendor': 'Elis UK Textile Solutions',
        'Property': 'All Properties',
        'Category': 'Housekeeping & Linen',
        'Annual Value (£)': 62000,
        'Start Date': '2025-01-01',
        'Expiry Date': '2028-01-01',
        'Notice Period (Days)': 60,
        'Notice Date': '2027-11-01',
        'SLA': '3 deliveries/week per hotel, zero tolerance stain replacement',
        'Status': 'active',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('contract') || c.includes('title') || c === 'name') return 'title';
      if (c.includes('vendor') || c.includes('supplier') || c.includes('contractor')) return 'contractor';
      if (c.includes('prop') || c.includes('hotel')) return 'property';
      if (c.includes('cat') || c.includes('service')) return 'category';
      if (c.includes('value') || c.includes('cost') || c.includes('spend')) return 'annualValue';
      if (c.includes('start')) return 'startDate';
      if (c.includes('expir') || c.includes('end')) return 'expiryDate';
      if (c.includes('noticeperiod') || c.includes('days')) return 'noticePeriodDays';
      if (c.includes('noticedate') || c.includes('break')) return 'noticeDate';
      if (c.includes('sla') || c.includes('term')) return 'sla';
      if (c.includes('status')) return 'status';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `ctr-${Date.now().toString().slice(-5)}-${idx + 1}`,
      title: row.title || `Vendor Contract ${idx + 1}`,
      contractor: row.contractor || 'Commercial Supplier',
      hotel: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      property: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      category: row.category || 'Operations & Facilities',
      annualValue: Number(row.annualValue) || 10000,
      startDate: row.startDate || new Date().toISOString().slice(0, 10),
      expiryDate: row.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      noticePeriodDays: Number(row.noticePeriodDays) || 90,
      noticeDate: row.noticeDate || new Date(Date.now() + 275 * 86400000).toISOString().slice(0, 10),
      sla: row.sla || 'Standard supplier SLA terms',
      status: (row.status || 'active').toLowerCase(),
    }),
  },
  {
    id: 'utilities',
    name: 'Utilities & Energy Accounts',
    shortLabel: 'Utilities',
    categoryDesc: 'Electricity, Natural Gas, Commercial Water, Biomass & Meter Registers',
    collection: 'utilities',
    viewHref: '/utilities-register',
    icon: <Zap size={16} className="text-yellow-400" />,
    systemFields: [
      { key: 'name', label: 'Utility Account Name', required: true },
      { key: 'type', label: 'Utility Type (Electricity, Gas, Water)', required: true },
      { key: 'supplier', label: 'Supplier / Provider' },
      { key: 'accountNumber', label: 'Account / Contract Ref' },
      { key: 'meterNumber', label: 'Meter Serial Number / MPAN' },
      { key: 'property', label: 'Property / Site' },
      { key: 'tariffType', label: 'Tariff Type' },
      { key: 'contractEndDate', label: 'Contract End Date' },
      { key: 'annualSpend', label: 'Estimated Annual Spend (£)' },
      { key: 'status', label: 'Status (active/review/terminated)' },
    ],
    sampleData: [
      {
        'Utility Name': 'Main Fiscal Half-Hourly Electricity',
        'Utility Type': 'Electricity',
        'Supplier': 'British Gas Business',
        'Account Number': 'BGB-8840192',
        'Meter / MPAN': '1012938475820',
        'Property': 'Crowne Plaza Kingston-south',
        'Tariff Type': 'Half-Hourly Fixed 2-Year',
        'Contract End Date': '2027-09-30',
        'Annual Spend (£)': 82500,
        'Status': 'active',
      },
      {
        'Utility Name': 'Commercial Low-Pressure Gas Supply',
        'Utility Type': 'Gas',
        'Supplier': 'TotalEnergies Gas & Power',
        'Account Number': 'TE-GAS-99120',
        'Meter / MPRN': '77291830',
        'Property': 'Stanhill Court',
        'Tariff Type': 'Fixed Commercial Gas',
        'Contract End Date': '2026-10-31',
        'Annual Spend (£)': 44000,
        'Status': 'active',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('name') || c.includes('utility')) return 'name';
      if (c.includes('type') || c === 'commodity') return 'type';
      if (c.includes('supplier') || c.includes('provider')) return 'supplier';
      if (c.includes('account') || c.includes('contractref')) return 'accountNumber';
      if (c.includes('meter') || c.includes('mpan') || c.includes('mprn')) return 'meterNumber';
      if (c.includes('property') || c.includes('site') || c.includes('hotel')) return 'property';
      if (c.includes('tariff')) return 'tariffType';
      if (c.includes('enddate') || c.includes('expiry')) return 'contractEndDate';
      if (c.includes('spend') || c.includes('cost')) return 'annualSpend';
      if (c.includes('status')) return 'status';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `utl-${Date.now().toString().slice(-5)}-${idx + 1}`,
      name: row.name || `Utility Account ${idx + 1}`,
      type: row.type || 'Electricity',
      supplier: row.supplier || 'Commercial Energy Supplier',
      accountNumber: row.accountNumber || `ACC-${idx + 100}`,
      meterNumber: row.meterNumber || `MTR-${idx + 500}`,
      hotel: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      property: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      tariffType: row.tariffType || 'Commercial Fixed',
      contractEndDate: row.contractEndDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      annualSpend: Number(row.annualSpend) || 25000,
      status: (row.status || 'active').toLowerCase(),
    }),
  },
  {
    id: 'documents',
    name: 'Document Vault & Compliance Files',
    shortLabel: 'Document Vault',
    categoryDesc: 'O&M Manuals, Statutory Certificates, Architectural Drawings, Permits',
    collection: 'documents',
    viewHref: '/document-repository',
    icon: <FolderArchive size={16} className="text-orange-400" />,
    systemFields: [
      { key: 'name', label: 'Document Title', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'property', label: 'Property / Site' },
      { key: 'documentType', label: 'Type (Certificate, Manual, Report, Permit)' },
      { key: 'fileRef', label: 'File Reference / File Name' },
      { key: 'expiryDate', label: 'Expiry Date' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'uploadedBy', label: 'Uploaded By' },
      { key: 'status', label: 'Status (active/expired/archived)' },
    ],
    sampleData: [
      {
        'Document Title': 'Stanhill Court Asbestos Management Survey & Register',
        'Category': 'Health & Safety',
        'Property': 'Stanhill Court',
        'Document Type': 'Survey Report',
        'File Reference': 'SC-Asbestos-Reg-2025.pdf',
        'Expiry Date': '2027-04-15',
        'Issue Date': '2025-04-15',
        'Uploaded By': 'Alexander Vance',
        'Status': 'active',
      },
      {
        'Document Title': 'Commercial Kitchen Extraction Cleaning Certificate TR19',
        'Category': 'Fire Safety',
        'Property': 'Crowne Plaza Kingston-south',
        'Document Type': 'Statutory Certificate',
        'File Reference': 'CPKS-TR19-DuctClean-2026.pdf',
        'Expiry Date': '2026-11-20',
        'Issue Date': '2025-11-20',
        'Uploaded By': 'Marcus Webb',
        'Status': 'active',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('title') || c.includes('doc') || c === 'name') return 'name';
      if (c.includes('cat') || c.includes('discipline')) return 'category';
      if (c.includes('property') || c.includes('site') || c.includes('hotel')) return 'property';
      if (c.includes('type')) return 'documentType';
      if (c.includes('file') || c.includes('ref')) return 'fileRef';
      if (c.includes('expir') || c.includes('validuntil')) return 'expiryDate';
      if (c.includes('issue') || c.includes('date')) return 'issueDate';
      if (c.includes('upload') || c.includes('author')) return 'uploadedBy';
      if (c.includes('status')) return 'status';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `doc-${Date.now().toString().slice(-5)}-${idx + 1}`,
      name: row.name || `Document ${idx + 1}`,
      category: row.category || 'Operations',
      hotel: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      property: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      documentType: row.documentType || 'PDF Document',
      fileRef: row.fileRef || `file-${Date.now().toString().slice(-4)}.pdf`,
      fileUrl: '#',
      expiryDate: row.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      issueDate: row.issueDate || new Date().toISOString().slice(0, 10),
      uploadedBy: row.uploadedBy || 'Admin',
      status: (row.status || 'active').toLowerCase(),
    }),
  },
  {
    id: 'tasks',
    name: 'Tasks & Action List',
    shortLabel: 'Tasks',
    categoryDesc: 'Action items, urgent remedial tasks, audit follow-ups and tickets',
    collection: 'tasks',
    viewHref: '/tasks',
    icon: <ListTodo size={16} className="text-pink-400" />,
    systemFields: [
      { key: 'title', label: 'Task Title', required: true },
      { key: 'property', label: 'Property / Hotel' },
      { key: 'priority', label: 'Priority (Urgent, High, Medium, Low)' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'assignedTo', label: 'Assignee Name' },
      { key: 'category', label: 'Category / Department' },
      { key: 'status', label: 'Status (open, in-progress, completed)' },
      { key: 'description', label: 'Task Details / Description' },
    ],
    sampleData: [
      {
        'Task Title': 'Replace broken self-closer on 2nd Floor Fire Door 12',
        'Property': 'Crowne Plaza Kingston-south',
        'Priority': 'Urgent',
        'Due Date': '2026-10-28',
        'Assigned To': 'Marcus Webb',
        'Category': 'Fire Safety',
        'Status': 'open',
        'Description': 'Identified during weekly fire door audit. Door currently fails to latch fully.',
      },
      {
        'Task Title': 'Service water softener brine tank and test hardness',
        'Property': 'Stanhill Court',
        'Priority': 'Medium',
        'Due Date': '2026-11-05',
        'Assigned To': 'Sarah Chen',
        'Category': 'Plumbing',
        'Status': 'open',
        'Description': 'Check salt levels and regenerate resin bed.',
      },
    ],
    autoGuess: (h) => {
      const c = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (c.includes('task') || c.includes('title') || c === 'name') return 'title';
      if (c.includes('property') || c.includes('hotel') || c.includes('site')) return 'property';
      if (c.includes('priority')) return 'priority';
      if (c.includes('duedate') || c.includes('due')) return 'dueDate';
      if (c.includes('assign') || c.includes('owner')) return 'assignedTo';
      if (c.includes('cat') || c.includes('dept')) return 'category';
      if (c.includes('status')) return 'status';
      if (c.includes('desc') || c.includes('detail')) return 'description';
      return undefined;
    },
    transform: (row, defaultProp, idx) => ({
      id: `task-${Date.now().toString().slice(-5)}-${idx + 1}`,
      title: row.title || `Action Task ${idx + 1}`,
      site: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      property: row.property || defaultProp || 'Crowne Plaza Kingston-south',
      priority: row.priority || 'Medium',
      dueDate: row.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      assignedTo: row.assignedTo || 'Unassigned',
      category: row.category || 'General Operations',
      status: (row.status || 'open').toLowerCase(),
      description: row.description || 'Imported action task',
    }),
  },
];

const STEPS = [
  { id: 1, label: 'Upload Excel' },
  { id: 2, label: 'Preview File & Sheets' },
  { id: 3, label: 'Map Columns' },
  { id: 4, label: 'Validate' },
  { id: 5, label: 'Import to Database' },
];

export default function ImportClient() {
  const cms = useDeepPageCms('import');
  const { importExport: cmsImportExport } = useAppCms();
  const [step, setStep] = useState<Step>(1);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('fixed-assets');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [properties, setProperties] = useState<{ id: string; name: string }[]>(
    HOTELS.map((h) => ({ id: h.id, name: h.name }))
  );

  // File & Multi-Sheet State
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [sheetsMap, setSheetsMap] = useState<Record<string, any[]>>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [previewSearch, setPreviewSearch] = useState('');

  // Active sheet rows & headers
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Loading & Execution State
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ total: number; destination: string; collection: string } | null>(null);

  const activeDestination = useMemo(() => {
    return DESTINATIONS.find((d) => d.id === selectedDestinationId) || DESTINATIONS[0];
  }, [selectedDestinationId]);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await api.properties.getAll();
        if (res.success && res.data && res.data.length > 0) {
          setProperties(res.data.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (err) {
        console.warn('Fallback properties for import:', err);
      }
    }
    loadProperties();
  }, []);

  // When active destination or file headers change, auto-guess mapping
  const runAutoGuess = (headers: string[], dest: DestinationConfig) => {
    const newMap: Record<string, string> = {};
    headers.forEach((h) => {
      const guessedKey = dest.autoGuess(h);
      if (guessedKey) {
        newMap[h] = guessedKey;
      }
    });
    setMapping(newMap);
  };

  const switchSheet = (sheetName: string, mapToUse = sheetsMap) => {
    setSelectedSheetName(sheetName);
    const rows = mapToUse[sheetName] || [];
    setRawRows(rows);
    if (rows.length > 0) {
      const headers = Object.keys(rows[0] || {});
      setFileHeaders(headers);
      runAutoGuess(headers, activeDestination);
    } else {
      setFileHeaders([]);
      setMapping({});
    }
  };

  const processUploadedFile = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          toast.error('The uploaded file does not contain any sheets.');
          return;
        }

        const parsedSheets: Record<string, any[]> = {};
        const validSheetNames: string[] = [];

        workbook.SheetNames.forEach((name) => {
          const worksheet = workbook.Sheets[name];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
          if (jsonData.length > 0) {
            parsedSheets[name] = jsonData;
            validSheetNames.push(name);
          }
        });

        if (!validSheetNames.length) {
          toast.error('All sheets in the uploaded file are empty.');
          return;
        }

        setSheetsMap(parsedSheets);
        setSheetNames(validSheetNames);

        // Intelligently check if any sheet name matches the destination
        let bestSheet = validSheetNames[0];
        const destKeywords = activeDestination.id.split('-');
        const foundMatch = validSheetNames.find((s) =>
          destKeywords.some((k) => s.toLowerCase().includes(k))
        );
        if (foundMatch) bestSheet = foundMatch;

        switchSheet(bestSheet, parsedSheets);
        setStep(2);
        toast.success('Excel File Uploaded Successfully', {
          description: `Parsed ${validSheetNames.length} sheet(s) from "${file.name}" · Sheet "${bestSheet}" loaded (${parsedSheets[bestSheet]?.length || 0} rows)`,
        });
      } catch (err: any) {
        toast.error('Failed to parse Excel file', { description: err.message });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processUploadedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Download template tailored to currently selected destination
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(activeDestination.sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeDestination.shortLabel);
    const cleanFileName = `SamkoCentral_${activeDestination.id.replace(/-/g, '_')}_Template.xlsx`;
    XLSX.writeFile(wb, cleanFileName);
    toast.success(`Downloaded ${activeDestination.shortLabel} template`, {
      description: 'Fill in your data and upload directly to this module.',
    });
  };

  // Export current parsed sheet preview
  const handleExportPreviewSheet = () => {
    if (!rawRows.length) {
      toast.error('No rows to export');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rawRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedSheetName || 'Preview');
    XLSX.writeFile(wb, `Preview_${selectedSheetName || 'Sheet'}.xlsx`);
    toast.success(`Exported preview of sheet "${selectedSheetName}" to Excel`);
  };

  // Export live database data for the active module
  const handleExportModuleData = async () => {
    try {
      setExporting(true);
      let items: any[] = [];

      switch (activeDestination.id) {
        case 'fixed-assets': {
          const res = await api.assets.getAll({ type: 'fixed' });
          items = (res.data || []).filter((a: any) => a.isFixed !== false);
          break;
        }
        case 'non-fixed-assets': {
          const res = await api.assets.getAll({ type: 'non-fixed' });
          items = (res.data || []).filter((a: any) => a.isFixed === false);
          break;
        }
        case 'maintenance': {
          const res = await api.maintenance.getAll();
          items = res.data || [];
          break;
        }
        case 'compliance': {
          const res = await api.compliance.getAll();
          items = res.data || [];
          break;
        }
        case 'insurance': {
          const res = await api.insurance.getAll();
          items = res.data || [];
          break;
        }
        case 'contracts': {
          const res = await api.contracts.getAll();
          items = res.data || [];
          break;
        }
        case 'utilities': {
          const res = await api.utilities.getAll();
          items = res.data || [];
          break;
        }
        case 'documents': {
          const res = await api.documents.getAll();
          items = res.data || [];
          break;
        }
        case 'tasks': {
          const res = await api.tasks.getAll();
          items = res.data || [];
          break;
        }
        default: {
          const res = await api.assets.getAll();
          items = res.data || [];
          break;
        }
      }

      if (!items.length) {
        toast.info(`No existing records found for ${activeDestination.shortLabel} to export.`, {
          description: 'Upload an Excel sheet first or download the sample template.',
        });
        return;
      }

      const ws = XLSX.utils.json_to_sheet(items);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeDestination.shortLabel);
      const filename = `SamkoCentral_${activeDestination.id.replace(/-/g, '_')}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Exported ${items.length} records for ${activeDestination.shortLabel} to Excel!`);
    } catch (err: any) {
      toast.error('Export failed', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  // Build transformed records ready to import
  const getMappedRecords = () => {
    return rawRows.map((row, idx) => {
      const rowObj: Record<string, any> = {};
      Object.entries(mapping).forEach(([fileCol, sysKey]) => {
        if (sysKey && row[fileCol] !== undefined) {
          rowObj[sysKey] = row[fileCol];
        }
      });
      return activeDestination.transform(rowObj, selectedProperty, idx);
    });
  };

  // Execute import to database
  const handleExecuteImport = async () => {
    try {
      setImporting(true);
      const recordsToSave = getMappedRecords();

      if (!recordsToSave.length) {
        toast.error('No valid records to import');
        return;
      }

      // Universal bulk import using our bulk-import route
      const res = await api.bulkImport(activeDestination.collection, recordsToSave);

      if (res.success) {
        setImportResult({
          total: res.count || recordsToSave.length,
          destination: activeDestination.name,
          collection: activeDestination.collection,
        });
        setStep(5);

        // Broadcast data update to live application views
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('samko:data-changed', {
              detail: { type: activeDestination.collection, count: recordsToSave.length },
            })
          );
        }

        toast.success(`Successfully imported ${res.count} records into ${activeDestination.shortLabel}!`, {
          description: `All records are permanently stored in Firestore & database.`,
        });
      } else {
        toast.error('Import failed', { description: res.message || 'Database error occurred' });
      }
    } catch (err: any) {
      toast.error('Import error', { description: err.message });
    } finally {
      setImporting(false);
    }
  };

  // Filter preview rows based on search input
  const filteredPreviewRows = useMemo(() => {
    if (!previewSearch.trim()) return rawRows;
    const q = previewSearch.toLowerCase();
    return rawRows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rawRows, previewSearch]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Header Bar */}
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 border-b border-border gap-4 flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-head text-xl font-bold">{cms.title || cmsImportExport?.moduleTitle || 'Universal Data Import & Export Hub'}</h1>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5"
              style={{
                background: 'rgba(232,201,122,0.12)',
                borderColor: 'rgba(232,201,122,0.3)',
                color: 'var(--primary)',
              }}
            >
              {activeDestination.icon}
              {activeDestination.shortLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cms.subtitle || 'Upload, preview, map and export multi-sheet Excel files (.xlsx, .csv) for any module'}
          </p>
        </div>

        {/* Top Dropdowns & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PageCMSEditButton pageId="import" pageName="Bulk Data Import & Migration Hub" />

          {/* Target Place / Module Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border" style={{ background: 'var(--surface2)' }}>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Destination Place:
            </span>
            <select
              value={selectedDestinationId}
              onChange={(e) => {
                const newDestId = e.target.value;
                setSelectedDestinationId(newDestId);
                const newDest = DESTINATIONS.find((d) => d.id === newDestId) || DESTINATIONS[0];
                if (fileHeaders.length > 0) {
                  runAutoGuess(fileHeaders, newDest);
                }
              }}
              className="text-xs font-semibold bg-transparent border-0 outline-none cursor-pointer pr-2"
              style={{ color: 'var(--primary)' }}
            >
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id} style={{ background: 'var(--surface)', color: 'var(--foreground)' }}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Property Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border" style={{ background: 'var(--surface2)' }}>
            <span className="text-xs text-muted-foreground font-medium">Property:</span>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 outline-none cursor-pointer pr-2"
              style={{ color: 'var(--foreground)' }}
            >
              <option value="" style={{ background: 'var(--surface)', color: 'var(--foreground)' }}>
                All Properties / Auto from Sheet
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.name} style={{ background: 'var(--surface)', color: 'var(--foreground)' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Download Template for selected place */}
          <button
            onClick={handleDownloadTemplate}
            title={`Download ${activeDestination.shortLabel} Template`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary"
            style={{ background: 'var(--surface2)', color: 'var(--primary)' }}
          >
            <Download size={14} />
            <span>Download Template</span>
          </button>

          {/* Export selected place live data */}
          <button
            onClick={handleExportModuleData}
            disabled={exporting}
            title={`Export existing ${activeDestination.shortLabel} records`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-border"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            {exporting ? <Loader2 size={14} className="animate-spin text-primary" /> : <FileSpreadsheet size={14} />}
            <span>Export {activeDestination.shortLabel}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-8 max-w-4xl mx-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (s.id < step || (s.id === 2 && rawRows.length > 0)) {
                      setStep(s.id as Step);
                    }
                  }}
                  disabled={s.id > step && (s.id !== 2 || rawRows.length === 0)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    background: step === s.id ? 'var(--primary)' : step > s.id ? 'rgba(61,214,140,0.2)' : 'var(--surface2)',
                    color: step === s.id ? '#000' : step > s.id ? '#3dd68c' : 'var(--text2)',
                    border: step > s.id ? '1px solid #3dd68c' : '1px solid var(--border)',
                  }}
                >
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </button>
                <span
                  className="text-xs font-semibold hidden sm:block"
                  style={{ color: step === s.id ? 'var(--foreground)' : 'var(--text2)' }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-3"
                  style={{ background: step > s.id ? '#3dd68c' : 'var(--border)', minWidth: 20 }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Destination Selector Card */}
            <div className="p-5 rounded-2xl border border-border" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    {activeDestination.icon}
                  </div>
                  <div>
                    <h2 className="font-head text-sm font-bold text-foreground">Select Target Destination for Upload & Export</h2>
                    <p className="text-xs text-muted-foreground">{activeDestination.categoryDesc}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md font-mono font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  Collection: {activeDestination.collection}
                </span>
              </div>

              {/* Grid of Destination Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {DESTINATIONS.map((dest) => {
                  const isSelected = dest.id === selectedDestinationId;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => {
                        setSelectedDestinationId(dest.id);
                        if (fileHeaders.length > 0) {
                          runAutoGuess(fileHeaders, dest);
                        }
                      }}
                      className="flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all"
                      style={{
                        background: isSelected ? 'rgba(232,201,122,0.08)' : 'var(--surface2)',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">{dest.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate" style={{ color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}>
                          {dest.shortLabel}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{dest.collection}</div>
                      </div>
                      {isSelected && <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer"
              style={{
                borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
                background: dragOver ? 'rgba(232,201,122,0.05)' : 'var(--surface)',
              }}
              onClick={() => document.getElementById('universal-excel-input')?.click()}
            >
              <input
                id="universal-excel-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)' }}
              >
                <FileSpreadsheet size={32} />
              </div>
              <h3 className="font-head font-bold text-lg mb-1">
                Upload Excel Sheet for {activeDestination.shortLabel}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Drag and drop your .xlsx, .xls, or .csv file here, or click to browse. Supports multi-sheet workbooks!
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Upload size={15} />
                Browse Files
              </button>
            </div>

            {/* Pre-structured Template Download Card */}
            <div className="p-4 rounded-xl border border-border flex items-center justify-between" style={{ background: 'var(--surface2)' }}>
              <div>
                <div className="text-xs font-semibold text-foreground">Need standard column headers for {activeDestination.shortLabel}?</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Download our pre-structured template containing exact fields and sample entries for {activeDestination.name}.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 hover:border-primary transition-colors flex-shrink-0"
              >
                <Download size={13} />
                Sample Template (.xlsx)
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview File & Multi-Sheet Navigation */}
        {step === 2 && (
          <div className="max-w-5xl mx-auto space-y-5">
            {/* File Info Bar */}
            <div className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    {fileName}
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border border-primary/30 text-primary" style={{ background: 'rgba(232,201,122,0.1)' }}>
                      Target: {activeDestination.shortLabel}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fileSize} · {sheetNames.length} sheet(s) detected · Active Sheet: &quot;{selectedSheetName}&quot; ({rawRows.length} rows, {fileHeaders.length} columns)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPreviewSheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:border-primary transition-colors"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                >
                  <Download size={13} />
                  Export This Sheet (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border"
                  style={{ background: 'var(--surface2)' }}
                >
                  Choose different file
                </button>
              </div>
            </div>

            {/* Multi-Sheet Selector Tabs (if workbook has multiple sheets) */}
            {sheetNames.length > 1 && (
              <div className="p-3.5 rounded-xl border border-border" style={{ background: 'var(--surface)' }}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Layers size={13} />
                  Workbook Sheets ({sheetNames.length}) — Select sheet to preview & import:
                </div>
                <div className="flex flex-wrap gap-2">
                  {sheetNames.map((sName) => {
                    const isSheetActive = sName === selectedSheetName;
                    const rowCount = sheetsMap[sName]?.length || 0;
                    return (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => switchSheet(sName)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                        style={{
                          background: isSheetActive ? 'var(--primary)' : 'var(--surface2)',
                          color: isSheetActive ? '#000' : 'var(--foreground)',
                          borderColor: isSheetActive ? 'var(--primary)' : 'var(--border)',
                        }}
                      >
                        <FileSpreadsheet size={13} />
                        <span>{sName}</span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px]"
                          style={{
                            background: isSheetActive ? 'rgba(0,0,0,0.15)' : 'var(--surface)',
                            color: isSheetActive ? '#000' : 'var(--muted-foreground)',
                          }}
                        >
                          {rowCount} rows
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sheet Preview Table */}
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--surface2)' }}>
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Sheet Preview: &quot;{selectedSheetName}&quot; ({filteredPreviewRows.length} of {rawRows.length} rows)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search preview rows..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs rounded-lg border border-border outline-none w-48"
                      style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border sticky top-0" style={{ background: 'var(--surface2)' }}>
                      <th className="px-3 py-2.5 text-center font-mono text-[10px] text-muted-foreground border-r border-border w-10">
                        #
                      </th>
                      {fileHeaders.map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.slice(0, 15).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2 text-center font-mono text-[10px] text-muted-foreground border-r border-border/40">
                          {rIdx + 1}
                        </td>
                        {fileHeaders.map((h) => (
                          <td key={h} className="px-4 py-2 text-foreground whitespace-nowrap max-w-xs truncate">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {filteredPreviewRows.length === 0 && (
                      <tr>
                        <td colSpan={fileHeaders.length + 1} className="py-8 text-center text-xs text-muted-foreground">
                          No matching rows found for query &quot;{previewSearch}&quot;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {rawRows.length > 15 && (
                <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-center" style={{ background: 'var(--surface2)' }}>
                  Showing first 15 rows of {rawRows.length} total rows in this sheet. All {rawRows.length} rows will be processed.
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <ArrowLeft size={14} /> Back to Upload
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                Proceed to Column Mapping for {activeDestination.shortLabel} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Map Columns */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
                <div>
                  <h3 className="font-head font-bold text-base flex items-center gap-2">
                    {activeDestination.icon}
                    Map Excel Columns to {activeDestination.shortLabel} Fields
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Match the columns from &quot;{selectedSheetName}&quot; to system fields in {activeDestination.collection}.
                  </p>
                </div>

                {/* Default Property fallback */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Default Property:</span>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="">(Use property column from sheet)</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mapping list */}
              <div className="space-y-3 mt-4">
                {fileHeaders.map((col) => (
                  <div
                    key={col}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border/50"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div className="w-2/5">
                      <div className="text-xs font-bold text-foreground truncate">{col}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        Sample: &quot;{String(rawRows[0]?.[col] ?? '')}&quot;
                      </div>
                    </div>

                    <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />

                    <select
                      value={mapping[col] || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-border outline-none"
                      style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                    >
                      <option value="">— Skip This Column —</option>
                      {activeDestination.systemFields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label} {f.required ? ' * (Required)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <ArrowLeft size={14} /> Back to Preview
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                Validate Mappings <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Validate */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <h3 className="font-head font-bold text-base mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" />
                Pre-Import Verification for {activeDestination.shortLabel}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3.5 rounded-lg" style={{ background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)' }}>
                  <CheckCircle2 size={18} style={{ color: '#3dd68c' }} className="flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#3dd68c' }}>
                      {rawRows.length} records ready from sheet &quot;{selectedSheetName}&quot;
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Destination Module: {activeDestination.name} (Collection: {activeDestination.collection})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-lg" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <Database size={18} style={{ color: '#60a5fa' }} className="flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#60a5fa' }}>
                      Target Firestore & Local DB: `{activeDestination.collection}`
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedProperty ? `Assigned to: ${selectedProperty}` : 'Property will be mapped dynamically from sheet columns'}
                    </div>
                  </div>
                </div>

                {activeDestination.isFixed !== undefined && (
                  <div className="flex items-center gap-3 p-3.5 rounded-lg" style={{ background: 'rgba(232,201,122,0.08)', border: '1px solid rgba(232,201,122,0.2)' }}>
                    <Layers size={18} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                        Asset Type Tag: {activeDestination.isFixed ? 'Fixed Asset' : 'Non-Fixed Asset (FF&E)'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Will appear in {activeDestination.isFixed ? 'Fixed Assets register' : 'Non-Fixed Assets (FF&E) register'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={importing}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving {rawRows.length} Records to Database…
                  </>
                ) : (
                  <>
                    Import & Save {rawRows.length} Records to {activeDestination.shortLabel} <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Complete */}
        {step === 5 && (
          <div className="max-w-lg mx-auto text-center py-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(61,214,140,0.15)' }}>
              <CheckCircle2 size={44} style={{ color: '#3dd68c' }} />
            </div>
            <h3 className="font-head font-bold text-2xl mb-1 text-foreground">Import Complete & Saved!</h3>
            <p className="text-muted-foreground text-xs mb-6">
              {importResult?.total ?? 0} records have been successfully added to {importResult?.destination || activeDestination.name}. Data is persisted in Google Cloud Firestore & local cache.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                <div className="font-head font-bold text-2xl" style={{ color: '#3dd68c' }}>{importResult?.total ?? 0}</div>
                <div className="text-xs text-muted-foreground">Records Imported</div>
              </div>
              <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                <div className="font-head font-bold text-2xl" style={{ color: '#60a5fa' }}>{importResult?.collection || activeDestination.collection}</div>
                <div className="text-xs text-muted-foreground">Target Collection</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={activeDestination.viewHref}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                View in {activeDestination.shortLabel}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setRawRows([]);
                  setSheetsMap({});
                  setSheetNames([]);
                  setFileName('');
                }}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Import Another Sheet / Module
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
