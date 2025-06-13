// File: src/app/backend/api/clients/[clientId]/matters/[matterId]/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type MatterUpdateFields = {
  status?: string;
  type?: string;
  title?: string;
  description?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string; matterId: string }> }
) {
  try {
    const { clientId, matterId } = await params;
    const updateData = await request.json();
    const matterIdNum = parseInt(matterId);

    if (!clientId || isNaN(matterIdNum)) {
      return NextResponse.json({ error: 'Invalid client ID or matter ID' }, { status: 400 });
    }

    const existingMatter = await db.matter.findFirst({
      where: {
        id: matterIdNum,
        clientId: clientId,
      },
    });

    if (!existingMatter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    const allowedFields: (keyof MatterUpdateFields)[] = ['status', 'type', 'title', 'description'];
    const filteredUpdateData: MatterUpdateFields = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredUpdateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedMatter = await db.matter.update({
      where: { id: matterIdNum },
      data: filteredUpdateData,
    });

    if (existingMatter.sortOrder === 0) {
      const clientUpdateData: Partial<Pick<MatterUpdateFields, 'status' | 'type'>> = {};

      if (filteredUpdateData.status) clientUpdateData.status = filteredUpdateData.status;
      if (filteredUpdateData.type) clientUpdateData.type = filteredUpdateData.type;

      if (Object.keys(clientUpdateData).length > 0) {
        await db.client.update({
          where: { id: clientId },
          data: clientUpdateData,
        });
      }
    }

    return NextResponse.json(updatedMatter);
  } catch (error) {
    console.error('Error updating matter:', error);
    return NextResponse.json({ error: 'Failed to update matter' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string; matterId: string }> }
) {
  try {
    const { clientId, matterId } = await params;
    const matterIdNum = parseInt(matterId);

    if (!clientId || isNaN(matterIdNum)) {
      return NextResponse.json({ error: 'Invalid client ID or matter ID' }, { status: 400 });
    }

    const existingMatter = await db.matter.findFirst({
      where: {
        id: matterIdNum,
        clientId: clientId,
      },
    });

    if (!existingMatter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    const matterCount = await db.matter.count({
      where: { clientId: clientId },
    });

    if (matterCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last matter for a client' },
        { status: 400 }
      );
    }

    await db.matter.delete({
      where: { id: matterIdNum },
    });

    return NextResponse.json({ message: 'Matter deleted successfully' });
  } catch (error) {
    console.error('Error deleting matter:', error);
    return NextResponse.json({ error: 'Failed to delete matter' }, { status: 500 });
  }
}