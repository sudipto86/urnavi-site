import React from "react";
import MapView from "./components/MapView";

export default function App() {
  return (
    <div className="App">
      <header className="topbar">
        <div className="brand">
          <h1>Urnavi</h1>
          <div className="tag">Explore events & markets</div>
        </div>
      </header>

      <main>
        <MapView />
      </main>
    </div>
  );
}
