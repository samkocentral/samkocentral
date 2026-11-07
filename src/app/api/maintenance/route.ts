import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property') || searchParams.get('hotelId') || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let records = await getCollectionData('maintenance');

  if (search) {
    records = records.filter(
      (m: any) =>
        m.assetName?.toLowerCase().includes(search) ||
        m.assignedTo?.toLowerCase().includes(search) ||
        m.type?.toLowerCase().includes(search)
    );
  }

  if (property) {
    records = records.filter(
      (m: any) =>
        m.hotelId === property ||
        m.hotelName?.toLowerCase() === property.toLowerCase() ||
        m.property === property
    );
  }

  if (status) {
    records = records.filter((m: any) => m.status?.toLowerCase() === status);
  }

  return NextResponse.json({
    success: true,
    total: records.length,
    data: records,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assetName = body.assetName || body.title || body.name || 'General Equipment';
    const assetId = body.assetId || `AST-${Date.now().toString().slice(-4)}`;
    const propName = body.property || body.hotel || body.site || body.hotelName || 'Crowne Plaza Kingston-south';

    const newRecord = await createDocument('maintenance', {
      ...body,
      assetName,
      title: body.title || assetName,
      name: body.name || assetName,
      assetId,
      property: propName,
      hotel: propName,
      site: propName,
      hotelName: propName,
      status: body.status || 'scheduled',
      scheduledDate: body.scheduledDate || new Date().toISOString().slice(0, 10),
      frequency: body.frequency || 'yearly',
    });

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create record' }, { status: 500 });
  }
}
