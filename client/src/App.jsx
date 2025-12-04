import React, { useState } from "react";
import MapView from "./components/MapView";
import FilterPanel from "./components/FilterPanel";
import "./styles/global.css";

export default function App() {
  const [filters, setFilters] = useState({
    category: "all",
    country: "all",
    dateFrom: "",
    dateTo: ""
  });

  return (
    <div className="App">
      <header className="topbar">
        <div className="brand">
          <h1>Urnavi</h1>
          <div className="tag">Explore events & markets</div>
        </div>
      </header>

      <FilterPanel filters={filters} onChange={setFilters} />

      <main>
        <MapView filters={filters} />
      </main>
    </div>
  );
}
