import React, { useState } from "react";
import "./SignIn.css";
import { Eye, EyeOff } from "lucide-react";

function SignIn({ onSignIn, onShowSignUp, onShowForgotPassword }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSignIn(formData);
    }, 1000);
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Welcome to KhanPan</h1>
          <p>Sign in to access your past order history</p>
        </div>
        <form onSubmit={handleSubmit} className="signin-form">
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
              placeholder="Enter your password"
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
              "Sign In"
            )}
          </button>
        </form>
        <div className="signin-footer">
          <p>
            Don't have an account?{" "}
            <button
              className="signup-link"
              type="button"
              onClick={onShowSignUp}
            >
              Sign up
            </button>
          </p>
          <button
            className="forgot-password"
            type="button"
            onClick={onShowForgotPassword}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignIn;

<style>{`
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`}</style>;
