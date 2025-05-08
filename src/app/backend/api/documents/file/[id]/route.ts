import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';

// DELETE file
export async function DELETE(request: NextRequest) {
  try {
    const fileId = request.nextUrl.pathname.split('/').at(-1);

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    const file = await db.document.findUnique({
      where: { id: fileId, type: 'file' }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.path) {
      try {
        await unlink(file.path);
      } catch (err) {
        console.error('Error deleting physical file:', err);
      }
    }

    await db.document.delete({
      where: { id: fileId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

// PATCH file (rename)
export async function PATCH(request: NextRequest) {
  try {
    const fileId = request.nextUrl.pathname.split('/').at(-1);

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const file = await db.document.findUnique({
      where: { id: fileId, type: 'file' }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const updatedFile = await db.document.update({
      where: { id: fileId },
      data: { name }
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
