import { db } from '@/lib/db'; 
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const events = await db.event.findMany(); 
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const eventData = await request.json();

    if (!eventData.title || !eventData.date || !eventData.time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newEvent = await db.event.create({
      data: {
        title: eventData.title,
        description: eventData.description || "",
        date: eventData.date,
        time: eventData.time,
        type: eventData.type || "other",
        color: eventData.color || "blue",
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
