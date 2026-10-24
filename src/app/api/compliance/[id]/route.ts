import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await getDocumentById('compliance', id);

  if (!item) {
    return NextResponse.json({ success: false, error: 'Compliance item not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: item });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDocument('compliance', id, body);
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
    await deleteDocument('compliance', id);
    return NextResponse.json({ success: true, message: `Compliance item ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Delete failed' }, { status: 500 });
  }
}
