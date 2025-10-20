import { useMemo, useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import toast, { Toaster } from "react-hot-toast";

export default function AccountDetails({ initialUser, onSave, onLogout }) {
  const notifyError = (m) => toast.error(m || "Something went wrong");
  const notifySuccess = () => toast.success(`Changes saved successfully!`);

  const { user } = useUser();
  const baseUser = initialUser || user || {};

  const [form, setForm] = useState({
    fullName: `${baseUser.firstName || ""} ${baseUser.lastName || ""}`.trim(),
    email: baseUser.email || "",
    phone: baseUser.phoneNumber || "",
    password: "",
    confirmPassword: "",
    subscribe: !!baseUser.newsletter,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const apiBase = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const loadProfile = async () => {
      if (!apiBase) return;
      const token =
        localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
      if (!token) return;

      try {
        setLoadingProfile(true);
        const resp = await fetch(`${apiBase}/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.message || `HTTP ${resp.status}`);
        }

        const { user: u } = await resp.json();
        setForm((prev) => ({
          ...prev,
          fullName: `${u?.firstName || ""} ${u?.lastName || ""}`.trim(),
          email: u?.email || "",
          phone: u?.phoneNumber || "",
          subscribe: !!u?.newsletter,
        }));
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [apiBase]);

  const { isPhoneValid, doPasswordsMatch, canSubmit } = useMemo(() => {
    const isPhoneValid =
      !form.phone || /^\+?\d[\d\s\-()]{6,}$/.test(form.phone.trim());
    const doPasswordsMatch =
      !form.password || form.password === form.confirmPassword;

    const canSubmit = !!form.fullName?.trim() && !saving;

    return { isPhoneValid, doPasswordsMatch, canSubmit };
  }, [form, saving]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName?.trim()) {
      notifyError("Full name is required.");
      return;
    }
    if (!isPhoneValid && form.phone) {
      notifyError("Please enter a valid phone number.");
      return;
    }
    if (!doPasswordsMatch && form.password) {
      notifyError("Passwords do not match.");
      return;
    }

    if (!apiBase) {
      notifyError("Missing VITE_SERVER_URL for API calls");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    const trimmed = (form.fullName || "").trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");

    const payload = {
      firstName,
      lastName,
      phoneNumber: form.phone.trim(),
      newsletter: !!form.subscribe,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (onSave) {
        await onSave(payload);
      } else {
        const token =
          localStorage.getItem("jwt") || sessionStorage.getItem("jwt");

        const resp = await fetch(`${apiBase}/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.message || `HTTP ${resp.status}`);
        }

        await resp.json().catch(() => ({}));
      }

      setSaved(true);
      notifySuccess();
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Could not save changes");
      notifyError(err.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{ duration: 2000, style: { boxShadow: "none" } }}
      />
      <h3>Account Details</h3>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            className="form-control"
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
            placeholder="Full Name"
            autoComplete="name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            className="form-control"
            type="email"
            value={form.email}
            readOnly
            disabled
            aria-readonly="true"
            placeholder="Email Address"
            autoComplete="email"
            title="Email can't be changed here"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            className="form-control"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone Number"
            autoComplete="tel"
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            className="form-control"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="New Password"
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm">Password Confirmation</label>
          <input
            id="confirm"
            className="form-control"
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, confirmPassword: e.target.value }))
            }
            placeholder="Password Confirmation"
            autoComplete="new-password"
          />
          {form.password &&
            form.confirmPassword &&
            form.password !== form.confirmPassword && (
              <small className="hint error">Passwords do not match.</small>
            )}
        </div>

        <div className="form-check my-3 checkbox">
          <label>
            <input
              type="checkbox"
              checked={form.subscribe}
              onChange={(e) =>
                setForm((f) => ({ ...f, subscribe: e.target.checked }))
              }
            />{" "}
            Subscribe to GlowNest&apos;s newsletter for product updates and
            promotions.
          </label>
        </div>

        <div className="profile-btns">
          <button type="submit" disabled={!canSubmit || saving}>
            {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
          </button>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </form>
    </>
  );
}
