import "../../styles/auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye } from "react-icons/fa";
import { IoIosEyeOff } from "react-icons/io";
import { registerSchema } from "../../config/zod";
import { API } from "../../config/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/toast.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength(formData.password);
  const strengthText = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedFormData);

    const result = registerSchema.safeParse(updatedFormData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
    } else {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    console.log(result.data);

    try {
      setLoading(true);
      const { data } = await API.post("/auth/register", result.data);
      toast.success(data.message);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
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
              <span>REGISTER</span> 
            </h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* NAME */}
          <div className="form-group">
            <div className="input-box">
              <FaUser />
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            {/* Bulleted Errors */}
            {errors.name && errors.name.length > 0 && (
              <ul className="error-list">
                {errors.name.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>

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
                placeholder="Create a password"
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

            {/* STRENGTH BAR */}
            <div className="password-strength">
              <div className="bars">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      background:
                        i < strength
                          ? strength <= 1
                            ? "red"
                            : strength === 2
                              ? "orange"
                              : "limegreen"
                          : "#333",
                    }}
                  />
                ))}
              </div>
              <p>{strengthText[strength]}</p>
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

          {/* CONFIRM PASSWORD */}
          <div className="form-group">
            <div className="input-box">
              <FaLock />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {showConfirmPassword ? (
                <FaEye
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <IoIosEyeOff
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                />
              )}
            </div>
            {/* Bulleted Errors */}
            {errors.confirmPassword && errors.confirmPassword.length > 0 && (
              <ul className="error-list">
                {errors.confirmPassword.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? "Creating" : "Create Account"}
          </button>

          <div className="bottom-text">
            Already have an account?{" "}
            <Link to={"/login"}>
              <span>Login</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
