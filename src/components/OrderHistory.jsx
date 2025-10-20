import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const BASE = import.meta.env.VITE_SERVER_URL;
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
    }),
    []
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/orders`, { headers });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError("Please sign in to view your orders.");
          } else {
            const body = await res.json().catch(() => ({}));
            setError(body.message || `Failed to load orders (${res.status}).`);
          }
          return;
        }
        const data = await res.json();
        if (!ignore) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError("Could not fetch orders. Try again shortly.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [BASE, headers]);

  if (loading) return <div className="py-5 text-muted">Loading orders…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (orders.length === 0)
    return <div className="py-5 text-muted">No orders yet.</div>;

  return (
    <section className="order-history">
      <h3 className="mb-3">Order History</h3>
      <ul className="list-group">
        {orders.map((order) => (
          <li
            key={order._id}
            className="list-group-item d-flex gap-3 align-items-center"
          >
            {/* tiny item preview row */}
            <div className="d-flex gap-2 flex-wrap">
              {order.items?.slice(0, 3).map((it) => (
                <img
                  key={it._id || it.product}
                  src={it.imageUrl}
                  alt={it.name}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
              ))}
              {order.items?.length > 3 && (
                <span className="text-muted">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>

            <div className="ms-auto text-end">
              <div>
                <strong>#{order._id.slice(-6)}</strong>
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {new Date(order.createdAt).toLocaleString()}
              </div>
              <div className="fw-semibold">
                {order.currency || "AUD"} {Number(order.total).toFixed(2)}
              </div>
              <div className="badge bg-light text-dark mt-1">
                {order.status}
              </div>
            </div>

            <button
              className="btn-view"
              onClick={() => navigate(`/order-confirmation/${order._id}`)}
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
