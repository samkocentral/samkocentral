import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUDIT_LOGS_DIR =
  process.env.NODE_ENV === 'production' && fs.existsSync('/tmp')
    ? '/tmp'
    : path.join(process.cwd(), '.runtime_data');
const AUDIT_LOGS_FILE = path.join(AUDIT_LOGS_DIR, 'samko_audit_logs.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadLogsFromDisk(): any[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[api/audit-logs] Read error:', err);
  }
  return [];
}

function saveLogsToDisk(logs: any[]) {
  try {
    ensureDir(AUDIT_LOGS_FILE);
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8');
  } catch (err) {
    console.warn('[api/audit-logs] Save error:', err);
  }
}

export async function GET() {
  const logs = loadLogsFromDisk();
  return NextResponse.json({ success: true, count: logs.length, data: logs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newEntry = {
      id: body.id || `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
      relativeTime: body.relativeTime || 'Just now',
      actorName: body.actorName || 'System',
      actorEmail: body.actorEmail || 'system@samkocentral.com',
      actorInitials: body.actorInitials || 'SY',
      roleLevel: body.roleLevel || 'L1',
      action: body.action || 'UPDATE',
      actionLabel: body.actionLabel || 'Operation Logged',
      category: body.category || 'ASSET_REGISTER',
      categoryLabel: body.categoryLabel || 'System',
      resource: body.resource || 'Platform',
      property: body.property || 'All Properties (Portfolio)',
      ipAddress: body.ipAddress || '127.0.0.1 (Web Session)',
      location: body.location || 'London, United Kingdom',
      status: body.status || 'success',
      details: body.details || '',
      diff: body.diff || [],
    };

    const existing = loadLogsFromDisk();
    const updated = [newEntry, ...existing].slice(0, 500);
    saveLogsToDisk(updated);

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE() {
  saveLogsToDisk([]);
  return NextResponse.json({ success: true, message: 'All audit logs reset to clean live state.' });
}
