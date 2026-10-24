import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let items = await getCollectionData('claims');

  if (search) {
    items = items.filter(
      (i: any) =>
        i.policyNumber?.toLowerCase().includes(search) ||
        i.description?.toLowerCase().includes(search) ||
        i.hotel?.toLowerCase().includes(search)
    );
  }

  if (property && property !== 'all') {
    items = items.filter(
      (i: any) => i.property?.toLowerCase() === property || i.hotel?.toLowerCase() === property
    );
  }

  if (status && status !== 'all') {
    items = items.filter((i: any) => i.status?.toLowerCase() === status);
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
    if (!body.policyNumber && !body.description) {
      return NextResponse.json({ success: false, error: 'Policy number or description is required' }, { status: 400 });
    }

    const newItem = await createDocument('claims', {
      ...body,
      status: body.status || 'open',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create claim' }, { status: 500 });
  }
}
