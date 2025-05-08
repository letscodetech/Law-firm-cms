import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || 'root';

    const query: { where: Prisma.DocumentWhereInput } = {
      where: {}
    };

    query.where.parentId = folderId === 'root' ? null : folderId;

    const files = await db.document.findMany({
      where: {
        ...query.where,
        type: 'file'
      },
      orderBy: {
        name: 'asc'
      }
    });

    const folders = await db.document.findMany({
      where: {
        ...query.where,
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
