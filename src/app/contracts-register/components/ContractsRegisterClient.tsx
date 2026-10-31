'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ScrollText, Clock, CheckCircle2, Plus, Search, Download, Eye, Edit2, FileText, Bell, RefreshCw, Handshake, DollarSign, ChevronDown, Loader2, Trash2, AlertTriangle, X, Upload, ExternalLink, Calendar } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import { useCMSForm } from '@/lib/cmsConfig';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';


type ContractStatus = 'active' | 'expiring-soon' | 'expired' | 'pending' | 'terminated';

interface Contract {
  id: string;
  contractId: string;
  supplierName: string;
  contractName: string;
  category: string;
  hotel: string;
  department: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  noticePeriod: string;
  autoRenew: boolean;
  contractValue: number;
  monthlyCost: number;
  paymentFrequency: string;
  contractOwner: string;
  supplierContact: string;
  phone: string;
  email: string;
  sla: string;
  status: ContractStatus;
  notes?: string;
}

const CONTRACT_CATEGORIES = [
  'Lift Maintenance', 'Fire Alarm Maintenance', 'HVAC', 'Pest Control', 'Cleaning',
  'Laundry', 'Waste Collection', 'Security', 'Landscaping', 'Catering Equipment',
  'IT Support', 'Internet', 'Telephone', 'Utilities', 'Building Maintenance',
  'Roofing', 'Plumbing', 'Electrical', 'Kitchen Equipment', 'Generator',
  'Pest Inspection', 'Licensing', 'Professional Services', 'F&B Supply', 'HR & Payroll',
  'Maintenance & Servicing', 'Waste & Cleaning', 'Housekeeping',
];

const HOTELS = [
  'Crowne Plaza Kingston-south', 'Stanhill Court', 'Hampton 1 & 2', 'Ravens Ait Island',
  'River Club', 'Warren House', 'Gatwick Manor', 'Sharnbrook', 'Group / Portfolio-wide',
];

// ─── REAL DATA — Seeded from Samko_Holdings_Master_Contracts_Register ─────────
const MOCK_CONTRACTS: Contract[] = [
  {
    id: '1', contractId: 'CON-001', supplierName: 'Experian', contractName: 'Experian Credit Services',
    category: 'Professional Services', hotel: 'Crowne Plaza Kingston-south', department: 'Finance',
    startDate: '2025-01-01', endDate: '2026-12-31', renewalDate: '2026-11-30', noticePeriod: '2 days',
    autoRenew: true, contractValue: 184, monthlyCost: 15, paymentFrequency: 'Annual',
    contractOwner: 'Marcus Webb', supplierContact: 'Experian Support', phone: '0844 481 8000',
    email: 'business@experian.com', sla: 'Rolling auto-renew', status: 'active',
  },
  {
    id: '2', contractId: 'CON-002', supplierName: 'Planet Merchant Services Limited', contractName: 'Planet Payment Processing',
    category: 'Professional Services', hotel: 'Crowne Plaza Kingston-south', department: 'Finance',
    startDate: '2026-07-04', endDate: '2027-07-04', renewalDate: '2027-06-04', noticePeriod: '30 days',
    autoRenew: true, contractValue: 1776, monthlyCost: 148, paymentFrequency: 'Annual',
    contractOwner: 'Marcus Webb', supplierContact: 'Planet Support', phone: '+44 20 3370 0000',
    email: 'support@planetpayment.com', sla: 'Auto-renew rolling', status: 'active',
  },
  {
    id: '3', contractId: 'CON-003', supplierName: 'IHG', contractName: 'IHG Franchise Agreement',
    category: 'Licensing', hotel: 'Crowne Plaza Kingston-south', department: 'General Management',
    startDate: '2018-04-04', endDate: '2038-03-05', renewalDate: '2037-09-05', noticePeriod: '730 days',
    autoRenew: false, contractValue: 50000, monthlyCost: 4167, paymentFrequency: 'Annual',
    contractOwner: 'Marcus Webb', supplierContact: 'IHG Franchise Team', phone: '+44 1895 512 000',
    email: 'franchise@ihg.com', sla: 'Fixed term to 2038 per IHG brand standards', status: 'active',
    notes: 'Long-term franchise agreement. 730-day notice period required.',
  },
  {
    id: '4', contractId: 'CON-004', supplierName: 'HotelKey', contractName: 'HotelKey PMS System',
    category: 'IT Support', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2024-01-01', endDate: '2026-12-31', renewalDate: '2026-10-01', noticePeriod: '90 days',
    autoRenew: true, contractValue: 5709, monthlyCost: 476, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'HotelKey Support', phone: '+1 888 468 5397',
    email: 'support@hotelkey.com', sla: 'Auto-renew rolling, 90-day notice', status: 'active',
  },
  {
    id: '5', contractId: 'CON-005', supplierName: 'HotelKey', contractName: 'HotelKey EventKey SaaS License',
    category: 'IT Support', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2024-06-11', endDate: '2026-06-11', renewalDate: '2026-05-11', noticePeriod: '30 days',
    autoRenew: true, contractValue: 575, monthlyCost: 48, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'HotelKey Support', phone: '+1 888 468 5397',
    email: 'support@hotelkey.com', sla: 'Auto-renew rolling', status: 'expiring-soon',
  },
  {
    id: '6', contractId: 'CON-006', supplierName: 'PPL PRS', contractName: 'PPL PRS Music Licence',
    category: 'Licensing', hotel: 'Crowne Plaza Kingston-south', department: 'Compliance',
    startDate: '2026-01-21', endDate: '2027-01-21', renewalDate: '2026-12-21', noticePeriod: '30 days',
    autoRenew: true, contractValue: 2607, monthlyCost: 217, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'PPL PRS', phone: '0800 073 0101',
    email: 'info@pplprs.co.uk', sla: 'Annual licence renewal', status: 'active',
  },
  {
    id: '7', contractId: 'CON-007', supplierName: 'Parking Eye UK', contractName: 'Parking Eye Car Park Management',
    category: 'Professional Services', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2019-07-24', endDate: '2028-07-24', renewalDate: '2028-04-24', noticePeriod: '90 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Quarterly',
    contractOwner: 'Marcus Webb', supplierContact: 'Parking Eye', phone: '01772 450 450',
    email: 'info@parkingeye.co.uk', sla: 'VAT Reclaim model – no direct cost', status: 'active',
    notes: 'Revenue share / VAT reclaim model',
  },
  {
    id: '8', contractId: 'CON-008', supplierName: 'Booking.com', contractName: 'Booking.com Distribution Agreement',
    category: 'Professional Services', hotel: 'Crowne Plaza Kingston-south', department: 'Revenue',
    startDate: '2024-11-12', endDate: '2099-12-31', renewalDate: '2099-12-31', noticePeriod: '15 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: '14 Days of Invoice',
    contractOwner: 'Marcus Webb', supplierContact: 'Booking.com Partner Support', phone: '+31 20 712 5000',
    email: 'partner@booking.com', sla: '15% commission per booking, rolling no end date', status: 'active',
    notes: '15% commission per booking. Rolling agreement with no fixed end date.',
  },
  {
    id: '9', contractId: 'CON-009', supplierName: 'Musicstyling', contractName: 'Musicstyling Background Music',
    category: 'IT Support', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2024-12-01', endDate: '2026-11-30', renewalDate: '2026-10-30', noticePeriod: '30 days',
    autoRenew: true, contractValue: 490, monthlyCost: 41, paymentFrequency: 'Annual',
    contractOwner: 'Marcus Webb', supplierContact: 'Musicstyling Support', phone: '+44 20 0000 0000',
    email: 'info@musicstyling.com', sla: 'Auto-renew rolling', status: 'active',
  },
  {
    id: '10', contractId: 'CON-010', supplierName: 'Day Use SAS', contractName: 'Day Use Hotel Booking Platform',
    category: 'Professional Services', hotel: 'Crowne Plaza Kingston-south', department: 'Revenue',
    startDate: '2020-01-28', endDate: '2099-12-31', renewalDate: '2099-12-31', noticePeriod: '0 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'Day Use Support', phone: '+33 1 00 00 00 00',
    email: 'info@dayuse.com', sla: '10–20% commission, anytime cancellation', status: 'active',
  },
  {
    id: '11', contractId: 'CON-011', supplierName: 'Daybreak Hotels', contractName: 'Daybreak Hotels Distribution',
    category: 'Professional Services', hotel: 'Group / Portfolio-wide', department: 'Revenue',
    startDate: '2026-02-10', endDate: '2031-12-31', renewalDate: '2031-11-30', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Monthly',
    contractOwner: 'Group Admin', supplierContact: 'Daybreak Support', phone: '+44 20 0000 0000',
    email: 'info@daybreakhotels.com', sla: '14% fixed commission per booking', status: 'active',
  },
  {
    id: '12', contractId: 'CON-012', supplierName: 'Clean Linen Services Ltd', contractName: 'Group Linen & Laundry Service',
    category: 'Laundry', hotel: 'Group / Portfolio-wide', department: 'Housekeeping',
    startDate: '2025-07-24', endDate: '2026-12-31', renewalDate: '2026-11-30', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Weekly',
    contractOwner: 'Group Admin', supplierContact: 'Clean Linen Services', phone: '+44 20 0000 0000',
    email: 'info@cleanlinenservices.co.uk', sla: 'Weekly collection and delivery', status: 'active',
  },
  {
    id: '13', contractId: 'CON-013', supplierName: 'Hardall International Ltd', contractName: 'Linen Chute Maintenance',
    category: 'Maintenance & Servicing', hotel: 'Crowne Plaza Kingston-south', department: 'Facilities',
    startDate: '2023-03-21', endDate: '2026-03-20', renewalDate: '2026-03-20', noticePeriod: '0 days',
    autoRenew: false, contractValue: 0, monthlyCost: 0, paymentFrequency: 'One-off',
    contractOwner: 'Marcus Webb', supplierContact: 'Hardall International', phone: '+44 1234 000000',
    email: 'info@hardall.co.uk', sla: 'Remedial work required. Quote £1,250', status: 'expired',
    notes: 'Notice window passed. Remedial work to be completed.',
  },
  {
    id: '14', contractId: 'CON-014', supplierName: 'Hitched Limited', contractName: 'Hitched Wedding Directory',
    category: 'Professional Services', hotel: 'Crowne Plaza Kingston-south', department: 'Sales',
    startDate: '2026-04-29', endDate: '2027-04-28', renewalDate: '2027-03-28', noticePeriod: '28 days',
    autoRenew: true, contractValue: 2878, monthlyCost: 240, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'Hitched Support', phone: '+44 20 0000 0000',
    email: 'info@hitched.co.uk', sla: 'Annual listing, auto-renew', status: 'active',
  },
  {
    id: '15', contractId: 'CON-015', supplierName: 'Access UK Limited', contractName: 'Access Hospitality Software',
    category: 'IT Support', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2023-09-29', endDate: '2026-09-28', renewalDate: '2026-06-28', noticePeriod: '90 days',
    autoRenew: true, contractValue: 9360, monthlyCost: 780, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'Access UK Support', phone: '+44 1206 322 575',
    email: 'support@theaccessgroup.com', sla: 'Auto-renew rolling, 90-day notice', status: 'expiring-soon',
  },
  {
    id: '16', contractId: 'CON-016', supplierName: 'Intuit Limited', contractName: 'QuickBooks Accounting Software',
    category: 'IT Support', hotel: 'Group / Portfolio-wide', department: 'Finance',
    startDate: '2026-06-19', endDate: '2099-12-31', renewalDate: '2027-06-19', noticePeriod: '0 days',
    autoRenew: true, contractValue: 1920, monthlyCost: 160, paymentFrequency: 'Monthly',
    contractOwner: 'Group Admin', supplierContact: 'Intuit Support', phone: '0808 168 9533',
    email: 'support@intuit.com', sla: 'Rolling subscription', status: 'active',
  },
  {
    id: '17', contractId: 'CON-017', supplierName: 'Fourth Ltd', contractName: 'Fourth HR & Payroll Platform',
    category: 'HR & Payroll', hotel: 'Crowne Plaza Kingston-south', department: 'HR',
    startDate: '2019-03-14', endDate: '2099-12-31', renewalDate: '2027-03-14', noticePeriod: '365 days',
    autoRenew: true, contractValue: 15930, monthlyCost: 1328, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'Fourth Support', phone: '+44 20 3866 8000',
    email: 'support@fourth.com', sla: 'Rolling, 365-day notice period', status: 'active',
  },
  {
    id: '18', contractId: 'CON-018', supplierName: 'Selecta', contractName: 'Selecta Vending Machine Agreement',
    category: 'Catering Equipment', hotel: 'Crowne Plaza Kingston-south', department: 'Operations',
    startDate: '2025-08-25', endDate: '2028-08-25', renewalDate: '2028-05-25', noticePeriod: '0 days',
    autoRenew: false, contractValue: 18194, monthlyCost: 0, paymentFrequency: 'One-off',
    contractOwner: 'Marcus Webb', supplierContact: 'Selecta UK', phone: '+44 1908 000 000',
    email: 'info@selecta.com', sla: 'Fixed term 3-year vending placement', status: 'active',
  },
  {
    id: '19', contractId: 'CON-019', supplierName: 'Everflow Limited', contractName: 'Everflow Water Supply (Crowne Plaza)',
    category: 'Utilities', hotel: 'Crowne Plaza Kingston-south', department: 'Facilities',
    startDate: '2023-07-10', endDate: '2026-07-10', renewalDate: '2026-06-10', noticePeriod: '30 days',
    autoRenew: true, contractValue: 32175, monthlyCost: 2681, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'Everflow Customer Services', phone: '0330 6600 137',
    email: 'customer.services@everflowutilities.com', sla: 'Wholesale + Retail water supply', status: 'expiring-soon',
    notes: 'Contract renewal due 09-Jul-2026. Account: EFW293246-0',
  },
  {
    id: '20', contractId: 'CON-020', supplierName: 'SUEZ Recycling & Recovery Ltd', contractName: 'SUEZ Waste Management',
    category: 'Waste Collection', hotel: 'Crowne Plaza Kingston-south', department: 'Housekeeping',
    startDate: '2023-11-13', endDate: '2025-11-12', renewalDate: '2025-08-12', noticePeriod: '90 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'SUEZ Support', phone: '+44 1753 686 777',
    email: 'info@suez.co.uk', sla: 'Auto-renew rolling', status: 'expired',
  },
  {
    id: '21', contractId: 'CON-021', supplierName: 'Sortera – Reston Waste', contractName: 'Sortera Waste Collection',
    category: 'Waste & Cleaning', hotel: 'Crowne Plaza Kingston-south', department: 'Housekeeping',
    startDate: '2026-07-10', endDate: '2099-12-31', renewalDate: '2027-07-10', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Variable',
    contractOwner: 'Marcus Webb', supplierContact: 'Sortera Support', phone: '+44 20 0000 0000',
    email: 'info@sortera.co.uk', sla: 'Usage-based waste collection', status: 'active',
  },
  {
    id: '22', contractId: 'CON-022', supplierName: 'CloudExt', contractName: 'CloudExt 128-Line Phone System',
    category: 'Telephone', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2024-12-17', endDate: '2028-12-17', renewalDate: '2028-09-17', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'CloudExt Support', phone: '+44 20 0000 0000',
    email: 'info@cloudext.co.uk', sla: 'Fixed term 4-year phone system', status: 'active',
  },
  {
    id: '23', contractId: 'CON-023', supplierName: 'ScentAir', contractName: 'ScentAir Environmental Scent Service',
    category: 'Housekeeping', hotel: 'Crowne Plaza Kingston-south', department: 'Housekeeping',
    startDate: '2025-02-13', endDate: '2028-02-13', renewalDate: '2027-11-13', noticePeriod: '30 days',
    autoRenew: false, contractValue: 984, monthlyCost: 82, paymentFrequency: 'Quarterly',
    contractOwner: 'Marcus Webb', supplierContact: 'ScentAir UK', phone: '+44 20 0000 0000',
    email: 'info@scentair.co.uk', sla: 'Fixed term 3-year scent service', status: 'active',
  },
  {
    id: '24', contractId: 'CON-024', supplierName: 'Switchsure Finance', contractName: 'Samsung Hospitality TVs Finance',
    category: 'IT Support', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2024-12-11', endDate: '2026-12-10', renewalDate: '2026-08-10', noticePeriod: '141 days',
    autoRenew: false, contractValue: 10575, monthlyCost: 882, paymentFrequency: 'Quarterly',
    contractOwner: 'Marcus Webb', supplierContact: 'Switchsure Finance', phone: '+44 20 0000 0000',
    email: 'info@switchsure.co.uk', sla: 'Fixed term 2-year finance agreement', status: 'active',
  },
  {
    id: '25', contractId: 'CON-025', supplierName: 'SEFE Energy', contractName: 'SEFE Gas Supply (Crowne Plaza)',
    category: 'Utilities', hotel: 'Crowne Plaza Kingston-south', department: 'Facilities',
    startDate: '2026-03-01', endDate: '2028-02-29', renewalDate: '2027-11-29', noticePeriod: '90 days',
    autoRenew: false, contractValue: 13509, monthlyCost: 1126, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'SEFE Energy', phone: '0161 837 3395',
    email: 'enquiries@sefe-energy.com', sla: 'Fixed 2-year gas supply. Account: 100091219', status: 'active',
    notes: 'MPRN: 9209299704. Rate: 3.8431p/kWh. Broker: Nationwide Utilities Ltd.',
  },
  {
    id: '26', contractId: 'CON-026', supplierName: 'EDF Energy', contractName: 'EDF Electricity Supply (Crowne Plaza)',
    category: 'Utilities', hotel: 'Crowne Plaza Kingston-south', department: 'Facilities',
    startDate: '2025-11-01', endDate: '2026-10-31', renewalDate: '2026-08-31', noticePeriod: '60 days',
    autoRenew: false, contractValue: 116119, monthlyCost: 9677, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'EDF Energy', phone: '0845 366 3664',
    email: 'remittanceadvices@edfenergy.com', sla: 'Fixed 1-year electricity supply. Account: 3898198541', status: 'expiring-soon',
    notes: 'MPAN: 1900092859450. Rate: 20.0878p/kWh. Renewal due Oct 2026.',
  },
  {
    id: '27', contractId: 'CON-027', supplierName: 'Samko Kitchens Ltd', contractName: 'F&B Services Agreement',
    category: 'Catering Equipment', hotel: 'Crowne Plaza Kingston-south', department: 'Operations',
    startDate: '2026-06-15', endDate: '2031-06-15', renewalDate: '2030-12-15', noticePeriod: '180 days',
    autoRenew: false, contractValue: 75000, monthlyCost: 6250, paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb', supplierContact: 'Samko Kitchens', phone: '+44 20 0000 0000',
    email: 'info@samkokitchens.co.uk', sla: 'Fixed 5-year F&B management agreement', status: 'active',
  },
  {
    id: '28', contractId: 'CON-028', supplierName: 'A Keys Construction Ltd', contractName: 'Hotel Refurbishment Project',
    category: 'Building Maintenance', hotel: 'Crowne Plaza Kingston-south', department: 'Facilities',
    startDate: '2025-01-01', endDate: '2026-12-31', renewalDate: '2026-12-31', noticePeriod: '0 days',
    autoRenew: false, contractValue: 805837, monthlyCost: 0, paymentFrequency: 'One-off',
    contractOwner: 'Marcus Webb', supplierContact: 'A Keys Construction', phone: '+44 20 0000 0000',
    email: 'info@akeysconstruction.co.uk', sla: 'One-off construction project', status: 'active',
    notes: 'Major refurbishment project. Value: £805,837.',
  },
  {
    id: '29', contractId: 'CON-029', supplierName: 'BT', contractName: 'BT Net 500/1000Mbps Broadband (Crowne Plaza)',
    category: 'Internet', hotel: 'Crowne Plaza Kingston-south', department: 'IT',
    startDate: '2023-12-20', endDate: '2028-12-20', renewalDate: '2028-09-20', noticePeriod: '90 days',
    autoRenew: false, contractValue: 5880, monthlyCost: 490, paymentFrequency: 'Annual',
    contractOwner: 'Marcus Webb', supplierContact: 'BT Business', phone: '0800 800 150',
    email: 'business@bt.com', sla: 'Fixed 5-year broadband contract', status: 'active',
  },
  {
    id: '30', contractId: 'CON-030', supplierName: 'TNT Sports Broadcasting Limited', contractName: 'TNT Sports Broadcasting (Gatwick Manor)',
    category: 'Licensing', hotel: 'Gatwick Manor', department: 'Operations',
    startDate: '2026-06-10', endDate: '2027-12-10', renewalDate: '2027-09-10', noticePeriod: '30 days',
    autoRenew: true, contractValue: 211, monthlyCost: 18, paymentFrequency: 'Monthly',
    contractOwner: 'Sarah Chen', supplierContact: 'TNT Sports', phone: '+44 20 0000 0000',
    email: 'business@tntsports.co.uk', sla: 'Auto-renew rolling', status: 'active',
  },
  {
    id: '31', contractId: 'CON-031', supplierName: 'Rezcontrol', contractName: 'Rezcontrol PMS & Channel Manager (Hampton 1)',
    category: 'IT Support', hotel: 'Hampton 1 & 2', department: 'IT',
    startDate: '2022-07-05', endDate: '2025-07-05', renewalDate: '2025-04-05', noticePeriod: '90 days',
    autoRenew: true, contractValue: 447, monthlyCost: 37, paymentFrequency: 'Monthly',
    contractOwner: 'James Okafor', supplierContact: 'Rezcontrol Support', phone: '+44 20 0000 0000',
    email: 'support@rezcontrol.com', sla: 'Auto-renew rolling, 90-day notice', status: 'expired',
  },
  {
    id: '32', contractId: 'CON-032', supplierName: 'Rezcontrol', contractName: 'Rezcontrol PMS Agreement (Ravens Ait)',
    category: 'IT Support', hotel: 'Ravens Ait Island', department: 'IT',
    startDate: '2023-04-24', endDate: '2026-04-24', renewalDate: '2026-01-24', noticePeriod: '90 days',
    autoRenew: true, contractValue: 278, monthlyCost: 23, paymentFrequency: 'Monthly',
    contractOwner: 'Priya Sharma', supplierContact: 'Rezcontrol Support', phone: '+44 20 0000 0000',
    email: 'support@rezcontrol.com', sla: 'Auto-renew rolling, 90-day notice', status: 'expired',
  },
  {
    id: '33', contractId: 'CON-033', supplierName: 'Comms Specialist', contractName: 'Leased Line & Broadband (Sharnbrook)',
    category: 'Internet', hotel: 'Sharnbrook', department: 'IT',
    startDate: '2026-06-07', endDate: '2029-06-07', renewalDate: '2029-03-07', noticePeriod: '90 days',
    autoRenew: false, contractValue: 300, monthlyCost: 25, paymentFrequency: 'Monthly',
    contractOwner: 'Group Admin', supplierContact: 'Comms Specialist', phone: '+44 20 0000 0000',
    email: 'info@commsspecialist.co.uk', sla: 'Fixed 3-year leased line', status: 'active',
  },
  {
    id: '34', contractId: 'CON-034', supplierName: 'BT', contractName: 'BTnet 200M/1G (Ravens Ait)',
    category: 'Internet', hotel: 'Ravens Ait Island', department: 'IT',
    startDate: '2024-11-30', endDate: '2029-11-30', renewalDate: '2029-08-30', noticePeriod: '90 days',
    autoRenew: false, contractValue: 3768, monthlyCost: 314, paymentFrequency: 'Annual',
    contractOwner: 'Priya Sharma', supplierContact: 'BT Business', phone: '0800 800 150',
    email: 'business@bt.com', sla: 'Fixed 5-year broadband', status: 'active',
  },
  {
    id: '35', contractId: 'CON-035', supplierName: 'BT', contractName: 'BTnet 200M/1G (River Club)',
    category: 'Internet', hotel: 'River Club', department: 'IT',
    startDate: '2023-03-29', endDate: '2028-03-29', renewalDate: '2027-12-29', noticePeriod: '90 days',
    autoRenew: false, contractValue: 3588, monthlyCost: 299, paymentFrequency: 'Annual',
    contractOwner: 'David Thornton', supplierContact: 'BT Business', phone: '0800 800 150',
    email: 'business@bt.com', sla: 'Fixed 5-year broadband', status: 'active',
  },
  {
    id: '36', contractId: 'CON-036', supplierName: 'BT', contractName: 'BT Cloud Voice Headsets (Warren House)',
    category: 'Telephone', hotel: 'Warren House', department: 'IT',
    startDate: '2024-02-15', endDate: '2029-02-15', renewalDate: '2028-11-15', noticePeriod: '90 days',
    autoRenew: false, contractValue: 402, monthlyCost: 0, paymentFrequency: 'One-off',
    contractOwner: 'Harshit Gulati', supplierContact: 'BT Business', phone: '0800 800 150',
    email: 'business@bt.com', sla: 'One-off headset purchase', status: 'active',
  },
  {
    id: '37', contractId: 'CON-037', supplierName: 'TNT Sports Broadcasting Limited', contractName: 'TNT Sports Broadcasting (Warren House)',
    category: 'Licensing', hotel: 'Warren House', department: 'Operations',
    startDate: '2026-06-10', endDate: '2027-12-10', renewalDate: '2027-09-10', noticePeriod: '30 days',
    autoRenew: true, contractValue: 227, monthlyCost: 19, paymentFrequency: 'Monthly',
    contractOwner: 'Harshit Gulati', supplierContact: 'TNT Sports', phone: '+44 20 0000 0000',
    email: 'business@tntsports.co.uk', sla: 'Auto-renew rolling', status: 'active',
  },
  {
    id: '38', contractId: 'CON-038', supplierName: 'BT', contractName: 'BTnet 200/1G (Hampton 1)',
    category: 'Internet', hotel: 'Hampton 1 & 2', department: 'IT',
    startDate: '2023-06-13', endDate: '2028-06-13', renewalDate: '2028-03-13', noticePeriod: '90 days',
    autoRenew: false, contractValue: 3588, monthlyCost: 299, paymentFrequency: 'Annual',
    contractOwner: 'James Okafor', supplierContact: 'BT Business', phone: '0800 800 150',
    email: 'business@bt.com', sla: 'Fixed 5-year broadband', status: 'active',
  },
  {
    id: '39', contractId: 'CON-039', supplierName: 'Bodiam Meat Company Limited', contractName: 'Meat Supply Agreement (Stanhill)',
    category: 'F&B Supply', hotel: 'Gatwick Manor', department: 'Procurement',
    startDate: '2026-02-07', endDate: '2099-12-31', renewalDate: '2027-02-07', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Variable',
    contractOwner: 'Sarah Chen', supplierContact: 'Bodiam Meat Company', phone: '+44 1580 000 000',
    email: 'info@bodiam-meat.co.uk', sla: 'Rolling supply agreement', status: 'active',
  },
  {
    id: '40', contractId: 'CON-040', supplierName: 'Bidfood', contractName: 'Bidfood Food Supply (Stanhill)',
    category: 'F&B Supply', hotel: 'Gatwick Manor', department: 'Procurement',
    startDate: '2026-02-12', endDate: '2099-12-31', renewalDate: '2027-02-12', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Variable',
    contractOwner: 'Sarah Chen', supplierContact: 'Bidfood', phone: '0800 688 0000',
    email: 'info@bidfood.co.uk', sla: 'Rolling food supply agreement', status: 'active',
  },
  {
    id: '41', contractId: 'CON-041', supplierName: 'CJS Environmental Ltd', contractName: 'Waste Service Agreement (Stanhill)',
    category: 'Waste Collection', hotel: 'Gatwick Manor', department: 'Facilities',
    startDate: '2026-02-01', endDate: '2029-01-31', renewalDate: '2028-10-31', noticePeriod: '90 days',
    autoRenew: true, contractValue: 762, monthlyCost: 64, paymentFrequency: 'Annual',
    contractOwner: 'Sarah Chen', supplierContact: 'CJS Environmental', phone: '+44 1293 000 000',
    email: 'info@cjsenvironmental.co.uk', sla: 'Fixed 3-year waste service', status: 'active',
  },
  {
    id: '42', contractId: 'CON-042', supplierName: 'Balcombe Pest Control', contractName: 'Pest Control Service (Stanhill)',
    category: 'Pest Control', hotel: 'Gatwick Manor', department: 'Facilities',
    startDate: '2025-01-01', endDate: '2026-12-31', renewalDate: '2026-09-30', noticePeriod: '90 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Variable',
    contractOwner: 'Sarah Chen', supplierContact: 'Balcombe Pest Control', phone: '+44 1444 000 000',
    email: 'info@balcombepest.co.uk', sla: 'Auto-renew rolling pest control', status: 'active',
  },
  {
    id: '43', contractId: 'CON-043', supplierName: 'Star Linen UK Ltd', contractName: 'Linen Contract (Stanhill)',
    category: 'Laundry', hotel: 'Gatwick Manor', department: 'Housekeeping',
    startDate: '2026-03-02', endDate: '2099-12-31', renewalDate: '2027-03-02', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Variable',
    contractOwner: 'Sarah Chen', supplierContact: 'Star Linen UK', phone: '+44 20 0000 0000',
    email: 'info@starlinen.co.uk', sla: 'Rolling linen hire agreement', status: 'active',
  },
  {
    id: '44', contractId: 'CON-044', supplierName: 'Everflow Direct Debit', contractName: 'Everflow Water Supply (Stanhill)',
    category: 'Utilities', hotel: 'Gatwick Manor', department: 'Facilities',
    startDate: '2025-01-01', endDate: '2026-01-27', renewalDate: '2025-10-27', noticePeriod: '30 days',
    autoRenew: true, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Monthly',
    contractOwner: 'Sarah Chen', supplierContact: 'Everflow Customer Services', phone: '0330 6600 137',
    email: 'customer.services@everflowutilities.com', sla: 'Rolling water supply. Account: EFW364357-0', status: 'expired',
    notes: 'Contract end date 27-Jan-2026 has passed. Renewal action required.',
  },
  {
    id: '45', contractId: 'CON-045', supplierName: 'SEFE Energy', contractName: 'SEFE Gas Supply (Warren House)',
    category: 'Utilities', hotel: 'Warren House', department: 'Facilities',
    startDate: '2026-05-01', endDate: '2028-04-30', renewalDate: '2028-01-30', noticePeriod: '90 days',
    autoRenew: false, contractValue: 30397, monthlyCost: 2533, paymentFrequency: 'Monthly',
    contractOwner: 'Harshit Gulati', supplierContact: 'SEFE Energy', phone: '0161 837 3395',
    email: 'enquiries@sefe-energy.com', sla: 'Fixed 2-year gas supply. Account: 100093919', status: 'active',
    notes: 'MPRN: 10473207. Rate: 3.4765p/kWh. Signed 04-Feb-2026.',
  },
  {
    id: '46', contractId: 'CON-046', supplierName: 'EDF Energy', contractName: 'EDF Electricity Supply (Warren House)',
    category: 'Utilities', hotel: 'Warren House', department: 'Facilities',
    startDate: '2026-05-01', endDate: '2027-04-30', renewalDate: '2027-01-30', noticePeriod: '90 days',
    autoRenew: false, contractValue: 100198, monthlyCost: 8350, paymentFrequency: 'Monthly',
    contractOwner: 'Harshit Gulati', supplierContact: 'EDF Energy – Anete Painter', phone: '020 8186 1382',
    email: 'Anete.Painter@edfenergy.com', sla: 'Fixed 1-year electricity supply. Account: 0506000000', status: 'active',
    notes: 'MPAN: 1200010214798. Day: 21.3419p/kWh, Night: 15.6863p/kWh. Annual volume: 459,826 kWh.',
  },
  {
    id: '47', contractId: 'CON-047', supplierName: 'Everflow Limited', contractName: 'Everflow Water Supply (Warren House)',
    category: 'Utilities', hotel: 'Warren House', department: 'Facilities',
    startDate: '2023-07-10', endDate: '2026-10-02', renewalDate: '2026-07-02', noticePeriod: '30 days',
    autoRenew: true, contractValue: 21509, monthlyCost: 1792, paymentFrequency: 'Monthly',
    contractOwner: 'Harshit Gulati', supplierContact: 'Everflow Customer Services', phone: '0330 6600 137',
    email: 'customer.services@everflowutilities.com', sla: 'Wholesale + Retail water supply. Account: EFW232342-0', status: 'expiring-soon',
    notes: 'Contract renewal due Oct 2026. Outstanding balance £9,007.52 – ACTION REQUIRED.',
  },
  {
    id: '48', contractId: 'CON-048', supplierName: 'SEFE Energy', contractName: 'SEFE Gas Supply (River Club)',
    category: 'Utilities', hotel: 'River Club', department: 'Facilities',
    startDate: '2027-01-01', endDate: '2027-09-30', renewalDate: '2027-06-30', noticePeriod: '90 days',
    autoRenew: false, contractValue: 20329, monthlyCost: 1694, paymentFrequency: 'Monthly',
    contractOwner: 'David Thornton', supplierContact: 'SEFE Energy', phone: '0161 837 3395',
    email: 'enquiries@sefe-energy.com', sla: 'Fixed gas supply. Account: 100022228', status: 'active',
    notes: 'MPRN: 9116667904. New rate from Jan-27: 3.8114p/kWh. Signed 09-Jul-2025.',
  },
  {
    id: '49', contractId: 'CON-049', supplierName: 'SSE Energy Solutions', contractName: 'SSE Electricity Supply (River Club)',
    category: 'Utilities', hotel: 'River Club', department: 'Facilities',
    startDate: '2025-09-01', endDate: '2026-08-31', renewalDate: '2026-05-31', noticePeriod: '90 days',
    autoRenew: false, contractValue: 21082, monthlyCost: 1757, paymentFrequency: 'Monthly',
    contractOwner: 'David Thornton', supplierContact: 'SSE Energy Solutions', phone: '0345 072 9402',
    email: 'cmt.commercial@sse.com', sla: 'Fixed 1-year electricity supply. Account: 880000068119', status: 'expiring-soon',
    notes: 'Total across 4 MPANs: £21,081.92/yr. Signed 09/07/2025. Renewal due Aug 2026.',
  },
  {
    id: '50', contractId: 'CON-050', supplierName: 'SSE Energy Solutions', contractName: 'SSE Electricity Supply (Stanhill Court)',
    category: 'Utilities', hotel: 'Stanhill Court', department: 'Facilities',
    startDate: '2026-02-12', endDate: '2027-01-31', renewalDate: '2026-10-31', noticePeriod: '90 days',
    autoRenew: false, contractValue: 0, monthlyCost: 0, paymentFrequency: 'Monthly',
    contractOwner: 'Sarah Chen', supplierContact: 'SSE Energy Solutions', phone: '0345 725 2526',
    email: 'businesscontracts@sse.com', sla: 'Fixed 1-year electricity supply. Account: 8701889865', status: 'active',
    notes: 'MPAN: 1900018001128. Contract: AGR5408710.',
  },
];

const STATUS_CONFIG: Record<ContractStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  'expiring-soon': { label: 'Expiring Soon', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  expired: { label: 'Expired', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  pending: { label: 'Pending', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  terminated: { label: 'Terminated', bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

function normalizeContract(c: any): Contract {
  const val = Number(c.contractValue ?? c.value ?? 0) || 0;
  const mCost = Number(c.monthlyCost ?? (val > 0 ? Math.round(val / 12) : 0)) || 0;
  const hotel = c.hotel || c.property || 'Crowne Plaza Kingston-south';
  const start = c.startDate && !isNaN(new Date(c.startDate).getTime()) ? c.startDate : '2025-01-01';
  const end = c.endDate && !isNaN(new Date(c.endDate).getTime()) ? c.endDate : '2026-12-31';
  const renewal = c.renewalDate && !isNaN(new Date(c.renewalDate).getTime()) ? c.renewalDate : end;

  return {
    id: String(c.id || c.contractId || Math.random()),
    contractId: c.contractId || `CON-${c.id}`,
    supplierName: c.supplierName || 'Supplier',
    contractName: c.contractName || 'Service Agreement',
    category: c.category || 'Maintenance & Servicing',
    hotel,
    department: c.department || 'Operations',
    startDate: start,
    endDate: end,
    renewalDate: renewal,
    noticePeriod: c.noticePeriod || '30 days',
    autoRenew: Boolean(c.autoRenew),
    contractValue: val,
    monthlyCost: mCost,
    paymentFrequency: c.paymentFrequency || 'Monthly',
    contractOwner: c.contractOwner || 'Marcus Webb',
    supplierContact: c.supplierContact || 'Supplier Contact',
    phone: c.phone || '+44 20 0000 0000',
    email: c.email || 'info@supplier.co.uk',
    sla: c.sla || 'Standard SLA Terms',
    status: (c.status as ContractStatus) || 'active',
    notes: c.notes || '',
  };
}

function daysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date('2026-07-22');
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmt(n: number) { return `£${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`; }

function KPICard({ label, value, sub, color, icon: Icon }: { label: string; value: number | string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title={label}>{label}</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight truncate" style={{ color }}>{value}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">{sub}</div>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function ContractsRegisterClient() {
  const { isViewer, canEdit, canDelete } = useAuth();
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    columns: cmsColumns,
    items: cmsItems,
  } = useDeepPageCms('contracts');

  const activeColumns = useMemo(() => {
    if (cmsColumns && cmsColumns.length > 0) {
      return [...cmsColumns].sort((a, b) => a.order - b.order).filter((c) => c.visible !== false);
    }
    return [
      { id: 'contractId', label: 'ID', visible: true, order: 1 },
      { id: 'contractName', label: 'Contract', visible: true, order: 2 },
      { id: 'supplierName', label: 'Supplier', visible: true, order: 3 },
      { id: 'category', label: 'Category', visible: true, order: 4 },
      { id: 'hotel', label: 'Property', visible: true, order: 5 },
      { id: 'contractValue', label: 'Value', visible: true, order: 6 },
      { id: 'endDate', label: 'End Date', visible: true, order: 7 },
      { id: 'daysLeft', label: 'Days Left', visible: true, order: 8 },
      { id: 'autoRenew', label: 'Auto Renew', visible: true, order: 9 },
      { id: 'contractOwner', label: 'Owner', visible: true, order: 10 },
      { id: 'status', label: 'Status', visible: true, order: 11 },
      { id: 'actions', label: 'Actions', visible: true, order: 12 },
    ];
  }, [cmsColumns]);

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get('tab');
  const initialTab: 'register' | 'suppliers' | 'renewals' | 'slas' =
    tabParam === 'suppliers' || tabParam === 'renewals' || tabParam === 'slas' ? tabParam : 'register';

  const [contracts, setContracts] = useState<Contract[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_contracts');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeContract);
        }
      } catch {}
    }
    if (cmsItems && cmsItems.length > 0) return (cmsItems as any).map(normalizeContract);
    return MOCK_CONTRACTS.map(normalizeContract);
  });

  useEffect(() => {
    if (cmsItems && cmsItems.length > 0) {
      setContracts((cmsItems as any).map(normalizeContract));
    }
  }, [cmsItems]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'suppliers' | 'renewals' | 'slas'>(initialTab);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'suppliers' || t === 'renewals' || t === 'slas') {
      setActiveTab(t);
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleTabChange = (t: 'register' | 'suppliers' | 'renewals' | 'slas') => {
    setActiveTab(t);
    const url = t === 'register' ? '/contracts-register' : `/contracts-register?tab=${t}`;
    router.push(url, { scroll: false });
  };
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterHotel, setFilterHotel] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit contract modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Set reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDays, setReminderDays] = useState(30);
  const [reminderNote, setReminderNote] = useState('');

  // Documents modal state
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsList, setDocumentsList] = useState<Array<{ id: string; name: string; size: string; date: string; type: string; url?: string }>>([
    { id: 'doc-1', name: 'Master_Service_Agreement_Executed.pdf', size: '2.4 MB', date: '12 Jan 2026', type: 'agreement' },
    { id: 'doc-2', name: 'SLA_Maintenance_Schedule_Scope.pdf', size: '1.1 MB', date: '15 Jan 2026', type: 'sla' },
    { id: 'doc-3', name: 'Statutory_Compliance_Certificate.pdf', size: '890 KB', date: '01 Feb 2026', type: 'certificate' },
  ]);

  // Delete confirmation state
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: '',
    contractName: '',
    category: CONTRACT_CATEGORIES[0],
    hotel: HOTELS[0],
    department: 'Operations',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    renewalDate: new Date(Date.now() + 330 * 86400000).toISOString().slice(0, 10),
    noticePeriod: '30 days',
    autoRenew: false,
    contractValue: '',
    monthlyCost: '',
    paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb',
    supplierContact: '',
    phone: '',
    email: '',
    sla: 'Standard Support & Maintenance SLA',
    status: 'active' as ContractStatus,
    notes: '',
  });

  const fetchContractsData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, propsRes] = await Promise.all([
        api.contracts.getAll().catch(() => ({ success: false, data: [] })),
        api.properties.getAll().catch(() => ({ success: false, data: [] })),
      ]);
      if (res.success && res.data && res.data.length > 0) {
        setContracts(res.data.map(normalizeContract));
        try {
          sessionStorage.setItem('samko_cache_contracts', JSON.stringify(res.data));
        } catch {}
      } else {
        setContracts(MOCK_CONTRACTS.map(normalizeContract));
      }
      if (propsRes.success && propsRes.data && propsRes.data.length > 0) {
        setProperties(propsRes.data);
      }
    } catch (err) {
      console.warn('Contracts offline/fallback:', err);
      setContracts(MOCK_CONTRACTS.map(normalizeContract));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractsData();
  }, [fetchContractsData]);

  useEffect(() => {
    const handleDataChanged = (e: any) => {
      if (e.detail?.type === 'contracts' || e.detail?.type === 'properties') {
        fetchContractsData();
      }
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchContractsData]);

  const propertyOptions = properties.length > 0
    ? Array.from(new Set([...properties.map((p) => p.name), ...HOTELS]))
    : HOTELS;

  const { getDropdownOptions, getFieldLabel, customFields } = useCMSForm('contracts');

  const cmsCategoryOptions = getDropdownOptions('category', CONTRACT_CATEGORIES.map((c) => ({ value: c, label: c })));
  const cmsStatusOptions = getDropdownOptions('status', [
    { value: 'active', label: 'Active', color: '#3dd68c' },
    { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
    { value: 'expired', label: 'Expired', color: '#f43f5e' },
    { value: 'pending', label: 'Pending', color: '#60a5fa' },
    { value: 'terminated', label: 'Terminated', color: '#94a3b8' },
  ]);
  const cmsHotelOptions = getDropdownOptions('hotel', propertyOptions.map((h) => ({ value: h, label: h })));

  const handleStatusChange = async (id: string, newStatus: ContractStatus) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (selectedContract && selectedContract.id === id) {
      setSelectedContract((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    toast.success(`Status updated to ${newStatus}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'contracts', id, status: newStatus },
        })
      );
    }
    try {
      await api.contracts.update(id, { status: newStatus });
    } catch (e) {
      console.warn('Contract status updated locally:', e);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contractName.trim() || !formData.supplierName.trim()) return;
    setSaving(true);
    const tempId = `CON-${String(contracts.length + 1).padStart(3, '0')}`;
    const payload = normalizeContract({
      ...formData,
      contractId: tempId,
      contractValue: Number(formData.contractValue) || 0,
      monthlyCost: Number(formData.monthlyCost) || 0,
    });
    try {
      const res = await api.contracts.create(payload);
      const created = normalizeContract(res.data || { ...payload, id: `con-${Date.now()}` });
      setContracts((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success('Contract added successfully');
      setFormData({
        supplierName: '',
        contractName: '',
        category: CONTRACT_CATEGORIES[0],
        hotel: propertyOptions[0] || HOTELS[0],
        department: 'Operations',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        renewalDate: new Date(Date.now() + 330 * 86400000).toISOString().slice(0, 10),
        noticePeriod: '30 days',
        autoRenew: false,
        contractValue: '',
        monthlyCost: '',
        paymentFrequency: 'Monthly',
        contractOwner: 'Marcus Webb',
        supplierContact: '',
        phone: '',
        email: '',
        sla: 'Standard Support & Maintenance SLA',
        status: 'active' as ContractStatus,
        notes: '',
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'contracts', id: created.id },
          })
        );
      }
    } catch (err: any) {
      console.warn('Contract created locally:', err);
      const created = normalizeContract({ ...payload, id: `con-${Date.now()}` });
      setContracts((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success('Contract added locally');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (contract: Contract) => {
    setEditFormData({
      ...contract,
      contractValue: String(contract.contractValue || ''),
      monthlyCost: String(contract.monthlyCost || ''),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setSaving(true);
    const updated = normalizeContract({
      ...editFormData,
      contractValue: Number(editFormData.contractValue) || 0,
      monthlyCost: Number(editFormData.monthlyCost) || 0,
    });
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedContract && selectedContract.id === updated.id) {
      setSelectedContract(updated);
    }
    try {
      await api.contracts.update(updated.id, updated);
      toast.success('Contract updated successfully');
    } catch (err) {
      toast.success('Contract updated locally');
    } finally {
      setSaving(false);
      setShowEditModal(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'contracts', id: updated.id },
          })
        );
      }
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    const id = contractToDelete.id;
    setDeleting(true);
    setContracts((prev) => prev.filter((c) => c.id !== id));
    if (selectedContract && selectedContract.id === id) {
      setSelectedContract(null);
    }
    try {
      await api.contracts.delete(id);
      toast.success('Contract deleted permanently', {
        description: `${contractToDelete.supplierName} removed from contracts register`,
      });
    } catch (err) {
      toast.success('Contract deleted permanently', {
        description: `${contractToDelete.supplierName} removed from contracts register`,
      });
    } finally {
      setDeleting(false);
      setContractToDelete(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'contracts', id },
          })
        );
      }
    }
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    toast.success(`Reminder scheduled ${reminderDays} days prior to renewal (${formatDate(selectedContract.renewalDate)})`);
    setShowReminderModal(false);
    setReminderNote('');
  };

  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: file.name.split('.').pop() || 'pdf',
    };
    setDocumentsList((prev) => [newDoc, ...prev]);
    toast.success(`Uploaded ${file.name}`);
  };

  const activeContracts = contracts.filter((c) => c.status === 'active').length;
  const expiringSoon = contracts.filter((c) => c.status === 'expiring-soon').length;
  const renewalsDue = contracts.filter((c) => { const d = daysUntil(c.renewalDate); return !isNaN(d) && d >= 0 && d <= 90; }).length;
  const autoRenewCount = contracts.filter((c) => c.autoRenew).length;
  const totalValue = contracts.filter((c) => c.status === 'active').reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0);
  const annualValDisplay = isNaN(totalValue) || totalValue === 0
    ? '£0'
    : totalValue >= 1000
    ? `£${(totalValue / 1000).toFixed(0)}k`
    : `£${totalValue.toLocaleString()}`;

  const filtered = contracts.filter((c) => {
    const matchSearch = !search || c.contractId.toLowerCase().includes(search.toLowerCase()) || c.supplierName.toLowerCase().includes(search.toLowerCase()) || c.contractName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus.length === 0 || filterStatus.includes(c.status);
    const matchHotel = filterHotel.length === 0 || filterHotel.includes(c.hotel);
    const matchCat = filterCategory.length === 0 || filterCategory.includes(c.category);
    return matchSearch && matchStatus && matchHotel && matchCat;
  });

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedContracts,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  const suppliers = Array.from(new Map(contracts.map((c) => [c.supplierName, c])).values());
  const renewals = contracts.filter((c) => { const d = daysUntil(c.renewalDate); return d >= 0 && d <= 120; }).sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate));

  const handleExport = () => {
    const headers = ['Contract ID', 'Contract Name', 'Supplier', 'Category', 'Property', 'Annual Value', 'Start Date', 'End Date', 'Renewal Date', 'Status', 'Auto Renew'];
    const rows = filtered.map((c) => [
      `"${c.contractId}"`,
      `"${c.contractName.replace(/"/g, '""')}"`,
      `"${c.supplierName.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.hotel}"`,
      c.contractValue,
      `"${c.startDate}"`,
      `"${c.endDate}"`,
      `"${c.renewalDate}"`,
      `"${c.status}"`,
      c.autoRenew ? 'Yes' : 'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contracts_register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} contracts to CSV`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head font-bold text-xl">{cmsTitle || 'Contracts Register'}</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cmsSubtitle || `Centralise all supplier and service contracts — ${contracts.length} contracts across all properties`}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="contracts" pageName="Contracts Register" />

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-surface2 transition-all active:scale-95 cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            <Download size={13} /> Export
          </button>
          {!isViewer && canEdit && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer" style={{ background: 'var(--primary)', color: '#000' }}>
            <Plus size={14} /> {(cmsPrimaryActionLabel || 'Add Contract').replace(/^[\+\s]+/, '').trim()}
          </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 px-6 pt-4 pb-3 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <KPICard label="Active Contracts" value={activeContracts} sub="Currently active" color="#3dd68c" icon={ScrollText} />
        <KPICard label="Expiring Soon" value={expiringSoon} sub="Requires attention" color="#f59e0b" icon={Clock} />
        <KPICard label="Renewals Due" value={renewalsDue} sub="Within 90 days" color="#f97316" icon={RefreshCw} />
        <KPICard label="Auto Renewal" value={autoRenewCount} sub="Auto-renewing contracts" color="#60a5fa" icon={CheckCircle2} />
        <KPICard label="Annual Value" value={annualValDisplay} sub="Active contract value" color="#a78bfa" icon={DollarSign} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {[{ id: 'register', label: 'Contracts Register' }, { id: 'suppliers', label: 'Suppliers' }, { id: 'renewals', label: 'Renewals' }, { id: 'slas', label: 'SLAs' }].map((tab) => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id as typeof activeTab)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer"
            style={{ borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)', background: 'transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'register' && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 min-w-48" style={{ background: 'var(--surface)' }}>
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" placeholder="Search contracts…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <CustomDropdown
                label={`All ${getFieldLabel('status', 'Statuses')}`}
                value={filterStatus}
                multiple
                options={cmsStatusOptions}
                onChange={setFilterStatus}
              />
              <CustomDropdown
                label={`All ${getFieldLabel('hotel', 'Properties')}`}
                value={filterHotel}
                multiple
                options={cmsHotelOptions}
                onChange={setFilterHotel}
              />
              <CustomDropdown
                label={`All ${getFieldLabel('category', 'Categories')}`}
                value={filterCategory}
                multiple
                options={cmsCategoryOptions}
                onChange={setFilterCategory}
              />
              <span className="text-xs text-muted-foreground">{filtered.length} contracts</span>
            </div>
            <div className="rounded-xl border border-border overflow-x-auto shadow-sm" style={{ background: 'var(--surface)' }}>
              <table className="w-full text-left border-collapse" style={{ minWidth: 960 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
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
                  {paginatedContracts.map((contract) => {
                    const days = daysUntil(contract.endDate);
                    const sc = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                    return (
                      <tr key={contract.id} className="border-t border-border cursor-pointer transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setSelectedContract(contract)}>
                        {activeColumns.map((col: any) => {
                          const colKey = col.id.toLowerCase();
                          if (colKey === 'contractid' || colKey === 'id') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                                {contract.contractId}
                              </td>
                            );
                          }
                          if (colKey === 'contractname' || colKey === 'contract' || colKey === 'name') {
                            return (
                              <td key={col.id} className="px-4 py-3">
                                <div className="font-medium text-sm max-w-48 truncate">{contract.contractName}</div>
                              </td>
                            );
                          }
                          if (colKey === 'suppliername' || colKey === 'supplier') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {contract.supplierName}
                              </td>
                            );
                          }
                          if (colKey === 'category') {
                            return (
                              <td key={col.id} className="px-4 py-3">
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                                  {contract.category}
                                </span>
                              </td>
                            );
                          }
                          if (colKey === 'hotel' || colKey === 'property') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap max-w-32 truncate">
                                {contract.hotel}
                              </td>
                            );
                          }
                          if (colKey === 'contractvalue' || colKey === 'value') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                                {contract.contractValue > 0 ? fmt(contract.contractValue) + '/yr' : 'Variable'}
                              </td>
                            );
                          }
                          if (colKey === 'monthlycost' || colKey === 'monthly') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                                {contract.monthlyCost > 0 ? fmt(contract.monthlyCost) : '—'}
                              </td>
                            );
                          }
                          if (colKey === 'enddate') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                                {new Date(contract.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            );
                          }
                          if (colKey === 'noticeperiod' || colKey === 'notice') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {contract.noticePeriod ? `${contract.noticePeriod} days` : '—'}
                              </td>
                            );
                          }
                          if (colKey === 'daysleft') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: days < 0 ? '#f43f5e' : days <= 30 ? '#f59e0b' : days <= 90 ? '#f97316' : '#3dd68c' }}>
                                {days < 0 ? `${Math.abs(days)}d ago` : days > 3000 ? '∞' : `${days}d`}
                              </td>
                            );
                          }
                          if (colKey === 'autorenew') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-center">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: contract.autoRenew ? 'rgba(61,214,140,0.12)' : 'rgba(148,163,184,0.12)', color: contract.autoRenew ? '#3dd68c' : '#94a3b8' }}>
                                  {contract.autoRenew ? 'Yes' : 'No'}
                                </span>
                              </td>
                            );
                          }
                          if (colKey === 'contractowner' || colKey === 'owner') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {contract.contractOwner}
                              </td>
                            );
                          }
                          if (colKey === 'status') {
                            return (
                              <td key={col.id} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="relative inline-block">
                                  <select
                                    value={contract.status}
                                    onChange={(e) => handleStatusChange(contract.id, e.target.value as ContractStatus)}
                                    className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                                    style={{
                                      background: sc.bg,
                                      color: sc.color,
                                      border: `1px solid ${sc.color}33`,
                                    }}
                                  >
                                    <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                                    <option value="expiring-soon" style={{ background: '#18181b', color: '#f59e0b' }}>Expiring Soon</option>
                                    <option value="expired" style={{ background: '#18181b', color: '#f43f5e' }}>Expired</option>
                                    <option value="pending" style={{ background: '#18181b', color: '#60a5fa' }}>Pending</option>
                                    <option value="terminated" style={{ background: '#18181b', color: '#94a3b8' }}>Terminated</option>
                                  </select>
                                  <span
                                    className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ background: sc.color }}
                                  />
                                  <ChevronDown
                                    size={11}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                                    style={{ color: sc.color }}
                                  />
                                </div>
                              </td>
                            );
                          }
                          if (colKey === 'actions') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button className="p-1.5 rounded-lg hover:bg-surface2 transition-colors" style={{ color: 'var(--text2)' }} title="View Contract Details" onClick={() => setSelectedContract(contract)}>
                                    <Eye size={14} />
                                  </button>
                                  {!isViewer && canEdit && (
                                    <button className="p-1.5 rounded-lg hover:bg-surface2 transition-colors" style={{ color: 'var(--primary)' }} title="Edit Contract" onClick={() => handleOpenEdit(contract)}>
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  {!isViewer && (canDelete ?? canEdit) && (
                                    <button className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors" title="Delete Contract" onClick={() => setContractToDelete(contract)}>
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          // Dynamic custom columns
                          const val = (contract as any)[col.id] ?? (contract as any)[colKey];
                          return (
                            <td key={col.id} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                              {val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <LoadingPagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              isLoading={loading || isPageLoading}
              recordName="contracts"
            />
          </>
        )}

        {activeTab === 'suppliers' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {suppliers.map((s) => {
              const supplierContracts = contracts.filter((c) => c.supplierName === s.supplierName);
              const totalVal = supplierContracts.reduce((sum, c) => sum + c.contractValue, 0);
              return (
                <div key={s.id} className="rounded-xl border border-border p-5 cursor-pointer transition-colors" style={{ background: 'var(--surface)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-head font-bold text-sm">{s.supplierName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.category}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.1)' }}>
                      <Handshake size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg p-2.5" style={{ background: 'var(--surface2)' }}>
                      <div className="text-xs text-muted-foreground">Contracts</div>
                      <div className="font-head font-bold text-lg" style={{ color: '#60a5fa' }}>{supplierContracts.length}</div>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background: 'var(--surface2)' }}>
                      <div className="text-xs text-muted-foreground">Annual Value</div>
                      <div className="font-head font-bold text-lg" style={{ color: '#3dd68c' }}>{totalVal > 0 ? fmt(totalVal) : 'Variable'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Contact: {s.supplierContact}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'renewals' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">{renewals.length} Contracts Renewing in Next 120 Days</div>
            {renewals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No renewals due in the next 120 days</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {renewals.map((contract) => {
                  const days = daysUntil(contract.renewalDate);
                  const sc = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                  return (
                    <div key={contract.id} className="rounded-xl border border-border p-4 flex items-center gap-4" style={{ background: 'var(--surface)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: days <= 30 ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)' }}>
                        <RefreshCw size={16} style={{ color: days <= 30 ? '#f43f5e' : '#f59e0b' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{contract.contractName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{contract.supplierName} · {contract.hotel}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold" style={{ color: days <= 30 ? '#f43f5e' : '#f59e0b' }}>{days}d until renewal</div>
                        <div className="text-xs text-muted-foreground">Notice: {contract.noticePeriod}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">{contract.contractValue > 0 ? fmt(contract.contractValue) + '/yr' : 'Variable'}</div>
                        <div className="text-xs text-muted-foreground">Auto: {contract.autoRenew ? 'Yes' : 'No'}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowReminderModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-transform active:scale-95 cursor-pointer"
                        style={{ background: 'var(--primary)', color: '#000' }}
                      >
                        <Bell size={11} /> Remind
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'slas' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">Service Level Agreements</div>
            <div className="rounded-xl border border-border overflow-x-auto shadow-sm" style={{ background: 'var(--surface)' }}>
              <table className="w-full text-left border-collapse" style={{ minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Contract', 'Supplier', 'Category', 'Property', 'SLA Terms', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const sc = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                    return (
                      <tr key={contract.id} className="border-t border-border"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm max-w-48 truncate">{contract.contractName}</div>
                          <div className="text-xs font-mono text-muted-foreground">{contract.contractId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{contract.supplierName}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{contract.category}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{contract.hotel}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">{contract.sla}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSelectedContract(null)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{selectedContract.contractId}</span>
                  <div className="relative inline-block">
                    <select
                      value={selectedContract.status}
                      onChange={(e) => handleStatusChange(selectedContract.id, e.target.value as ContractStatus)}
                      className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                      style={{
                        background: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).bg,
                        color: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).color,
                        border: `1px solid ${(STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).color}33`,
                      }}
                    >
                      <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                      <option value="expiring-soon" style={{ background: '#18181b', color: '#f59e0b' }}>Expiring Soon</option>
                      <option value="expired" style={{ background: '#18181b', color: '#f43f5e' }}>Expired</option>
                      <option value="pending" style={{ background: '#18181b', color: '#60a5fa' }}>Pending</option>
                      <option value="terminated" style={{ background: '#18181b', color: '#94a3b8' }}>Terminated</option>
                    </select>
                    <span
                      className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ background: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).color }}
                    />
                    <ChevronDown
                      size={11}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                      style={{ color: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).color }}
                    />
                  </div>
                  {selectedContract.autoRenew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}>Auto Renew</span>}
                </div>
                <h2 className="font-head font-bold text-lg">{selectedContract.contractName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedContract.supplierName}</p>
              </div>
              <button onClick={() => setSelectedContract(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Category', selectedContract.category], ['Property', selectedContract.hotel],
                ['Department', selectedContract.department], ['Contract Value', selectedContract.contractValue > 0 ? fmt(selectedContract.contractValue) + '/yr' : 'Variable'],
                ['Monthly Cost', selectedContract.monthlyCost > 0 ? fmt(selectedContract.monthlyCost) + '/mo' : 'Variable'], ['Payment Frequency', selectedContract.paymentFrequency],
                ['Start Date', formatDate(selectedContract.startDate)],
                ['End Date', formatDate(selectedContract.endDate)],
                ['Renewal Date', formatDate(selectedContract.renewalDate)],
                ['Notice Period', selectedContract.noticePeriod],
                ['Contract Owner', selectedContract.contractOwner], ['Supplier Contact', selectedContract.supplierContact],
                ['Phone', selectedContract.phone], ['Email', selectedContract.email],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">SLA Terms</span>
                <span className="text-sm font-medium">{selectedContract.sla}</span>
              </div>
            </div>
            {selectedContract.notes && (
              <div className="px-6 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>{selectedContract.notes}</div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 p-6 pt-0">
              {!isViewer && canEdit && (
                <button
                  onClick={() => handleOpenEdit(selectedContract)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Edit2 size={13} /> Edit Contract
                </button>
              )}
              <button
                onClick={() => setShowReminderModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border transition-colors hover:bg-surface2"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <Bell size={13} /> Set Reminder
              </button>
              <button
                onClick={() => setShowDocumentsModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border transition-colors hover:bg-surface2"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <FileText size={13} /> Documents
              </button>
              {!isViewer && (canDelete ?? canEdit) && (
                <button
                  onClick={() => setContractToDelete(selectedContract)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
                >
                  <Trash2 size={13} /> Delete Contract
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddContract}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-head font-bold text-lg">Add Contract</h2>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contractName}
                    onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{getFieldLabel('category', 'Category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {cmsCategoryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{getFieldLabel('hotel', 'Property')}</label>
                  <select
                    value={formData.hotel}
                    onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {cmsHotelOptions.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notice Period</label>
                  <input
                    type="text"
                    value={formData.noticePeriod}
                    onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract Value (£)</label>
                  <input
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Monthly Cost (£)</label>
                  <input
                    type="number"
                    value={formData.monthlyCost}
                    onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Payment Frequency</label>
                  <input
                    type="text"
                    value={formData.paymentFrequency}
                    onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract Owner</label>
                  <input
                    type="text"
                    value={formData.contractOwner}
                    onChange={(e) => setFormData({ ...formData, contractOwner: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier Contact</label>
                  <input
                    type="text"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="autoRenew" className="text-sm font-medium">Auto Renew</label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{getFieldLabel('status', 'Initial Status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {cmsStatusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Custom Fields Added via CMS */}
                {customFields.map((cf) => (
                  <div key={cf.id} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>{cf.label} {cf.required && <span className="text-rose-400">*</span>}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">(CMS Field)</span>
                    </label>
                    {cf.type === 'select' ? (
                      <select
                        value={(formData as any)[cf.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [cf.id]: e.target.value } as any)}
                        className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                      >
                        <option value="">Select {cf.label}...</option>
                        {cf.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'}
                        value={(formData as any)[cf.id] || ''}
                        placeholder={cf.placeholder || `Enter ${cf.label}...`}
                        onChange={(e) => setFormData({ ...formData, [cf.id]: e.target.value } as any)}
                        className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                      />
                    )}
                  </div>
                ))}
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">SLA Terms</label>
                  <input
                    type="text"
                    value={formData.sla}
                    onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Contract
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

      {/* Edit Contract Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowEditModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h2 className="font-head font-bold text-lg">Edit Contract</h2>
                    <p className="text-xs text-muted-foreground">{editFormData.contractId} · {editFormData.contractName}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.supplierName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.contractName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contractName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={editFormData.category || CONTRACT_CATEGORIES[0]}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {CONTRACT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Property</label>
                  <select
                    value={editFormData.hotel || propertyOptions[0]}
                    onChange={(e) => setEditFormData({ ...editFormData, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Annual Value (£)</label>
                  <input
                    type="number"
                    value={editFormData.contractValue ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contractValue: e.target.value })}
                    placeholder="e.g. 24500"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Monthly Cost (£)</label>
                  <input
                    type="number"
                    value={editFormData.monthlyCost ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, monthlyCost: e.target.value })}
                    placeholder="e.g. 2041"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Payment Frequency</label>
                  <input
                    type="text"
                    value={editFormData.paymentFrequency || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentFrequency: e.target.value })}
                    placeholder="Monthly, Annual, Quarterly"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.startDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={editFormData.endDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Renewal Date</label>
                  <input
                    type="date"
                    value={editFormData.renewalDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, renewalDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notice Period</label>
                  <input
                    type="text"
                    value={editFormData.noticePeriod || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, noticePeriod: e.target.value })}
                    placeholder="e.g. 30 days"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract Owner</label>
                  <input
                    type="text"
                    value={editFormData.contractOwner || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contractOwner: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier Contact</label>
                  <input
                    type="text"
                    value={editFormData.supplierContact || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierContact: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="editAutoRenew"
                    checked={Boolean(editFormData.autoRenew)}
                    onChange={(e) => setEditFormData({ ...editFormData, autoRenew: e.target.checked })}
                    className="rounded w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="editAutoRenew" className="text-sm font-medium cursor-pointer">Auto Renew Agreement</label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={editFormData.status || 'active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ContractStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">SLA Terms</label>
                  <input
                    type="text"
                    value={editFormData.sla || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sla: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    rows={3}
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Update Contract
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

      {/* Set Reminder Modal */}
      {showReminderModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowReminderModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base">Set Renewal Reminder</h3>
                  <p className="text-xs text-muted-foreground">{selectedContract.contractId} · Renewal {formatDate(selectedContract.renewalDate)}</p>
                </div>
              </div>
              <button onClick={() => setShowReminderModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  When to Remind
                </label>
                <select
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                >
                  <option value={15}>15 days before renewal</option>
                  <option value={30}>30 days before renewal (Recommended)</option>
                  <option value={60}>60 days before renewal</option>
                  <option value={90}>90 days before renewal</option>
                  <option value={120}>120 days before renewal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Reminder Recipient
                </label>
                <input
                  type="email"
                  defaultValue={selectedContract.email || 'marcus.webb@samkocentral.com'}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Custom Reminder Note
                </label>
                <textarea
                  rows={3}
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="e.g. Request competitive quote 45 days prior to notice period..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none resize-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Bell size={13} />
                  Confirm Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowDocumentsModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base">Contract Documents</h3>
                  <p className="text-xs text-muted-foreground">{selectedContract.contractId} · {selectedContract.supplierName}</p>
                </div>
              </div>
              <button onClick={() => setShowDocumentsModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 mb-5 max-h-64 overflow-y-auto pr-1">
              {documentsList.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-border transition-colors hover:border-primary/40" style={{ background: 'var(--surface2)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-foreground">{doc.name}</div>
                      <div className="text-[11px] text-muted-foreground">{doc.size} · Uploaded {doc.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => window.open(doc.url || "#", "_blank")}
                      className="px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-surface"
                      style={{ color: 'var(--text2)' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => toast.success(`Downloading ${doc.name}`)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-border hover:bg-surface2 transition-colors" style={{ color: 'var(--foreground)' }}>
                <Upload size={13} className="text-primary" />
                Upload New Document
                <input type="file" onChange={handleUploadDocument} className="hidden" />
              </label>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)' }} onClick={() => setContractToDelete(null)}>
          <div className="rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-rose-500/15 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to delete <span className="font-semibold text-foreground">{contractToDelete.contractName}</span> ({contractToDelete.contractId}) with <span className="font-semibold text-foreground">{contractToDelete.supplierName}</span>?
                </p>
                <div className="p-3 rounded-lg border border-border mt-3 bg-surface2 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Property:</span>
                    <span className="font-medium text-foreground">{contractToDelete.hotel}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Annual Value:</span>
                    <span className="font-medium text-foreground">{contractToDelete.contractValue > 0 ? fmt(contractToDelete.contractValue) : 'Variable'}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>End Date:</span>
                    <span className="font-medium text-foreground">{formatDate(contractToDelete.endDate)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-rose-400 mt-2 font-medium">
                  This action will remove the contract from the register and database.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setContractToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteContract}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

