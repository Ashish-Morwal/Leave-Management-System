import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { ANNUAL_LEAVE_LIMIT } from "../utils/constants";

const EmployeeForm = ({ onEmployeeAdded }) => {
  const { addEmployee, state, refreshData } = useAppContext();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    joiningDate: "",
    leaveBalance: ANNUAL_LEAVE_LIMIT.toString(),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare employee data with default values for optional fields
      const employeeData = {
        ...form,
        leaveBalance: parseInt(form.leaveBalance) || ANNUAL_LEAVE_LIMIT, // Ensure it's a number
      };

      const result = await addEmployee(employeeData);
      if (result.success) {
        // Reset form
        setForm({
          name: "",
          email: "",
          password: "",
          joiningDate: "",
          leaveBalance: ANNUAL_LEAVE_LIMIT.toString(),
        });

        // Notify parent component
        if (onEmployeeAdded) {
          onEmployeeAdded();
        }

        // Refresh data to show updated employee list
        await refreshData();

        showSuccess("Employee added successfully!");
      } else {
        showError(result.error || "Failed to add employee");
      }
    } catch (error) {
      showError("An error occurred while adding employee");
    } finally {
      setSubmitting(false);
    }
  };

  if (state.role !== "Admin") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">
          Access denied. Admin privileges required.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Add New Employee
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* Hidden fields to prevent browser autofill */}
        <input type="text" style={{ display: "none" }} />
        <input type="password" style={{ display: "none" }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <input
              type="email"
              id="employeeEmail"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="new-email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password *
            </label>
            <input
              type="password"
              id="employeePassword"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label
              htmlFor="joiningDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Joining Date *
            </label>
            <input
              type="date"
              id="joiningDate"
              name="joiningDate"
              value={form.joiningDate}
              onChange={handleChange}
              required
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Select joining date"
            />
          </div>

          <div>
            <label
              htmlFor="leaveBalance"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Initial Leave Balance
            </label>
            <div className="relative">
              <input
                type="number"
                id="leaveBalance"
                name="leaveBalance"
                value={form.leaveBalance}
                onChange={handleChange}
                min="0"
                max="365"
                autoComplete="off"
                className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder={ANNUAL_LEAVE_LIMIT.toString()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Default: {ANNUAL_LEAVE_LIMIT} days for all new employees
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding..." : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
