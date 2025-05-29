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
} from "react-icons/fi";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const { user, getUserInitials, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserIconClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
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
        <div className="relative"></div>

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
