import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerApi } from "../api";
import { useAppContext, ACTIONS } from "../context/AppContext";

const Register = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
    joiningDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await registerApi(form);
      const { token, user } = res.data || {};
      if (token) {
        dispatch({ type: ACTIONS.REGISTER_SUCCESS, payload: { token, user } });
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Role</span>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option>Employee</option>
              <option>Admin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm text-gray-700">Joining date</span>
            <input
              type="date"
              name="joiningDate"
              value={form.joiningDate}
              onChange={onChange}
              required
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
        </div>

        <button disabled={submitting} className="btn w-full justify-center">
          {submitting ? "Creating..." : "Create account"}
        </button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;



