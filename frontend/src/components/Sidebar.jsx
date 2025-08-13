import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAppContext } from "../context/AppContext";

const NavItem = ({ to, icon: Icon, label, onClick, active }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
      active
        ? "bg-blue-50 text-blue-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </Link>
);

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state: { role, user },
    logout: logoutContext,
  } = useAppContext();

  const items = useMemo(() => {
    const base = [
      { to: "/", icon: HomeIcon, label: "Home" },
      { to: "/profile", icon: UserCircleIcon, label: "Profile" },
    ];

    if (role === "Admin") {
      return [
        ...base,
        { to: "/employees", icon: UsersIcon, label: "Employees" },
        { to: "/admin", icon: ShieldCheckIcon, label: "Admin Panel" },
        {
          to: "/admin/leaves",
          icon: CalendarDaysIcon,
          label: "Leave Management",
        },
      ];
    }

    return [
      ...base,
      { to: "/my-leaves", icon: CalendarDaysIcon, label: "My Leaves" },
      { to: "/apply-leave", icon: CalendarDaysIcon, label: "Apply Leave" },
    ];
  }, [role]);

  const logout = () => {
    logoutContext();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-gray-200 bg-white shadow-sm transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:-translate-x-0"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              Current Role
            </span>
            <span className="text-xs text-gray-500">{role || "Guest"}</span>
          </div>
          <button
            aria-label="Close sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        <div className="space-y-1 p-3">
          {items.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              onClick={() => setOpen(false)}
              active={location.pathname === item.to}
            />
          ))}
        </div>

        <div className="mt-auto p-3">
          <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <div className="font-medium text-gray-700">
              {user?.name || "Signed in"}
            </div>
            <div className="truncate text-gray-500">{user?.email || ""}</div>
          </div>
          <button
            onClick={logout}
            className="btn w-full justify-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
