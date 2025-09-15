import React, { useState } from "react";
import "./SignIn.css";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

function ResetPassword({ email, onReset, onBack }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await onReset(newPassword);
    } catch (err) {
      setError(err.message || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Reset Password</h1>
          <p>
            Set a new password for{" "}
            <span style={{ fontWeight: 500 }}>{email}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group" style={{ position: "relative" }}>
            <label htmlFor="newPassword">New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
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
              placeholder="Confirm new password"
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
          {error && (
            <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
          )}
          <button type="submit" className="signin-button" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <div className="signin-footer">
          <button className="signup-link" type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
