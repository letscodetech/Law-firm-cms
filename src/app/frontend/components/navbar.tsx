"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { 
  FiSearch, 
  FiCalendar, 
  FiFolder, 
  FiDollarSign, 
  FiBarChart2, 
  FiUsers, 
  FiLogOut
} from "react-icons/fi";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const { user, getUserInitials, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <nav className="flex justify-between items-center py-3 px-6 bg-white shadow">
      {/* Centered Links */}
      <div className="hidden md:flex space-x-5 mx-auto">
        <Link href="/" className="flex items-center gap-1 hover:text-blue-600">
          <FiBarChart2 />
          <span>Home</span>
        </Link>
        <Link href="/clients" className="flex items-center gap-1 hover:text-blue-600">
          <FiUsers />
          <span>Clients</span>
        </Link>
        <Link href="/diary" className="flex items-center gap-1 hover:text-blue-600">
          <FiCalendar />
          <span>Diary</span>
        </Link>
        <Link href="/documents" className="flex items-center gap-1 hover:text-blue-600">
          <FiFolder />
          <span>Documents</span>
        </Link>
        <Link href="/billing" className="flex items-center gap-1 hover:text-blue-600">
          <FiDollarSign />
          <span>Billing</span>
        </Link>
      </div>

      {/* Right side elements */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:border-blue-500"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
    
        
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
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
            onClick={() => window.location.href = '/login'} 
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