/* =============================================================================
   APDPL Business Intelligence — Sales Analysis Logic
   Scope: pages/sales-analysis.html ONLY (population of existing ids, no
   markup/CSS changes). Architecture mirrors js/salesman.js.

   Data source: fetchFromAppsScript() from ./api.js — the ONLY API function
   used. Exactly ONE API call is made; its `summary` array is reused for
   all three tabs (Day Wise / Customer Wise / Route Wise), and its
   `salesmanSnapshot` / `unitSnapshot` are reused for the header.
   ============================================================================= */

import { fetchFromAppsScript } from "./api.js";

/* ---------------------------------------------------------------------------
   1. DOM REFERENCES (existing ids from sales-analysis.html — not modified)
   --------------------------------------------------------------------------- */

const dom = {
  page: document.getElementById("salesAnalysisPage"),

  salesmanName: document.getElementById("salesmanName"),
  financialMonthChip: document.querySelector("#financialMonth span:last-child"),
  todaysDateChip: document.querySelector("#todaysDate span:last-child"),
  profilePhoto: document.getElementById("profilePhoto"),
  rankBadge: document.getElementById("rankBadge"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),

  tabs: {
    dayWiseBtn: document.getElementById("dayWiseTabBtn"),
    customerWiseBtn: document.getElementById("customerWiseTabBtn"),
    routeWiseBtn: document.getElementById("routeWiseTabBtn"),

    dayWisePanel: document.getElementById("dayWisePanel"),
    customerWisePanel: document.getElementById("customerWisePanel"),
    routeWisePanel: document.getElementById("routeWisePanel")
  },

  dayWise: {
    totalSale: document.getElementById("dayWiseTotalSale"),
    totalReturn: document.getElementById("dayWiseTotalReturn"),
    totalNetSale: document.getElementById("dayWiseTotalNetSale"),
    tableBody: document.getElementById("dayWiseTableBody")
  },

  customer: {
    search: document.getElementById("customerSearch"),
    tableBody: document.getElementById("customerTableBody")
  },

  route: {
    search: document.getElementById("routeSearch"),
    tableBody: document.getElementById("routeTableBody")
  }
};

/* ---------------------------------------------------------------------------
   2. FORMATTING HELPERS (Indian currency / number / date)
   --------------------------------------------------------------------------- */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-IN");

function formatCurrency(value){
  if (!Number.isFinite(value)) return "—";
  return inrFormatter.format(value);
}

function formatNumber(value){
  if (!Number.isFinite(value)) return "—";
  return numberFormatter.format(Math.round(value));
}

// dd-MMM-yyyy, e.g. 09-Jul-2026 (used for rendering table rows)
const shortMonthFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});

function formatDate(dateValue){
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return shortMonthFormatter.format(date).replace(/ /g, "-");
}

/* ---------------------------------------------------------------------------
   2b. HEADER / BUSINESS-LOGIC HELPERS (mirrors salesman.js exactly)
   --------------------------------------------------------------------------- */

// Greeting based on system time.
function getGreeting(){
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// Initials avatar fallback (data URI — no new DOM elements required).
function generateInitialsAvatar(name){
  const initials = String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="100%" height="100%" rx="48" fill="#6366f1"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="36" fill="#ffffff">
        ${initials}
      </text>
    </svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Normalizes the Unit Snapshot's Financial Year value into an "FY ..." label
// without hardcoding the year — reads whatever the sheet provides.
function getFinancialYearLabel(rawValue){
  const value = String(rawValue || "").trim();
  if (!value || value === "—") return "—";
  return value.toUpperCase().startsWith("FY") ? value : `FY ${value}`;
}

// Formats today's date using browser local time (NOT sheet data).
// Example: "Wednesday, 09 Jul 2026"
function getFormattedTodayDate(){
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "short", year: "numeric"
  });
}

/* ---------------------------------------------------------------------------
   2c. RELIABLE DATE PARSER — Summary sheet stores "Bill Date" as
   dd-MMM-yyyy (e.g. "30-Jun-2026"). `new Date(str)` is browser/locale
   dependent for this format, so it's parsed manually and always returns
   a valid Date (or null if the string doesn't match).
   --------------------------------------------------------------------------- */

const MONTH_INDEX_BY_ABBR = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

function parseSummaryDate(rawValue){
  if (rawValue instanceof Date){
    return Number.isNaN(rawValue.getTime()) ? null : rawValue;
  }

  const str = String(rawValue || "").trim();
  const match = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);

  if (!match) return null;

  const [, dayStr, monthAbbr, yearStr] = match;
  const monthIndex = MONTH_INDEX_BY_ABBR[monthAbbr.toLowerCase()];

  if (monthIndex === undefined) return null;

  const day = Number(dayStr);
  const year = Number(yearStr);
  const date = new Date(year, monthIndex, day);

  // Guards against invalid combinations like 31-Feb-2026.
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day){
    return null;
  }

  return date;
}

/* ---------------------------------------------------------------------------
   3. SESSION HELPERS
   --------------------------------------------------------------------------- */

function getLoggedInUser(){
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;

    const user = JSON.parse(raw);
    if (!user || !user.email) return null;

    return user;
  } catch (err) {
    console.error("Failed to read logged-in user from sessionStorage:", err);
    return null;
  }
}

/* ---------------------------------------------------------------------------
   3b. THEME TOGGLE (light / dark) — localStorage persisted, system-aware
   --------------------------------------------------------------------------- */

const THEME_STORAGE_KEY = "apdpl-theme";

function getSystemPreferredTheme(){
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSavedTheme(){
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to read saved theme from localStorage:", err);
    return null;
  }
}

function saveTheme(theme){
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    console.error("Failed to save theme to localStorage:", err);
  }
}

function updateThemeToggleIcon(theme){
  if (!dom.themeToggleBtn) return;

  const icon = dom.themeToggleBtn.querySelector("i");
  if (icon){
    icon.classList.remove("bi-moon-stars", "bi-sun");
    icon.classList.add(theme === "dark" ? "bi-sun" : "bi-moon-stars");
  }

  dom.themeToggleBtn.setAttribute("aria-pressed", String(theme === "dark"));
  dom.themeToggleBtn.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeToggleIcon(theme);
}

function toggleTheme(){
  const current = document.documentElement.getAttribute("data-theme") || getSystemPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  saveTheme(next);
}

function initThemeToggle(){
  const initialTheme = getSavedTheme() || getSystemPreferredTheme();
  applyTheme(initialTheme);

  if (dom.themeToggleBtn){
    dom.themeToggleBtn.addEventListener("click", toggleTheme);
  }
}

/* ---------------------------------------------------------------------------
   4. LOADING / ERROR STATE HELPERS
   --------------------------------------------------------------------------- */

function setLoadingState(isLoading){
  if (!dom.page) return;
  dom.page.setAttribute("aria-busy", String(isLoading));
}

function renderMessageRow(tableBodyEl, colSpan, message){
  if (!tableBodyEl) return;
  tableBodyEl.innerHTML = "";

  const row = document.createElement("tr");
  row.className = "table-empty-row";

  const cell = document.createElement("td");
  cell.colSpan = colSpan;
  cell.innerHTML = `
    <div class="empty-state">
      <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
      <p>${message}</p>
    </div>
  `;

  row.appendChild(cell);
  tableBodyEl.appendChild(row);
}

function setFatalMessage(message){
  renderMessageRow(dom.dayWise.tableBody, 4, message);
  renderMessageRow(dom.customer.tableBody, 6, message);
  renderMessageRow(dom.route.tableBody, 6, message);

  if (dom.dayWise.totalSale) dom.dayWise.totalSale.textContent = "—";
  if (dom.dayWise.totalReturn) dom.dayWise.totalReturn.textContent = "—";
  if (dom.dayWise.totalNetSale) dom.dayWise.totalNetSale.textContent = "—";
}

/* ---------------------------------------------------------------------------
   5. TAB SWITCHING (ARIA tabs — no page reload, single set of listeners)
   --------------------------------------------------------------------------- */

function activateTab(tabName){
  const map = {
    dayWise: { btn: dom.tabs.dayWiseBtn, panel: dom.tabs.dayWisePanel },
    customerWise: { btn: dom.tabs.customerWiseBtn, panel: dom.tabs.customerWisePanel },
    routeWise: { btn: dom.tabs.routeWiseBtn, panel: dom.tabs.routeWisePanel }
  };

  Object.entries(map).forEach(([name, refs]) => {
    const isActive = name === tabName;

    if (refs.btn){
      refs.btn.classList.toggle("is-active", isActive);
      refs.btn.setAttribute("aria-selected", String(isActive));
      refs.btn.tabIndex = isActive ? 0 : -1;
    }

    if (refs.panel){
      refs.panel.hidden = !isActive;
    }
  });
}

function initTabSwitching(){
  const buttons = [
    { name: "dayWise", el: dom.tabs.dayWiseBtn },
    { name: "customerWise", el: dom.tabs.customerWiseBtn },
    { name: "routeWise", el: dom.tabs.routeWiseBtn }
  ];

  buttons.forEach(({ name, el }) => {
    if (!el) return;
    el.addEventListener("click", () => activateTab(name));
  });

  // Basic left/right arrow-key support per the ARIA tabs pattern.
  const tabList = document.getElementById("salesAnalysisTabs");
  if (tabList){
    tabList.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

      const order = ["dayWise", "customerWise", "routeWise"];
      const currentIndex = order.findIndex((name) => map_isActive(buttons, name));
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + order.length) % order.length;
      const nextName = order[nextIndex];

      activateTab(nextName);
      const nextBtn = buttons.find((b) => b.name === nextName)?.el;
      if (nextBtn) nextBtn.focus();
    });
  }
}

function map_isActive(buttons, name){
  const found = buttons.find((b) => b.name === name);
  return found?.el?.classList.contains("is-active") || false;
}

/* ---------------------------------------------------------------------------
   6. SALESMAN-SCOPED SUMMARY FILTER + LOOKUP
   Summary sheet has NO Email column — filtered by SalesmanName ("Salesman"),
   exactly as done in salesman.js's computeReturns().
   --------------------------------------------------------------------------- */

function findSalesmanRowByEmail(salesmanSnapshot, email){
  if (!Array.isArray(salesmanSnapshot)) return null;

  return salesmanSnapshot.find(
    (row) =>
      String(row.Email).trim().toLowerCase() ===
      String(email).trim().toLowerCase()
  ) || null;
}

// Rank calculation based on Overall Sale — same logic as salesman.js's
// computeSalesmanRank, reused here so the header rank badge matches.
function computeSalesmanRank(salesmanSnapshot, email){
  if (!Array.isArray(salesmanSnapshot) || salesmanSnapshot.length === 0) return null;

  const ranked = salesmanSnapshot
    .map((row) => ({
      email: row.Email,
      overallSale:
        (Number(row.AchievementPharma) || 0) +
        (Number(row.AchievementPI) || 0) +
        (Number(row.AchievementZenvito) || 0)
    }))
    .sort((a, b) => b.overallSale - a.overallSale);

  const normalizedEmail = String(email).trim().toLowerCase();
  const index = ranked.findIndex(
    (row) => String(row.email).trim().toLowerCase() === normalizedEmail
  );

  return index === -1 ? null : index + 1;
}

function filterSummaryForSalesman(summary, salesmanName){
  const normalizedName = String(salesmanName).trim().toLowerCase();

  return Array.isArray(summary)
    ? summary.filter((row) => String(row.Salesman).trim().toLowerCase() === normalizedName)
    : [];
}

/* ---------------------------------------------------------------------------
   7. HEADER POPULATION — mirrors salesman.js's populateHeader
   --------------------------------------------------------------------------- */

function populateHeader(salesmanRow, unit, sessionUser, rank){
  const name = salesmanRow.SalesmanName || "—";

  if (dom.salesmanName){
    dom.salesmanName.textContent = `${getGreeting()}, ${name}`;
  }

  if (dom.profilePhoto){
    if (sessionUser?.photo){
      dom.profilePhoto.src = sessionUser.photo;
    } else {
      dom.profilePhoto.src = generateInitialsAvatar(name);
    }
    dom.profilePhoto.alt = `${name} profile photo`;
  }

  if (dom.rankBadge){
    dom.rankBadge.textContent = rank ? `#${rank}` : "—";
  }

  if (dom.financialMonthChip){
    dom.financialMonthChip.textContent = getFinancialYearLabel(unit?.["Financial Year"]);
  }

  if (dom.todaysDateChip){
    // Uses the browser's local time, NOT sheet data — always reflects the
    // visitor's actual current date, same behavior as salesman.js.
    dom.todaysDateChip.textContent = getFormattedTodayDate();
  }
}

/* ---------------------------------------------------------------------------
   8. ROW-LEVEL NUMERIC HELPERS
   --------------------------------------------------------------------------- */

function getSaleValue(row){
  return Number(row["Sales Value"]) || 0;
}

function getReturnValue(row){
  return Number(row["Return Value"]) || 0;
}

// Expiry Value follows the same naming convention as Sales Value / Return
// Value in the Summary sheet. Falls back to "Expiry" if present instead.
function getExpiryValue(row){
  if (row["Expiry Value"] !== undefined) return Number(row["Expiry Value"]) || 0;
  if (row["Expiry"] !== undefined) return Number(row["Expiry"]) || 0;
  return 0;
}

/* ---------------------------------------------------------------------------
   9. TAB 1 — DAY WISE (group by Bill Date, reliable dd-MMM-yyyy parsing)
   --------------------------------------------------------------------------- */

function computeDayWise(rows){
  const groups = new Map();

  rows.forEach((row) => {
    const dateObj = parseSummaryDate(row["Bill Date"]);
    if (!dateObj) return;

    const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

    if (!groups.has(key)){
      groups.set(key, { date: dateObj, sale: 0, return: 0 });
    }

    const bucket = groups.get(key);
    bucket.sale += getSaleValue(row);
    bucket.return += getReturnValue(row);
  });

  const dayRows = Array.from(groups.values())
    .map((bucket) => ({
      date: bucket.date,
      sale: bucket.sale,
      returnValue: bucket.return,
      netSale: bucket.sale - bucket.return
    }))
    .sort((a, b) => a.date - b.date); // ascending

  const totals = dayRows.reduce(
    (acc, r) => {
      acc.sale += r.sale;
      acc.returnValue += r.returnValue;
      acc.netSale += r.netSale;
      return acc;
    },
    { sale: 0, returnValue: 0, netSale: 0 }
  );

  return { dayRows, totals };
}

function renderDayWiseSummary(totals){
  if (dom.dayWise.totalSale) dom.dayWise.totalSale.textContent = formatCurrency(totals.sale);
  if (dom.dayWise.totalReturn) dom.dayWise.totalReturn.textContent = formatCurrency(totals.returnValue);
  if (dom.dayWise.totalNetSale) dom.dayWise.totalNetSale.textContent = formatCurrency(totals.netSale);
}

function renderDayWiseTable(dayRows){
  const tbody = dom.dayWise.tableBody;
  if (!tbody) return;

  tbody.innerHTML = "";

  if (dayRows.length === 0){
    renderMessageRow(tbody, 4, "No data available.");
    return;
  }

  const fragment = document.createDocumentFragment();

  dayRows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(r.date)}</td>
      <td data-numeric>${formatCurrency(r.sale)}</td>
      <td data-numeric>${formatCurrency(r.returnValue)}</td>
      <td data-numeric>${formatCurrency(r.netSale)}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

/* ---------------------------------------------------------------------------
   10. TAB 2 — CUSTOMER WISE (group by Customer Code + Customer Name)
   --------------------------------------------------------------------------- */

function computeCustomerWise(rows){
  const groups = new Map();

  rows.forEach((row) => {
    const code = String(row["Customer Code"] ?? "").trim() || "—";
    const name = String(row["Customer Name"] ?? "").trim() || "—";
    const key = `${code}|||${name}`;

    if (!groups.has(key)){
      groups.set(key, { code, name, sale: 0, return: 0, expiry: 0 });
    }

    const bucket = groups.get(key);
    bucket.sale += getSaleValue(row);
    bucket.return += getReturnValue(row);
    bucket.expiry += getExpiryValue(row);
  });

  return Array.from(groups.values())
    .map((bucket) => ({
      code: bucket.code,
      name: bucket.name,
      sale: bucket.sale,
      returnValue: bucket.return,
      expiry: bucket.expiry,
      netSale: bucket.sale - bucket.return - bucket.expiry
    }))
    .sort((a, b) => b.netSale - a.netSale); // highest Net Sale first
}

function renderCustomerTable(customerRows){
  const tbody = dom.customer.tableBody;
  if (!tbody) return;

  tbody.innerHTML = "";

  if (customerRows.length === 0){
    renderMessageRow(tbody, 6, "No data available.");
    return;
  }

  const fragment = document.createDocumentFragment();

  customerRows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.code}</td>
      <td>${r.name}</td>
      <td data-numeric>${formatCurrency(r.sale)}</td>
      <td data-numeric>${formatCurrency(r.returnValue)}</td>
      <td data-numeric>${formatCurrency(r.expiry)}</td>
      <td data-numeric>${formatCurrency(r.netSale)}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

function filterCustomerRows(customerRows, query){
  const normalized = query.trim().toLowerCase();
  if (!normalized) return customerRows;

  return customerRows.filter(
    (r) =>
      r.name.toLowerCase().includes(normalized) ||
      r.code.toLowerCase().includes(normalized)
  );
}

/* ---------------------------------------------------------------------------
   11. TAB 3 — ROUTE WISE (group by Area)
   --------------------------------------------------------------------------- */

function computeRouteWise(rows){
  const groups = new Map();

  rows.forEach((row) => {
    const area = String(row["Area"] ?? "").trim() || "—";
    const customerKey = `${row["Customer Code"] ?? ""}|||${row["Customer Name"] ?? ""}`;

    if (!groups.has(area)){
      groups.set(area, { area, customers: new Set(), sale: 0, return: 0, expiry: 0 });
    }

    const bucket = groups.get(area);
    bucket.customers.add(customerKey);
    bucket.sale += getSaleValue(row);
    bucket.return += getReturnValue(row);
    bucket.expiry += getExpiryValue(row);
  });

  return Array.from(groups.values())
    .map((bucket) => ({
      area: bucket.area,
      customerCount: bucket.customers.size,
      sale: bucket.sale,
      returnValue: bucket.return,
      expiry: bucket.expiry,
      netSale: bucket.sale - bucket.return - bucket.expiry
    }))
    .sort((a, b) => b.netSale - a.netSale); // highest Net Sale first
}

function renderRouteTable(routeRows){
  const tbody = dom.route.tableBody;
  if (!tbody) return;

  tbody.innerHTML = "";

  if (routeRows.length === 0){
    renderMessageRow(tbody, 6, "No data available.");
    return;
  }

  const fragment = document.createDocumentFragment();

  routeRows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.area}</td>
      <td data-numeric>${formatNumber(r.customerCount)}</td>
      <td data-numeric>${formatCurrency(r.sale)}</td>
      <td data-numeric>${formatCurrency(r.returnValue)}</td>
      <td data-numeric>${formatCurrency(r.expiry)}</td>
      <td data-numeric>${formatCurrency(r.netSale)}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

function filterRouteRows(routeRows, query){
  const normalized = query.trim().toLowerCase();
  if (!normalized) return routeRows;

  return routeRows.filter((r) => r.area.toLowerCase().includes(normalized));
}

/* ---------------------------------------------------------------------------
   12. LIVE SEARCH (instant filter, no extra API calls, single listener each)
   --------------------------------------------------------------------------- */

function initCustomerSearch(customerRows){
  const input = dom.customer.search;
  if (!input) return;

  input.addEventListener("input", () => {
    const filtered = filterCustomerRows(customerRows, input.value);
    renderCustomerTable(filtered);
  });
}

function initRouteSearch(routeRows){
  const input = dom.route.search;
  if (!input) return;

  input.addEventListener("input", () => {
    const filtered = filterRouteRows(routeRows, input.value);
    renderRouteTable(filtered);
  });
}

/* ---------------------------------------------------------------------------
   13. INIT / ORCHESTRATION — exactly ONE API call, reused for header + all
   three tabs.
   --------------------------------------------------------------------------- */

async function initSalesAnalysis(){
  setLoadingState(true);
  initTabSwitching();

  const sessionUser = getLoggedInUser();

  if (!sessionUser){
    setFatalMessage("Please sign in again to view sales analysis.");
    setLoadingState(false);
    return;
  }

  try {
    const data = await fetchFromAppsScript();
    if (!data){
      throw new Error("Unable to load sales analysis data.");
    }

    const { summary, salesmanSnapshot, unitSnapshot } = data;

    // unitSnapshot may arrive as an object or as an array containing one object.
    const unit = Array.isArray(unitSnapshot) ? unitSnapshot[0] : unitSnapshot;

    const salesmanRow = findSalesmanRowByEmail(salesmanSnapshot, sessionUser.email);

    if (!salesmanRow){
      setFatalMessage("We couldn't find your account details. Contact your administrator.");
      setLoadingState(false);
      return;
    }

    const rank = computeSalesmanRank(salesmanSnapshot, sessionUser.email);
    populateHeader(salesmanRow, unit, sessionUser, rank);

    const ownRows = filterSummaryForSalesman(summary, salesmanRow.SalesmanName);

    if (ownRows.length === 0){
      setFatalMessage("No sales records found for your account yet.");
      setLoadingState(false);
      return;
    }

    // ---- Day Wise ----
    const { dayRows, totals } = computeDayWise(ownRows);
    renderDayWiseSummary(totals);
    renderDayWiseTable(dayRows);

    // ---- Customer Wise ----
    const customerRows = computeCustomerWise(ownRows);
    renderCustomerTable(customerRows);
    initCustomerSearch(customerRows);

    // ---- Route Wise ----
    const routeRows = computeRouteWise(ownRows);
    renderRouteTable(routeRows);
    initRouteSearch(routeRows);

  } catch (err) {
    console.error("Failed to load sales analysis:", err);
    setFatalMessage("Sales analysis data is temporarily unavailable. Please try again shortly.");
  } finally {
    setLoadingState(false);
  }
}

/* ---------------------------------------------------------------------------
   14. ENTRY POINT
   Theme is applied immediately (no need to wait on the API call), then the
   sales analysis data load kicks off. Single set of listeners — no duplicates.
   --------------------------------------------------------------------------- */

function bootSalesAnalysis(){
  initThemeToggle();
  initSalesAnalysis();
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", bootSalesAnalysis);
} else {
  bootSalesAnalysis();
}