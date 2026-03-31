import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { del } from '@vercel/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'view';

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    const file = await db.document.findUnique({
      where: { id: fileId, type: 'file' }
    });

    if (!file || !file.path) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // file.path is now a blob URL e.g. https://xxx.blob.vercel-storage.com/...
    const blobResponse = await fetch(file.path);

    if (!blobResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 404 });
    }

    const fileBuffer = await blobResponse.arrayBuffer();

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    const disposition = action === 'download' ? 'attachment' : 'inline';
    headers.set('Content-Disposition', `${disposition}; filename="${file.name}"`);
    headers.set('Content-Length', fileBuffer.byteLength.toString());
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(new Uint8Array(fileBuffer), { status: 200, headers });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { name } = await request.json();

    if (!fileId || !name?.trim()) {
      return NextResponse.json({ error: 'Missing file ID or name' }, { status: 400 });
    }

    const updated = await db.document.update({
      where: { id: fileId },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    const file = await db.document.findUnique({
      where: { id: fileId, type: 'file' }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Vercel Blob using the stored URL
    if (file.path) {
      await del(file.path);
    }

    await db.document.delete({
      where: { id: fileId }
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}