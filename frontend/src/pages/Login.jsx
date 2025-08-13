import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginContext } = useAppContext();
  const { showError } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await loginContext(form);
      if (result.success) {
        // Redirect to the page they were trying to access, or dashboard
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        showError(result.error || "Login failed");
      }
    } catch (err) {
      showError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
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
        <button disabled={submitting} className="btn w-full justify-center">
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        {/* Self-registration removed */}
      </form>
    </div>
  );
};

export default Login;
