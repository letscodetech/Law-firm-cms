import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || 'root';

    // Set parentId condition based on folderId
    const parentIdCondition = folderId === 'root' ? null : folderId;

    // Fetch files
    const files = await db.document.findMany({
      where: {
        parentId: parentIdCondition,
        type: 'file'
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Fetch folders
    const folders = await db.document.findMany({
      where: {
        parentId: parentIdCondition,
        type: 'folder'
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json([...folders, ...files]);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}