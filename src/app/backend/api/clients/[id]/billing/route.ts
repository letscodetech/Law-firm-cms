import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function extractClientIdFromRequest(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  const clientIndex = segments.indexOf('clients');
  return clientIndex !== -1 ? segments[clientIndex + 1] : null;
}

export async function GET(request: NextRequest) {
  try {
    const id = extractClientIdFromRequest(request);

    if (!id) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const billingData = await db.billing.findFirst({
      where: { clientId: id }
    });

    if (!billingData) {
      return NextResponse.json({ error: 'Billing data not found' }, { status: 404 });
    }

    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const id = extractClientIdFromRequest(request);
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    if (!data.totalAmount || isNaN(data.totalAmount) || data.totalAmount < 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    if (!data.amountPaid || isNaN(data.amountPaid) || data.amountPaid < 0) {
      return NextResponse.json({ error: 'Invalid amount paid' }, { status: 400 });
    }

    if (data.amountPaid > data.totalAmount) {
      return NextResponse.json({ error: 'Amount paid cannot exceed total amount' }, { status: 400 });
    }

    const client = await db.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const existingBilling = await db.billing.findFirst({ where: { clientId: id } });
    if (existingBilling) {
      return NextResponse.json(
        { error: 'Billing data already exists for this client. Use PATCH to update.' },
        { status: 409 }
      );
    }

    const billingRecord = await db.billing.create({
      data: {
        clientId: id,
        clientName: data.clientName,
        totalAmount: parseFloat(data.totalAmount),
        amountPaid: parseFloat(data.amountPaid),
        amountRemaining: parseFloat(data.totalAmount) - parseFloat(data.amountPaid),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(billingRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const id = extractClientIdFromRequest(request);
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    if ((data.totalAmount !== undefined && isNaN(data.totalAmount)) || data.totalAmount < 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    if ((data.amountPaid !== undefined && isNaN(data.amountPaid)) || data.amountPaid < 0) {
      return NextResponse.json({ error: 'Invalid amount paid' }, { status: 400 });
    }

    if (data.amountPaid > data.totalAmount) {
      return NextResponse.json({ error: 'Amount paid cannot exceed total amount' }, { status: 400 });
    }

    const existingBilling = await db.billing.findFirst({ where: { clientId: id } });
    if (!existingBilling) {
      return NextResponse.json({ error: 'Billing data not found' }, { status: 404 });
    }

    const updatedBilling = await db.billing.update({
      where: { id: existingBilling.id },
      data: {
        clientName: data.clientName,
        totalAmount: parseFloat(data.totalAmount),
        amountPaid: parseFloat(data.amountPaid),
        amountRemaining: parseFloat(data.totalAmount) - parseFloat(data.amountPaid),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedBilling);
  } catch (error) {
    console.error('Error updating billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = extractClientIdFromRequest(request);

    if (!id) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const existingBilling = await db.billing.findFirst({ where: { clientId: id } });
    if (!existingBilling) {
      return NextResponse.json({ error: 'Billing data not found' }, { status: 404 });
    }

    await db.billing.delete({ where: { id: existingBilling.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
