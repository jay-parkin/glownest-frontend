import { useState, useEffect } from "react";
import "../styles/Filters.css";

export default function FilterSidebar({ value, onChange }) {
  const [form, setForm] = useState({
    q: value?.q || "",
    category: value?.category || [],
    brands: value?.brands || [],
    minPrice: value?.minPrice || "",
    maxPrice: value?.maxPrice || "",
    gender: value?.gender || [],
    skin: value?.skin || [],
    tags: value?.tags || [],
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const categories = [
    "Cleanser",
    "Serum",
    "Moisturizer",
    "Sunscreen",
    "Exfoliator",
    "Toner",
    "Eye Cream",
    "Face Mask",
    "Lip Balm",
    "Night Cream",
  ];

  const brandOptions = [
    "GlowNest",
    "SkinStrong",
    "DermaPure",
    "HydraGlow",
    "LumeLux",
    "RadiantSkin",
    "BrightenUp",
  ];

  const genders = ["men", "women", "unisex"];
  const skins = ["oily", "dry", "sensitive", "combination", "normal"];
  const tagOptions = [
    { key: "vegan", label: "Vegan" },
    { key: "fragranceFree", label: "Fragrance‑free" },
    { key: "crueltyFree", label: "Cruelty‑free" },
    { key: "organic", label: "Organic" },
  ];

  function toggleInArray(key, val) {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: prev[key].includes(val)
          ? prev[key].filter((v) => v !== val)
          : [...prev[key], val],
      };
      onChange?.(next);
      return next;
    });
  }

  function setField(key, val) {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      onChange?.(next);
      return next;
    });
  }

  function setMultiFromSelect(key, e) {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setField(key, values);
  }

  function clearAll() {
    const next = {
      q: "",
      category: [],
      brands: [],
      minPrice: "",
      maxPrice: "",
      gender: [],
      skin: [],
      tags: [],
    };
    setForm(next);
    onChange?.(next);
  }

  return (
    <>
      <div className={`filters-drawer ${mobileOpen ? "open" : ""}`}>
        <aside className="filters">
          <div className="filters-header">
            <h4>Filter</h4>
            <button className="link-btn" onClick={clearAll}>
              Clear
            </button>
            <button
              className="close-drawer btn"
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
          </div>

          <label className="filters-block">
            <span className="filters-label">Search</span>
            <input
              value={form.q}
              onChange={(e) => setField("q", e.target.value)}
              placeholder="name or brand"
            />
          </label>

          <div className="filters-block">
            <span className="filters-label">Category</span>
            <select
              multiple
              value={form.category}
              onChange={(e) => setMultiFromSelect("category", e)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="filters-block">
            <span className="filters-label">Brand</span>
            <select
              multiple
              value={form.brands}
              onChange={(e) => setMultiFromSelect("brands", e)}
            >
              {brandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="filters-row">
            <label>
              <span className="filters-label">Min $</span>
              <input
                type="number"
                min="0"
                value={form.minPrice}
                onChange={(e) => setField("minPrice", e.target.value)}
              />
            </label>
            <label>
              <span className="filters-label">Max $</span>
              <input
                type="number"
                min="0"
                value={form.maxPrice}
                onChange={(e) => setField("maxPrice", e.target.value)}
              />
            </label>
          </div>

          <div className="filters-block">
            <span className="filters-label">Gender</span>
            <div className="pill-group">
              {genders.map((g) => (
                <button
                  key={g}
                  className={`pill ${form.gender.includes(g) ? "active" : ""}`}
                  type="button"
                  onClick={() => toggleInArray("gender", g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="filters-block">
            <span className="filters-label">Skin Type</span>
            <div className="pill-group">
              {skins.map((s) => (
                <button
                  key={s}
                  className={`pill ${form.skin.includes(s) ? "active" : ""}`}
                  type="button"
                  onClick={() => toggleInArray("skin", s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="filters-block">
            <span className="filters-label">Tags</span>
            <div className="pill-group">
              {tagOptions.map((t) => (
                <button
                  key={t.key}
                  className={`pill ${
                    form.tags.includes(t.key) ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => toggleInArray("tags", t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <button
        className="mobile-filter-toggle"
        onClick={() => setMobileOpen(true)}
      >
        ☰ Filters
      </button>
    </>
  );
}
