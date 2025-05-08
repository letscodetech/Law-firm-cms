import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const id = url.pathname.split('/').pop(); // Extract 'id' from URL
    const clientId = id || ''; // Ensure clientId is a string

    if (!clientId) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const updateData = await request.json();

    const updatedClient = await db.client.update({
      where: { id: clientId }, // clientId is now a string
      data: updateData,
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}
