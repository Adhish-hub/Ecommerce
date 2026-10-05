import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (fn) => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = () =>
    run(async () => {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setInfo(
        "If an account exists for that email, a 6-digit code has been sent.",
      );
    });

  const sendOtp = (e) => {
    e.preventDefault();
    run(async () => {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setStep(2);
      setInfo(
        "If an account exists for that email, a 6-digit code has been sent.",
      );
    });
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    run(async () => {
      const data = await api("/auth/verify-otp", {
        method: "POST",
        body: { email, otp },
      });
      setResetToken(data.resetToken);
      setStep(3);
    });
  };

  const resetPassword = (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match.");
    run(async () => {
      await api("/auth/reset-password", {
        method: "POST",
        body: { resetToken, newPassword: password },
      });
      navigate("/login", {
        state: { notice: "Password updated. Please log in." },
      });
    });
  };

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-slate-500">Step {step} of 3</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {info}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={sendOtp} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter your account email and we'll send you a one-time code.
            </p>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter the 6-digit code for <strong>{email}</strong>.
            </p>
            <input
              className="input text-center text-xl tracking-[0.5em]"
              inputMode="numeric"
              maxLength={6}
              placeholder="······"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button
              className="btn-primary w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying…" : "Verify code"}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={requestOtp}
                disabled={loading}
                className="text-brand-600 hover:underline"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setInfo("");
                }}
                className="text-slate-500 hover:underline"
              >
                Change email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <p className="text-sm text-slate-600">
              Code verified. Choose a new password.
            </p>
            <input
              className="input"
              type="password"
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <input
              className="input"
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500">
          Remembered it?{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
