import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to extract clientId from the URL
function extractClientId(request: NextRequest): number | null {
  const segments = request.nextUrl.pathname.split('/');
  const id = segments[segments.indexOf('clients') + 1];
  const clientId = parseInt(id);
  return isNaN(clientId) ? null : clientId;
}

// GET: Get case details for a specific client
export async function GET(request: NextRequest) {
  try {
    const clientId = extractClientId(request);
    if (!clientId) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const caseDetails = await db.caseDetails.findUnique({
      where: { clientId: String(clientId) },
    });

    if (!caseDetails) {
      return NextResponse.json({ error: 'Case details not found' }, { status: 404 });
    }

    return NextResponse.json(caseDetails);
  } catch (error) {
    console.error('GET caseDetails error:', error);
    return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 });
  }
}

// POST: Create or upsert case details
export async function POST(request: NextRequest) {
  try {
    const clientId = extractClientId(request);
    if (!clientId) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const body = await request.json();

    const caseDetails = await db.caseDetails.upsert({
      where: { clientId: String(clientId) },
      update: body,
      create: {
        ...body,
        clientId: String(clientId),
        client: { connect: { id: clientId } },
      },
    });

    return NextResponse.json(caseDetails, { status: 201 });
  } catch (error) {
    console.error('POST caseDetails error:', error);
    return NextResponse.json({ error: 'Failed to create case details' }, { status: 500 });
  }
}

// PATCH: Update case details
export async function PATCH(request: NextRequest) {
  try {
    const clientId = extractClientId(request);
    if (!clientId) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const body = await request.json();

    const existingDetails = await db.caseDetails.findUnique({
      where: { clientId: String(clientId) },
    });

    if (!existingDetails) {
      return NextResponse.json({ error: 'Case details not found' }, { status: 404 });
    }

    const updatedCaseDetails = await db.caseDetails.update({
      where: { clientId: String(clientId) },
      data: body,
    });

    return NextResponse.json(updatedCaseDetails);
  } catch (error) {
    console.error('PATCH caseDetails error:', error);
    return NextResponse.json({ error: 'Failed to update case details' }, { status: 500 });
  }
}
