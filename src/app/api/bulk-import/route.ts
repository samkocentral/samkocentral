import { NextResponse } from 'next/server';
import { bulkCreateDocuments } from '@/lib/serverData';

const ALLOWED_COLLECTIONS = [
  'assets',
  'maintenance',
  'compliance',
  'insurance',
  'contracts',
  'utilities',
  'documents',
  'tasks',
  'categories',
  'properties',
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const collection = body?.collection || 'assets';
    const items = Array.isArray(body?.items) ? body.items : (Array.isArray(body) ? body : []);

    if (!ALLOWED_COLLECTIONS.includes(collection)) {
      return NextResponse.json(
        { success: false, error: `Invalid collection: ${collection}. Must be one of: ${ALLOWED_COLLECTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json({ success: false, error: 'No items provided for bulk upload' }, { status: 400 });
    }

    const result = await bulkCreateDocuments(collection, items);
    return NextResponse.json({
      success: true,
      collection,
      count: result.count,
      data: result.data,
      message: `Successfully stored ${result.count} records in ${collection}`,
    });
  } catch (error: any) {
    console.error('Universal bulk import error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to bulk import records' },
      { status: 500 }
    );
  }
}
