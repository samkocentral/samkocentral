import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let items = await getCollectionData('insurance');

  if (search) {
    items = items.filter(
      (i: any) =>
        i.policyNumber?.toLowerCase().includes(search) ||
        i.insuranceType?.toLowerCase().includes(search) ||
        i.company?.toLowerCase().includes(search)
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
    if (!body.policyNumber && !body.insuranceType) {
      return NextResponse.json({ success: false, error: 'Policy details are required' }, { status: 400 });
    }

    const newItem = await createDocument('insurance', {
      ...body,
      status: body.status || 'active',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create insurance policy' }, { status: 500 });
  }
}
