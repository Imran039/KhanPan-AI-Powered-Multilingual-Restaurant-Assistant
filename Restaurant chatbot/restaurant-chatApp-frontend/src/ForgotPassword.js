import React, { useState } from "react";
import "./SignIn.css";

function ForgotPassword({ onShowSignIn }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Password reset link sent! (UI only)");
      onShowSignIn();
    }, 1000);
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <button type="submit" className="signin-button" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
