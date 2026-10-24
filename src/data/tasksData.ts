export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'open' | 'in-progress' | 'completed';
export type TaskType = 'Task' | 'Inspection' | 'Maintenance' | 'Compliance' | 'Audit Action';

export interface TaskItem {
  id: string;
  title: string;
  type: TaskType;
  property: string;
  priority: TaskPriority;
  dueInDays: number; // negative = overdue, 0 = due today, positive = due in X days
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  assignee: string;
  assigneeRole: string;
  assigneeInitials: string;
  assigneeColor: string;
  description?: string;
  createdAt: string;
}

export const TASK_PROPERTIES = [
  'Crowne Plaza Kingston-South',
  'Stanhill Court',
  'Mercure London Watford',
  'Holiday Inn Southampton',
  'Ravens Ait Island',
  'River Club',
] as const;

export const TASK_ASSIGNEES = [
  { name: 'Jamie Clarke', role: 'Maintenance Lead', initials: 'JC', color: '#38bdf8' },
  { name: 'Priya Shah', role: 'Compliance Manager', initials: 'PS', color: '#a78bfa' },
  { name: 'Marcus Webb', role: 'Opco Operations Admin', initials: 'MW', color: '#60a5fa' },
  { name: 'Sarah Chen', role: 'Operational Uploader', initials: 'SC', color: '#34d399' },
  { name: 'James Okafor', role: 'Electrical Engineer', initials: 'JO', color: '#fbbf24' },
  { name: 'Alexander Vance', role: 'Super Admin', initials: 'AV', color: '#f43f5e' },
];

// Helper to format Date to YYYY-MM-DD
export function formatDateYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Helper to compute target date given days from now
export function getDateWithOffset(days: number): { formatted: string; full: string } {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return {
    formatted: formatDateYMD(d),
    full: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

export function getInitialTasks(): TaskItem[] {
  return [
    {
      id: 'TSK-101',
      title: 'Replace emergency lighting batteries in West Wing Corridor',
      type: 'Maintenance',
      property: 'Crowne Plaza Kingston-South',
      priority: 'urgent',
      dueInDays: 1, // Due in 1 day
      dueDate: getDateWithOffset(1).formatted,
      status: 'open',
      assignee: 'Jamie Clarke',
      assigneeRole: 'Maintenance Lead',
      assigneeInitials: 'JC',
      assigneeColor: '#38bdf8',
      description: '3 emergency pack batteries failed monthly 3-hour discharge test during routine inspection.',
      createdAt: '2026-10-21',
    },
    {
      id: 'TSK-102',
      title: 'Upload renewed EICR 5-year electrical certificate',
      type: 'Compliance',
      property: 'Stanhill Court',
      priority: 'urgent',
      dueInDays: -2, // Overdue by 2 days
      dueDate: getDateWithOffset(-2).formatted,
      status: 'open',
      assignee: 'Priya Shah',
      assigneeRole: 'Compliance Manager',
      assigneeInitials: 'PS',
      assigneeColor: '#a78bfa',
      description: 'Apex Electrical completed on-site testing. Awaiting stamped PDF document for portal archiving.',
      createdAt: '2026-10-14',
    },
    {
      id: 'TSK-103',
      title: 'Quarterly chiller compressor oil sampling & vibration analysis',
      type: 'Inspection',
      property: 'Crowne Plaza Kingston-South',
      priority: 'medium',
      dueInDays: 4, // Due in 4 days
      dueDate: getDateWithOffset(4).formatted,
      status: 'open',
      assignee: 'Jamie Clarke',
      assigneeRole: 'Maintenance Lead',
      assigneeInitials: 'JC',
      assigneeColor: '#38bdf8',
      description: 'Daikin plant room chiller 2 preventative maintenance cycle. Send oil samples to Eurofins lab.',
      createdAt: '2026-10-20',
    },
    {
      id: 'TSK-104',
      title: 'Legionella water temperature sentinel log sign-off',
      type: 'Task',
      property: 'Mercure London Watford',
      priority: 'medium',
      dueInDays: 4, // Due in 4 days
      dueDate: getDateWithOffset(4).formatted,
      status: 'in-progress',
      assignee: 'Priya Shah',
      assigneeRole: 'Compliance Manager',
      assigneeInitials: 'PS',
      assigneeColor: '#a78bfa',
      description: 'Verify calorifier outlet and return temperatures across all 4 guest floors and submit verification.',
      createdAt: '2026-10-19',
    },
    {
      id: 'TSK-105',
      title: 'Annual kitchen extraction duct degreasing & TR19 certification',
      type: 'Compliance',
      property: 'Holiday Inn Southampton',
      priority: 'urgent',
      dueInDays: -1, // Overdue by 1 day
      dueDate: getDateWithOffset(-1).formatted,
      status: 'open',
      assignee: 'Marcus Webb',
      assigneeRole: 'Opco Operations Admin',
      assigneeInitials: 'MW',
      assigneeColor: '#60a5fa',
      description: 'Overdue TR19 grease extract cleaning required for building insurance compliance warranty.',
      createdAt: '2026-10-15',
    },
    {
      id: 'TSK-106',
      title: 'Passenger lift LOLER 6-monthly statutory thorough examination',
      type: 'Inspection',
      property: 'Crowne Plaza Kingston-South',
      priority: 'medium',
      dueInDays: 7, // Due in 7 days
      dueDate: getDateWithOffset(7).formatted,
      status: 'open',
      assignee: 'Sarah Chen',
      assigneeRole: 'Operational Uploader',
      assigneeInitials: 'SC',
      assigneeColor: '#34d399',
      description: 'Otis engineer scheduled on-site to inspect Lift Car A and B hoisting ropes and safety governors.',
      createdAt: '2026-10-22',
    },
    {
      id: 'TSK-107',
      title: 'Fix boiler room pressure relief valve minor seepage',
      type: 'Maintenance',
      property: 'Stanhill Court',
      priority: 'medium',
      dueInDays: 9, // Due in 9 days
      dueDate: getDateWithOffset(9).formatted,
      status: 'in-progress',
      assignee: 'Jamie Clarke',
      assigneeRole: 'Maintenance Lead',
      assigneeInitials: 'JC',
      assigneeColor: '#38bdf8',
      description: 'Replace standard 3-bar safety valve on primary calorifier circuit and pressure test.',
      createdAt: '2026-10-18',
    },
    {
      id: 'TSK-108',
      title: 'Annual CP12 Commercial Gas Safety certification audit',
      type: 'Audit Action',
      property: 'Mercure London Watford',
      priority: 'low',
      dueInDays: 14,
      dueDate: getDateWithOffset(14).formatted,
      status: 'open',
      assignee: 'Marcus Webb',
      assigneeRole: 'Opco Operations Admin',
      assigneeInitials: 'MW',
      assigneeColor: '#60a5fa',
      description: 'Coordinate with British Gas commercial team for gas soundness certificate across boilers and kitchen range.',
      createdAt: '2026-10-17',
    },
    {
      id: 'TSK-109',
      title: 'Conduct weekly fire alarm sounder test & manual call point test',
      type: 'Task',
      property: 'Holiday Inn Southampton',
      priority: 'low',
      dueInDays: 2,
      dueDate: getDateWithOffset(2).formatted,
      status: 'completed',
      assignee: 'Sarah Chen',
      assigneeRole: 'Operational Uploader',
      assigneeInitials: 'SC',
      assigneeColor: '#34d399',
      description: 'Weekly test completed: Zone 3 call point activated, audibility verified at 85dB in all guest wings.',
      createdAt: '2026-10-16',
    },
    {
      id: 'TSK-110',
      title: 'Replace damaged fire door intumescent smoke seals in Stairwell 2',
      type: 'Maintenance',
      property: 'Ravens Ait Island',
      priority: 'urgent',
      dueInDays: -3, // Overdue by 3 days
      dueDate: getDateWithOffset(-3).formatted,
      status: 'open',
      assignee: 'James Okafor',
      assigneeRole: 'Electrical Engineer',
      assigneeInitials: 'JO',
      assigneeColor: '#fbbf24',
      description: 'Fire officer audit non-conformance remediation: 30-min FD30 door seals replaced and aligned.',
      createdAt: '2026-10-12',
    },
  ];
}
