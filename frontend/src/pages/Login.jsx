import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice;
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>

        {notice && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <input
          className="input"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>

        <div className="flex justify-between text-sm text-slate-500">
          <Link to="/forgot-password" className="hover:text-brand-600">
            Forgot password?
          </Link>
          <Link to="/register" className="hover:text-brand-600">
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
