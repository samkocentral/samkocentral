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
    if (!body.assetName && !body.assetId) {
      return NextResponse.json({ success: false, error: 'Asset information is required' }, { status: 400 });
    }

    const newRecord = await createDocument('maintenance', {
      ...body,
      status: body.status || 'scheduled',
      scheduledDate: body.scheduledDate || new Date().toISOString().slice(0, 10),
      frequency: body.frequency || 'yearly',
    });

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create record' }, { status: 500 });
  }
}
