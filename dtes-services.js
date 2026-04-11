// dtes-services.js — logic for dtes-services.html

const CAT_META = {
  "SCS / OPS":                 {color:"#C0392B", icon:"💉"},
  "Primary Care / OAT":        {color:"#1A7A4A", icon:"🩺"},
  "Harm Reduction":            {color:"#D4AC0D", icon:"🧴"},
  "Detox / WDM":               {color:"#D95F00", icon:"🏥"},
  "Peer / Indigenous":         {color:"#1655A2", icon:"🤝"},
  "Women / Sex Workers":       {color:"#A0306B", icon:"♀"},
  "Supportive Housing":        {color:"#4A5568", icon:"🏠"},
  "Shelter / Recovery":        {color:"#6B3FA0", icon:"🛡"},
  "Community / Drop-in":       {color:"#0A7A6B", icon:"🏢"},
  "Emergency Services":        {color:"#CC3300", icon:"🚨"},
  "Transitional / Acute Care": {color:"#2D3A8C", icon:"🏨"},
  "System Navigation":         {color:"#1A2B6B", icon:"🔬"},
};

// ── State ──────────────────────────────────────────────────
let orgs = [];
let activeCategories = new Set();
let activeFlags = new Set();
let searchQuery = "";
let selectedId = null;
let editingId = null;
let sortCol = "name", sortDir = 1;
let map, markers = {};

// ── Storage ────────────────────────────────────────────────
function loadOrgs() {
  try {
    const saved = localStorage.getItem("dtes_orgs_v3");
    orgs = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(BASE_ORGS));
  } catch(e) { orgs = JSON.parse(JSON.stringify(BASE_ORGS)); }
}
function saveOrgs() {
  try { localStorage.setItem("dtes_orgs_v3", JSON.stringify(orgs)); } catch(e) {}
}

// ── Map ────────────────────────────────────────────────────
function initMap() {
  map = L.map("services-map", {zoomControl:true}).setView([49.2815, -123.099], 15);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:"© OpenStreetMap contributors © CARTO", maxZoom:19
  }).addTo(map);
  setTimeout(() => map.invalidateSize(), 200);
}

function makeIcon(org) {
  const meta = CAT_META[org.cat] || {color:"#666", icon:"●"};
  const ring = org.id === selectedId
    ? `box-shadow:0 0 0 2px white,0 0 0 4px ${meta.color},0 4px 12px rgba(0,0,0,0.3);transform:scale(1.15);`
    : "";
  return L.divIcon({
    html:`<div style="background:${meta.color};width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;${ring}cursor:pointer;transition:transform 0.1s;">${meta.icon}</div>`,
    className:"", iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16]
  });
}

function buildPopup(org) {
  const meta = CAT_META[org.cat] || {color:"#666"};
  const oatBadge = org.oat?.startsWith("Yes") ? `<span class="pb pb-yes">OAT ✓</span>` : "";
  const scsBadge = org.scs?.startsWith("Yes") && !org.scs.startsWith("No") ? `<span class="pb pb-yes">SCS/OPS ✓</span>` : "";
  const wiBadge  = (org.walkin?.includes("drop-in") || org.walkin?.startsWith("Yes")) ? `<span class="pb pb-yes">Walk-in ✓</span>` : "";
  const div = document.createElement("div");
  div.className = "popup-inner";
  div.innerHTML = `
    <div class="popup-cat-label" style="color:${meta.color}">${org.cat}</div>
    <div class="popup-name">${org.name}</div>
    <div class="popup-addr">📍 ${org.addr}${org.phone ? `<br>📞 ${org.phone}` : ""}</div>
    <div class="popup-badges">${oatBadge}${scsBadge}${wiBadge}</div>
    <button class="popup-detail-btn" onclick="showDetail('${org.id}')">View full details →</button>
  `;
  return div;
}

function renderMarkers() {
  Object.values(markers).forEach(m => m.remove());
  markers = {};
  orgs.forEach(org => {
    if (!org.lat || !org.lng) return;
    const marker = L.marker([org.lat, org.lng], {icon: makeIcon(org)});
    marker.bindPopup(buildPopup(org), {maxWidth:280, className:""});
    marker.on("click", () => selectOrg(org.id));
    marker.addTo(map);
    markers[org.id] = marker;
  });
}

function updateMarkerIcon(id) {
  const org = orgs.find(o=>o.id===id);
  if (org && markers[id]) markers[id].setIcon(makeIcon(org));
}

// ── Filter & search ────────────────────────────────────────
function getVisible() {
  const q = searchQuery.toLowerCase();
  return orgs.filter(org => {
    const catMatch  = activeCategories.size === 0 || activeCategories.has(org.cat);
    const flagMatch = [...activeFlags].every(f => org.flags?.[f]);
    const textMatch = !q
      || [org.name, org.addr, org.inst, org.desc, org.cat].some(v => v?.toLowerCase().includes(q));
    return catMatch && flagMatch && textMatch;
  });
}

function updateMapVisibility() {
  const visibleIds = new Set(getVisible().map(o=>o.id));
  orgs.forEach(org => {
    const m = markers[org.id];
    if (!m) return;
    if (visibleIds.has(org.id)) { if (!map.hasLayer(m)) m.addTo(map); }
    else                        { if (map.hasLayer(m))  m.remove(); }
  });
}

// ── Render table ───────────────────────────────────────────
function renderTable() {
  const data = [...getVisible()].sort((a, b) => {
    const av = (a[sortCol]||"").toLowerCase(), bv = (b[sortCol]||"").toLowerCase();
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  document.getElementById("total-count").textContent        = orgs.length;
  document.getElementById("shown-count-header").textContent = data.length;
  document.getElementById("shown-count").textContent        = data.length;
  document.getElementById("total-shown").textContent        = orgs.length;
  updateMapVisibility();

  const tbody = document.getElementById("table-body");
  if (data.length === 0) {
    tbody.innerHTML = `<tr class="no-results-row"><td colspan="8">No organizations match — try removing some filters.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(org => {
    const meta = CAT_META[org.cat] || {color:"#666"};
    const oatCls = org.oat?.startsWith("Yes") ? "tbadge-yes" : "tbadge-no";
    const scsCls = org.scs?.startsWith("Yes") && !org.scs.startsWith("No") ? "tbadge-yes" : "tbadge-no";
    const wiCls  = (org.walkin?.includes("drop-in") || org.walkin?.startsWith("Yes")) ? "tbadge-yes" : "tbadge-ref";
    return `
      <tr id="row-${org.id}" class="${org.id===selectedId?'row-selected':''}" onclick="selectAndDetail('${org.id}')">
        <td class="td-name">${org.name}<small>${org.inst||""}</small></td>
        <td class="td-cat"><span class="tcat-pill" style="background:${meta.color}22;color:${meta.color}">${org.cat}</span></td>
        <td class="td-addr">${org.addr||"—"}</td>
        <td class="td-phone">${org.phone?`<a href="tel:${org.phone}">${org.phone}</a>`:"—"}</td>
        <td class="td-hours">${org.hours||"—"}</td>
        <td><span class="${oatCls}">${org.oat||"No"}</span></td>
        <td><span class="${scsCls}">${org.scs||"No"}</span></td>
        <td><span class="${wiCls}">${org.walkin||"—"}</span></td>
      </tr>`;
  }).join("");
}

function renderAll() { renderTable(); }

// ── Select + detail ────────────────────────────────────────
function selectOrg(id) {
  const prev = selectedId;
  selectedId = id;
  if (prev) updateMarkerIcon(prev);
  updateMarkerIcon(id);
  document.querySelectorAll("#table-body tr").forEach(r =>
    r.classList.toggle("row-selected", r.id === "row-"+id)
  );
  const org = orgs.find(o=>o.id===id);
  if (org?.lat && org?.lng) {
    map.setView([org.lat, org.lng], Math.max(map.getZoom(), 16), {animate:true});
    markers[id]?.openPopup();
  }
}

function selectAndDetail(id) { selectOrg(id); showDetail(id); }

function showDetail(id) {
  const org = orgs.find(o=>o.id===id);
  if (!org) return;
  selectOrg(id);
  const meta     = CAT_META[org.cat] || {color:"#666", icon:"●"};
  const oatBadge = `<span class="dbadge ${org.oat?.startsWith('Yes')?'dbadge-yes':'dbadge-no'}">OAT: ${org.oat||"No"}</span>`;
  const scsBadge = `<span class="dbadge ${org.scs?.startsWith('Yes')&&!org.scs.startsWith('No')?'dbadge-yes':'dbadge-no'}">SCS/OPS: ${org.scs||"No"}</span>`;
  const wiBadge  = `<span class="dbadge ${(org.walkin?.includes('drop-in')||org.walkin?.startsWith('Yes'))?'dbadge-yes':'dbadge-ref'}">Access: ${org.walkin||"—"}</span>`;
  const webHtml  = org.web ? `<div class="detail-row"><span class="detail-label">Website</span><span class="detail-val"><a href="https://${org.web}" target="_blank">${org.web}</a></span></div>` : "";
  const noteHtml = org.note ? `<div class="detail-note">⚠️ ${org.note}</div>` : "";

  document.getElementById("detail-scroll").innerHTML = `
    <div class="detail-icon-row">
      <div class="detail-icon" style="background:${meta.color}22">${meta.icon}</div>
      <div>
        <div class="detail-cat" style="color:${meta.color}">${org.cat}</div>
        <div class="detail-name">${org.name}</div>
      </div>
    </div>
    <div class="detail-inst">${org.inst||""}</div>
    <div class="detail-badges">${oatBadge}${scsBadge}${wiBadge}</div>
    <div class="detail-section-title">Contact &amp; Access</div>
    <div class="detail-row"><span class="detail-label">Address</span><span class="detail-val">${org.addr||"—"}</span></div>
    <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-val">${org.phone?`<a href="tel:${org.phone}">${org.phone}</a>`:"—"}</span></div>
    <div class="detail-row"><span class="detail-label">Hours</span><span class="detail-val">${org.hours||"—"}</span></div>
    ${webHtml}
    <div class="detail-section-title">Services</div>
    <div class="detail-desc">${org.desc||"No description available."}</div>
    ${noteHtml}
    <div class="detail-cta">
      <button class="detail-cta-btn" onclick="openModal('${org.id}')">Edit</button>
      ${org.phone?`<button class="detail-cta-btn primary" onclick="window.location='tel:${org.phone}'">Call</button>`:""}
    </div>`;

  document.getElementById("list-panel").style.display = "none";
  document.getElementById("detail-panel").classList.add("show");
}

function showList() {
  document.getElementById("list-panel").style.display = "";
  document.getElementById("detail-panel").classList.remove("show");
}

// ── Edit / add ─────────────────────────────────────────────
function openModal(id) {
  editingId = id || null;
  const org = id ? orgs.find(o=>o.id===id) : null;
  document.getElementById("modal-title").textContent = id ? "Edit Organization" : "Add Organization";
  document.getElementById("btn-delete").style.display = id ? "inline-flex" : "none";
  const f = id => document.getElementById(id);
  f("f-name").value  = org?.name  || "";
  f("f-cat").value   = org?.cat   || "Primary Care / OAT";
  f("f-inst").value  = org?.inst  || "";
  f("f-addr").value  = org?.addr  || "";
  f("f-phone").value = org?.phone || "";
  f("f-web").value   = org?.web   || "";
  f("f-hours").value = org?.hours || "";
  f("f-oat").value   = org?.oat   || "No";
  f("f-scs").value   = org?.scs   || "No";
  f("f-walkin").value= org?.walkin|| "No – referral only";
  f("f-hrs-type").value = org?.flags?.["24hr"] ? "24hr" : org?.flags?.women ? "women" : org?.flags?.indigenous ? "indigenous" : "";
  f("f-desc").value  = org?.desc  || "";
  f("f-lat").value   = org?.lat   || "";
  f("f-lng").value   = org?.lng   || "";
  document.getElementById("modal-overlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("show");
  editingId = null;
}

function saveOrg() {
  const name = document.getElementById("f-name").value.trim();
  if (!name) { alert("Name is required."); return; }
  const f = id => document.getElementById(id).value;
  const hrsType = f("f-hrs-type"), oatVal = f("f-oat"), scsVal = f("f-scs"), wiVal = f("f-walkin");
  const flags = {
    oat: oatVal.startsWith("Yes"),
    scs: scsVal.startsWith("Yes") || scsVal.includes("OPS"),
    walkin: wiVal.includes("drop-in") || wiVal.startsWith("Yes"),
    "24hr": hrsType === "24hr", women: hrsType === "women", indigenous: hrsType === "indigenous",
  };
  const newOrg = {
    id: editingId || "custom_" + Date.now(),
    name, cat: f("f-cat"), inst: f("f-inst").trim(), addr: f("f-addr").trim(),
    phone: f("f-phone").trim(), web: f("f-web").trim(), hours: f("f-hours").trim(),
    oat: oatVal, scs: scsVal, walkin: wiVal, flags,
    desc: f("f-desc").trim(),
    lat: parseFloat(f("f-lat")) || null, lng: parseFloat(f("f-lng")) || null,
  };
  if (editingId) {
    const idx = orgs.findIndex(o=>o.id===editingId);
    if (idx >= 0) orgs[idx] = newOrg;
    markers[editingId]?.remove();
    delete markers[editingId];
  } else {
    orgs.push(newOrg);
  }
  saveOrgs();
  if (newOrg.lat && newOrg.lng) {
    const marker = L.marker([newOrg.lat, newOrg.lng], {icon: makeIcon(newOrg)});
    marker.bindPopup(buildPopup(newOrg), {maxWidth:280});
    marker.on("click", () => selectOrg(newOrg.id));
    marker.addTo(map);
    markers[newOrg.id] = marker;
  }
  closeModal(); showList(); renderAll();
}

function deleteOrg() {
  if (!editingId || !confirm("Delete this organization?")) return;
  orgs = orgs.filter(o=>o.id!==editingId);
  markers[editingId]?.remove();
  delete markers[editingId];
  saveOrgs();
  if (selectedId === editingId) selectedId = null;
  closeModal(); showList(); renderAll();
}

// ── Handout ────────────────────────────────────────────────
function openHandout() {
  const visible = getVisible();
  const byCat = {};
  visible.forEach(org => { (byCat[org.cat] = byCat[org.cat]||[]).push(org); });
  const now = new Date().toLocaleDateString("en-CA", {year:"numeric",month:"long",day:"numeric"});
  let html = `<div class="handout-title">DTES Harm Reduction & Addiction Services</div>
    <div class="handout-sub">Downtown Eastside Vancouver · ${visible.length} organizations · Generated ${now} · Verify all information before use</div>`;
  Object.entries(byCat).forEach(([cat, list]) => {
    html += `<div class="handout-section"><div class="handout-section-title">${cat}</div>`;
    list.forEach(org => {
      html += `<div class="handout-item">
        <div class="handout-item-name">${org.name}</div>
        <div class="handout-item-addr">${org.addr||""}${org.hours?` · ${org.hours}`:""}</div>
        <div class="handout-item-phone">${org.phone||""}</div></div>`;
    });
    html += `</div>`;
  });
  document.getElementById("handout-content").innerHTML = html;
  document.getElementById("handout-overlay").classList.add("show");
}
function closeHandout() { document.getElementById("handout-overlay").classList.remove("show"); }

// ── CSV export ─────────────────────────────────────────────
function exportCSV() {
  const cols    = ["name","cat","inst","addr","phone","hours","oat","scs","walkin","web","desc","note"];
  const headers = ["Organization","Category","Institution","Address","Phone","Hours","OAT","SCS/OPS","Walk-in","Website","Description","Notes"];
  const esc = v => `"${(v||"").replace(/"/g,'""')}"`;
  const csv = [headers.map(esc).join(","), ...getVisible().map(o => cols.map(c=>esc(o[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  Object.assign(document.createElement("a"), {href:url, download:"DTES_Services.csv"}).click();
  URL.revokeObjectURL(url);
}

// ── Events ─────────────────────────────────────────────────
function initEvents() {
  document.getElementById("search").addEventListener("input", e => {
    searchQuery = e.target.value; renderAll();
  });
  document.querySelectorAll(".filter-btn[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      activeCategories[activeCategories.has(cat) ? "delete" : "add"](cat);
      btn.classList.toggle("active", activeCategories.has(cat));
      renderAll();
    });
  });
  document.querySelectorAll(".filter-btn[data-flag]").forEach(btn => {
    btn.addEventListener("click", () => {
      const flag = btn.dataset.flag;
      activeFlags[activeFlags.has(flag) ? "delete" : "add"](flag);
      btn.classList.toggle("active", activeFlags.has(flag));
      renderAll();
    });
  });
  document.querySelectorAll("thead th[data-col]").forEach(th => {
    th.addEventListener("click", () => {
      if (sortCol === th.dataset.col) sortDir *= -1;
      else { sortCol = th.dataset.col; sortDir = 1; }
      document.querySelectorAll("thead th").forEach(t => t.classList.remove("sort-asc","sort-desc"));
      th.classList.add(sortDir === 1 ? "sort-asc" : "sort-desc");
      renderAll();
    });
  });
  document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); closeHandout(); }
  });
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadOrgs(); initMap(); renderMarkers(); renderAll(); initEvents();
  setTimeout(() => map?.invalidateSize(), 200);
});
