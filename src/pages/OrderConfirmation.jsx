import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const BASE = import.meta.env.VITE_SERVER_URL;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${BASE}/orders/${orderId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message || `Failed (${res.status})`);
        if (!cancelled) setOrder(body);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, BASE]);

  const addressLines = (a) =>
    a
      ? [
          a.fullName + (a.phone ? ` • ${a.phone}` : ""),
          a.company,
          a.line1 + (a.line2 ? `, ${a.line2}` : ""),
          `${a.city}${a.state ? `, ${a.state}` : ""} ${
            a.postCode ?? a.postalCode ?? ""
          }`,
          a.country,
        ].filter(Boolean)
      : [];

  if (loading) return <div className="container py-5">Loading your order…</div>;
  if (error)
    return (
      <div className="container py-5">
        <div className="alert alert-danger mb-3">{error}</div>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );

  const items = order?.items || [];
  const money = (n) => Number(n || 0).toFixed(2);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2>Thanks! Your order is in.</h2>
        <div className="text-muted">
          Order #{order._id} • Status: <strong>{order.status}</strong>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-8">
          <div className="card p-3">
            <h5 className="mb-3">Items</h5>
            <ul className="list-group list-group-flush">
              {items.map((it) => (
                <li
                  key={it.product}
                  className="list-group-item d-flex align-items-center gap-3"
                >
                  <img
                    src={it.imageUrl}
                    alt={it.name}
                    style={{ width: 64, height: 64, objectFit: "cover" }}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{it.name}</div>
                    <div className="text-muted small">{it.brand}</div>
                    <div className="text-muted small">
                      Qty: {it.quantity} • ${money(it.unitPrice)} each
                    </div>
                  </div>
                  <div className="fw-bold">${money(it.lineTotal)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-3 mt-3">
            <h5 className="mb-2">Shipping Address</h5>
            {addressLines(order.shippingAddress).map((l, i) => (
              <div key={i} className="text-muted">
                {l}
              </div>
            ))}
          </div>

          <div className="card p-3 mt-3">
            <h5 className="mb-2">Billing Address</h5>
            {addressLines(order.billingAddress).map((l, i) => (
              <div key={i} className="text-muted">
                {l}
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3">
            <h5>Order Summary</h5>
            <div className="d-flex justify-content-between">
              <span>Subtotal</span>
              <strong>${money(order.subtotal)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Shipping</span>
              <strong>${money(order.shipping)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Tax</span>
              <strong>${money(order.tax)}</strong>
            </div>
            {Number(order.discount) > 0 && (
              <div className="d-flex justify-content-between">
                <span>Discount</span>
                <strong>- ${money(order.discount)}</strong>
              </div>
            )}
            <hr />
            <div className="d-flex justify-content-between">
              <span>Total</span>
              <strong>
                ${money(order.total)} {order.currency}
              </strong>
            </div>
            <div className="text-muted small mt-2">
              Payment: {order?.payment?.provider} • {order?.payment?.status}
            </div>
            <Link to="/" className="btn btn-primary mt-3">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
