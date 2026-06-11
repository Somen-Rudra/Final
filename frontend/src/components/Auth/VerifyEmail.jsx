import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "../../config/axios";
import { toast } from "react-toastify";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { data } = await API.get(`/auth/verify/${token}`);

        toast.success(data.message);

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Verification link is invalid or expired",
        );

        setTimeout(() => {
          navigate("/register");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="dragon-bg" />

      <div className="auth-card">
        <div className="logo-section">
          <div className="logo">
            <h1>
              <span>EMAIL VERIFICATION</span>
            </h1>
          </div>
        </div>

        <div className="auth-form">
          <p style={{ textAlign: "center" }}>
            {loading ? "Verifying your email..." : "Redirecting..."}
          </p>
        </div>
      </div>
    </div>
  );
}
