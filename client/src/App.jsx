import React, { useState } from "react";
import MapView from "./components/MapView";
import FilterPanel from "./components/FilterPanel";
import "./styles/global.css";
import "./styles/drawer.css";

export default function App() {
  const [filters, setFilters] = useState({
    category: "all",
    country: "all",
    dateFrom: "",
    dateTo: ""
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("map"); // map | list (placeholder)

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">UrNavi</div>
          <div className="slogan">Calmly find what’s happening nearby</div>
        </div>

        <div className="nav-actions">
          <button
            className={`toggle-btn ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
            aria-pressed={viewMode === "map"}
            title="Map view"
          >
            Map
          </button>

          <button
            className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            title="List view"
          >
            List
          </button>

          <button
            className="filter-open-btn"
            onClick={() => setShowFilters(true)}
            title="Open filters"
          >
            Filters
          </button>
        </div>
      </nav>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
      />

      <main>
        <MapView filters={filters} />
      </main>
    </div>
  );
}
