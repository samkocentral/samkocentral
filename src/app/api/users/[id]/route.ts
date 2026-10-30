import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

const isBotUser = (u: any, id: string) =>
  id === 'usr-bot-001' ||
  u?.id === 'usr-bot-001' ||
  u?.email?.toLowerCase() === 'digitalbot@samkocentral.com' ||
  u?.name?.toLowerCase().includes('digital bot');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id === 'usr-bot-001') {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const user = await getDocumentById('users', id);

  if (!user || isBotUser(user, id)) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id === 'usr-bot-001') {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Super Admin cannot modify Digital Bot account' },
        { status: 403 }
      );
    }

    const existing = await getDocumentById('users', id);
    if (existing && isBotUser(existing, id)) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Super Admin cannot modify Digital Bot account' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await updateDocument('users', id, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id === 'usr-bot-001') {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Super Admin cannot delete Digital Bot account' },
        { status: 403 }
      );
    }

    const existing = await getDocumentById('users', id);
    if (existing && isBotUser(existing, id)) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Super Admin cannot delete Digital Bot account' },
        { status: 403 }
      );
    }

    await deleteDocument('users', id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
