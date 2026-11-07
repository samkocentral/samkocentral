import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property')?.toLowerCase() || '';
  const utilityType = searchParams.get('type')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let items = await getCollectionData('utilities');

  if (search) {
    items = items.filter(
      (u: any) =>
        u.accountNo?.toLowerCase().includes(search) ||
        u.supplier?.toLowerCase().includes(search) ||
        u.meterNo?.toLowerCase().includes(search)
    );
  }

  if (property && property !== 'all') {
    items = items.filter((u: any) => u.property?.toLowerCase() === property);
  }

  if (utilityType && utilityType !== 'all') {
    items = items.filter((u: any) => u.utilityType?.toLowerCase() === utilityType);
  }

  if (status && status !== 'all') {
    items = items.filter((u: any) => u.status?.toLowerCase() === status);
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
    const accountNo = body.accountNo || body.accountNumber || body.meterNumber || `ACC-${Date.now().toString().slice(-4)}`;
    const utilityType = body.utilityType || body.type || 'Electricity';
    const propName = body.property || body.hotel || body.site || 'Crowne Plaza Kingston-south';

    const newItem = await createDocument('utilities', {
      ...body,
      accountNo,
      accountNumber: accountNo,
      meterNumber: body.meterNumber || accountNo,
      utilityType,
      property: propName,
      hotel: propName,
      site: propName,
      hotelName: propName,
      status: body.status || 'active',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create utility account' }, { status: 500 });
  }
}
