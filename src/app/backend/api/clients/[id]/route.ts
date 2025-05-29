import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const id = url.pathname.split('/').pop();
    const clientId = id || '';

    if (!clientId) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const updateData = await request.json();

    const updatedCaseDetails = await db.caseDetails.upsert({
      where: { clientId },
      update: updateData,
      create: { ...updateData, clientId },
    });

    return NextResponse.json(updatedCaseDetails);
  } catch (error) {
    console.error('Error updating case details:', error);
    return NextResponse.json({ error: 'Failed to update case details' }, { status: 500 });
  }
}

