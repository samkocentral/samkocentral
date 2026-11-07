import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const site = searchParams.get('site')?.toLowerCase() || searchParams.get('property')?.toLowerCase() || '';
  const priority = searchParams.get('priority')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let tasks = await getCollectionData('tasks');

  tasks = tasks.map((t: any) => {
    const propName = t.property || t.site || t.hotel || 'Crowne Plaza Kingston-South';
    return {
      ...t,
      property: propName,
      site: propName,
      hotel: propName,
      title: t.title || t.name || 'Untitled Task',
      assignee: t.assignee || 'Unassigned',
      priority: t.priority || 'medium',
      status: t.status || 'open',
    };
  });

  if (search) {
    tasks = tasks.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(search) ||
        t.property?.toLowerCase().includes(search) ||
        t.site?.toLowerCase().includes(search) ||
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
    const title = body.title || body.name || 'Untitled Task';

    const propName = body.property || body.site || body.hotel || 'Crowne Plaza Kingston-South';
    const newTask = await createDocument('tasks', {
      ...body,
      id: body.id || `task-${Date.now()}`,
      title,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      property: propName,
      site: propName,
      hotel: propName,
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create task' }, { status: 500 });
  }
}
