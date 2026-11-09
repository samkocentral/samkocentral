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
    const policyNumber =
      body.policyNumber || body.name || body.title || `POL-${Date.now().toString().slice(-6)}`;
    const insuranceType = body.insuranceType || body.type || body.category || 'General Cover';
    const propName = body.property || body.hotel || body.site || 'Crowne Plaza Kingston-south';

    const newItem = await createDocument('insurance', {
      ...body,
      policyNumber,
      insuranceType,
      type: insuranceType,
      title: policyNumber,
      name: policyNumber,
      property: propName,
      hotel: propName,
      site: propName,
      hotelName: propName,
      status: body.status || 'active',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create insurance policy' },
      { status: 500 }
    );
  }
}
