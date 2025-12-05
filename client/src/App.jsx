// client/src/App.jsx
import React, { useState, useEffect, useMemo } from "react";
import MapView from "./components/MapView";
import Logo from "./components/Logo";
import events from "./data/events.json";
import "./styles/global.css";

/**
 * Simple, clean header:
 * - Where (country) -> immediate apply
 * - What (category) -> immediate apply (single select)
 * - When (month) -> immediate apply (single select)
 * - Clear resets filters and triggers map reset via resetToken
 */

export default function App() {
  const [filters, setFilters] = useState({
    category: "all",    // What
    country: "all",     // Where
    dateFrom: ""        // When (YYYY-MM-DD month-start) or "" for all
  });

  // token used to tell MapView to reset to world bounds when Clear pressed
  const [resetToken, setResetToken] = useState(0);

  // derive options from events.json
  const categoryOptions = useMemo(() => {
    const s = Array.from(new Set(events.map(e => (e.category || "uncategorized").trim())));
    s.sort();
    return ["all", ...s];
  }, []);

  const countryOptions = useMemo(() => {
    const s = Array.from(new Set(events.map(e => (e.country || "Unknown").trim())));
    s.sort();
    return ["all", ...s];
  }, []);

  // months: next 3 months including current
  const monthOptions = useMemo(() => {
    const now = new Date();
    const months = ["all"];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const iso = d.toISOString().slice(0,7); // YYYY-MM
      const label = d.toLocaleString(undefined, { month: "short", year: "numeric" });
      months.push({ value: `${iso}-01`, label });
    }
    return months;
  }, []);

  // handlers - immediate apply
  function onWhereChange(value) {
    setFilters(f => ({ ...f, country: value }));
    // if clearing the country, trigger resetToken so MapView can reset to world bounds
    if (!value || value === "all") setResetToken(t => t + 1);
  }

  function onWhatChange(value) {
    setFilters(f => ({ ...f, category: value }));
  }

  function onWhenChange(value) {
    setFilters(f => ({ ...f, dateFrom: value || "" }));
  }

  function onClear() {
    setFilters({ category: "all", country: "all", dateFrom: "" });
    setResetToken(t => t + 1);
  }

  return (
    <div className="App">
      <header className="app-header header-compact clean-header">
        <div className="left">
          <Logo size={40} />
          <div className="brand-block">
            <div className="wordmark">URNAVI</div>
            <div className="sub">Curated for Navigation</div>
          </div>
        </div>

        <div className="top-search compact" role="search" aria-label="Explore events">

          {/* WHERE */}
          <div className="search-field compact-field">
            <select
              aria-label="Where — Countries"
              value={filters.country}
              onChange={e => onWhereChange(e.target.value)}
            >
              <option value="all" disabled>Where</option>
              {countryOptions.map(c => (
                <option key={c} value={c === "all" ? "all" : c}>
                  {c === "all" ? "All countries" : c}
                </option>
              ))}
            </select>
          </div>

          {/* WHAT */}
          <div className="search-field compact-field">
            <select
              aria-label="What — Type"
              value={filters.category}
              onChange={e => onWhatChange(e.target.value)}
            >
              <option value="all" disabled>What</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat === "all" ? "all" : cat}>
                  {cat === "all" ? "All types" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* WHEN */}
          <div className="search-field compact-field">
            <select
              aria-label="When — Month"
              value={filters.dateFrom ? filters.dateFrom : "all"}
              onChange={e => onWhenChange(e.target.value === "all" ? "" : e.target.value)}
            >
              <option value="all" disabled>When</option>
              {monthOptions.map(opt =>
                opt === "all" ? null : <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </select>
          </div>

          <div className="search-actions compact-actions">
            <button className="clear-btn compact-clear" onClick={onClear}>Clear</button>
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
