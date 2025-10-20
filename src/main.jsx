import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "./App";

import "./styles/Index.css";

import { UserProvider } from "./contexts/UserContext.jsx";
import { CartProvider } from "./contexts/CartContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </UserProvider>
  </StrictMode>
);
