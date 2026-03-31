import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type MatterUpdateFields = {
  status?: string;
  type?: string;
  title?: string;
  description?: string;
};

// Helper to extract IDs from URL
function extractIdsFromUrl(url: string): { clientId: string | null; matterId: string | null } {
  const segments = url.split('/');
  const clientIndex = segments.indexOf('clients');
  const matterIndex = segments.indexOf('matters');
  
  return {
    clientId: clientIndex !== -1 ? segments[clientIndex + 1] : null,
    matterId: matterIndex !== -1 ? segments[matterIndex + 1] : null,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; matterId: string }> }
) {
  try {
    let clientId: string | null = null;
    let matterId: string | null = null;
    
    try {
      const paramsObj = await params;
      clientId = paramsObj.id || null;        // changed from paramsObj.clientId
      matterId = paramsObj.matterId || null;
    } catch (error) {
      console.error('Error getting params:', error);
    }
    
    // Fallback: extract from URL if params are missing
    if (!clientId || !matterId) {
      const url = new URL(request.url);
      const extracted = extractIdsFromUrl(url.pathname);
      clientId = extracted.clientId;
      matterId = extracted.matterId;
    }

    const updateData = await request.json();
    const matterIdNum = parseInt(matterId!);

    console.log('PATCH request received:', { clientId, matterId, updateData });

    if (!clientId || isNaN(matterIdNum)) {
      console.log('Invalid IDs:', { clientId, matterId });
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
  { params }: { params: Promise<{ id: string; matterId: string }> }
) {
  try {
    let clientId: string | null = null;
    let matterId: string | null = null;
    
    try {
      const paramsObj = await params;
      clientId = paramsObj.id || null;        // changed from paramsObj.clientId
      matterId = paramsObj.matterId || null;
    } catch (error) {
      console.error('Error getting params:', error);
    }
    
    // Fallback: extract from URL if params are missing
    if (!clientId || !matterId) {
      const url = new URL(request.url);
      const extracted = extractIdsFromUrl(url.pathname);
      clientId = extracted.clientId;
      matterId = extracted.matterId;
    }

    const matterIdNum = parseInt(matterId!);

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