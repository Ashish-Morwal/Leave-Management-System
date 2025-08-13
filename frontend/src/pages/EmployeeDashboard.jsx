import React, { useState } from "react";
import ApplyLeaveForm from "../components/ApplyLeaveForm";
import LeaveTable from "../components/LeaveTable";
import { useAppContext } from "../context/AppContext";

const EmployeeDashboard = () => {
  const { state } = useAppContext();
  const employeeId = state?.user?._id || state?.user?.id;
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <div className="space-y-4">
      <ApplyLeaveForm
        preselectedEmployeeId={employeeId}
        reloadKey={reloadKey}
      />
      <LeaveTable
        employeeId={employeeId}
        onChanged={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
};

export default EmployeeDashboard;
