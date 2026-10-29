import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';
import { isAssetFixed } from '@/lib/assetData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const property = searchParams.get('property') || searchParams.get('hotelId') || '';
  const category = searchParams.get('category')?.toLowerCase() || '';
  const department = searchParams.get('department')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';
  const type = searchParams.get('type'); // 'fixed' | 'non-fixed'

  let assets = await getCollectionData('assets');

  if (search) {
    assets = assets.filter(
      (a: any) =>
        a.name?.toLowerCase().includes(search) ||
        a.assetId?.toLowerCase().includes(search) ||
        a.location?.toLowerCase().includes(search) ||
        a.manufacturer?.toLowerCase().includes(search)
    );
  }

  if (property) {
    assets = assets.filter(
      (a: any) =>
        a.hotelId === property ||
        a.hotelName?.toLowerCase() === property.toLowerCase() ||
        a.property === property
    );
  }

  if (category) {
    assets = assets.filter((a: any) => a.category?.toLowerCase() === category);
  }

  if (department) {
    assets = assets.filter((a: any) => a.department?.toLowerCase() === department);
  }

  if (status) {
    assets = assets.filter((a: any) => a.status?.toLowerCase() === status);
  }

  if (type === 'fixed') {
    assets = assets.filter((a: any) => isAssetFixed(a));
  } else if (type === 'non-fixed') {
    assets = assets.filter((a: any) => !isAssetFixed(a));
  }

  return NextResponse.json({
    success: true,
    total: assets.length,
    data: assets,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Asset name is required' }, { status: 400 });
    }

    const assetId = body.assetId || `AST-${Date.now().toString().slice(-6)}`;
    const newAsset = await createDocument('assets', {
      ...body,
      assetId,
      status: body.status || 'active',
      condition: body.condition || 'good',
      riskLevel: body.riskLevel || 'low',
      isFixed: body.isFixed ?? true,
      quantity: body.quantity || 1,
    });

    return NextResponse.json({ success: true, data: newAsset }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create asset' }, { status: 500 });
  }
}
