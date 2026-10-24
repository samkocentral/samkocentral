import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property') || searchParams.get('site') || '';
  const category = searchParams.get('category')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let items = await getCollectionData('compliance');

  if (search) {
    items = items.filter(
      (c: any) =>
        c.item?.toLowerCase().includes(search) ||
        c.assignee?.toLowerCase().includes(search) ||
        c.notes?.toLowerCase().includes(search)
    );
  }

  if (property && property !== 'all') {
    items = items.filter(
      (c: any) =>
        c.site?.toLowerCase() === property.toLowerCase() ||
        c.property?.toLowerCase() === property.toLowerCase()
    );
  }

  if (category && category !== 'all') {
    items = items.filter((c: any) => c.category?.toLowerCase() === category);
  }

  if (status && status !== 'all') {
    items = items.filter((c: any) => c.status?.toLowerCase() === status);
  }

  return NextResponse.json({
    success: true,
    total: items.length,
    data: items,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const itemName = body.item || body.name;
    if (!itemName) {
      return NextResponse.json({ success: false, error: 'Compliance item name is required' }, { status: 400 });
    }

    const newItem = await createDocument('compliance', {
      ...body,
      item: itemName,
      name: itemName,
      status: body.status || 'ok',
      dueDate: body.dueDate || body.expiryDate || new Date().toISOString().slice(0, 10),
      lastReviewed: body.lastReviewed || body.issueDate || new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create compliance item' }, { status: 500 });
  }
}
