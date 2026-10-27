/**
 * SAMKO CENTRAL - Dynamic Form & Dropdown CMS Engine
 * Allows Super Admins (L1) to dynamically manage form fields, dropdown labels,
 * option values, and add new custom fields across all platform modules.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type CMSFieldType = 'select' | 'text' | 'number' | 'date' | 'textarea' | 'checkbox';

export interface CMSOption {
  id: string;
  value: string;
  label: string;
  color?: string;
  badge?: string | number;
}

export interface CMSField {
  id: string;
  label: string;
  type: CMSFieldType;
  placeholder?: string;
  required?: boolean;
  isCustom?: boolean;
  helpText?: string;
  order: number;
  options?: CMSOption[];
  defaultValue?: string | boolean | number;
}

export interface CMSForm {
  id: string;
  title: string;
  pagePath: string;
  category: string;
  description: string;
  fields: CMSField[];
}

const STORAGE_KEY = 'samko:cms_form_definitions_v1';
const EVENT_KEY = 'samko:cms-fields-updated';

// ─── SYSTEM DEFAULT FORMS & DROPDOWNS ─────────────────────────────────────────

export const DEFAULT_CMS_FORMS: CMSForm[] = [
  {
    id: 'contracts',
    title: 'Contracts Register Form & Dropdowns',
    pagePath: '/contracts-register',
    category: 'Contracts & Procurement',
    description: 'Supplier contract details, maintenance SLAs, renewal schedules and pricing terms',
    fields: [
      {
        id: 'category',
        label: 'Contract Category',
        type: 'select',
        required: true,
        order: 1,
        helpText: 'Primary service classification for contract categorisation and reporting',
        options: [
          { id: 'opt_c1', value: 'Lift Maintenance', label: 'Lift Maintenance', color: '#60a5fa' },
          { id: 'opt_c2', value: 'Fire Alarm Maintenance', label: 'Fire Alarm Maintenance', color: '#f43f5e' },
          { id: 'opt_c3', value: 'HVAC', label: 'HVAC', color: '#38bdf8' },
          { id: 'opt_c4', value: 'Pest Control', label: 'Pest Control', color: '#f59e0b' },
          { id: 'opt_c5', value: 'Cleaning', label: 'Cleaning', color: '#34d399' },
          { id: 'opt_c6', value: 'Laundry', label: 'Laundry', color: '#818cf8' },
          { id: 'opt_c7', value: 'Waste Collection', label: 'Waste Collection', color: '#a78bfa' },
          { id: 'opt_c8', value: 'Security', label: 'Security', color: '#e879f9' },
          { id: 'opt_c9', value: 'Landscaping', label: 'Landscaping', color: '#4ade80' },
          { id: 'opt_c10', value: 'Catering Equipment', label: 'Catering Equipment', color: '#fb923c' },
          { id: 'opt_c11', value: 'IT Support', label: 'IT Support', color: '#38bdf8' },
          { id: 'opt_c12', value: 'Internet', label: 'Internet & Connectivity', color: '#2dd4bf' },
          { id: 'opt_c13', value: 'Telephone', label: 'Telephone & VOIP', color: '#2dd4bf' },
          { id: 'opt_c14', value: 'Utilities', label: 'Utilities & Power', color: '#eab308' },
          { id: 'opt_c15', value: 'Building Maintenance', label: 'Building Maintenance', color: '#94a3b8' },
          { id: 'opt_c16', value: 'Roofing', label: 'Roofing & Cladding', color: '#a3a3a3' },
          { id: 'opt_c17', value: 'Plumbing', label: 'Plumbing & Drainage', color: '#0ea5e9' },
          { id: 'opt_c18', value: 'Electrical', label: 'Electrical Infrastructure', color: '#facc15' },
          { id: 'opt_c19', value: 'Kitchen Equipment', label: 'Commercial Kitchen Equipment', color: '#f97316' },
          { id: 'opt_c20', value: 'Generator', label: 'Standby Generator', color: '#ef4444' },
          { id: 'opt_c21', value: 'Licensing', label: 'Licensing & Copyright', color: '#c084fc' },
          { id: 'opt_c22', value: 'Professional Services', label: 'Professional Services', color: '#818cf8' },
          { id: 'opt_c23', value: 'F&B Supply', label: 'F&B Supply Agreements', color: '#fbbf24' },
          { id: 'opt_c24', value: 'HR & Payroll', label: 'HR & Payroll Systems', color: '#f472b6' },
          { id: 'opt_c25', value: 'Housekeeping', label: 'Housekeeping Services', color: '#22c55e' },
        ],
      },
      {
        id: 'status',
        label: 'Contract Status',
        type: 'select',
        required: true,
        order: 2,
        helpText: 'Current operational standing of the agreement',
        options: [
          { id: 'opt_s1', value: 'active', label: 'Active', color: '#3dd68c' },
          { id: 'opt_s2', value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
          { id: 'opt_s3', value: 'expired', label: 'Expired', color: '#f43f5e' },
          { id: 'opt_s4', value: 'pending', label: 'Pending Signature / Approval', color: '#60a5fa' },
          { id: 'opt_s5', value: 'terminated', label: 'Terminated', color: '#94a3b8' },
        ],
      },
      {
        id: 'hotel',
        label: 'Property / Hotel Site',
        type: 'select',
        required: true,
        order: 3,
        options: [
          { id: 'opt_h1', value: 'Crowne Plaza Kingston-south', label: 'Crowne Plaza Kingston-south' },
          { id: 'opt_h2', value: 'Stanhill Court', label: 'Stanhill Court Hotel' },
          { id: 'opt_h3', value: 'Hampton 1 & 2', label: 'Hampton 1 & 2' },
          { id: 'opt_h4', value: 'Ravens Ait Island', label: 'Ravens Ait Island' },
          { id: 'opt_h5', value: 'River Club', label: 'River Club' },
          { id: 'opt_h6', value: 'Warren House', label: 'Warren House' },
          { id: 'opt_h7', value: 'Gatwick Manor', label: 'Gatwick Manor' },
          { id: 'opt_h8', value: 'Sharnbrook', label: 'Sharnbrook Hotel' },
          { id: 'opt_h9', value: 'Group / Portfolio-wide', label: 'Group / Portfolio-wide' },
        ],
      },
      {
        id: 'paymentFrequency',
        label: 'Payment Frequency',
        type: 'select',
        required: false,
        order: 4,
        options: [
          { id: 'opt_pf1', value: 'Monthly', label: 'Monthly' },
          { id: 'opt_pf2', value: 'Quarterly', label: 'Quarterly' },
          { id: 'opt_pf3', value: 'Semi-Annual', label: 'Semi-Annual' },
          { id: 'opt_pf4', value: 'Annual', label: 'Annual' },
          { id: 'opt_pf5', value: '14 Days of Invoice', label: '14 Days of Invoice' },
          { id: 'opt_pf6', value: '30 Days Net', label: '30 Days Net' },
          { id: 'opt_pf7', value: 'Ad-hoc / Per Visit', label: 'Ad-hoc / Per Visit' },
        ],
      },
      {
        id: 'noticePeriod',
        label: 'Notice Period',
        type: 'select',
        required: false,
        order: 5,
        options: [
          { id: 'opt_np1', value: '0 days', label: 'Immediate (0 days)' },
          { id: 'opt_np2', value: '14 days', label: '14 days' },
          { id: 'opt_np3', value: '30 days', label: '30 days (1 month)' },
          { id: 'opt_np4', value: '60 days', label: '60 days (2 months)' },
          { id: 'opt_np5', value: '90 days', label: '90 days (3 months)' },
          { id: 'opt_np6', value: '180 days', label: '180 days (6 months)' },
          { id: 'opt_np7', value: '365 days', label: '365 days (1 year)' },
          { id: 'opt_np8', value: '730 days', label: '730 days (2 years)' },
        ],
      },
      {
        id: 'department',
        label: 'Department Owner',
        type: 'select',
        required: false,
        order: 6,
        options: [
          { id: 'opt_dep1', value: 'Finance', label: 'Finance' },
          { id: 'opt_dep2', value: 'Operations', label: 'Operations' },
          { id: 'opt_dep3', value: 'Engineering & Maintenance', label: 'Engineering & Maintenance' },
          { id: 'opt_dep4', value: 'IT & Systems', label: 'IT & Systems' },
          { id: 'opt_dep5', value: 'General Management', label: 'General Management' },
          { id: 'opt_dep6', value: 'Revenue & Sales', label: 'Revenue & Sales' },
          { id: 'opt_dep7', value: 'Compliance & Safety', label: 'Compliance & Safety' },
          { id: 'opt_dep8', value: 'Food & Beverage', label: 'Food & Beverage' },
          { id: 'opt_dep9', value: 'Human Resources', label: 'Human Resources' },
        ],
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance Register Form & Dropdowns',
    pagePath: '/compliance-register',
    category: 'Safety & Compliance',
    description: 'Statutory compliance tracking, inspections, certificates, audits and risk management',
    fields: [
      {
        id: 'category',
        label: 'Compliance Domain / Category',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'comp_c1', value: 'Fire Safety', label: 'Fire Safety (Extinguishers, Alarms, Doors)', color: '#f43f5e' },
          { id: 'comp_c2', value: 'Water Safety (Legionella)', label: 'Water Safety & Legionella Control', color: '#0ea5e9' },
          { id: 'comp_c3', value: 'Electrical & Gas', label: 'Electrical Installation & Gas Safety', color: '#f59e0b' },
          { id: 'comp_c4', value: 'Health & Safety', label: 'Health, Safety & Welfare', color: '#10b981' },
          { id: 'comp_c5', value: 'Asbestos', label: 'Asbestos Survey & Register', color: '#64748b' },
          { id: 'comp_c6', value: 'Lifts & Lifting', label: 'LOLER Lifts & Lifting Equipment', color: '#8b5cf6' },
          { id: 'comp_c7', value: 'Food Safety & Hygiene', label: 'Food Safety, HACCP & Hygiene', color: '#ec4899' },
          { id: 'comp_c8', value: 'Environmental & Waste', label: 'Environmental, EPA & Waste Transfer', color: '#84cc16' },
          { id: 'comp_c9', value: 'Insurance & Licensing', label: 'Premises Licensing & Statutory Insurance', color: '#e8c97a' },
        ],
      },
      {
        id: 'status',
        label: 'Compliance Status',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { id: 'comp_s1', value: 'Compliant', label: 'Compliant / Certified', color: '#3dd68c' },
          { id: 'comp_s2', value: 'Overdue', label: 'Statutory Overdue', color: '#f43f5e' },
          { id: 'comp_s3', value: 'Action Required', label: 'Action / Remedial Required', color: '#f59e0b' },
          { id: 'comp_s4', value: 'Scheduled', label: 'Scheduled / Under Review', color: '#60a5fa' },
          { id: 'comp_s5', value: 'Exempt', label: 'Exempt / Not Applicable', color: '#94a3b8' },
        ],
      },
      {
        id: 'frequency',
        label: 'Statutory Frequency',
        type: 'select',
        required: true,
        order: 3,
        options: [
          { id: 'comp_f1', value: 'Weekly', label: 'Weekly Check' },
          { id: 'comp_f2', value: 'Monthly', label: 'Monthly Inspection' },
          { id: 'comp_f3', value: 'Quarterly', label: 'Quarterly Audit' },
          { id: 'comp_f4', value: 'Semi-Annual', label: 'Semi-Annual (6 Months)' },
          { id: 'comp_f5', value: 'Annual', label: 'Annual (12 Months)' },
          { id: 'comp_f6', value: 'Bi-Annual', label: 'Bi-Annual (2 Years)' },
          { id: 'comp_f7', value: '5 Years', label: '5-Yearly Fixed Wire Testing' },
          { id: 'comp_f8', value: 'Ad-hoc', label: 'Ad-hoc / Post Incident' },
        ],
      },
      {
        id: 'riskLevel',
        label: 'Risk Severity Rating',
        type: 'select',
        required: false,
        order: 4,
        options: [
          { id: 'comp_r1', value: 'Low', label: 'Low Risk', color: '#3dd68c' },
          { id: 'comp_r2', value: 'Medium', label: 'Medium Risk', color: '#f59e0b' },
          { id: 'comp_r3', value: 'High', label: 'High Priority Risk', color: '#f97316' },
          { id: 'comp_r4', value: 'Critical', label: 'Critical / Life Safety', color: '#f43f5e' },
        ],
      },
    ],
  },
  {
    id: 'assets',
    title: 'Asset Management Register Form & Dropdowns',
    pagePath: '/asset-management/assets',
    category: 'Asset Management',
    description: 'Fixed Plant & Machinery, loose equipment, lifecycle condition tracking and warranties',
    fields: [
      {
        id: 'category',
        label: 'Asset Category',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'ast_c1', value: 'Mechanical & Electrical', label: 'Mechanical & Electrical (M&E)', color: '#38bdf8' },
          { id: 'ast_c2', value: 'HVAC', label: 'HVAC & Air Conditioning', color: '#0ea5e9' },
          { id: 'ast_c3', value: 'Kitchen Equipment', label: 'Commercial Kitchen & Catering', color: '#f97316' },
          { id: 'ast_c4', value: 'Fire & Life Safety', label: 'Fire & Life Safety Systems', color: '#f43f5e' },
          { id: 'ast_c5', value: 'Plumbing & Water', label: 'Plumbing, Pumps & Boilers', color: '#06b6d4' },
          { id: 'ast_c6', value: 'IT & Telecoms', label: 'IT, Servers, Wi-Fi & Telecoms', color: '#818cf8' },
          { id: 'ast_c7', value: 'Furniture & Fixtures', label: 'Furniture, Fixtures & Fittings (FF&E)', color: '#d97706' },
          { id: 'ast_c8', value: 'Lifts & Escalators', label: 'Lifts & Passenger Elevators', color: '#8b5cf6' },
          { id: 'ast_c9', value: 'Laundry & Housekeeping', label: 'Commercial Laundry Machinery', color: '#10b981' },
          { id: 'ast_c10', value: 'Building Fabric', label: 'Roof, Building Fabric & Windows', color: '#94a3b8' },
        ],
      },
      {
        id: 'condition',
        label: 'Asset Physical Condition',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { id: 'ast_cd1', value: 'Excellent', label: 'Excellent (Like New)', color: '#3dd68c' },
          { id: 'ast_cd2', value: 'Good', label: 'Good (Operational & Maintained)', color: '#10b981' },
          { id: 'ast_cd3', value: 'Fair', label: 'Fair (Minor Wear & Tear)', color: '#f59e0b' },
          { id: 'ast_cd4', value: 'Poor', label: 'Poor (High Repair Needed)', color: '#f97316' },
          { id: 'ast_cd5', value: 'Critical', label: 'Critical / Needs Immediate Replacement', color: '#f43f5e' },
        ],
      },
      {
        id: 'status',
        label: 'Operational Status',
        type: 'select',
        required: true,
        order: 3,
        options: [
          { id: 'ast_st1', value: 'In Service', label: 'In Service (Active)', color: '#3dd68c' },
          { id: 'ast_st2', value: 'Under Maintenance', label: 'Under Maintenance / Repair', color: '#f59e0b' },
          { id: 'ast_st3', value: 'Standby', label: 'Standby / Redundant', color: '#60a5fa' },
          { id: 'ast_st4', value: 'Out of Service', label: 'Out of Service (Breakdown)', color: '#f43f5e' },
          { id: 'ast_st5', value: 'Decommissioned', label: 'Decommissioned / Scrapped', color: '#94a3b8' },
        ],
      },
      {
        id: 'department',
        label: 'Department Allocation',
        type: 'select',
        required: false,
        order: 4,
        options: [
          { id: 'ast_dp1', value: 'Engineering', label: 'Engineering' },
          { id: 'ast_dp2', value: 'Kitchen / F&B', label: 'Kitchen / F&B' },
          { id: 'ast_dp3', value: 'Housekeeping', label: 'Housekeeping' },
          { id: 'ast_dp4', value: 'Front of House', label: 'Front of House' },
          { id: 'ast_dp5', value: 'IT & Audio-Visual', label: 'IT & Audio-Visual' },
          { id: 'ast_dp6', value: 'Spa & Leisure', label: 'Spa & Leisure' },
          { id: 'ast_dp7', value: 'Grounds & Facilities', label: 'Grounds & Facilities' },
        ],
      },
      {
        id: 'criticality',
        label: 'Business Impact Criticality',
        type: 'select',
        required: false,
        order: 5,
        options: [
          { id: 'ast_cr1', value: 'High', label: 'High (Guest Critical / Revenue Impacting)', color: '#f43f5e' },
          { id: 'ast_cr2', value: 'Medium', label: 'Medium (Operational Impact)', color: '#f59e0b' },
          { id: 'ast_cr3', value: 'Low', label: 'Low (Non-Critical)', color: '#3dd68c' },
        ],
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Planned Preventive Maintenance (PPM) Form',
    pagePath: '/asset-management/maintenance',
    category: 'Maintenance & Works',
    description: 'Routine servicing schedules, contractor task assignments, and breakdown work orders',
    fields: [
      {
        id: 'priority',
        label: 'Maintenance Priority',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'maint_p1', value: 'urgent', label: 'Urgent / Emergency', color: '#f43f5e' },
          { id: 'maint_p2', value: 'high', label: 'High Priority', color: '#f97316' },
          { id: 'maint_p3', value: 'medium', label: 'Medium Priority', color: '#f59e0b' },
          { id: 'maint_p4', value: 'low', label: 'Low Priority / Routine', color: '#60a5fa' },
        ],
      },
      {
        id: 'status',
        label: 'Work Order Status',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { id: 'maint_s1', value: 'scheduled', label: 'Scheduled', color: '#60a5fa' },
          { id: 'maint_s2', value: 'in-progress', label: 'In Progress', color: '#f59e0b' },
          { id: 'maint_s3', value: 'completed', label: 'Completed & Signed Off', color: '#3dd68c' },
          { id: 'maint_s4', value: 'overdue', label: 'Overdue Work Order', color: '#f43f5e' },
          { id: 'maint_s5', value: 'on-hold', label: 'On Hold (Awaiting Parts)', color: '#94a3b8' },
        ],
      },
      {
        id: 'taskType',
        label: 'Maintenance Classification',
        type: 'select',
        required: true,
        order: 3,
        options: [
          { id: 'maint_t1', value: 'PPM', label: 'Planned Preventive (PPM)' },
          { id: 'maint_t2', value: 'Reactive', label: 'Reactive Breakdown Repair' },
          { id: 'maint_t3', value: 'Statutory', label: 'Statutory Compliance Check' },
          { id: 'maint_t4', value: 'Warranty', label: 'Warranty / Manufacturer SLA' },
          { id: 'maint_t5', value: 'Capital Project', label: 'Capital Works / Refurbishment' },
        ],
      },
      {
        id: 'serviceProvider',
        label: 'Assigned Contractor / Team',
        type: 'select',
        required: false,
        order: 4,
        options: [
          { id: 'maint_sp1', value: 'In-House Engineering', label: 'In-House Engineering Team' },
          { id: 'maint_sp2', value: 'External Specialist SLA', label: 'External Specialist SLA Contractor' },
          { id: 'maint_sp3', value: 'OEM Manufacturer', label: 'OEM Manufacturer Tech' },
          { id: 'maint_sp4', value: 'Local Emergency Contractor', label: 'Local Emergency Contractor' },
        ],
      },
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities Register Form & Dropdowns',
    pagePath: '/utilities-register',
    category: 'Energy & Sustainability',
    description: 'Utility meters, billing reconciliations, consumption tracking and carbon reporting',
    fields: [
      {
        id: 'utilityType',
        label: 'Utility Service Type',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'ut_t1', value: 'Electricity', label: 'Electricity (HH & NHH)', color: '#eab308' },
          { id: 'ut_t2', value: 'Gas', label: 'Mains Natural Gas', color: '#f97316' },
          { id: 'ut_t3', value: 'Water', label: 'Water & Wastewater', color: '#38bdf8' },
          { id: 'ut_t4', value: 'Solar PV', label: 'Solar PV Generation', color: '#22c55e' },
          { id: 'ut_t5', value: 'Biomass', label: 'Biomass & Renewable Heat', color: '#10b981' },
          { id: 'ut_t6', value: 'LPG', label: 'LPG Gas Storage', color: '#fb923c' },
        ],
      },
      {
        id: 'tariffType',
        label: 'Tariff Structure',
        type: 'select',
        required: false,
        order: 2,
        options: [
          { id: 'ut_tf1', value: 'Fixed Rate', label: 'Fixed Price Contract' },
          { id: 'ut_tf2', value: 'Flexible Day/Night', label: 'Flexible Day / Night Economy' },
          { id: 'ut_tf3', value: 'Half-Hourly Settlement', label: 'Half-Hourly (HH) Market Settlement' },
          { id: 'ut_tf4', value: 'Pass-Through', label: 'Pass-Through Commodity' },
          { id: 'ut_tf5', value: 'Green REGO Certified', label: '100% Green REGO Certified Tariff' },
        ],
      },
      {
        id: 'billingStatus',
        label: 'Invoice Reconcile Status',
        type: 'select',
        required: true,
        order: 3,
        options: [
          { id: 'ut_b1', value: 'Paid & Verified', label: 'Paid & Meter Verified', color: '#3dd68c' },
          { id: 'ut_b2', value: 'Pending Approval', label: 'Pending GM Approval', color: '#f59e0b' },
          { id: 'ut_b3', value: 'In Dispute', label: 'In Dispute (Estimate Discrepancy)', color: '#f43f5e' },
          { id: 'ut_b4', value: 'Overdue', label: 'Overdue Payment', color: '#e11d48' },
        ],
      },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance Register Form & Dropdowns',
    pagePath: '/insurance-register',
    category: 'Risk & Governance',
    description: 'Corporate property policies, public liability, claims tracking and underwriting dates',
    fields: [
      {
        id: 'policyType',
        label: 'Insurance Policy Type',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'ins_p1', value: 'Property Damage & BI', label: 'Property Damage & Business Interruption (BI)' },
          { id: 'ins_p2', value: 'Public Liability', label: 'Public & Products Liability' },
          { id: 'ins_p3', value: 'Employers Liability', label: 'Employers Liability (£10M)' },
          { id: 'ins_p4', value: 'Directors & Officers', label: 'Directors & Officers (D&O)' },
          { id: 'ins_p5', value: 'Cyber Liability', label: 'Cyber & Data Privacy Insurance' },
          { id: 'ins_p6', value: 'Engineering & Inspection', label: 'Engineering Breakdown & Statutory Inspection' },
          { id: 'ins_p7', value: 'Terrorism', label: 'Pool Re Terrorism Coverage' },
        ],
      },
      {
        id: 'status',
        label: 'Policy Status',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { id: 'ins_s1', value: 'Active', label: 'Active & In Force', color: '#3dd68c' },
          { id: 'ins_s2', value: 'Renewal Pending', label: 'Renewal Terms Pending', color: '#f59e0b' },
          { id: 'ins_s3', value: 'Expired', label: 'Expired / Lapsed', color: '#f43f5e' },
          { id: 'ins_s4', value: 'Cancelled', label: 'Cancelled Policy', color: '#94a3b8' },
        ],
      },
    ],
  },
  {
    id: 'documents',
    title: 'Document Repository Form & Dropdowns',
    pagePath: '/document-repository',
    category: 'Governance & Media',
    description: 'Certificates, legal deeds, floor plans, warranties, policies and user uploads',
    fields: [
      {
        id: 'category',
        label: 'Document Category',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'doc_c1', value: 'Compliance Certificates', label: 'Compliance & Statutory Certificates' },
          { id: 'doc_c2', value: 'Service Contracts', label: 'Supplier & Service Contracts' },
          { id: 'doc_c3', value: 'As-Built Drawings', label: 'As-Built CAD & Architectural Drawings' },
          { id: 'doc_c4', value: 'O&M Manuals', label: 'Operation & Maintenance (O&M) Manuals' },
          { id: 'doc_c5', value: 'Health & Safety', label: 'Health & Safety Risk Assessments (RAMS)' },
          { id: 'doc_c6', value: 'Insurance Policies', label: 'Insurance Schedules & Wordings' },
          { id: 'doc_c7', value: 'Lease & Property Deeds', label: 'Leases, Title Deeds & Planning Consents' },
        ],
      },
      {
        id: 'confidentiality',
        label: 'Confidentiality Tier',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { id: 'doc_cf1', value: 'Public Internal', label: 'General Internal (All Users)' },
          { id: 'doc_cf2', value: 'Department Only', label: 'Department Restricted' },
          { id: 'doc_cf3', value: 'Management Only', label: 'Management Confidential (L1 & L2)', color: '#f59e0b' },
          { id: 'doc_cf4', value: 'Board Restricted', label: 'Super Admin / Board Only (L1)', color: '#f43f5e' },
        ],
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Task Manager Form & Dropdowns',
    pagePath: '/tasks',
    category: 'Operational Tasks',
    description: 'Operational work items, department priorities, status tracking and due dates',
    fields: [
      {
        id: 'priority',
        label: 'Task Priority',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { id: 'tsk_p1', value: 'urgent', label: 'Urgent', color: '#f43f5e' },
          { id: 'tsk_p2', value: 'high', label: 'High', color: '#f97316' },
          { id: 'tsk_p3', value: 'medium', label: 'Medium', color: '#f59e0b' },
          { id: 'tsk_p4', value: 'low', label: 'Low', color: '#60a5fa' },
        ],
      },
      {
        id: 'status',
        label: 'Workflow Status',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { id: 'tsk_s1', value: 'open', label: 'Open / Unassigned', color: '#60a5fa' },
          { id: 'tsk_s2', value: 'in-progress', label: 'In Progress', color: '#f59e0b' },
          { id: 'tsk_s3', value: 'under-review', label: 'Under Review / QA', color: '#a855f7' },
          { id: 'tsk_s4', value: 'completed', label: 'Completed', color: '#3dd68c' },
          { id: 'tsk_s5', value: 'blocked', label: 'Blocked / Escalated', color: '#f43f5e' },
        ],
      },
      {
        id: 'category',
        label: 'Task Category',
        type: 'select',
        required: false,
        order: 3,
        options: [
          { id: 'tsk_c1', value: 'Maintenance', label: 'Maintenance & Repairs' },
          { id: 'tsk_c2', value: 'Operations', label: 'Operations & Guest Services' },
          { id: 'tsk_c3', value: 'Compliance', label: 'Compliance & Safety Audit' },
          { id: 'tsk_c4', value: 'Finance', label: 'Finance & Invoicing' },
          { id: 'tsk_c5', value: 'IT Systems', label: 'IT & POS Systems' },
          { id: 'tsk_c6', value: 'General', label: 'General Task' },
        ],
      },
    ],
  },
];

// ─── STORAGE ACCESSORS ────────────────────────────────────────────────────────

export function getCMSForms(): CMSForm[] {
  if (typeof window === 'undefined') return DEFAULT_CMS_FORMS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CMS_FORMS));
      return DEFAULT_CMS_FORMS;
    }
    const parsed: CMSForm[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CMS_FORMS;
    }

    // Merge in any newly added system default forms if user upgraded
    const formsMap = new Map(parsed.map((f) => [f.id, f]));
    let modified = false;

    for (const defForm of DEFAULT_CMS_FORMS) {
      if (!formsMap.has(defForm.id)) {
        formsMap.set(defForm.id, defForm);
        modified = true;
      }
    }

    const merged = Array.from(formsMap.values());
    if (modified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    console.error('Error reading CMS forms from localStorage:', err);
    return DEFAULT_CMS_FORMS;
  }
}

export function saveCMSForms(forms: CMSForm[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: forms }));
  } catch (err) {
    console.error('Error saving CMS forms to localStorage:', err);
  }
}

export function getCMSForm(formId: string): CMSForm | undefined {
  const forms = getCMSForms();
  return forms.find((f) => f.id === formId);
}

export function resetCMSForms(): CMSForm[] {
  if (typeof window === 'undefined') return DEFAULT_CMS_FORMS;
  try {
    localStorage.removeItem(STORAGE_KEY);
    saveCMSForms(DEFAULT_CMS_FORMS);
    return DEFAULT_CMS_FORMS;
  } catch {
    return DEFAULT_CMS_FORMS;
  }
}

export function resetCMSForm(formId: string): CMSForm | undefined {
  const def = DEFAULT_CMS_FORMS.find((f) => f.id === formId);
  if (!def) return undefined;

  const current = getCMSForms();
  const next = current.map((f) => (f.id === formId ? def : f));
  saveCMSForms(next);
  return def;
}

// ─── FIELD & OPTION MUTATIONS ─────────────────────────────────────────────────

export function updateCMSField(
  formId: string,
  fieldId: string,
  updates: Partial<CMSField>
): boolean {
  const forms = getCMSForms();
  const formIndex = forms.findIndex((f) => f.id === formId);
  if (formIndex === -1) return false;

  const form = forms[formIndex];
  const fieldIndex = form.fields.findIndex((f) => f.id === fieldId);
  if (fieldIndex === -1) return false;

  form.fields[fieldIndex] = {
    ...form.fields[fieldIndex],
    ...updates,
  };

  saveCMSForms(forms);
  return true;
}

export function addCMSField(
  formId: string,
  newField: Omit<CMSField, 'order'>
): CMSField | null {
  const forms = getCMSForms();
  const formIndex = forms.findIndex((f) => f.id === formId);
  if (formIndex === -1) return null;

  const form = forms[formIndex];
  const order = form.fields.length + 1;
  const fieldToAdd: CMSField = {
    ...newField,
    isCustom: true,
    order,
  };

  form.fields.push(fieldToAdd);
  saveCMSForms(forms);
  return fieldToAdd;
}

export function deleteCMSField(formId: string, fieldId: string): boolean {
  const forms = getCMSForms();
  const formIndex = forms.findIndex((f) => f.id === formId);
  if (formIndex === -1) return false;

  const form = forms[formIndex];
  form.fields = form.fields.filter((f) => f.id !== fieldId);
  saveCMSForms(forms);
  return true;
}

export function addOptionToField(
  formId: string,
  fieldId: string,
  option: { value: string; label: string; color?: string }
): CMSOption | null {
  const forms = getCMSForms();
  const form = forms.find((f) => f.id === formId);
  if (!form) return null;

  const field = form.fields.find((f) => f.id === fieldId);
  if (!field) return null;

  if (!field.options) field.options = [];

  // Check for duplicate value
  const cleanVal = option.value.trim();
  const cleanLabel = option.label.trim();
  if (!cleanVal || !cleanLabel) return null;

  const exists = field.options.some(
    (o) => o.value.toLowerCase() === cleanVal.toLowerCase()
  );
  if (exists) return null;

  const newOption: CMSOption = {
    id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    value: cleanVal,
    label: cleanLabel,
    color: option.color,
  };

  field.options.push(newOption);
  saveCMSForms(forms);
  return newOption;
}

export function updateOptionInField(
  formId: string,
  fieldId: string,
  optionId: string,
  updates: Partial<CMSOption>
): boolean {
  const forms = getCMSForms();
  const form = forms.find((f) => f.id === formId);
  if (!form) return false;

  const field = form.fields.find((f) => f.id === fieldId);
  if (!field || !field.options) return false;

  const optIndex = field.options.findIndex((o) => o.id === optionId);
  if (optIndex === -1) return false;

  field.options[optIndex] = {
    ...field.options[optIndex],
    ...updates,
  };

  saveCMSForms(forms);
  return true;
}

export function deleteOptionFromField(
  formId: string,
  fieldId: string,
  optionId: string
): boolean {
  const forms = getCMSForms();
  const form = forms.find((f) => f.id === formId);
  if (!form) return false;

  const field = form.fields.find((f) => f.id === fieldId);
  if (!field || !field.options) return false;

  field.options = field.options.filter((o) => o.id !== optionId);
  saveCMSForms(forms);
  return true;
}

export function reorderOptionsInField(
  formId: string,
  fieldId: string,
  fromIndex: number,
  toIndex: number
): boolean {
  const forms = getCMSForms();
  const form = forms.find((f) => f.id === formId);
  if (!form) return false;

  const field = form.fields.find((f) => f.id === fieldId);
  if (!field || !field.options) return false;

  const [moved] = field.options.splice(fromIndex, 1);
  if (!moved) return false;
  field.options.splice(toIndex, 0, moved);

  saveCMSForms(forms);
  return true;
}

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────

export function exportCMSConfigJSON(): string {
  const forms = getCMSForms();
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      forms,
    },
    null,
    2
  );
}

export function importCMSConfigJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.forms || !Array.isArray(data.forms)) return false;
    saveCMSForms(data.forms);
    return true;
  } catch (e) {
    console.error('Failed to parse CMS JSON import:', e);
    return false;
  }
}

// ─── REACT HOOK FOR REAL-TIME FORM CONSUMPTION ────────────────────────────────

export function useCMSForm(formId: string) {
  const [form, setForm] = useState<CMSForm | undefined>(() => getCMSForm(formId));

  const refresh = useCallback(() => {
    setForm(getCMSForm(formId));
  }, [formId]);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  // Utility to get dropdown options formatted for CustomDropdown
  const getDropdownOptions = useCallback(
    (fieldId: string, fallback: Array<{ value: string; label: string; color?: string }> = []) => {
      if (!form) return fallback;
      const field = form.fields.find((f) => f.id === fieldId);
      if (!field || !field.options || field.options.length === 0) return fallback;
      return field.options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        color: opt.color,
      }));
    },
    [form]
  );

  // Utility to get field label
  const getFieldLabel = useCallback(
    (fieldId: string, fallback: string) => {
      if (!form) return fallback;
      const field = form.fields.find((f) => f.id === fieldId);
      return field?.label || fallback;
    },
    [form]
  );

  // Utility to get custom fields added by admin
  const customFields = form?.fields.filter((f) => f.isCustom) || [];

  return {
    form,
    fields: form?.fields || [],
    customFields,
    getFieldLabel,
    getDropdownOptions,
    refresh,
  };
}
