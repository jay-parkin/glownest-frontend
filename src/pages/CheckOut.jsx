import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

import "../styles/CheckOut.css";
import CheckoutPayment from "../components/CheckoutPayment";

export default function CheckOut() {
  const navigate = useNavigate();
  const { cart, setQuantity, removeFromCart } = useCart();

  const BASE = import.meta.env.VITE_SERVER_URL;
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
  });

  const checkoutData = useMemo(() => {
    const cartItems = cart.map((item) => ({
      productId: item.productId,
      name: item.productName,
      image: item.imageUrl,
      price: item.price,
      qty: item.quantity,
    }));
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = 9.99;
    const tax = parseFloat((subtotal * 0.1).toFixed(2));
    return { cartItems, subtotal, shipping, tax };
  }, [cart]);

  const orderTotal =
    checkoutData.subtotal + checkoutData.shipping + checkoutData.tax;

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        setAddrLoading(true);
        setAddrError("");
        const res = await fetch(`${BASE}/me/addresses`, {
          method: "GET",
          headers: authHeaders(),
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("jwt");
          navigate("/login");
          return;
        }
        const list = await res.json();
        if (cancelled) return;
        const safe = Array.isArray(list) ? list : [];
        setAddresses(safe);
        if (safe.length) {
          const def = safe.find((a) => a.isDefault) || safe[0];
          setShippingAddressId(def._id);
        } else {
          setShippingAddressId(null);
        }
      } catch {
        if (!cancelled)
          setAddrError("Couldn't load your addresses. Try again.");
      } finally {
        if (!cancelled) setAddrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, BASE, navigate]);

  const selectedAddress =
    addresses.find((a) => a._id === shippingAddressId) || null;

  const updateQuantity = async (index, newQty) => {
    if (newQty < 1) return;
    const productId = checkoutData.cartItems[index].productId;
    await setQuantity(productId, newQty);
  };

  const removeItem = async (index) => {
    const productId = checkoutData.cartItems[index].productId;
    await removeFromCart(productId);
  };

  const buildOrderPayload = () => {
    if (!selectedAddress) {
      setStep(2);
      setAddrError("Please choose a shipping address.");
      return null;
    }
    const items = checkoutData.cartItems.map((i) => ({
      productId: i.productId,
      quantity: i.qty,
    }));
    return {
      items,
      shippingAddress: selectedAddress,
      billingAddress: selectedAddress,
      shipping: checkoutData.shipping,
      tax: checkoutData.tax,
      currency: "AUD",
    };
  };

  return (
    <div className="checkout-page container">
      {/* Progress Bar */}
      <ul className="checkout-steps">
        <li className={step === 1 ? "active" : step > 1 ? "completed" : ""}>
          Cart Summary
        </li>
        <li className={step === 2 ? "active" : step > 2 ? "completed" : ""}>
          Shipping Information
        </li>
        <li className={step === 3 ? "active" : ""}>Payment Details</li>
      </ul>

      <div className="row mt-4">
        {/* Cart Summary */}
        <div className="col-md-8">
          <div className="section">
            <h4>Cart Summary</h4>
            {checkoutData.cartItems.map((item, index) => (
              <div
                key={item.productId}
                className="card mb-4 p-3 shadow-sm position-relative"
              >
                <div className="text-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="img-fluid mb-2"
                    style={{ maxWidth: "120px" }}
                  />
                  <h5 className="fw-bold">{item.name}</h5>
                </div>

                <button
                  className="btn position-absolute top-0 end-0 m-2 p-1"
                  onClick={() => removeItem(index)}
                  title="Remove from cart"
                >
                  <i
                    className="bi bi-trash"
                    style={{ color: "#dc3545", fontSize: "1.2rem" }}
                  />
                </button>

                <div className="text-center mt-3">
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                    <button
                      className="btn-qty"
                      onClick={() => updateQuantity(index, item.qty - 1)}
                      disabled={item.qty <= 1}
                    >
                      –
                    </button>
                    <span style={{ minWidth: "2rem", textAlign: "center" }}>
                      {item.qty}
                    </span>
                    <button
                      className="btn-qty"
                      onClick={() => updateQuantity(index, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div>
                    <small className="text-muted">
                      ${item.price.toFixed(2)} × {item.qty}
                    </small>
                    <div className="fw-bold fs-5">
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              className="btn btn-primary continue-btn mt-3 shipping-btn"
              onClick={() => setStep(2)}
            >
              Continue to Shipping <i className="bi bi-arrow-right" />
            </button>
          </div>

          {/* Shipping Accordion */}
          <div className="section">
            <button className="accordion-header" onClick={() => setStep(2)}>
              Shipping Information
            </button>
            {step === 2 && (
              <div className="accordion-body">
                {addrError && (
                  <div className="alert alert-danger">{addrError}</div>
                )}
                {addrLoading ? (
                  <div className="text-muted">Loading your addresses…</div>
                ) : addresses.length === 0 ? (
                  <div className="d-flex flex-column gap-2">
                    <div>No addresses yet.</div>
                    <Link
                      className="btn btn-outline-primary"
                      to="/account/addresses"
                    >
                      Add an address
                    </Link>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {addresses.map((a) => {
                      const pc = a.postCode ?? a.postalCode;
                      return (
                        <label
                          key={a._id}
                          className={`card p-3 shadow-sm address-option ${
                            a._id === shippingAddressId ? "selected" : ""
                          }`}
                        >
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="shippingAddress"
                              value={a._id}
                              checked={shippingAddressId === a._id}
                              onChange={() => setShippingAddressId(a._id)}
                            />
                            <div className="ms-2">
                              <div className="d-flex align-items-center gap-2">
                                <strong>{a.label || "Shipping Address"}</strong>
                                {a.isDefault && (
                                  <span className="badge bg-success">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-muted small">
                                <div>
                                  {a.fullName}
                                  {a.phone ? ` • ${a.phone}` : ""}
                                </div>
                                {a.company && <div>{a.company}</div>}
                                <div>
                                  {a.line1}
                                  {a.line2 ? `, ${a.line2}` : ""}
                                </div>
                                <div>
                                  {a.city}
                                  {a.state ? `, ${a.state}` : ""} {pc}
                                </div>
                                <div>{a.country}</div>
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    <div className="d-flex gap-2">
                      <Link
                        className="btn btn-outline-secondary"
                        to="/account/addresses"
                      >
                        Manage addresses
                      </Link>
                      <button
                        className="btn btn-primary"
                        onClick={() => setStep(3)}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Accordion */}
          <div className="section">
            <button className="accordion-header" onClick={() => setStep(3)}>
              Payment Details
            </button>
            {step === 3 && (
              <div className="accordion-body">
                <CheckoutPayment
                  buildOrderPayload={buildOrderPayload}
                  BASE={BASE}
                  authHeaders={authHeaders()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="col-md-4">
          <div className="order-summary card p-3">
            <h5>Order Summary</h5>
            <div className="d-flex justify-content-between">
              <strong>Subtotal</strong>
              <strong>${checkoutData.subtotal.toFixed(2)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <strong>Shipping</strong>
              <strong>${checkoutData.shipping.toFixed(2)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <strong>Estimated Tax</strong>
              <strong>${checkoutData.tax.toFixed(2)}</strong>
            </div>
            <hr />
            <div className="total d-flex justify-content-between">
              <strong>Total</strong>
              <strong>${orderTotal.toFixed(2)}</strong>
            </div>
            <button
              className="btn btn-primary continue-btn mt-3 place-order-btn"
              // onClick={handlePlaceOrder}
            >
              Place Order
            </button>
            <span className="term-text">
              By placing your order, you agree to GlowNest's Terms of Service.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
