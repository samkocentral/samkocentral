import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET() {
  const categories = await getCollectionData('categories');
  return NextResponse.json({
    success: true,
    count: categories.length,
    data: categories,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const newCategory = await createDocument('categories', {
      ...body,
      color: body.color || '#e8c97a',
    });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create category' }, { status: 500 });
  }
}
