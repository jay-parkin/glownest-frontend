import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useCart } from "../contexts/CartContext";
import SearchBar from "./SearchBar";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useUser(); // Currently unused but can be used for user-specific nav items

  const { cart } = useCart();
  const cartCount = useMemo(
    () =>
      Array.isArray(cart)
        ? cart.reduce((sum, i) => sum + (i.quantity || 1), 0)
        : 0,
    [cart]
  );

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

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
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

          <div className="d-flex align-items-center gap-2">
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
