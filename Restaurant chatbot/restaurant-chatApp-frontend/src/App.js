import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import ChatApp from "./ChatApp";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import EnterOtp from "./EnterOtp";
import ResetPassword from "./ResetPassword";
import { toast } from "react-toastify";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000";

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authPage, setAuthPage] = useState(null); // null means no modal
  const [signupEmail, setSignupEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [signupOtpTries, setSignupOtpTries] = useState(0);
  const [resetOtpTries, setResetOtpTries] = useState(0);
  const [signupSuccess, setSignupSuccess] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Validate JWT on app load
  useEffect(() => {
    const validateJWT = async () => {
      const token = localStorage.getItem("khanpan_jwt");
      if (!token) {
        setIsSignedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/validate`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsSignedIn(true);
        } else {
          // Invalid token, clear everything
          localStorage.removeItem("khanpan_jwt");
          setIsSignedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error validating JWT:", error);
        localStorage.removeItem("khanpan_jwt");
        setIsSignedIn(false);
        setUser(null);
      }
      setLoading(false);
    };

    validateJWT();
  }, []);

  // --- SIGNUP FLOW ---
  const handleSignUp = async (formData) => {
    setSignupSuccess("");
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/auth/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setSignupEmail(formData.email);
      setAuthPage("otp");
      toast.success(
        "OTP sent to your email. Please verify to complete signup."
      );
    } else {
      toast.error(data.message || "Signup failed");
    }
  };

  const handleVerifySignupOtp = async (otp, password) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail, otp, password }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setSignupSuccess("Signup complete! You can now log in.");
      setAuthPage("signin");
      toast.success("Signup complete! You can now log in.");
    } else {
      setSignupOtpTries((t) => t + 1);
      toast.error(data.message || "Invalid OTP");
      throw new Error(data.message || "Invalid OTP");
    }
  };

  const handleResendSignupOtp = async () => {
    setAuthPage("signup");
    setTimeout(() => setAuthPage("otp"), 100);
    toast.info("OTP resent. Please check your email.");
  };

  // --- FORGOT PASSWORD FLOW ---
  const handleForgotPassword = async ({ email }) => {
    setResetSuccess("");
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setResetEmail(email);
      setAuthPage("otp-reset");
      toast.success("OTP sent to your email. Please verify to reset password.");
    } else {
      toast.error(data.message || "Error sending OTP");
    }
  };

  const handleVerifyResetOtp = async (otp) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/auth/verify-reset-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setAuthPage("reset");
      toast.success("OTP verified. You can now reset your password.");
    } else {
      setResetOtpTries((t) => t + 1);
      toast.error(data.message || "Invalid OTP");
      throw new Error(data.message || "Invalid OTP");
    }
  };

  const handleResendResetOtp = async () => {
    await handleForgotPassword({ email: resetEmail });
    toast.info("OTP resent. Please check your email.");
  };

  const handleResetPassword = async (newPassword) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: "", newPassword }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setResetSuccess("Password reset! You can now log in.");
      setAuthPage("signin");
      toast.success("Password reset! You can now log in.");
    } else {
      toast.error(data.message || "Error resetting password");
      throw new Error(data.message || "Error resetting password");
    }
  };

  // --- SIGN IN ---
  const handleSignIn = async (userData) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setIsSignedIn(true);
      localStorage.setItem("khanpan_jwt", data.token);
      toast.success("Login successful!");
      setAuthPage(null);
    } else {
      if (data.message && data.message.toLowerCase().includes("not verified")) {
        toast.error(
          "Account not verified. Please check your email for the OTP and verify your account."
        );
      } else {
        toast.error(data.message || "Login failed");
      }
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setIsSignedIn(false);
    setAuthPage(null);
    localStorage.removeItem("khanpan_jwt");
    // No toast on sign out
  };

  // Hamburger menu state (for ChatApp)
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <ChatApp
        onSignOut={handleSignOut}
        user={user}
        showMenu={isSignedIn ? showMenu : false}
        setShowMenu={isSignedIn ? setShowMenu : () => {}}
        menuRef={menuRef}
        onShowLogin={() => setAuthPage("signin")}
      />
      {/* Auth modal overlay */}
      {!isSignedIn && authPage && (
        <div className="auth-modal-overlay">
          <div
            className={`auth-modal-card${
              authPage === "signup" ? " auth-modal-card--scrollable" : ""
            }`}
          >
            <button
              className="auth-modal-close"
              onClick={() => setAuthPage(null)}
              aria-label="Close"
            >
              &times;
            </button>
            {authPage === "signin" ? (
              <SignIn
                onSignIn={handleSignIn}
                onShowSignUp={() => setAuthPage("signup")}
                onShowForgotPassword={() => setAuthPage("forgot")}
              />
            ) : authPage === "signup" ? (
              <SignUp
                onShowSignIn={() => setAuthPage("signin")}
                onSignUp={handleSignUp}
              />
            ) : authPage === "otp" ? (
              <EnterOtp
                email={signupEmail}
                mode="signup"
                onVerifyOtp={handleVerifySignupOtp}
                onResendOtp={handleResendSignupOtp}
                onBack={() => setAuthPage("signup")}
              />
            ) : authPage === "forgot" ? (
              <ForgotPassword
                onShowSignIn={() => setAuthPage("signin")}
                onForgotPassword={handleForgotPassword}
              />
            ) : authPage === "otp-reset" ? (
              <EnterOtp
                email={resetEmail}
                mode="reset"
                onVerifyOtp={handleVerifyResetOtp}
                onResendOtp={handleResendResetOtp}
                onBack={() => setAuthPage("forgot")}
              />
            ) : authPage === "reset" ? (
              <ResetPassword
                email={resetEmail}
                onReset={handleResetPassword}
                onBack={() => setAuthPage("forgot")}
              />
            ) : null}
          </div>
        </div>
      )}
      <style>{`
        .sidebar-menu {
          position: absolute;
          top: 60px;
          left: 16px;
          z-index: 1000;
        }
        .sidebar-menu-content {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          padding: 8px 0;
          min-width: 160px;
          display: flex;
          flex-direction: column;
        }
        .sidebar-menu-item {
          background: none;
          border: none;
          text-align: left;
          padding: 10px 20px;
          font-size: 16px;
          color: #222;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sidebar-menu-item:hover {
          background: #f0f4ff;
        }
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(24, 28, 40, 0.35);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
          padding: 32px 0;
        }
        .auth-modal-card {
          position: relative;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(24,28,40,0.18), 0 1.5px 8px rgba(24,28,40,0.10);
          border: 1.5px solid #e6e8f0;
          padding: 1.4rem 1.2rem;
          min-width: 0;
          max-width: 400px;
          min-height: 0;
          max-height: calc(100vh - 32px);
          box-sizing: border-box;
          overflow: visible;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: scaleIn 0.33s cubic-bezier(.4,2,.6,1) both;
        }
        .auth-modal-card--scrollable {
          overflow-y: auto;
          max-height: calc(100vh - 32px);
        }
        @media (max-width: 500px) {
          .auth-modal-card, .auth-modal-card--scrollable {
            max-width: 98vw;
            max-height: calc(100vh - 8px);
            overflow-y: auto;
          }
        }
        .auth-modal-close {
          position: absolute;
          top: 18px;
          right: 22px;
          background: #fff;
          border: none;
          font-size: 2.2rem;
          color: #222;
          font-weight: bold;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          box-shadow: 0 2px 8px rgba(24,28,40,0.10);
          cursor: pointer;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, background 0.2s;
          line-height: 1;
          padding: 0;
        }
        .auth-modal-close:hover {
          color: #fff;
          background: #3b82f6;
        }
        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(30px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
