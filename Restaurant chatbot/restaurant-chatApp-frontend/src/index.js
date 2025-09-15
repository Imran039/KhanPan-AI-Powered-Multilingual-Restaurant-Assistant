import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={2500}
      hideProgressBar
      closeOnClick
      pauseOnHover={false}
      draggable={false}
      theme="colored"
      style={{ fontSize: 14, zIndex: 9999 }}
      toastStyle={{
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        minWidth: 180,
      }}
    />
    <style>{`
      .Toastify__toast-theme--colored.Toastify__toast--success {
        background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
        color: #fff;
      }
      .Toastify__toast-theme--colored.Toastify__toast--error {
        background: linear-gradient(90deg, #ef4444 0%, #b91c1c 100%);
        color: #fff;
      }
      .Toastify__toast-theme--colored.Toastify__toast--info {
        background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%);
        color: #fff;
      }
      .Toastify__toast-theme--colored.Toastify__toast--warning {
        background: linear-gradient(90deg, #f59e42 0%, #d97706 100%);
        color: #fff;
      }
    `}</style>
  </React.StrictMode>
);
