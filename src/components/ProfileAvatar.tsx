// src/app/components/ProfileAvatar.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";

export default function ProfileAvatar() {
  const { user, getUserInitials } = useAuth();
  
  if (!user) {
    return null;
  }

  // Get user initials for the avatar
  const initials = getUserInitials();
  
  return (
    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
      <span className="font-medium text-sm">{initials}</span>
    </div>
  );
}