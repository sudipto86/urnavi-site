// client/src/App.jsx
import React, { useState, useEffect, useMemo } from "react";
import MapView from "./components/MapView";
import Logo from "./components/Logo";
import events from "./data/events.json";
import "./styles/global.css";
import "./styles/filterbar.css";

export default function App() {
  // canonical filters (applied to MapView)
  const [filters, setFilters] = useState({
    category: "all",
    country: "all",
    dateFrom: "",
    dateTo: ""
  });

  // local header inputs (edit freely; user must press Show to apply)
  const [local, setLocal] = useState(filters);

  // reset token to tell MapView to refit world bounds on Clear
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    // keep local in sync when filters externally change
    setLocal(filters);
  }, [filters]);

  function updateLocal(changes) {
    setLocal({ ...local, ...changes });
  }

  function applyFilters() {
    setFilters(local);
  }

  function clearFilters() {
    const defaults = { category: "all", country: "all", dateFrom: "", dateTo: "" };
    setLocal(defaults);
    setFilters(defaults);
    setResetToken(t => t + 1);
  }

  // derive category and country lists from events.json (dedupe + sort)
  const categoryOptions = useMemo(() => {
    const s = new Set(events.map(e => (e.category || "uncategorized").trim()));
    return ["all", ...Array.from(s).filter(Boolean).sort()];
  }, []);

  const countryOptions = useMemo(() => {
    const s = new Set(events.map(e => (e.country || "Unknown").trim()));
    return ["all", ...Array.from(s).filter(Boolean).sort()];
  }, []);

  return (
    <div className="App">
      <header className="app-header header-clean">
        <div className="left">
          <Logo size={40} />
          <div className="brand-block">
            <div className="wordmark">URNAVI</div>
            <div className="sub">Curated for Navigation</div>
          </div>
        </div>

        <div className="top-search" role="search" aria-label="Explore events">
          <div className="search-field">
            <label className="visually-hidden" htmlFor="cat-select">Type</label>
            <select
              id="cat-select"
              value={local.category}
              onChange={e => updateLocal({ category: e.target.value })}
            >
              {categoryOptions.map(c => <option key={c} value={c === "all" ? "all" : c}>{c === "all" ? "All types" : c}</option>)}
            </select>
          </div>

          <div className="search-field">
            <label className="visually-hidden" htmlFor="country-select">Country</label>
            <select
              id="country-select"
              value={local.country}
              onChange={e => updateLocal({ country: e.target.value })}
            >
              {countryOptions.map(c => <option key={c} value={c === "all" ? "all" : c}>{c === "all" ? "All countries" : c}</option>)}
            </select>
          </div>

          <div className="search-field">
            <label className="visually-hidden" htmlFor="month-input">Month</label>
            <input
              id="month-input"
              type="month"
              value={local.dateFrom ? local.dateFrom.slice(0,7) : ""}
              onChange={e => updateLocal({ dateFrom: e.target.value ? `${e.target.value}-01` : "" })}
            />
          </div>

          <div className="search-actions">
            <button className="show-btn" onClick={applyFilters}>Show</button>
            <button className="clear-btn" onClick={clearFilters}>Clear</button>
          </div>
        </div>

        <div className="right">
          <div className="three-dash" title="More">
            <button className="dash-btn" aria-label="More menu">☰</button>
            <div className="dash-menu" role="menu">
              <a href="#discover" onClick={e => e.preventDefault()}>Discover</a>
              <a href="#about" onClick={e => e.preventDefault()}>About</a>
              <a href="#contact" onClick={e => e.preventDefault()}>Contact</a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <MapView filters={filters} resetToken={resetToken} />
      </main>
    </div>
  );
}
