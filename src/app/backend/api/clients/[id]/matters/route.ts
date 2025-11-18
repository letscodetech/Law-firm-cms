// src/app/backend/api/clients/[id]/matters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    // Fetch matters for the client
    const matters = await db.matter.findMany({
      where: { clientId: id },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(matters);
  } catch (error) {
    console.error('Error fetching matters:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch matters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    // Create a new matter for the client
    const newMatter = await db.matter.create({
      data: {
        clientId: id,
        title: body.title,
        type: body.type,
        description: body.description,
        status: body.status || 'Open',
        dateOpened: new Date(),
        sortOrder: body.sortOrder || 0
      }
    });

    return NextResponse.json(newMatter, { status: 201 });
  } catch (error) {
    console.error('Error creating matter:', error);
    return NextResponse.json({ 
      error: 'Failed to create matter',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}