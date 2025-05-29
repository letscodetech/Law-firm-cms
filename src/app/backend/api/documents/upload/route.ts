import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentId = formData.get('parentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = uuidv4();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use /tmp directory on Vercel for writable file storage
    const uploadDir = path.join('/tmp', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileId);
    await writeFile(filePath, buffer);

    // Save the path relative to your app or just store the fileId for cloud URLs
    const document = await db.document.create({
      data: {
        id: fileId,
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        parentId: parentId === 'root' ? null : parentId,
        path: filePath, // or just `fileId` if you upload to cloud later
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
