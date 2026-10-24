import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/serverData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await getDocumentById('tasks', id);

  if (!task) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: task });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDocument('tasks', id, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDocument('tasks', id);
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete task' }, { status: 500 });
  }
}
