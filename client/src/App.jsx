// client/src/App.jsx
import React, { useState, useEffect, useMemo } from "react";
import MapView from "./components/MapView";
import Logo from "./components/Logo";
import events from "./data/events.json";
import "./styles/global.css";

export default function App() {
  // canonical filters (applied to MapView)
  const [filters, setFilters] = useState({
    category: "all",     // "What"
    country: "all",      // "Where"
    dateFrom: ""         // "When" (YYYY-MM-DD, month-start) or "" = all
  });

  // reset token to tell MapView to refit world bounds on Clear
  const [resetToken, setResetToken] = useState(0);

  // derive Type (category) & Country lists from events.json
  const categoryOptions = useMemo(() => {
    const s = new Set(events.map(e => (e.category || "uncategorized").trim()));
    return ["all", ...Array.from(s).filter(Boolean).sort()];
  }, []);

  const countryOptions = useMemo(() => {
    const s = new Set(events.map(e => (e.country || "Unknown").trim()));
    return ["all", ...Array.from(s).filter(Boolean).sort()];
  }, []);

  // Build 'When' options - month list for next 3 months (including current month)
  const monthOptions = useMemo(() => {
    const months = ["all"];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const iso = d.toISOString().slice(0,7); // "YYYY-MM"
      const label = d.toLocaleString(undefined, { month: "short", year: "numeric" }); // "Dec 2025"
      months.push({ value: `${iso}-01`, label });
    }
    return months; // first "all", then objects
  }, []);

  // Handlers: immediate apply on change
  function onWhereChange(value) {
    // apply country immediately
    setFilters(f => ({ ...f, country: value }));
    // no need to change resetToken — clearing will do that.
  }

  function onWhatChange(value) {
    setFilters(f => ({ ...f, category: value }));
  }

  function onWhenChange(monthValue) {
    // monthValue is either ""/"all" or "YYYY-MM-01"
    setFilters(f => ({ ...f, dateFrom: monthValue || "" }));
  }

  function clearFilters() {
    const defaults = { category: "all", country: "all", dateFrom: "" };
    setFilters(defaults);
    // signal map to reset view
    setResetToken(t => t + 1);
  }

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

          {/* WHERE */}
          <div className="search-field">
            <label className="search-label">Where</label>
            <select
              aria-label="Where — Countries"
              value={filters.country}
              onChange={e => onWhereChange(e.target.value)}
            >
              {countryOptions.map(c => (
                <option key={c} value={c === "all" ? "all" : c}>
                  {c === "all" ? "All countries" : c}
                </option>
              ))}
            </select>
          </div>

          {/* WHAT */}
          <div className="search-field">
            <label className="search-label">What</label>
            <select
              aria-label="What — Type"
              value={filters.category}
              onChange={e => onWhatChange(e.target.value)}
            >
              {categoryOptions.map(c => (
                <option key={c} value={c === "all" ? "all" : c}>
                  {c === "all" ? "All types" : c}
                </option>
              ))}
            </select>
          </div>

          {/* WHEN (months) */}
          <div className="search-field">
            <label className="search-label">When</label>
            <select
              aria-label="When — Month"
              value={filters.dateFrom ? filters.dateFrom : "all"}
              onChange={e => onWhenChange(e.target.value === "all" ? "" : e.target.value)}
            >
              {monthOptions.map(opt => {
                if (opt === "all") return <option key="all" value="all">All months</option>;
                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
              })}
            </select>
          </div>

          {/* Clear */}
          <div className="search-actions">
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
