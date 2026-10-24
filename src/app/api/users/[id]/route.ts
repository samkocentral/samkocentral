import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getDocumentById('users', id);

  if (!user) {
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
    await deleteDocument('users', id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
