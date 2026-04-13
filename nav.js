/**
 * nav.js — shared site navigation for DTES Community Tools
 *
 * Usage: <script src="nav.js"></script>
 *
 * NAV_ITEMS supports two shapes:
 *   { href, label }            — flat link
 *   { label, children: [...] } — dropdown group
 *
 * To add pages: edit NAV_ITEMS below.
 */

(function () {
  const NAV_ITEMS = [
    { href: "index.html", label: "Home" },
    {
      label: "Services",
      children: [
        { href: "dtes-services.html", label: "Services Map" },
        { href: "treatment-programs.html", label: "Treatment Programs" },
        { href: "vancouver-shelters.html", label: "Shelters" },
        { href: "social-housing.html", label: "Social Housing" },
        { href: "ctct.html", label: "CTCT" },
        { href: "drug-supply.html", label: "Drug Supply" },
        { href: "legal-services.html", label: "Legal Services" },
        { href: "income-assistance.html", label: "Income Assistance" },
        { href: "dtes-demographics.html", label: "Demographics" },
      ],
    },
    {
      label: "OD Response",
      children: [
        { href: "overdose-watch.html", label: "OD Watch" },
        { href: "public-health-dashboard.html", label: "PH Dashboard" },
        { href: "pilot-plan.html", label: "Pilot Plan" },
      ],
    },
    {
      label: "Treatment",
      children: [
        { href: "treatment-programs.html", label: "Programs" },
        { href: "wait-times.html", label: "Wait Times" },
      ],
    },
  ];

  // ── CSS ───────────────────────────────────────────────────────
  const css = `
#site-nav {
  background: #071F1B;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
#site-nav .sn-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
}
#site-nav .sn-pulse {
  width: 8px; height: 8px; border-radius: 50%;
  background: #E8930A; flex-shrink: 0;
  animation: sn-pulse 2.2s ease-in-out infinite;
  display: inline-block;
}
@keyframes sn-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(232,147,10,0.6); }
  50%      { box-shadow: 0 0 0 5px rgba(232,147,10,0); }
}

/* ── Link row ── */
#site-nav .sn-links {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ── Flat links ── */
#site-nav .sn-links > a {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #7EC8C0;
  padding: 5px 10px;
  border-radius: 6px;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
#site-nav .sn-links > a:hover,
#site-nav .sn-links > a.sn-active {
  background: rgba(255,255,255,0.09);
  color: #fff;
  text-decoration: none;
}
#site-nav .sn-links > a.sn-active { font-weight: 500; }

/* ── Dropdown wrapper ── */
#site-nav .sn-dropdown {
  position: relative;
}

/* ── Dropdown toggle button ── */
#site-nav .sn-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #7EC8C0;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
}
#site-nav .sn-toggle::after {
  content: '';
  display: inline-block;
  width: 0; height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-top: 4px solid currentColor;
  opacity: 0.55;
  margin-top: 1px;
  transition: transform 0.15s;
}
#site-nav .sn-dropdown:hover .sn-toggle,
#site-nav .sn-dropdown:focus-within .sn-toggle {
  background: rgba(255,255,255,0.09);
  color: #fff;
}
#site-nav .sn-dropdown:hover .sn-toggle::after,
#site-nav .sn-dropdown:focus-within .sn-toggle::after {
  transform: rotate(180deg);
}
#site-nav .sn-toggle.sn-active {
  color: #fff;
  font-weight: 500;
  background: rgba(255,255,255,0.09);
}

/* ── Dropdown menu ── */
#site-nav .sn-menu {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 172px;
  background: #0D3D35;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  z-index: 1100;
}
#site-nav .sn-dropdown:hover .sn-menu,
#site-nav .sn-dropdown:focus-within .sn-menu {
  display: block;
}
#site-nav .sn-menu a {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #7EC8C0;
  padding: 7px 12px;
  border-radius: 5px;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
#site-nav .sn-menu a:hover,
#site-nav .sn-menu a.sn-active {
  background: rgba(255,255,255,0.09);
  color: #fff;
  text-decoration: none;
}
#site-nav .sn-menu a.sn-active { font-weight: 500; }
`;

  // ── Inject CSS ────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ── Determine active page ─────────────────────────────────────
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  // ── Build nav items HTML ──────────────────────────────────────
  function buildItems(items) {
    return items
      .map((item) => {
        if (item.children) {
          // Dropdown group
          const groupActive = item.children.some((c) => c.href === currentFile);
          const toggleClass = groupActive ? ' class="sn-toggle sn-active"' : ' class="sn-toggle"';
          const childLinks = item.children
            .map((c) => {
              const active = c.href === currentFile ? ' class="sn-active"' : "";
              return `<a href="${c.href}"${active}>${c.label}</a>`;
            })
            .join("\n        ");
          return `<div class="sn-dropdown">
      <button${toggleClass} tabindex="0">${item.label}</button>
      <div class="sn-menu">
        ${childLinks}
      </div>
    </div>`;
        } else {
          // Flat link
          const active = item.href === currentFile ? ' class="sn-active"' : "";
          return `<a href="${item.href}"${active}>${item.label}</a>`;
        }
      })
      .join("\n    ");
  }

  const navHtml = `
<nav id="site-nav">
  <a href="index.html" class="sn-logo">
    <span class="sn-pulse"></span>
    DTES Community Tools
  </a>
  <div class="sn-links">
    ${buildItems(NAV_ITEMS)}
  </div>
</nav>`;

  // ── Inject nav ────────────────────────────────────────────────
  const existing = document.getElementById("site-nav");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("afterbegin", navHtml);
})();
