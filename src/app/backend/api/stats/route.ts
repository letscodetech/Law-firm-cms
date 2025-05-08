import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust this import to your database setup

export async function GET() {
  try {
    // Count clients by status
    const openCases = await db.client.count({
      where: { status: 'Open' }
    });
    
    const closedCases = await db.client.count({
      where: { status: 'Closed' }
    });
    
    const totalClients = await db.client.count();
    
    return NextResponse.json({
      openCases,
      closedCases,
      totalClients
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
