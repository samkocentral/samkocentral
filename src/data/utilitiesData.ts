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
  // ── SUN HOTEL (CROWNE PLAZA KINGSTON) ──
  {
    id: 'u-001', property: 'Crowne Plaza Kingston-south', utilityType: 'Electricity',
    supplier: 'EDF Energy', accountNumber: '3898198541', meterReference: 'MPAN: 1900092859450 / Meter: E24BG03134_P272',
    contractStart: '2025-11-01', contractEnd: '2026-10-31', annualCost: 0, monthlyCost: 213,
    tariffRate: '20.0878p/kWh; Standing: £40.14/day', portalLogin: 'Accounts@cplondonkingston.co.uk',
    supplierPhone: '0845 366 3664', supplierEmail: 'remittanceadvices@edfenergy.com',
    status: 'expiring-soon', notes: 'Contract: Q_2225032. Fixed Fully Inclusive (Half-Hourly). Renewal due Oct 2026.',
    flags: ['Renewal Due Oct 2026'],
  },
  {
    id: 'u-002', property: 'Crowne Plaza Kingston-south', utilityType: 'Gas',
    supplier: 'SEFE Energy', accountNumber: '100091219', meterReference: 'MPRN: 9209299704 / Meter: M100K0079408D6',
    contractStart: '2026-03-01', contractEnd: '2028-02-29', annualCost: 13508, monthlyCost: 1126,
    tariffRate: '3.8431p/kWh; Standing: £5.607/day', portalLogin: 'Accounts@cplondonkingston.co.uk',
    supplierPhone: '0161 837 3395', supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active', notes: 'Contract: AG08104881. Fixed 2-year SEFE Energy Shield. AQ: 298,269 kWh. Signed 09-Feb-2026.',
  },
  {
    id: 'u-003', property: 'Crowne Plaza Kingston-south', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW293246-0', meterReference: 'SPID: 3010968825 / Meter: 319025069',
    contractStart: '2023-07-10', contractEnd: '2026-07-09', annualCost: 35240, monthlyCost: 2937,
    tariffRate: 'Water: £2.7346/m³; Waste: £1.5496/m³; Fixed: £1,202.56/yr', portalLogin: 'EFW293246-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'expired', notes: 'CONTRACT RENEWAL DUE — expired 09-Jul-2026. Address: Holiday Inn, Portsmouth Rd, Surbiton KT6 5QQ.',
    flags: ['⚠️ CONTRACT EXPIRED — Renewal Required'],
  },

  // ── WARREN HOUSE ──
  {
    id: 'u-004', property: 'Warren House', utilityType: 'Electricity',
    supplier: 'EDF Energy', accountNumber: '0506000000', meterReference: 'MPAN: 1200010214798 / Top: 00 845 072',
    contractStart: '2026-05-01', contractEnd: '2027-04-30', annualCost: 100198, monthlyCost: 8350,
    tariffRate: 'Day: 21.3419p/kWh; Night: 15.6863p/kWh; Standing: £13.04/day; Availability: 7.257p/kVA/day',
    portalLogin: 'accounts@warrenhouse.com (portal login email not recorded)',
    supplierPhone: '0845 366 3664', supplierEmail: 'Anete.Painter@edfenergy.com',
    status: 'active', notes: 'Contract: Q-52926-R1L7P0. Annual volume: 459,826 kWh. Signed 04-Feb-2026. Broker: Nationwide Utilities Ltd. EDF Relationship Manager: Anete Painter — 020 8186 1382.',
    flags: ['Portal login email not recorded'],
  },
  {
    id: 'u-005', property: 'Warren House', utilityType: 'Gas',
    supplier: 'SEFE Energy', accountNumber: '100093919', meterReference: 'MPRN: 10473207 / Meter: M160A0004412A7',
    contractStart: '2026-05-01', contractEnd: '2028-04-30', annualCost: 30397, monthlyCost: 2533,
    tariffRate: '3.4765p/kWh; Standing: £13.167/day', portalLogin: 'accounts@warrenhouse.com',
    supplierPhone: '0161 837 3395', supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active', notes: 'Contract: AG08019270. Fixed 2-year SEFE Energy Shield. AQ: 736,171 kWh. Signed 04-Feb-2026.',
  },
  {
    id: 'u-006', property: 'Warren House', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW232342-0', meterReference: 'SPID: 3010981651 (waste-only) + SPID: 3011506736 (water+waste)',
    contractStart: '2023-07-10', contractEnd: '2026-10-02', annualCost: 21509, monthlyCost: 954,
    tariffRate: 'Water: £1.7760/m³; Waste: £1.0544/m³; Fixed: £676.44/yr per SPID', portalLogin: 'EFW232342-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'expiring-soon', notes: 'Contract renewal due Oct 2026. ⚠️ Outstanding balance £9,007.52 — ACTION REQUIRED. Annual forecast: £21,509.15 net.',
    flags: ['⚠️ Renewal Due Oct 2026', '⚠️ Outstanding Balance £9,007.52'],
  },

  // ── STANHILL COURT ──
  {
    id: 'u-007', property: 'Stanhill Court', utilityType: 'Electricity',
    supplier: 'SSE Energy Solutions', accountNumber: '8701889865', meterReference: 'MPAN: 1900018001128 / Meter: K20A002284',
    contractStart: '2026-02-12', contractEnd: '2027-01-31', annualCost: 0, monthlyCost: 0,
    tariffRate: 'Fixed Green Protect HH Non-Energy Only', portalLogin: 'ab@stanhillcourthotel.co.uk',
    supplierPhone: '0345 725 2526', supplierEmail: 'businesscontracts@sse.com',
    status: 'active', notes: 'Contract: AGR5408710. Portal: my.sseenergysolutions.co.uk. Tariff/rate details not yet recorded.',
  },
  {
    id: 'u-008', property: 'Stanhill Court', utilityType: 'Gas',
    supplier: 'Calor Gas', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'LPG/Calor — rate not recorded', portalLogin: 'SH1881',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: '⚠️ Portal not working. Account details to be provided via WhatsApp. All fields require updating.',
    flags: ['⚠️ Incomplete — Portal not working'],
  },
  {
    id: 'u-009', property: 'Stanhill Court', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW364357-0', meterReference: 'SPID: 3026521701 / Meter: 5069925',
    contractStart: '', contractEnd: '2026-01-27', annualCost: 0, monthlyCost: 0,
    tariffRate: 'Rate not recorded', portalLogin: 'EFW364357-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'expired', notes: '⚠️ Contract end date 27-Jan-2026 has already passed. Renewal action required.',
    flags: ['⚠️ CONTRACT EXPIRED — Renewal Required'],
  },

  // ── THE RIVER CLUB ──
  {
    id: 'u-010', property: 'River Club', utilityType: 'Electricity',
    supplier: 'SSE Energy Solutions', accountNumber: '880000068119', meterReference: 'MPANs: 1900029038809 / 1900031000016 / 1900070285553 / 1900090295272',
    contractStart: '2025-09-01', contractEnd: '2026-08-31', annualCost: 21082, monthlyCost: 1757,
    tariffRate: 'NHH: 20.5107p/kWh; Day: 23.6805p/kWh; Night: 16.2019p/kWh; Eve: 17.9279p/kWh',
    portalLogin: 'david@theriverclub.co.uk',
    supplierPhone: '0345 072 9402', supplierEmail: 'cmt.commercial@sse.com',
    status: 'expiring-soon', notes: 'Contract: AGR3464675. 4 MPANs total. Annual volume: ~89,604 kWh. Signed 09/07/2025. ⚠️ Legacy invoice IV04388495 for £89,837.19 (Revenue Protection 2018–2025) — VERIFY/DISPUTE.',
    flags: ['Renewal Due Aug 2026', '⚠️ Legacy Invoice £89,837.19 — Verify/Dispute'],
  },
  {
    id: 'u-011', property: 'River Club', utilityType: 'Gas',
    supplier: 'SEFE Energy', accountNumber: '100022228', meterReference: 'MPRN: 9116667904 / Meter: M016A0564215A6',
    contractStart: '2027-01-01', contractEnd: '2027-09-30', annualCost: 20329, monthlyCost: 1694,
    tariffRate: '3.8114p/kWh (from Jan-27); Standing: £5.756/day; Current rate: 6.8508p/kWh',
    portalLogin: 'david@theriverclub.co.uk',
    supplierPhone: '0161 837 3395', supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active', notes: 'Contract: AG07576924. AQ: 478,165 kWh. Signed 09/07/2025. New contract starts Jan-27.',
  },
  {
    id: 'u-012', property: 'River Club', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW292393-0', meterReference: 'SPID: 3012811532 / Meter: 150005643',
    contractStart: '', contractEnd: '2027-10-06', annualCost: 0, monthlyCost: 1420,
    tariffRate: 'Wholesale + Retail — full tariff to be extracted from invoice', portalLogin: 'EFW292393-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'active', notes: 'Contract end: 06-Oct-2027. Latest invoice: £1,420.06 net (May 2026).',
  },

  // ── HAMPTON APARTMENTS 1 (SUN TV) ──
  {
    id: 'u-013', property: 'Hampton 1 & 2', utilityType: 'Electricity',
    supplier: 'ENGIE Power', accountNumber: '10314633', meterReference: 'MPAN: 1900026425412 / Meter: 44651946',
    contractStart: '', contractEnd: '2027-05-31', annualCost: 0, monthlyCost: 2465,
    tariffRate: '65.2243p/kWh; Standing: £5.0718/day; CCL: 0.801p/kWh',
    portalLogin: 'Portal login not yet available',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'active', notes: 'Account: Sampath Kumar Mallaya & Sun TV UK Limited (T/A Hampton Suites). Next contract ends 31-Mar-2029 — notice required by 01-Mar-2029.',
    flags: ['Portal login not yet available'],
  },
  {
    id: 'u-014', property: 'Hampton 1 & 2', utilityType: 'Water',
    supplier: 'Castle Water', accountNumber: '2578329', meterReference: 'Meter/SPID awaiting from main invoice',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'Awaiting full tariff sheet', portalLogin: 'Not recorded',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: '⚠️ Outstanding balance £1,029.50 (due 06/05/2026) — investigate late payment charge. Meter/SPID and full tariff awaiting main invoice.',
    flags: ['⚠️ Outstanding Balance £1,029.50', 'Meter/SPID Awaiting'],
  },

  // ── RAVENS AIT (4YOU HOSPITALITY / 4YOU INVESTMENTS) ──
  {
    id: 'u-015', property: 'Ravens Ait Island', utilityType: 'Electricity',
    supplier: 'EDF Energy', accountNumber: 'A-7F0A5110', meterReference: 'MPAN: 1900034424274 / Meter: A7471465',
    contractStart: '', contractEnd: '', annualCost: 36518, monthlyCost: 3480,
    tariffRate: '45.550p/kWh; Standing: £1.86/day; CCL: 0.801p/kWh',
    portalLogin: 'Not recorded',
    supplierPhone: '0845 366 3664', supplierEmail: 'remittanceadvices@edfenergy.com',
    status: 'incomplete', notes: '⚠️ On variable Freedom tariff — no fixed-rate contract on file. REVIEW FOR FIXED-RATE PROCUREMENT. Account Holder: 4You Investments Ltd. Annual estimated usage: 78,710 kWh.',
    flags: ['⚠️ Variable Tariff — Review for Fixed-Rate', 'Portal Login Not Recorded'],
  },
  {
    id: 'u-016', property: 'Ravens Ait Island', utilityType: 'Water',
    supplier: 'Castle Water', accountNumber: '2531103', meterReference: 'Water SPID: 3011855706W14 / Waste SPID: 3011855706S11 / Meter: 131612389',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 319,
    tariffRate: 'Water: £2.9534/m³; Foul Sewerage: £1.7046/m³; Fixed: £2.039/day',
    portalLogin: 'Not recorded',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Account Holder: 4You Hospitality Services Limited. Meter size: 40mm. Latest invoice: £319.34 (May 2026).',
    flags: ['Portal Login Not Recorded'],
  },

  // ── CLAPHAM APARTMENT ──
  {
    id: 'u-017', property: 'Clapham Apartment', utilityType: 'Electricity',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'No supplier documentation on file. Placeholder — all details required.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-018', property: 'Clapham Apartment', utilityType: 'Gas',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'No supplier documentation on file. Placeholder — all details required.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-019', property: 'Clapham Apartment', utilityType: 'Water',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'No supplier documentation on file. Placeholder — all details required.',
    flags: ['⚠️ No Documentation on File'],
  },

  // ── SHARNBROOK ──
  {
    id: 'u-020', property: 'Sharnbrook', utilityType: 'Electricity',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Placeholder — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-021', property: 'Sharnbrook', utilityType: 'Gas',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Placeholder — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-022', property: 'Sharnbrook', utilityType: 'Water',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Placeholder — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },

  // ── HAMPTON APARTMENTS 2 (MAX MERIDIAN) ──
  {
    id: 'u-023', property: 'Hampton 1 & 2', utilityType: 'Gas',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Hampton Apartments 2 (Max Meridian) — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },
];
