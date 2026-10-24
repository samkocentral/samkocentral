import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await getDocumentById('claims', id);

  if (!item) {
    return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });
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
    const updated = await updateDocument('claims', id, body);
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
    await deleteDocument('claims', id);
    return NextResponse.json({ success: true, message: `Claim ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Delete failed' }, { status: 500 });
  }
}
