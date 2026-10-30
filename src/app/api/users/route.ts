import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const role = searchParams.get('role')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  const roleLevel = searchParams.get('roleLevel')?.toUpperCase() || '';
  const portal = searchParams.get('portal')?.toLowerCase() || '';

  const includeBot = searchParams.get('includeBot') === 'true';

  let users = await getCollectionData('users');

  // Strict isolation: Digital Bot account is hidden from all general user listings
  if (!includeBot) {
    users = users.filter(
      (u: any) =>
        u.id !== 'usr-bot-001' &&
        u.email?.toLowerCase() !== 'digitalbot@samkocentral.com' &&
        !u.name?.toLowerCase().includes('digital bot')
    );
  }

  if (search) {
    users = users.filter(
      (u: any) =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.hotel?.toLowerCase().includes(search) ||
        u.property?.toLowerCase().includes(search) ||
        u.roleTitle?.toLowerCase().includes(search)
    );
  }

  if (roleLevel && roleLevel !== 'ALL') {
    users = users.filter((u: any) => u.roleLevel === roleLevel);
  }

  if (portal && portal !== 'all') {
    users = users.filter((u: any) => u.portal === portal || u.portal === 'both');
  }

  if (role && role !== 'all') {
    users = users.filter((u: any) => u.role?.toLowerCase() === role);
  }

  if (status && status !== 'all') {
    users = users.filter((u: any) => u.status?.toLowerCase() === status);
  }

  return NextResponse.json({
    success: true,
    total: users.length,
    data: users,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    if (
      body.email?.toLowerCase().trim() === 'digitalbot@samkocentral.com' ||
      body.name?.toLowerCase().trim().includes('digital bot')
    ) {
      return NextResponse.json(
        { success: false, error: 'Cannot create an account with reserved Digital Bot credentials' },
        { status: 400 }
      );
    }

    const initials = body.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    const roleLevel = body.roleLevel || (body.role === 'super-admin' ? 'L1' : body.role === 'admin' ? 'L2' : body.role === 'read-only' ? 'L4' : 'L3');
    const roleTitle = body.roleTitle || (roleLevel === 'L1' ? 'Super Admin' : roleLevel === 'L2' ? 'Admin' : roleLevel === 'L4' ? 'Viewer' : 'Uploader');
    const portal = body.portal || (roleLevel === 'L1' ? 'both' : 'opco');
    const password = body.password || `${roleTitle.replace(/\s+/g, '')}2026!`;

    const newUser = await createDocument('users', {
      ...body,
      id: body.id || `usr-${roleLevel.toLowerCase()}-${Date.now().toString().slice(-6)}`,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password,
      roleLevel,
      roleTitle,
      portal,
      hotel: body.hotel || 'Crowne Plaza Kingston-south',
      assignedProperties: Array.isArray(body.assignedProperties) ? body.assignedProperties : [body.hotel || 'all'],
      status: body.status || 'active',
      lastLogin: new Date().toISOString().split('T')[0],
      initials,
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create user' }, { status: 500 });
  }
}
