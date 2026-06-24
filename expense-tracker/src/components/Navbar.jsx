import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand" aria-label="Expense Tracker home">
          <span className="brand-mark">ET</span>
          <span>
            <strong>Expense Tracker</strong>
            <small>Receipt management</small>
          </span>
        </NavLink>

        <ul className="nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
              Settings
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
