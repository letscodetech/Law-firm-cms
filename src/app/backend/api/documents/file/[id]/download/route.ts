import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').at(-2); // Extract [id] from URL

    if (!id) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    const file = await db.document.findUnique({
      where: { id, type: 'file' },
    });

    if (!file || !file.path) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(file.path);

    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
    response.headers.set('Content-Type', file.mimeType || 'application/octet-stream');

    return response;
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
