import React, { useMemo } from "react";
import events from "../data/events.json";
import "../styles/filterbar.css";

export default function FilterPanel({ id, open, onClose, filters, onChange }) {
    const categories = useMemo(() => {
        const s = new Set(events.map(e => e.category));
        return ["all", ...Array.from(s)];
    }, []);
    const countries = useMemo(() => {
        const s = new Set(events.map(e => e.country || "unknown"));
        return ["all", ...Array.from(s)];
    }, []);

    function update(changes) {
        onChange({ ...filters, ...changes });
    }

    return (
        <div
            id={id}
            className={`filterbar ${open ? "open" : ""}`}
            role="region"
            aria-hidden={!open}
        >
            <div className="filter-inner">
                <div className="field">
                    <label>Type</label>
                    <select value={filters.category} onChange={e => update({ category: e.target.value })}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="field">
                    <label>Country</label>
                    <select value={filters.country} onChange={e => update({ country: e.target.value })}>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="field">
                    <label>Month</label>
                    <input
                        type="month"
                        value={filters.dateFrom ? filters.dateFrom.slice(0, 7) : ""}
                        onChange={e => update({ dateFrom: e.target.value ? `${e.target.value}-01` : "" })}
                    />
                </div>

                <div className="actions">
                    <button className="apply" onClick={onClose}>Apply</button>
                    <button className="clear" onClick={() => update({ category: "all", country: "all", dateFrom: "", dateTo: "" })}>Clear</button>
                </div>
            </div>
        </div>
    );
}
