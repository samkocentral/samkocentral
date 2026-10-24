import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await getDocumentById('documents', id);

  if (!doc) {
    return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: doc });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDocument('documents', id, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDocument('documents', id);
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete document' }, { status: 500 });
  }
}
