import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🎓</span>
          CharusatStudentCare
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <div className="navbar-nav">
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Home
            </Link>

            <Link
              to="/helpful-posts"
              className={`nav-link ${
                isActive("/helpful-posts") ? "active" : ""
              }`}
              onClick={closeMenu}
            >
              Helpful Posts
            </Link>

            {null}

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-link ${
                    isActive("/dashboard") ? "active" : ""
                  }`}
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>

                {user?.role === "student" && (
                  <>
                    <Link
                      to="/submit-ticket"
                      className={`nav-link ${
                        isActive("/submit-ticket") ? "active" : ""
                      }`}
                      onClick={closeMenu}
                    >
                      Open Ticket
                    </Link>
                  </>
                )}

                {user?.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link ${
                      isActive("/admin/dashboard") ? "active" : ""
                    }`}
                    onClick={closeMenu}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="navbar-actions">

            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-name">
                  {user?.name}
                  <span className="user-role">({user?.role})</span>
                </span>
                <div className="user-dropdown">
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-btn"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className="btn btn-secondary btn-sm"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
