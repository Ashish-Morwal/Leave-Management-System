import React, { useEffect, useState } from "react";
import { applyLeave, getEmployees } from "../api";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const initialForm = {
  employeeId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

const ApplyLeaveForm = ({
  preselectedEmployeeId,
  allowSelect = false,
  reloadKey,
}) => {
  const { state } = useAppContext();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const idFromContext = state?.user?._id || state?.user?.id || "";
    const eid = preselectedEmployeeId || idFromContext;
    setForm((prev) => ({ ...prev, employeeId: eid }));
  }, [preselectedEmployeeId, state?.user]);

  useEffect(() => {
    if (!allowSelect) return;
    (async () => {
      try {
        const res = await getEmployees({ page: 1, limit: 100 });
        setEmployees(res.data?.employees || res.data?.data || []);
      } catch {
        // Ignore if not accessible
      }
    })();
  }, [allowSelect, reloadKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason?.trim()) {
      showError("Reason for leave is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      };
      if (allowSelect && form.employeeId) payload.employeeId = form.employeeId;
      await applyLeave(payload);
      showSuccess("Leave applied successfully");
      setForm((prev) => ({ ...prev, startDate: "", endDate: "", reason: "" }));
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to apply leave";
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Apply Leave</h2>

      {allowSelect && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">Employee</span>
          <select
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e._id || e.id} value={e._id || e.id}>
                {e.name} ({e.email})
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">Start date</span>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="input"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">End date</span>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="input"
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Reason</span>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          className="input min-h-[90px]"
          required
        />
      </label>

      {/* Leave Balance Warning */}
      {state.user && state.user.leaveBalance <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">
            ⚠️ Balance exhausted. You cannot apply for leave until your balance
            is restored.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          disabled={submitting || (state.user && state.user.leaveBalance <= 0)}
          className={`btn ${
            state.user && state.user.leaveBalance <= 0
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {submitting ? "Submitting..." : "Apply"}
        </button>
      </div>
    </form>
  );
};

export default ApplyLeaveForm;
