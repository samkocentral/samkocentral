import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getDocumentById('maintenance', id);

  if (!record) {
    return NextResponse.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: record });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDocument('maintenance', id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDocument('maintenance', id);
    return NextResponse.json({ success: true, message: `Maintenance record ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Delete failed' }, { status: 500 });
  }
}
