import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import HomePage from "./pages/HomePage";
import Loader from "./components/Home/Loader";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Navbar from "./components/Home/Navbar";
import Workspace from "./pages/Workspace";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/toast.css";
import ProblemSetPage from "./pages/ProblemSetPage";
import CodeEditor from "./components/Problem/CodeEditor";
import VerifyOtp from "./components/Auth/VerifyOtp";
import VerifyEmail from "./components/Auth/VerifyEmail";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<CodeEditor />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problemSet/:slug" element={<Workspace />} />
        <Route path="/problemSet" element={<ProblemSetPage />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/token/:token" element={<VerifyEmail />} />

      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
        transition={Bounce}
      />
    </BrowserRouter>
  );
}
