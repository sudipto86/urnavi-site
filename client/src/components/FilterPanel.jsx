import React, { useMemo } from "react";
import events from "../data/events.json";
import "../styles/filter.css";

export default function FilterPanel({ filters, onChange }) {
    // derive options from data
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
        <aside className="filter-panel" aria-label="Filters">
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

            <div className="note">
                Tip: click a marker to view event details.
            </div>
        </aside>
    );
}
