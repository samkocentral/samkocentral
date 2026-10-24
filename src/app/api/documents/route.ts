import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData, createDocument } from '@/lib/serverData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const site = searchParams.get('site')?.toLowerCase() || searchParams.get('property')?.toLowerCase() || '';
  const category = searchParams.get('category')?.toLowerCase() || '';
  const status = searchParams.get('status')?.toLowerCase() || '';

  let documents = await getCollectionData('documents');

  if (search) {
    documents = documents.filter(
      (d: any) =>
        d.name?.toLowerCase().includes(search) ||
        d.site?.toLowerCase().includes(search) ||
        d.category?.toLowerCase().includes(search) ||
        d.notes?.toLowerCase().includes(search)
    );
  }

  if (site && site !== 'all' && site !== 'all sites') {
    documents = documents.filter(
      (d: any) =>
        d.site?.toLowerCase() === site ||
        d.property?.toLowerCase() === site ||
        d.hotel?.toLowerCase() === site
    );
  }

  if (category && category !== 'all') {
    documents = documents.filter((d: any) => d.category?.toLowerCase() === category);
  }

  if (status && status !== 'all') {
    documents = documents.filter((d: any) => d.status?.toLowerCase() === status);
  }

  return NextResponse.json({
    success: true,
    total: documents.length,
    data: documents,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Document name is required' }, { status: 400 });
    }

    const newDoc = await createDocument('documents', {
      ...body,
      id: body.id || `doc-${Date.now()}`,
      status: body.status || 'ok',
      site: body.site || body.property || 'Crowne Plaza Kingston-south',
      uploadedAt: new Date().toISOString().split('T')[0],
      size: body.size || '1.2 MB',
      type: body.type || 'PDF',
      version: body.version || 'v1.0',
    });

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create document' }, { status: 500 });
  }
}
