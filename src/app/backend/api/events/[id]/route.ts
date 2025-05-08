import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get a specific event
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const event = await db.event.findUnique({ where: { id } });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}


// Update a specific event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const eventData = await request.json();

    const existingEvent = await db.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!eventData.title || !eventData.date || !eventData.time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedEvent = await db.event.update({
      where: { id },
      data: {
        title: eventData.title,
        description: eventData.description || "",
        date: eventData.date,
        time: eventData.time,
        type: eventData.type || "other",
        color: eventData.color || "blue",
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Failed to update event:", error); // Log the error
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// Delete a specific event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingEvent = await db.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await db.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error); // Log the error
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
