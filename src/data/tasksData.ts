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

export const TASK_PROPERTIES = ['Crowne Plaza Kingston-South', 'Stanhill Court'] as const;

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
      dueInDays: 1,
      dueDate: getDateWithOffset(1).formatted,
      status: 'open',
      assignee: 'Marcus Webb',
      assigneeRole: 'Maintenance Lead',
      assigneeInitials: 'MW',
      assigneeColor: '#38bdf8',
      description:
        '3 emergency pack batteries failed monthly 3-hour discharge test during routine inspection.',
      createdAt: '2026-10-21',
    },
    {
      id: 'TSK-102',
      title: 'Upload renewed EICR 5-year electrical certificate',
      type: 'Compliance',
      property: 'Stanhill Court',
      priority: 'urgent',
      dueInDays: -2,
      dueDate: getDateWithOffset(-2).formatted,
      status: 'open',
      assignee: 'Sarah Chen',
      assigneeRole: 'Compliance Manager',
      assigneeInitials: 'SC',
      assigneeColor: '#a78bfa',
      description:
        'Apex Electrical completed on-site testing. Stamped PDF document archived for portal compliance.',
      createdAt: '2026-10-14',
    },
    {
      id: 'TSK-103',
      title: 'Passenger lift LOLER 6-monthly statutory thorough examination',
      type: 'Inspection',
      property: 'Stanhill Court',
      priority: 'medium',
      dueInDays: 7,
      dueDate: getDateWithOffset(7).formatted,
      status: 'open',
      assignee: 'Marcus Webb',
      assigneeRole: 'Operations Admin',
      assigneeInitials: 'MW',
      assigneeColor: '#60a5fa',
      description:
        'Otis engineer scheduled on-site to inspect Lift Car hoisting ropes and safety governors.',
      createdAt: '2026-10-22',
    },
  ];
}
