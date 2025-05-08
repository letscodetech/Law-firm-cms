import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Create new folder
export async function POST(request: Request) {
  try {
    const { name, parentId } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }
    
    const folder = await db.document.create({
      data: {
        id: uuidv4(),
        name,
        type: 'folder',
        parentId: parentId === 'root' ? null : parentId
      }
    });
    
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
