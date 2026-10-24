import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const city = searchParams.get('city')?.toLowerCase() || '';

  let properties = await getCollectionData('properties');

  if (search) {
    properties = properties.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(search) ||
        p.manager?.toLowerCase().includes(search) ||
        p.address?.toLowerCase().includes(search)
    );
  }

  if (city) {
    properties = properties.filter((p: any) => p.city?.toLowerCase() === city);
  }

  return NextResponse.json({
    success: true,
    count: properties.length,
    data: properties,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Property name is required' }, { status: 400 });
    }

    const newProperty = await createDocument('properties', {
      ...body,
      status: body.status || 'active',
      totalAssets: body.totalAssets || 0,
    });

    return NextResponse.json({ success: true, data: newProperty }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create property' }, { status: 500 });
  }
}
