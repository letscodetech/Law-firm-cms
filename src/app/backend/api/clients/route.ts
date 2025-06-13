import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Type definitions for better type safety
interface Matter {
  title: string;
  dateOpened: string;
  status: string;
  type: string;
  description?: string;
}

interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  matters: Matter[];
}

export async function POST(request: Request) {
  try {
    const clientData: ClientData = await request.json();
    const { matters, ...clientInfo } = clientData;

    // Validate required fields
    if (!clientInfo.name || !clientInfo.name.trim()) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    if (!matters || matters.length === 0) {
      return NextResponse.json(
        { error: 'At least one matter is required' },
        { status: 400 }
      );
    }

    // Validate matters
    for (const matter of matters) {
      if (!matter.title || !matter.title.trim()) {
        return NextResponse.json(
          { error: 'All matters must have a title' },
          { status: 400 }
        );
      }
      if (!matter.dateOpened) {
        return NextResponse.json(
          { error: 'All matters must have a date opened' },
          { status: 400 }
        );
      }
    }

    // Create client with matters using a transaction
    const newClient = await db.$transaction(async (tx) => {
      // First create the client
      const client = await tx.client.create({
        data: {
          name: clientInfo.name.trim(),
          email: clientInfo.email?.trim() || null,
          phone: clientInfo.phone?.trim() || null,
          address: clientInfo.address?.trim() || null,
          // Set main client properties based on first matter for backward compatibility
          dateOpened: new Date(matters[0].dateOpened),
          status: matters[0].status,
          type: matters[0].type,
        },
      });

      // Then create all matters for this client
      const createdMatters = await Promise.all(
        matters.map((matter, index) =>
          tx.matter.create({
            data: {
              clientId: client.id,
              title: matter.title.trim(),
              dateOpened: new Date(matter.dateOpened),
              status: matter.status,
              type: matter.type,
              description: matter.description?.trim() || null,
              // You might want to add a sort order
              sortOrder: index,
            },
          })
        )
      );

      // Return client with matters
      return {
        ...client,
        matters: createdMatters,
      };
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A client with this information already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create client and matters' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        matters: {
          orderBy: { sortOrder: 'asc' },
        },
        caseDetails: true, // Keep this for backward compatibility if needed
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