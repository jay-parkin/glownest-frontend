import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SearchBar.css";

export default function SearchBar({ initial = "", autoFocus = false }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();

  function onSubmit(event) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;
    setValue("");
    navigate(`/search?query=${encodeURIComponent(query)}`);
  }

  return (
    <div className="search-bar-container">
      <form onSubmit={onSubmit} role="search" aria-label="Product search" className="search-bar">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search"
          aria-label="Search products"
          autoFocus={autoFocus}
        />
        <button className="search-btn custom-btn" type="submit">
          <span className="search-text">Search</span>
          <i className="bi bi-search search-icon"></i>
        </button>
      </form>
    </div>
  );
}
