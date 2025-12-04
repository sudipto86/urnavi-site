import React, { useState } from "react";
import MapView from "./components/MapView";
import FilterPanel from "./components/FilterPanel";
import Logo from "./components/Logo";
import "./styles/global.css";
import "./styles/filterbar.css";

export default function App() {
  const [filters, setFilters] = useState({
    category: "all",
    country: "all",
    dateFrom: "",
    dateTo: ""
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="App">
      <header className="app-header">
        <div className="left">
          <Logo size={36} />
          <div className="brand-block">
            <div className="wordmark">UrNavi</div>
            <div className="sub">Calmly find what’s happening nearby</div>
          </div>
        </div>

        <div className="right">
          <button
            className="filter-toggle"
            onClick={() => setFiltersOpen((s) => !s)}
            aria-expanded={filtersOpen}
            aria-controls="filter-bar"
          >
            {filtersOpen ? "Close Filters" : "Filters"}
          </button>
        </div>
      </header>

      <FilterPanel
        id="filter-bar"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
      />

      <main>
        <MapView filters={filters} />
      </main>
    </div>
  );
}
