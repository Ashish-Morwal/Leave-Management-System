import React, { useEffect, useState } from "react";
import { approveLeave, rejectLeave, listLeaves, getLeaveBalance } from "../api";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const StatusPill = ({ status }) => {
  const classes = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Approved: "bg-green-50 text-green-700 border-green-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
  };
  const cls = classes[status] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`rounded border px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
};

const LeaveTable = ({
  fetchLeaves,
  employeeId,
  onChanged,
  title = "Leaves",
  filterStatus = "Pending",
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const { state, refreshData } = useAppContext();
  const { showSuccess, showError } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      if (fetchLeaves) {
        const data = await fetchLeaves();
        const filtered = Array.isArray(data)
          ? filterStatus
            ? data.filter((r) => r?.status === filterStatus)
            : data
          : [];
        setRows(filtered);
      } else {
        try {
          const res = await listLeaves({ employeeId });
          const data = res.data?.leaves || res.data || [];
          const filtered = filterStatus
            ? data.filter((r) => r?.status === filterStatus)
            : data;
          setRows(filtered);
        } catch (e) {
          // Fallback: if listing endpoint is missing, show pending via balance for employees
          if (employeeId) {
            try {
              const bal = await getLeaveBalance(employeeId);
              const pending = bal.data?.pendingRequests || [];
              const mapped = pending.map((p) => ({
                ...(p || {}),
                status: "Pending",
              }));
              const filtered = filterStatus
                ? mapped.filter((r) => r?.status === filterStatus)
                : mapped;
              setRows(filtered);
            } catch {
              setRows([]);
            }
          } else {
            setRows([]);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const onApprove = async (id) => {
    try {
      await approveLeave(id);
      await load();
      await refreshData(); // Refresh employee data to show updated balances
      onChanged?.();
      showSuccess("Leave request approved successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to approve leave";
      showError(message);
    }
  };

  const onReject = async (id) => {
    try {
      await rejectLeave(id);
      await load();
      onChanged?.();
      showSuccess("Leave request rejected successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to reject leave";
      showError(message);
    }
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={load}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="py-6 text-center text-sm text-gray-600">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-600">
          {state?.role === "Admin"
            ? filterStatus === "Pending"
              ? "No pending leave requests."
              : "No leave requests found."
            : "No leave requests found."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2">
                  {state?.role === "Admin" ? "Employee Name" : "Leave Details"}
                </th>
                <th className="px-3 py-2">Start Date</th>
                <th className="px-3 py-2">End Date</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id || r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    {r.employee?.name || r.employeeName || r.employeeId}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(r.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(r.endDate).toLocaleDateString()}
                  </td>
                  <td
                    className="px-3 py-2 max-w-[260px] truncate"
                    title={r.reason}
                  >
                    {r.reason}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.status === "Pending" && state?.role === "Admin" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onApprove(r._id || r.id)}
                          className="rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(r._id || r.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    ) : r.status === "Pending" ? (
                      <span className="text-xs text-gray-500">
                        Waiting for approval
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveTable;
