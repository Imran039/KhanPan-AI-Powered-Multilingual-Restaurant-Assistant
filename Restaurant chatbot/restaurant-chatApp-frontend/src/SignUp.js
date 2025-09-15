import React, { useState } from "react";
import "./SignIn.css";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

function SignUp({ onShowSignIn, onSignUp }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    onSignUp({ name: formData.name, email: formData.email }).finally(() =>
      setIsLoading(false)
    );
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Create your account</h1>
          <p>Sign up to start chatting with KhanPan</p>
        </div>
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group" style={{ position: "relative" }}>
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Set your password"
              required
              style={{ paddingRight: 36 }}
            />
            <span
              className="password-eye"
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
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              style={{ paddingRight: 36 }}
            />
            <span
              className="password-eye"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
          <button type="submit" className="signin-button" disabled={isLoading}>
            {isLoading ? (
              <span
                className="loader-spinner"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  width: 22,
                  height: 22,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 22,
                    height: 22,
                    border: "3px solid #fff",
                    borderTop: "3px solid #667eea",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
        <div className="signin-footer">
          <button className="signup-link" type="button" onClick={onShowSignIn}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

<style>{`
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`}</style>;
