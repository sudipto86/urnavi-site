import React, { useMemo } from "react";
import events from "../data/events.json";
import "../styles/drawer.css";

export default function FilterPanel({ open, onClose, filters, onChange }) {
    const categories = useMemo(() => {
        const set = new Set(events.map(e => e.category));
        return ["all", ...Array.from(set)];
    }, []);

    const countries = useMemo(() => {
        const set = new Set(events.map(e => e.country || "unknown"));
        return ["all", ...Array.from(set)];
    }, []);

    function update(changes) {
        onChange({ ...filters, ...changes });
    }

    return (
        <>
            <div className={`drawer-backdrop ${open ? "visible" : ""}`} onClick={onClose} />

            <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
                <div className="drawer-header">
                    <h3>Filters</h3>
                    <button className="drawer-close" onClick={onClose} aria-label="Close filters">✕</button>
                </div>

                <div className="drawer-body">
                    <div className="filter-row">
                        <label>Category</label>
                        <select value={filters.category} onChange={e => update({ category: e.target.value })}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="filter-row">
                        <label>Country</label>
                        <select value={filters.country} onChange={e => update({ country: e.target.value })}>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="filter-row">
                        <label>From</label>
                        <input type="date" value={filters.dateFrom} onChange={e => update({ dateFrom: e.target.value })} />
                    </div>

                    <div className="filter-row">
                        <label>To</label>
                        <input type="date" value={filters.dateTo} onChange={e => update({ dateTo: e.target.value })} />
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <button className="apply-btn" onClick={onClose}>Apply</button>
                        <button className="clear-btn" onClick={() => update({ category: "all", country: "all", dateFrom: "", dateTo: "" })}>Clear</button>
                    </div>
                </div>

                <footer className="drawer-footer">
                    <small>UrNavi • Explore events & markets</small>
                </footer>
            </aside>
        </>
    );
}
