import React, { useState } from "react";
import "./SignIn.css";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

function EnterOtp({ email, mode, onVerifyOtp, onResendOtp, onBack }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsLoading(false);
          return;
        }
        await onVerifyOtp(otp, password);
      } else {
        await onVerifyOtp(otp);
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Enter OTP</h1>
          <p>
            {mode === "signup"
              ? "Check your email for the verification code."
              : "Check your email for the password reset code."}
            <br />
            <span style={{ fontWeight: 500 }}>{email}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="otp">OTP</label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the 6-digit code"
              required
              maxLength={6}
            />
          </div>
          {mode === "signup" && (
            <>
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="password">Set Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set your password"
                  required
                  style={{ paddingRight: 36 }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 38,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  style={{ paddingRight: 36 }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 38,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </>
          )}
          {error && (
            <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
          )}
          <button type="submit" className="signin-button" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <div className="signin-footer">
          <button className="signup-link" type="button" onClick={onResendOtp}>
            Resend OTP
          </button>
          <button className="signup-link" type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnterOtp;
