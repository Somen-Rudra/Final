import { Link } from "react-router-dom";
import "../../styles/auth.css";
import { FaEnvelope, FaLock, FaEye } from "react-icons/fa";
import { IoIosEyeOff } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginSchema } from "../../config/zod";
import { API } from "../../config/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/toast.css";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedFormData);

    const result = loginSchema.safeParse(updatedFormData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
    } else {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    console.log(result.data);

    try {
      setLoading(true);
      const { data } = await API.post("/auth/login", result.data);
      toast.success(data.message);
      setTimeout(() => {
        navigate("/verify-otp",{state:{email:result.data.email}});
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
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
              <span>LOGIN</span>
            </h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="form-group">
            <div className="input-box">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {/* Bulleted Errors */}
            {errors.email && errors.email.length > 0 && (
              <ul className="error-list">
                {errors.email.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <div className="input-box">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="password"
                value={formData.password}
                onChange={handleChange}
              />
              {showPassword ? (
                <FaEye
                  className="eye-icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <IoIosEyeOff
                  className="eye-icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                />
              )}
            </div>

            {/* Bulleted Errors */}
            {errors.password && errors.password.length > 0 && (
              <ul className="error-list">
                {errors.password.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? "Logging in.." : "Log in"}
          </button>

          <div className="bottom-text">
            Don't have an account?{" "}
            <Link to={"/register"}>
              <span>Register</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
