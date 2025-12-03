document.addEventListener("DOMContentLoaded", async () => {

  const roots = document.querySelectorAll('#events-root');
  if (!roots.length) return;

  for (const root of roots) {
    const country = (root.dataset.country || "").toLowerCase();
    if (!country) {
      root.innerHTML = '<div style="color:var(--muted)">No country specified.</div>';
      continue;
    }

    // Always start clean — prevents duplicate rendering
    root.innerHTML = "";

    // Load local JSON: /data/country.json
    const url = `data/${country}.json`;

    let payload = null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("File not found");
      payload = await res.json();
    } catch (e) {
      root.innerHTML = `<div style="color:var(--muted)">No event data available for ${country}.</div>`;
      continue;
    }

    // Container fragment
    const frag = document.createDocumentFragment();

    // -------------------------
    // Render EVENTS (dynamic)
    // -------------------------
    if (Array.isArray(payload.events) && payload.events.length) {
      const sec = document.createElement("section");
      sec.className = "section";
      const header = document.createElement("h2");
      header.textContent = "Events";
      sec.appendChild(header);

      const eventsGrid = document.createElement("div");
      eventsGrid.className = "events";

      payload.events.forEach(ev => {
        const card = document.createElement("article");
        card.className = "event";

        // Title
        const title = document.createElement("div");
        title.className = "title";
        title.textContent = ev.title || "Untitled event";
        card.appendChild(title);

        // Date
        if (ev.date) {
          const date = document.createElement("div");
          date.className = "date";
          date.textContent = ev.date;
          card.appendChild(date);
        }

        // Description
        if (ev.desc) {
          const desc = document.createElement("div");
          desc.className = "desc";
          desc.textContent = ev.desc;
          card.appendChild(desc);
        }

        // Actions (button link)
        if (ev.link) {
          const actions = document.createElement("div");
          actions.className = "actions";

          const a = document.createElement("a");
          a.className = "btn";
          a.href = ev.link;
          a.textContent = ev.cta || "More info";

          // 🔥 Always open event links in new tab
          a.target = "_blank";
          a.rel = "noopener noreferrer";

          actions.appendChild(a);
          card.appendChild(actions);
        }

        eventsGrid.appendChild(card);
      });

      sec.appendChild(eventsGrid);
      frag.appendChild(sec);
    }

    // -------------------------
    // Render MARKETS (dynamic)
    // -------------------------
    if (Array.isArray(payload.markets) && payload.markets.length) {
      const sec = document.createElement("section");
      sec.className = "section";
      const header = document.createElement("h2");
      header.textContent = "Markets";
      sec.appendChild(header);

      const grid = document.createElement("div");
      grid.className = "grid";

      payload.markets.forEach(m => {
        const card = document.createElement("article");
        card.className = "card";

        // Header image
        const media = document.createElement("div");
        media.className = "media";
        if (m.image) {
          media.style.backgroundImage = `url('${m.image}')`;
        }
        card.appendChild(media);

        const body = document.createElement("div");
        body.className = "body";

        // Title
        const h3 = document.createElement("h3");
        h3.textContent = m.title || "Untitled market";
        body.appendChild(h3);

        // Description
        if (m.desc) {
          const p = document.createElement("p");
          p.textContent = m.desc;
          body.appendChild(p);
        }

        // Meta + link
        const meta = document.createElement("div");
        meta.className = "meta";

        const span = document.createElement("span");
        span.style.color = "var(--muted)";
        span.textContent = m.type || "";
        meta.appendChild(span);

        if (m.link) {
          const a = document.createElement("a");
          a.className = "btn";
          a.href = m.link;
          a.textContent = m.cta || "Visit";

          // 🔥 All market links → new tab
          a.target = "_blank";
          a.rel = "noopener noreferrer";

          meta.appendChild(a);
        }

        body.appendChild(meta);
        card.appendChild(body);
        grid.appendChild(card);
      });

      sec.appendChild(grid);
      frag.appendChild(sec);
    }

    // Append everything
    root.appendChild(frag);
  }
});
