import React, { useState, useMemo } from "react";
import MapView from "./components/MapView";
import Logo from "./components/Logo";
import events from "./data/events.json";
//import events from './data/events-static.json';
import "./styles/global.css";

export default function App() {
  const [filters, setFilters] = useState({
    country: "all",  // Where
    category: "all", // What
    dateFrom: ""     // When (YYYY-MM-01 or "")
  });

  const [resetToken, setResetToken] = useState(0);

  // WHERE options (countries) – derive from data but ensure Sweden/Norway visible
  const countryOptions = useMemo(() => {
    const base = ["Sweden", "Norway"];
    const fromData = Array.from(
      new Set(
        events
          .map(e => (e.country || "").trim())
          .filter(Boolean)
      )
    );
    const merged = Array.from(new Set([...base, ...fromData])).sort();
    return ["all", ...merged];
  }, []);

  // WHAT options (categories) – derive from data
  const categoryOptions = useMemo(() => {
    const cats = Array.from(
      new Set(
        events
          .map(e => (e.category || "").trim())
          .filter(Boolean)
      )
    ).sort();
    return ["all", ...cats];
  }, []);

  // WHEN options – next 3 months (including current)
  const monthOptions = useMemo(() => {
    const now = new Date();
    const arr = ["all"];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = d.toLocaleString(undefined, {
        month: "short",
        year: "numeric"
      });
      arr.push({ value: iso, label });
    }
    return arr;
  }, []);

  function handleWhereChange(value) {
  setFilters((f) => ({ ...f, country: value }));
  if (!value || value === "all") {
    setResetToken((t) => t + 1);
  }
}

  function handleWhatChange(value) {
    setFilters(f => ({ ...f, category: value }));
  }

  function handleWhenChange(value) {
    setFilters(f => ({ ...f, dateFrom: value === "all" ? "" : value }));
  }

  function handleClear() {
    setFilters({ country: "all", category: "all", dateFrom: "" });
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
              onChange={e => handleWhereChange(e.target.value)}
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
              onChange={e => handleWhatChange(e.target.value)}
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
              value={filters.dateFrom || "all"}
              onChange={e => handleWhenChange(e.target.value)}
            >
              <option value="all" disabled>When</option>
              {monthOptions.map(opt =>
                opt === "all" ? null : (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="search-actions compact-actions">
            <button className="clear-btn compact-clear" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>

        <div className="right" />
      </header>

      <main>
        <MapView filters={filters} resetToken={resetToken} />
      </main>
    </div>
  );
}
