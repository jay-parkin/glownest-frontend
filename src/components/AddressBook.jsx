import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddressForm from "./AddressForm";
import "../styles/AddressBook.css";

import AnimatedLoader from "./Loaders/AnimatedLoader";

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);

  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_SERVER_URL;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
  });

  const handleAuthFailure = (
    msg = "Session expired. Please sign in again."
  ) => {
    setError(msg);
    localStorage.removeItem("jwt");
    navigate("/login");
  };

  // GET all addresses
  const loadAddresses = async () => {
    setLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      const response = await fetch(`${BASE}/me/addresses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setError(null);
        setAddresses(Array.isArray(data) ? data : []);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        handleAuthFailure();
        return;
      }

      const body = await response.json().catch(() => ({}));
      setError(
        body.message || `Failed to load addresses (${response.status}).`
      );
    } catch (err) {
      setError("Error fetching addresses. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // POST set default address
  const setDefault = async (id) => {
    setLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      const response = await fetch(`${BASE}/me/addresses/${id}/default`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updated = await response.json();
        setError(null);
        setAddresses(updated || []);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        handleAuthFailure();
        return;
      }

      const body = await response.json().catch(() => ({}));
      setError(body.message || `Failed to set default (${response.status}).`);
    } catch (err) {
      setError("Error setting default address. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // DELETE address (then refresh)
  const remove = async (id) => {
    if (!confirm("Delete this address?")) return;

    setLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      const response = await fetch(`${BASE}/me/addresses/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        await loadAddresses();
        setError(null);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        handleAuthFailure();
        return;
      }

      const body = await response.json().catch(() => ({}));
      setError(body.message || `Failed to delete (${response.status}).`);
    } catch (err) {
      setError("Error deleting address. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadAddresses();
  }, []);

  // create mode
  if (mode === "create") {
    return (
      <section className="address-book">
        <header className="address-header">
          <h3>Add Address</h3>
        </header>
        <AddressForm
          title="Add Address"
          onCancel={() => setMode("list")}
          onSaved={(updated) => {
            setAddresses(updated || []);
            setMode("list");
          }}
        />
      </section>
    );
  }

  // edit mode
  if (mode === "edit" && editing) {
    return (
      <section className="address-book">
        <header className="address-header">
          <h3>Edit Address</h3>
        </header>
        <AddressForm
          title="Edit Address"
          initial={editing}
          addressId={editing._id}
          onCancel={() => {
            setEditing(null);
            setMode("list");
          }}
          onSaved={(updated) => {
            setAddresses(updated || []);
            setEditing(null);
            setMode("list");
          }}
        />
      </section>
    );
  }

  // list mode
  return (
    <section className="address-book">
      <header className="address-header">
        <h3>Address Book</h3>
        <button onClick={() => setMode("create")}>+ Add Address</button>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <AnimatedLoader />
      ) : addresses.length === 0 ? (
        <div className="empty">
          <p>No saved addresses yet.</p>
          <button className="btn" onClick={() => setMode("create")}>
            Add your first address
          </button>
        </div>
      ) : (
        <ul className="address-grid">
          {addresses.map((a) => (
            <li
              key={a._id}
              className={`address-card${a.isDefault ? " default" : ""}`}
            >
              <div className="address-title">
                <strong className="address-label">
                  {a.label || "Address"}
                </strong>
                {a.isDefault && (
                  <span className="default-pill" title="Default address">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" fill="#22c55e" />
                      <path
                        d="M7 12.5l3 3 7-7"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Default</span>
                  </span>
                )}
              </div>

              <address className="address-lines">
                <div>{a.fullName}</div>
                {a.phone && <div>{a.phone}</div>}
                {a.company && <div>{a.company}</div>}
                <div>
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </div>
                <div>
                  {a.city}
                  {a.state ? `, ${a.state}` : ""} {a.postalCode}
                </div>
                <div>{a.country}</div>
              </address>

              <div className="address-actions">
                {!a.isDefault && (
                  <button
                    className="btn link"
                    onClick={() => setDefault(a._id)}
                  >
                    Set default
                  </button>
                )}
                <button
                  className="btn link"
                  onClick={() => {
                    setEditing(a);
                    setMode("edit");
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn link danger"
                  onClick={() => remove(a._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
