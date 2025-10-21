import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { useMemo, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useCart } from "../contexts/CartContext";
import SearchBar from "./SearchBar";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useUser();
  const { cart } = useCart();

  const cartCount = useMemo(
    () =>
      Array.isArray(cart)
        ? cart.reduce((sum, i) => sum + (i.quantity || 1), 0)
        : 0,
    [cart]
  );

  const [showSearch, setShowSearch] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) setShowSearch(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setShowSearch(false);
    }
    if (showSearch) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showSearch]);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{ backgroundColor: "#ff6b6b" }}
    >
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/">
          GlowNest
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse position-relative"
          id="navbarSupportedContent"
        >
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                Products
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                Profile
              </NavLink>
            </li>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-2">
            <div className="cart-wrapper">
              <a href="/checkout" className="custom-link">
                <i className="bi bi-cart3 cart-icon"></i>
                {cartCount > 0 && (
                  <span className="cart-badge" style={{ fontSize: "0.75rem" }}>
                    {cartCount}
                  </span>
                )}
              </a>
            </div>
            <SearchBar initial="" />
          </div>

          <div className="d-flex d-lg-none align-items-center gap-2 ms-auto">
            <div className="cart-wrapper">
              <a href="/checkout" className="custom-link">
                <i className="bi bi-cart3 cart-icon"></i>
                {cartCount > 0 && (
                  <span className="cart-badge" style={{ fontSize: "0.75rem" }}>
                    {cartCount}
                  </span>
                )}
              </a>
            </div>

            <button
              className="btn btn-light search-trigger"
              aria-haspopup="true"
              aria-expanded={showSearch}
              aria-controls="gn-search-popover"
              onClick={() => setShowSearch((s) => !s)}
              title="Search"
            >
              <i className="bi bi-search" />
            </button>
          </div>

          {showSearch && (
            <div
              id="gn-search-popover"
              ref={popRef}
              className="search-popover d-lg-none"
              role="dialog"
              aria-label="Site search"
            >
              <SearchBar initial="" autoFocus />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
