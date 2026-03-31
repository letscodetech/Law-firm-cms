// app/backend/api/documents/upload/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
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

    // 1. Use the project root's "uploads" folder (PERMANENT storage)
    const uploadDir = path.join(process.cwd(), 'uploads');

    // 2. Create the folder if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // 3. Save the physical file to the hard drive
    const filePath = path.join(uploadDir, fileId);
    await writeFile(filePath, buffer);

    // 4. Save the RELATIVE path to the database 
    // (e.g., "uploads/12345-abcde" instead of "/tmp/uploads/12345-abcde")
    const dbPath = `uploads/${fileId}`;

    const document = await db.document.create({
      data: {
        id: fileId,
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        parentId: parentId === 'root' ? null : parentId,
        path: dbPath, 
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}