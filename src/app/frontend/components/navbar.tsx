"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { usePathname } from "next/navigation";
import {
  FiCalendar,
  FiFolder,
  FiDollarSign,
  FiBarChart2,
  FiUsers,
  FiLogOut,
  FiBell,
} from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { format, parseISO, isToday, isTomorrow, addDays, isBefore, isAfter } from "date-fns";

type EventType = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "hearing" | "Mention" | "meeting" | "deadline" | "other";
  color: string;
};

const Navbar = () => {
  const { user, getUserInitials, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventType[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Fetch events from localStorage or API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/backend/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const fetchedEvents = await response.json();
        setEvents(fetchedEvents);
      } catch {
        const savedEvents = localStorage.getItem("legalDiaryEvents");
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents));
        }
      }
    };
    
    fetchEvents();
    
    // Set up interval to refresh events every minute
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter upcoming events (today and next 7 days)
  useEffect(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    const upcoming = events.filter(event => {
      const eventDate = parseISO(event.date);
      return (isToday(eventDate) || (isAfter(eventDate, now) && isBefore(eventDate, nextWeek)));
    }).sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      if (dateA.getTime() === dateB.getTime()) {
        return a.time.localeCompare(b.time);
      }
      return dateA.getTime() - dateB.getTime();
    });
    
    setUpcomingEvents(upcoming);
    console.log('Events:', events.length, 'Upcoming:', upcoming.length); // Debug log
  }, [events]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserIconClick = () => {
    setShowDropdown(!showDropdown);
    setShowNotifications(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowDropdown(false);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const getEventDateLabel = (eventDate: string) => {
    const date = parseISO(eventDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "hearing":
        return "text-red-600 bg-red-50";
      case "Mention":
        return "text-blue-600 bg-blue-50";
      case "deadline":
        return "text-orange-600 bg-orange-50";
      case "meeting":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Helper function to determine if a link is active
  const isActiveLink = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // Helper function to get link classes
  const getLinkClasses = (path: string) => {
    const baseClasses = "flex items-center gap-1 transition-colors";
    return isActiveLink(path)
      ? `${baseClasses} text-blue-600 font-medium`
      : `${baseClasses} hover:text-blue-600`;
  };

  return (
    <nav className="flex justify-between items-center py-3 px-6 bg-white shadow">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={250}
            height={80}
            className="h-20 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Centered Links */}
      <div className="hidden md:flex space-x-5 absolute left-1/2 transform -translate-x-1/2">
        <Link href="/" className={getLinkClasses("/")}>
          <FiBarChart2 />
          <span>Home</span>
        </Link>
        <Link href="/clients" className={getLinkClasses("/clients")}>
          <FiUsers />
          <span>Clients</span>
        </Link>
        <Link href="/diary" className={getLinkClasses("/diary")}>
          <FiCalendar />
          <span>Diary</span>
        </Link>
        <Link href="/documents" className={getLinkClasses("/documents")}>
          <FiFolder />
          <span>Documents</span>
        </Link>
        <Link href="/billing" className={getLinkClasses("/billing")}>
          <FiDollarSign />
          <span>Billing</span>
        </Link>
      </div>

      {/* Right side elements */}
      <div className="flex items-center gap-3">
        {/* Notifications - Always visible for testing */}
        {user && (
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="relative h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer border border-gray-300"
              title={`${upcomingEvents.length} upcoming events`}
            >
              <FiBell className="h-5 w-5 text-gray-600" />
              {/* Always show badge for testing - remove the condition temporarily */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {upcomingEvents.length > 9 ? '9+' : upcomingEvents.length || '0'}
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-20 border border-gray-200 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                  Upcoming Events
                </div>
                
                {upcomingEvents.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No upcoming events
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {upcomingEvents.map((event) => (
                      <Link
                        key={event.id}
                        href="/diary"
                        className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => setShowNotifications(false)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                {event.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {event.time.substring(0, 5)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-900">
                              {getEventDateLabel(event.date)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                {upcomingEvents.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <Link
                      href="/diary"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all events →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleUserIconClick}
              className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <span className="font-medium text-sm">{getUserInitials()}</span>
            </button>
 
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200 truncate">
                  {user.email}
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiLogOut className="mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;