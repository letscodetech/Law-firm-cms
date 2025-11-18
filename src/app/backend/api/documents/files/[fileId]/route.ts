// app/backend/api/documents/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { stat } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'view'; // 'view' or 'download'

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    // Fetch file record from database
    const file = await db.document.findUnique({
      where: { id: fileId, type: 'file' }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!file.path) {
      return NextResponse.json({ error: 'File path not available' }, { status: 404 });
    }

    // Construct the full file path - handle various path formats
    const storedPath = file.path;
    
    console.log('Stored path from database:', storedPath);
    
    // Try different path combinations to find the file
    const possiblePaths = [
      storedPath, // Absolute path as stored
      join(process.cwd(), storedPath), // Relative to project root
      join(process.cwd(), 'uploads', storedPath), // uploads/path
      join(process.cwd(), storedPath.replace('tmp/uploads/', 'uploads/')), // Replace tmp/uploads with uploads
      join(process.cwd(), storedPath.replace(/^tmp\//, '')), // Remove tmp/ prefix
    ];
    
    // Find which path exists
    let filePath: string | null = null;
    for (const path of possiblePaths) {
      try {
        await stat(path);
        filePath = path;
        console.log('File found at:', filePath);
        break;
      } catch {
        // File not found at this path, try next
        continue;
      }
    }
    
    if (!filePath) {
      console.error('File not found in any of these locations:');
      possiblePaths.forEach(p => console.error('  -', p));
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    // Read file content
    const fileBuffer = await readFile(filePath);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    
    // Set disposition based on action
    const disposition = action === 'download' ? 'attachment' : 'inline';
    headers.set('Content-Disposition', `${disposition}; filename="${file.name}"`);
    headers.set('Content-Length', fileBuffer.byteLength.toString());
    
    // Set cache headers for better performance
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Accept-Ranges', 'bytes');

    // Return file as response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ 
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}