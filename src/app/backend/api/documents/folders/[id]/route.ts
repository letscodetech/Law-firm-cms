import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE folder
export async function DELETE(request: NextRequest) {
  try {
    const folderId = request.nextUrl.pathname.split('/').at(-1);

    if (!folderId) {
      return NextResponse.json({ error: 'Missing folder ID' }, { status: 400 });
    }

    const folder = await db.document.findUnique({
      where: { id: folderId, type: 'folder' }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const children = await db.document.findMany({
      where: { parentId: folderId }
    });

    if (children.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder with contents' }, { status: 400 });
    }

    await db.document.delete({
      where: { id: folderId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}

// PATCH folder (rename)
export async function PATCH(request: NextRequest) {
  try {
    const folderId = request.nextUrl.pathname.split('/').at(-1);

    if (!folderId) {
      return NextResponse.json({ error: 'Missing folder ID' }, { status: 400 });
    }

    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const folder = await db.document.findUnique({
      where: { id: folderId, type: 'folder' }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const updatedFolder = await db.document.update({
      where: { id: folderId },
      data: { name }
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}
