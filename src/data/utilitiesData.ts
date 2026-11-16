export type UtilityType = 'Electricity' | 'Gas' | 'Water';
export type UtilityStatus = 'active' | 'expiring-soon' | 'expired' | 'incomplete';

export interface UtilityAccount {
  id: string;
  property: string;
  utilityType: UtilityType;
  supplier: string;
  accountNumber: string;
  meterReference: string;
  contractStart: string;
  contractEnd: string;
  annualCost: number;
  monthlyCost: number;
  tariffRate: string;
  portalLogin: string;
  supplierPhone: string;
  supplierEmail: string;
  status: UtilityStatus;
  notes?: string;
  flags?: string[];
}

export const UTILITIES: UtilityAccount[] = [
  {
    id: 'util-001',
    property: 'Crowne Plaza Kingston-south',
    utilityType: 'Electricity',
    supplier: 'British Gas Business',
    accountNumber: 'BG-EL-883921',
    meterReference: 'MPAN: 19002847192',
    contractStart: '2025-10-01',
    contractEnd: '2027-09-30',
    annualCost: 38400,
    monthlyCost: 3200,
    tariffRate: '21.5p/kWh; Standing: £1.20/day',
    portalLogin: 'admin@samkocentral.com',
    supplierPhone: '0800 048 0202',
    supplierEmail: 'business@britishgas.co.uk',
    status: 'active',
    notes: 'Primary half-hourly electricity supply contract.',
  },
  {
    id: 'util-002',
    property: 'Stanhill Court',
    utilityType: 'Gas',
    supplier: 'TotalEnergies Gas & Power',
    accountNumber: 'TE-GS-490218',
    meterReference: 'MPRN: 8492019482',
    contractStart: '2025-04-01',
    contractEnd: '2027-03-31',
    annualCost: 24600,
    monthlyCost: 2050,
    tariffRate: '4.2p/kWh; Standing: £2.50/day',
    portalLogin: 'admin@samkocentral.com',
    supplierPhone: '0333 003 7874',
    supplierEmail: 'customercare@totalenergies.com',
    status: 'active',
    notes: '2-year fixed commercial gas tariff for heating & hot water.',
  },
  {
    id: 'util-003',
    property: 'Stanhill Court',
    utilityType: 'Water',
    supplier: 'Thames Water Commercial',
    accountNumber: 'TW-WT-109283',
    meterReference: 'SPID: 3901928471',
    contractStart: '2025-02-01',
    contractEnd: '2028-01-31',
    annualCost: 14200,
    monthlyCost: 1183,
    tariffRate: 'Water: £2.10/m³; Sewerage: £1.45/m³',
    portalLogin: 'admin@samkocentral.com',
    supplierPhone: '0800 980 8800',
    supplierEmail: 'commercial@thameswater.co.uk',
    status: 'active',
    notes: 'Commercial water & wastewater services agreement.',
  },
];
