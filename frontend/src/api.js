import api from "./api/axios";

// Employees
export const createEmployee = (payload) => api.post("/api/employees", payload);
export const getEmployees = (params = {}) =>
  api.get("/api/employees", { params });

// Leaves
export const applyLeave = (payload) => api.post("/api/leaves", payload);
export const approveLeave = (id) => api.patch(`/api/leaves/${id}/approve`);
export const rejectLeave = (id) => api.patch(`/api/leaves/${id}/reject`);
export const getLeaveBalance = (employeeId) =>
  api.get(`/api/leaves/balance/${employeeId}`);

// Optional: attempt to list leaves (if backend exposes it)
export const listLeaves = (params = {}) => api.get("/api/leaves", { params });

// Auth
export const login = (payload) => api.post("/api/auth/login", payload);

export default api;
