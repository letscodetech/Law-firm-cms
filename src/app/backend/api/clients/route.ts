import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const clientData = await request.json();
    const { caseDetails, ...clientRest } = clientData;

    const newClient = await db.client.create({
      data: {
        ...clientRest,
        caseDetails: caseDetails
          ? {
              create: {
                caseNumber: caseDetails.caseNumber,
                filingDate: caseDetails.filingDate,
                caseSummary: caseDetails.caseSummary,
                station: caseDetails.station,
              },
            }
          : undefined,
      },
      include: {
        caseDetails: true,
      },
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        caseDetails: true,
      },
      orderBy: { dateOpened: 'desc' },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
