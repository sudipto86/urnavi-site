// client/src/components/FilterPanel.jsx
import React, { useMemo, useState, useEffect } from "react";
import events from "../data/events.json";
import "../styles/filterbar.css";

export default function FilterPanel({ id, open, onClose, filters, onChange, onApply, onClear }) {
  // local copy so the user can change values in the UI and only apply when pressing Show
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    // when filters prop changes (e.g., external clear) update local
    setLocal(filters);
  }, [filters]);

  const categories = useMemo(() => {
    const s = new Set(events.map(e => e.category));
    return ["all", ...Array.from(s)];
  }, []);

  const countries = useMemo(() => {
    const s = new Set(events.map(e => e.country || "unknown"));
    return ["all", ...Array.from(s)];
  }, []);

  function updateLocal(changes) {
    setLocal({ ...local, ...changes });
  }

  function handleShow() {
    // apply: pass local up to parent
    onApply && onApply(local);
  }

  function handleClear() {
    // clear both local UI and request parent clear
    const defaults = { category: "all", country: "all", dateFrom: "", dateTo: "" };
    setLocal(defaults);
    onClear && onClear();
  }

  return (
    <div id={id} className={`filterbar ${open ? "open" : ""}`} role="region" aria-hidden={!open}>
      <div className="filter-inner">
        <div className="field">
          <label>Type</label>
          <select value={local.category} onChange={e => updateLocal({ category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Country</label>
          <select value={local.country} onChange={e => updateLocal({ country: e.target.value })}>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Month</label>
          <input
            type="month"
            value={local.dateFrom ? local.dateFrom.slice(0,7) : ""}
            onChange={e => updateLocal({ dateFrom: e.target.value ? `${e.target.value}-01` : "" })}
          />
        </div>

        <div className="actions">
          <button className="apply" onClick={handleShow}>Show</button>
          <button className="clear" onClick={handleClear}>Clear</button>
          <button className="close-small" aria-label="Close" onClick={onClose}>✕</button>
        </div>
      </div>
    </div>
  );
}
