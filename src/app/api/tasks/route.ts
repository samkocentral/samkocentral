import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const site = searchParams.get('site')?.toLowerCase() || searchParams.get('property')?.toLowerCase() || '';
  const priority = searchParams.get('priority')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let tasks = await getCollectionData('tasks');

  if (search) {
    tasks = tasks.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(search) ||
        t.assignee?.toLowerCase().includes(search) ||
        t.category?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
    );
  }

  if (site && site !== 'all' && site !== 'all sites') {
    tasks = tasks.filter(
      (t: any) =>
        t.site?.toLowerCase() === site ||
        t.property?.toLowerCase() === site ||
        t.hotel?.toLowerCase() === site
    );
  }

  if (priority && priority !== 'all') {
    tasks = tasks.filter((t: any) => t.priority?.toLowerCase() === priority);
  }

  if (status && status !== 'all') {
    tasks = tasks.filter((t: any) => t.status?.toLowerCase() === status);
  }

  return NextResponse.json({
    success: true,
    total: tasks.length,
    data: tasks,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 });
    }

    const newTask = await createDocument('tasks', {
      ...body,
      id: body.id || `task-${Date.now()}`,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      site: body.site || body.property || 'Crowne Plaza Kingston-south',
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create task' }, { status: 500 });
  }
}
