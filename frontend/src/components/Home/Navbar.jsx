import { Link, useLocation } from "react-router-dom";
import {assets} from "../../assets/assets"
import "../../styles/navbar.css"

const NAV_LINKS = [
  { label: "Home",      to: "/" },
  { label: "Problems",  to: "/problemSet" },
  { label: "Contests",  to: "/contests" },
  { label: "Stats",     to: "/stats" },
  { label: "Editor", to: "/editor" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="nav-logo">
        <div className="nav-logo-icon"><img src={assets.logo} /></div>      
      </Link>

      {/* Links */}
      <ul className="nav-links">
        {NAV_LINKS.map(({ label, to }) => (
          <li key={to}>
            <Link to={to} className={pathname === to ? "active" : ""}>
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right */}
      <div className="nav-right">
        <Link to={"/login"}>Login</Link>
      </div>
    </nav>
  );
}