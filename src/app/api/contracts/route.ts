import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property')?.toLowerCase() || '';
  const category = searchParams.get('category')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let items = await getCollectionData('contracts');

  if (search) {
    items = items.filter(
      (c: any) =>
        c.contractName?.toLowerCase().includes(search) ||
        c.supplierName?.toLowerCase().includes(search) ||
        c.contractId?.toLowerCase().includes(search)
    );
  }

  if (property && property !== 'all') {
    items = items.filter(
      (c: any) => c.property?.toLowerCase() === property || c.hotel?.toLowerCase() === property
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
    if (!body.contractName && !body.supplierName) {
      return NextResponse.json({ success: false, error: 'Contract details are required' }, { status: 400 });
    }

    const contractId = body.contractId || `CON-${Date.now().toString().slice(-4)}`;
    const newItem = await createDocument('contracts', {
      ...body,
      contractId,
      status: body.status || 'active',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create contract' }, { status: 500 });
  }
}
