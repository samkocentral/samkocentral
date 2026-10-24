import { NextResponse } from 'next/server';
import { isAdminConfigured } from '@/lib/firebaseAdmin';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getCollectionData } from '@/lib/serverData';

export async function GET() {
  const [properties, categories, assets, maintenance, compliance, insurance, contracts, utilities, tasks, documents, users] = await Promise.all([
    getCollectionData('properties'),
    getCollectionData('categories'),
    getCollectionData('assets'),
    getCollectionData('maintenance'),
    getCollectionData('compliance'),
    getCollectionData('insurance'),
    getCollectionData('contracts'),
    getCollectionData('utilities'),
    getCollectionData('tasks'),
    getCollectionData('documents'),
    getCollectionData('users'),
  ]);

  return NextResponse.json({
    status: 'ok',
    firebaseClientConfigured: isFirebaseConfigured(),
    firebaseAdminConfigured: isAdminConfigured(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
    counts: {
      properties: properties.length,
      categories: categories.length,
      assets: assets.length,
      maintenance: maintenance.length,
      compliance: compliance.length,
      insurance: insurance.length,
      contracts: contracts.length,
      utilities: utilities.length,
      tasks: tasks.length,
      documents: documents.length,
      users: users.length,
    },
    timestamp: new Date().toISOString(),
  });
}
