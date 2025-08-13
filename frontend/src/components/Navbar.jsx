import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAppContext } from "../context/AppContext";

const Navbar = ({ onToggleSidebar }) => {
  const {
    state: { user, role },
  } = useAppContext();
  const displayRole = role || user?.role;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
          <span className="font-semibold">Leave Management</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          {displayRole && (
            <span className="rounded bg-gray-100 px-2 py-1">{displayRole}</span>
          )}
          {user?.email && (
            <span className="hidden sm:inline text-gray-600">{user.email}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
