import { NextResponse } from 'next/server';
import { bulkCreateDocuments } from '@/lib/serverData';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : (Array.isArray(body) ? body : []);

    if (!items.length) {
      return NextResponse.json({ success: false, error: 'No items provided for bulk upload' }, { status: 400 });
    }

    const result = await bulkCreateDocuments('assets', items);
    return NextResponse.json({
      success: true,
      count: result.count,
      data: result.data,
      message: `Successfully stored ${result.count} assets in the database`,
    });
  } catch (error: any) {
    console.error('Bulk asset creation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to bulk create assets' },
      { status: 500 }
    );
  }
}
