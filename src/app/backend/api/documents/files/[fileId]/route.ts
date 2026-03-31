// app/backend/api/documents/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile, stat, unlink } from 'fs/promises';
import { join, basename } from 'path';

// GET: Download or View the file
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
      return NextResponse.json({ error: 'File record or path not found' }, { status: 404 });
    }

    const storedPath = file.path;
    const filename = basename(storedPath); 

    // DEBUG LOGGING: Print exactly what the DB gave us
    console.log('=== DEBUG FILE FETCH ===');
    console.log('File ID:', fileId);
    console.log('File Name:', file.name);
    console.log('DB Stored Path:', storedPath);
    console.log('Extracted Filename:', filename);
    console.log('Project Root (cwd):', process.cwd());

    const possiblePaths = [
      join(process.cwd(), 'uploads', filename),
      join(process.cwd(), 'uploads', storedPath),
      join(process.cwd(), storedPath),
      storedPath, 
    ];
    
    console.log('Checking paths...');
    
    let filePath: string | null = null;
    for (const p of possiblePaths) {
      console.log(`-> Checking: ${p}`);
      try {
        await stat(p);
        filePath = p;
        console.log(`✅ SUCCESS! Found file at: ${p}`);
        break;
      } catch {
        console.log(`   ❌ Not found here.`);
        continue;
      }
    }
    
    if (!filePath) {
      console.error('🚨 FILE NOT FOUND ANYWHERE ON DISK');
      return NextResponse.json({ 
        error: 'File not found on disk. It may have been deleted or the upload failed.' 
      }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

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

// DELETE: Remove the file from DB and disk
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
      return NextResponse.json({ error: 'File not found in database' }, { status: 404 });
    }

    if (file.path) {
      const filename = basename(file.path);
      const possiblePaths = [
        join(process.cwd(), 'uploads', filename),
        join(process.cwd(), 'uploads', file.path),
        join(process.cwd(), file.path),
        file.path, 
      ];

      for (const p of possiblePaths) {
        try {
          await unlink(p);
          break;
        } catch {
          continue;
        }
      }
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