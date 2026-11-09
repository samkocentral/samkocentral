import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCollectionData } from '@/lib/serverData';

const COLLECTIONS = [
  'properties',
  'categories',
  'assets',
  'maintenance',
  'compliance',
  'tasks',
  'alerts',
  'contracts',
  'insurance',
  'claims',
  'utilities',
  'documents',
  'users',
];

export async function GET(req: NextRequest) {
  try {
    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const col of COLLECTIONS) {
      const items = await getCollectionData(col);
      backupData[col] = items;
      totalRecords += items.length;
    }

    // Read audit logs, notifications & CMS if present
    const auditLogsPath = path.join(process.cwd(), '.runtime_data', 'samko_audit_logs.json');
    const notifsPath = path.join(process.cwd(), '.runtime_data', 'samko_notifications.json');
    const cmsPath = path.join(process.cwd(), 'src', 'data', 'samko_cms.json');

    let auditLogs: any[] = [];
    let notifications: any[] = [];
    let cmsSettings: Record<string, any> = {};

    try {
      if (fs.existsSync(auditLogsPath))
        auditLogs = JSON.parse(fs.readFileSync(auditLogsPath, 'utf8'));
    } catch {}
    try {
      if (fs.existsSync(notifsPath))
        notifications = JSON.parse(fs.readFileSync(notifsPath, 'utf8'));
    } catch {}
    try {
      if (fs.existsSync(cmsPath)) cmsSettings = JSON.parse(fs.readFileSync(cmsPath, 'utf8'));
    } catch {}

    const payload = {
      _backupMetadata: {
        timestamp: new Date().toISOString(),
        version: '2.0',
        generator: 'SamkoCentral Automated Master Database Backup',
        totalRecords,
        collectionsCount: Object.keys(backupData).length,
        auditLogsCount: Array.isArray(auditLogs) ? auditLogs.length : 0,
        notificationsCount: Array.isArray(notifications) ? notifications.length : 0,
        cmsPagesCount: Object.keys(cmsSettings).length,
      },
      collections: backupData,
      auditLogs: Array.isArray(auditLogs) ? auditLogs : [],
      notifications: Array.isArray(notifications) ? notifications : [],
      cmsSettings,
    };

    // Save copy to backups folder on disk
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const timestampedFile = path.join(backupDir, `samkocentral_database_backup_${dateStr}.json`);
      const latestFile = path.join(backupDir, 'samkocentral_database_backup_latest.json');
      const pretty = JSON.stringify(payload, null, 2);
      fs.writeFileSync(timestampedFile, pretty, 'utf8');
      fs.writeFileSync(latestFile, pretty, 'utf8');
    } catch (saveErr) {
      console.warn('Backup write to disk warning:', saveErr);
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    if (download) {
      const dateTag = new Date().toISOString().slice(0, 10);
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="samkocentral_master_backup_${dateTag}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalRecords,
      collections: Object.keys(backupData),
      backup: payload,
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate backup' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const collectionsToRestore =
      body?.collections || (body?._backupMetadata ? body.collections : body);

    if (!collectionsToRestore || typeof collectionsToRestore !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid backup file structure' },
        { status: 400 }
      );
    }

    // Save directly to disk runtime & seed database
    const runtimeDbPath = path.join(process.cwd(), '.runtime_data', 'samko_db.json');
    const seedDbPath = path.join(process.cwd(), 'src', 'data', 'samko_db.json');
    const auditLogsPath = path.join(process.cwd(), '.runtime_data', 'samko_audit_logs.json');
    const notifsPath = path.join(process.cwd(), '.runtime_data', 'samko_notifications.json');
    const cmsPath = path.join(process.cwd(), 'src', 'data', 'samko_cms.json');

    const cleanData: Record<string, any[]> = {};
    let restoredCount = 0;

    for (const [col, items] of Object.entries(collectionsToRestore)) {
      if (Array.isArray(items)) {
        cleanData[col] = items;
        restoredCount += items.length;
      }
    }

    const dir = path.dirname(runtimeDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(runtimeDbPath, JSON.stringify(cleanData, null, 2), 'utf8');

    if (fs.existsSync(path.dirname(seedDbPath))) {
      fs.writeFileSync(seedDbPath, JSON.stringify(cleanData, null, 2), 'utf8');
    }

    // Restore audit logs if present
    if (Array.isArray(body.auditLogs) && body.auditLogs.length > 0) {
      try {
        fs.writeFileSync(auditLogsPath, JSON.stringify(body.auditLogs, null, 2), 'utf8');
      } catch {}
    }

    // Restore notifications if present
    if (Array.isArray(body.notifications) && body.notifications.length > 0) {
      try {
        fs.writeFileSync(notifsPath, JSON.stringify(body.notifications, null, 2), 'utf8');
      } catch {}
    }

    // Restore CMS if present
    if (
      body.cmsSettings &&
      typeof body.cmsSettings === 'object' &&
      Object.keys(body.cmsSettings).length > 0
    ) {
      try {
        fs.writeFileSync(cmsPath, JSON.stringify(body.cmsSettings, null, 2), 'utf8');
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${restoredCount} database records, ${body.auditLogs?.length || 0} audit logs, and ${body.notifications?.length || 0} notifications across ${Object.keys(cleanData).length} collections`,
      restoredCollections: Object.keys(cleanData),
      restoredCount,
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to restore database from backup' },
      { status: 500 }
    );
  }
}
