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

    const fileId = uuidv4();

    // Upload to Vercel Blob (works in production)
    const blob = await put(`documents/${fileId}`, file, {
      access: 'public',
    });

    // Save the blob URL to the database instead of a local path
    const document = await db.document.create({
      data: {
        id: fileId,
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        parentId: parentId === 'root' ? null : parentId,
        path: blob.url, // store the cloud URL
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}