"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
type EventType = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "hearing" | "Mention" | "meeting" | "deadline" | "other";
  color: string;
};

type ViewType = "day" | "week" | "month";

const colorOptions = [
  { label: "Blue", value: "blue", class: "bg-blue-500" },
  { label: "Red", value: "red", class: "bg-red-500" },
  { label: "Green", value: "green", class: "bg-green-500" },
  { label: "Purple", value: "purple", class: "bg-purple-500" },
  { label: "Orange", value: "orange", class: "bg-orange-500" },
];

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const formattedHour = hour.toString().padStart(2, "0");
  const formattedMinute = minute.toString().padStart(2, "0");
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return {
    value: `${formattedHour}:${formattedMinute}`,
    label: `${displayHour}:${formattedMinute} ${period}`,
  };
});

const api = {
  getEvents: async (): Promise<EventType[]> => {
    try {
      const response = await fetch('/backend/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
    } catch {
      const savedEvents = localStorage.getItem("legalDiaryEvents");
      return savedEvents ? JSON.parse(savedEvents) : [];
    }
  },

  createEvent: async (event: EventType): Promise<EventType> => {
    try {
      const response = await fetch('/backend/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error('Failed to create event');
      return await response.json();
    } catch {
      return event;
    }
  },

  updateEvent: async (event: EventType): Promise<EventType> => {
    try {
      const response = await fetch(`/backend/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error('Failed to update event');
      return await response.json();
    } catch {
      return event;
    }
  },

  deleteEvent: async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/backend/api/events/${eventId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete event');
      return true;
    } catch {
      return false;
    }
  }
};

export default function DiaryPage() {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [newEvent, setNewEvent] = useState<Omit<EventType, "id"> & { id?: string }>({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "other",
    color: "blue",
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      const fetchedEvents = await api.getEvents();
      setEvents(fetchedEvents);
      setIsLoading(false);
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem("legalDiaryEvents", JSON.stringify(events));
    }
  }, [events]);

  const handlePrevious = () => {
    setCurrentDate(view === "day" ? subDays(currentDate, 1)
      : view === "week" ? subWeeks(currentDate, 1)
      : subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(view === "day" ? addDays(currentDate, 1)
      : view === "week" ? addWeeks(currentDate, 1)
      : addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setIsEditing(false);
    setNewEvent({
      title: "",
      description: "",
      date: format(date, "yyyy-MM-dd"),
      time: format(new Date().setHours(9, 0, 0, 0), "HH:mm"),
      type: "other",
      color: "blue",
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (event: EventType, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setNewEvent({ ...event });
    setIsDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title.trim()) {
      toast.error("Please enter a title for the event");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && newEvent.id) {
        const updatedEvent = await api.updateEvent(newEvent as EventType);
        setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        toast.success("Event updated successfully");
      } else {
        const event: EventType = {
          ...newEvent,
          id: Date.now().toString(),
        };
        const createdEvent = await api.createEvent(event);
        setEvents([...events, createdEvent]);
        toast.success("Event added successfully");
      }

      setIsDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        type: "other",
        color: "blue",
      });
    } catch {
      toast.error("Failed to save event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!newEvent.id) return;

    setIsLoading(true);

    try {
      await api.deleteEvent(newEvent.id);
      setEvents(events.filter(e => e.id !== newEvent.id));
      toast.success("Event deleted successfully");
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  // Generate day cells for month view
  const generateMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day: Date) => {
      // Get events for this day
      const dayEvents = events.filter((event) =>
        isSameDay(parseISO(event.date), day)
      );

      return (
        <div
          key={day.toString()}
          className={cn(
            "h-32 p-1 border border-gray-200 overflow-hidden relative",
            !isSameMonth(day, currentDate) && "bg-gray-50 text-gray-400",
            isSameDay(day, new Date()) && "bg-blue-50",
            "hover:bg-blue-50 cursor-pointer transition-colors"
          )}
          onClick={() => handleDayClick(day)}
        >
          <div className="flex justify-between mb-1">
            <span
              className={cn(
                "text-sm font-medium h-6 w-6 flex items-center justify-center",
                isSameDay(day, new Date()) &&
                  "bg-blue-600 text-white rounded-full"
              )}
            >
              {format(day, "d")}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-24 overflow-hidden">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs p-1.5 rounded truncate cursor-pointer hover:ring-1 hover:ring-offset-1",
                  event.color === "blue" && "bg-blue-100 text-blue-800",
                  event.color === "red" && "bg-red-100 text-red-800",
                  event.color === "green" && "bg-green-100 text-green-800",
                  event.color === "purple" && "bg-purple-100 text-purple-800",
                  event.color === "orange" && "bg-orange-100 text-orange-800"
                )}
                onClick={(e) => handleEventClick(event, e)}
              >
                <div className="font-medium">{event.time.substring(0, 5)}</div>
                <div className="truncate">{event.title}</div>
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 pl-1 absolute bottom-1 right-1 bg-white px-1 rounded">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  // Generate week view
  const generateWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 text-center py-2 border-b bg-gray-50">
          {days.map((day: Date) => (
            <div key={day.toString()} className="text-sm font-medium">
              <div>{format(day, "EEE")}</div>
              <div
                className={cn(
                  "inline-flex items-center justify-center h-8 w-8 rounded-full mt-1",
                  isSameDay(day, new Date()) && "bg-blue-600 text-white"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {days.map((day: Date) => {
            const dayEvents = events.filter((event) =>
              isSameDay(parseISO(event.date), day)
            );

            return (
              <div
                key={day.toString()}
                className="border-r border-b min-h-16 h-full"
                onClick={() => handleDayClick(day)}
              >
                <div className="h-full p-1 overflow-y-auto space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-2 rounded mb-1 cursor-pointer hover:ring-1 hover:ring-offset-1",
                        event.color === "blue" && "bg-blue-100 text-blue-800",
                        event.color === "red" && "bg-red-100 text-red-800",
                        event.color === "green" &&
                          "bg-green-100 text-green-800",
                        event.color === "purple" &&
                          "bg-purple-100 text-purple-800",
                        event.color === "orange" &&
                          "bg-orange-100 text-orange-800"
                      )}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="font-medium">{event.time}</div>
                      <div>{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Generate day view
  const generateDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

    const dayEvents = events.filter((event) =>
      isSameDay(parseISO(event.date), currentDate)
    );

    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="text-center py-4 border-b bg-gray-50">
          <div className="text-lg font-medium">
            {format(currentDate, "EEEE")}
          </div>
          <div
            className={cn(
              "inline-flex items-center justify-center h-8 w-8 rounded-full mt-1",
              isSameDay(currentDate, new Date()) && "bg-blue-600 text-white"
            )}
          >
            {format(currentDate, "d")}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter(
              (event) => parseInt(event.time.split(":")[0]) === hour
            );

            return (
              <div
                key={hour}
                className="flex border-b min-h-16"
                onClick={() => {
                  setSelectedDate(currentDate);
                  setIsEditing(false);
                  setNewEvent({
                    title: "",
                    description: "",
                    date: format(currentDate, "yyyy-MM-dd"),
                    time: `${hour.toString().padStart(2, "0")}:00`,
                    type: "other",
                    color: "blue",
                  });
                  setIsDialogOpen(true);
                }}
              >
                <div className="w-16 p-2 border-r text-xs text-gray-500 text-right">
                  {hour % 12 === 0 ? 12 : hour % 12}:00{" "}
                  {hour >= 12 ? "PM" : "AM"}
                </div>
                <div className="flex-1 p-1">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-2 rounded mb-1 cursor-pointer hover:ring-1 hover:ring-offset-1",
                        event.color === "blue" && "bg-blue-100 text-blue-800",
                        event.color === "red" && "bg-red-100 text-red-800",
                        event.color === "green" &&
                          "bg-green-100 text-green-800",
                        event.color === "purple" &&
                          "bg-purple-100 text-purple-800",
                        event.color === "orange" &&
                          "bg-orange-100 text-orange-800"
                      )}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div>{event.title}</div>
                      <div className="text-xs opacity-70">{event.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render the appropriate view
  const renderView = () => {
    if (isLoading && events.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case "day":
        return generateDayView();
      case "week":
        return generateWeekView();
      case "month":
      default:
        return (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
              {generateMonthDays()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Legal Diary</h1>
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setIsEditing(false);
              setNewEvent({
                title: "",
                description: "",
                date: format(new Date(), "yyyy-MM-dd"),
                time: format(new Date(), "HH:mm"),
                type: "other",
                color: "blue",
              });
              setIsDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <div className="flex items-center rounded-md border border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1 min-w-32 text-center">
                {view === "day" && format(currentDate, "MMMM d, yyyy")}
                {view === "week" && (
                  <>
                    {format(startOfWeek(currentDate), "MMM d")} -{" "}
                    {format(endOfWeek(currentDate), "MMM d, yyyy")}
                  </>
                )}
                {view === "month" && format(currentDate, "MMMM yyyy")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              className={cn(
                "rounded-none",
                view === "day"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "hover:bg-gray-100"
              )}
              onClick={() => setView("day")}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              className={cn(
                "rounded-none",
                view === "week"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "hover:bg-gray-100"
              )}
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              className={cn(
                "rounded-none",
                view === "month"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "hover:bg-gray-100"
              )}
              onClick={() => setView("month")}
            >
              Month
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">{renderView()}</main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={newEvent.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                value={newEvent.time}
                onValueChange={(value) => {
                  setNewEvent({
                    ...newEvent,
                    time: value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => {
                  setNewEvent({
                    ...newEvent,
                    type: value as EventType["type"],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hearing">Hearing</SelectItem>
                  <SelectItem value="Mention">Mention</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={newEvent.color}
                onValueChange={(value) => {
                  setNewEvent({
                    ...newEvent,
                    color: value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full mr-2 ${color.class}`}
                        ></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                placeholder="Add notes or details"
                rows={3}
              />
            </div>

            <DialogFooter className="flex justify-between space-x-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteEvent}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}