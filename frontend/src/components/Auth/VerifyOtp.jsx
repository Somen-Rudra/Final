import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../../config/axios";
import { toast } from "react-toastify";

import "../../styles/auth.css";
import "../../styles/toast.css";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Session expired. Please login again.");
      navigate("/");
      return;
    }

    if (otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const { data } = await API.post("/auth/verify", {
        email,
        otp,
      });

      toast.success(data.message);

      // Cookies are already set by generateToken()
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="dragon-bg" />

      <div className="auth-card">
        <div className="logo-section">
          <div className="logo">
            <h1>
              <span>VERIFY OTP</span>
            </h1>
          </div>
        </div>

        <p className="bottom-text" style={{ marginBottom: "20px" }}>
          Enter the OTP sent to
          <br />
          <strong>{email}</strong>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-box">
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                maxLength={6}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-btn"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}