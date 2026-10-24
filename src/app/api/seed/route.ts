import { NextResponse } from 'next/server';
import { seedAllCollections } from '@/lib/serverData';

export async function POST() {
  const result = await seedAllCollections();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
