import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentId = formData.get('parentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
    }

    const fileId = uuidv4();

    // Pass token explicitly
    const blob = await put(`documents/${fileId}`, file, {
      access: 'public',
      token, // <-- explicitly pass it
    });

    const document = await db.document.create({
      data: {
        id: fileId,
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        parentId: parentId === 'root' ? null : parentId,
        path: blob.url,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to upload file'
    }, { status: 500 });
  }
}
//redeploying