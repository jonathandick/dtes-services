/**
 * nav.js — shared site navigation for DTES Community Tools
 * 
 * Usage: add to any page:
 *   <script src="nav.js"></script>
 * 
 * The script:
 *  1. Injects the #site-nav element (and its CSS) into the page
 *  2. Auto-marks the current page link as sn-active based on the URL
 * 
 * To add a new page: edit the NAV_LINKS array below.
 */

(function () {
  const NAV_LINKS = [
    { href: "index.html",              label: "Home" },
    { href: "dtes-services.html",      label: "Services Map" },
    { href: "overdose-watch.html",     label: "OD Watch" },
    { href: "treatment-programs.html", label: "Treatment" },
    { href: "vancouver-shelters.html", label: "Shelters" },
    { href: "social-housing.html",     label: "Social Housing" },
  ];

  // ── CSS ────────────────────────────────────────────────────
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
  z-index: 300;
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
}
#site-nav .sn-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #E8930A;
  flex-shrink: 0;
  animation: sn-pulse 2.2s ease-in-out infinite;
  display: inline-block;
}
@keyframes sn-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(232,147,10,0.6); }
  50%      { box-shadow: 0 0 0 5px rgba(232,147,10,0); }
}
#site-nav .sn-links {
  display: flex;
  gap: 2px;
}
#site-nav .sn-links a {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #7EC8C0;
  padding: 5px 10px;
  border-radius: 6px;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
#site-nav .sn-links a:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
  text-decoration: none;
}
#site-nav .sn-links a.sn-active {
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-weight: 500;
}
`;

  // ── Inject CSS ─────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ── Determine active page ──────────────────────────────────
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  // ── Build nav HTML ─────────────────────────────────────────
  const linksHtml = NAV_LINKS.map(link => {
    const isActive = link.href === currentFile ? ' class="sn-active"' : "";
    return `<a href="${link.href}"${isActive}>${link.label}</a>`;
  }).join("\n    ");

  const navHtml = `
<nav id="site-nav">
  <a href="index.html" class="sn-logo">
    <span class="sn-pulse"></span>
    DTES Community Tools
  </a>
  <div class="sn-links">
    ${linksHtml}
  </div>
</nav>`;

  // ── Inject nav as first element in <body> ──────────────────
  // Remove any existing #site-nav first (in case it's hardcoded in the page)
  const existing = document.getElementById("site-nav");
  if (existing) existing.remove();

  document.body.insertAdjacentHTML("afterbegin", navHtml);
})();
