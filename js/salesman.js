/* =============================================================================
   APDPL Business Intelligence — Salesman Dashboard Logic
   Scope: pages/salesman.html ONLY (population of existing ids, no markup/CSS)

   Data source: fetchFromAppsScript() from ./api.js — the ONLY API function used.
   No duplicate fetch logic, no other API functions created.
   ============================================================================= */

import { fetchFromAppsScript } from "./api.js";

/* ---------------------------------------------------------------------------
   1. DOM REFERENCES (existing ids from salesman.html — not modified)
   --------------------------------------------------------------------------- */

const dom = {
  page: document.getElementById("salesmanPage"),

  salesmanName: document.getElementById("salesmanName"),
  financialMonthChip: document.querySelector("#financialMonth span:last-child"),
  todaysDateChip: document.querySelector("#todaysDate span:last-child"),
  profilePhoto: document.getElementById("profilePhoto"),
  rankBadge: document.getElementById("rankBadge"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),

  // Portal navigation (new — Dashboard / Sales Details tabs)
  dashboardTabBtn: document.getElementById("dashboardTabBtn"),
  detailsTabBtn: document.getElementById("detailsTabBtn"),
  dashboardView: document.getElementById("dashboardView"),
  salesDetailsView: document.getElementById("salesDetailsView"),

  mtdSaleValue: document.getElementById("mtdSaleValue"),
  mtdSaleSubtitle: document.getElementById("mtdSaleSubtitle"),
  monthlyTargetValue: document.getElementById("monthlyTargetValue"),
  monthlyTargetSubtitle: document.getElementById("monthlyTargetSubtitle"),
  achievementValue: document.getElementById("achievementValue"),
  achievementSubtitle: document.getElementById("achievementSubtitle"),
  pendingTargetValue: document.getElementById("pendingTargetValue"),
  pendingTargetSubtitle: document.getElementById("pendingTargetSubtitle"),
  todaysRequiredSaleValue: document.getElementById("todaysRequiredSaleValue"),
  todaysRequiredSaleSubtitle: document.getElementById("todaysRequiredSaleSubtitle"),
  overallUobValue: document.getElementById("overallUobValue"),
  overallUobSubtitle: document.getElementById("overallUobSubtitle"),

  pharma: {
    sale: document.getElementById("pharmaSaleValue"),
    target: document.getElementById("pharmaTargetValue"),
    achievement: document.getElementById("pharmaAchievementValue"),
    pending: document.getElementById("pharmaPendingValue"),
    uob: document.getElementById("pharmaUobValue"),
    fill: document.getElementById("pharmaProgressFill"),
    track: document.getElementById("pharmaProgressTrack"),
    status: document.getElementById("pharmaStatusValue")
  },
  pl: {
    sale: document.getElementById("plSaleValue"),
    target: document.getElementById("plTargetValue"),
    achievement: document.getElementById("plAchievementValue"),
    pending: document.getElementById("plPendingValue"),
    uob: document.getElementById("plUobValue"),
    fill: document.getElementById("plProgressFill"),
    track: document.getElementById("plProgressTrack"),
    status: document.getElementById("plStatusValue")
  },
  zenvito: {
    sale: document.getElementById("zenvitoSaleValue"),
    target: document.getElementById("zenvitoTargetValue"),
    achievement: document.getElementById("zenvitoAchievementValue"),
    pending: document.getElementById("zenvitoPendingValue"),
    uob: document.getElementById("zenvitoUobValue"),
    fill: document.getElementById("zenvitoProgressFill"),
    track: document.getElementById("zenvitoProgressTrack"),
    status: document.getElementById("zenvitoStatusValue")
  },

  currentRunRateValue: document.getElementById("currentRunRateValue"),
  currentRunRateSubtitle: document.getElementById("currentRunRateSubtitle"),
  requiredRunRateValue: document.getElementById("requiredRunRateValue"),
  requiredRunRateSubtitle: document.getElementById("requiredRunRateSubtitle"),

  projectedMonthEndValue: document.getElementById("projectedMonthEndValue"),
  projectedMonthEndSubtitle: document.getElementById("projectedMonthEndSubtitle"),
  gapToTargetValue: document.getElementById("gapToTargetValue"),
  gapToTargetSubtitle: document.getElementById("gapToTargetSubtitle"),

  pharmaReturnValue: document.getElementById("pharmaReturnValue"),
  plReturnValue: document.getElementById("plReturnValue"),
  returnPercentValue: document.getElementById("returnPercentValue")
};

/* ---------------------------------------------------------------------------
   2. FORMATTING HELPERS (Indian currency / number / percent)
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

function formatPercent(value){
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

/* ---------------------------------------------------------------------------
   2b. BUSINESS-LOGIC HELPERS (new — normalization, status, greeting, avatar)
   --------------------------------------------------------------------------- */

// Auto-detects fraction (0.78) vs whole percent (78) from the sheet and
// always returns a value on the 0–100 scale.
function normalizePercent(value){
  const num = Number(value) || 0;
  return num <= 1 ? num * 100 : num;
}

// Maps a percentage to a status color for progress bars / text.
function getProgressColor(percent){
  if (percent >= 80) return "var(--success, #22c55e)";
  if (percent >= 50) return "var(--warning, #f59e0b)";
  return "var(--danger, #ef4444)";
}

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

// Company status label based on normalized achievement percentage.
function getCompanyStatus(pct){
  if (pct >= 90) return "Excellent";
  if (pct >= 70) return "Good";
  if (pct >= 50) return "Average";
  return "Poor";
}

// Run rate Ahead/Behind status + daily difference.
function getRunRateStatus(current, required){
  const diff = current - required;
  return {
    label: diff >= 0 ? "Ahead of Target" : "Behind Target",
    color: diff >= 0 ? "var(--success, #22c55e)" : "var(--danger, #ef4444)",
    diff
  };
}

// Forecast status per the business tiers.
function getForecastStatus(projectedSale, target){
  if (target <= 0) return { label: "—", color: "inherit" };
  const pct = (projectedSale / target) * 100;

  if (pct >= 100) return { label: "🏆 Target Achieved", color: "var(--success, #22c55e)" };
  if (pct >= 95)  return { label: "🎯 Almost There", color: "var(--success, #22c55e)" };
  if (pct >= 80)  return { label: "👍 On Track", color: "var(--warning, #f59e0b)" };
  if (pct >= 60)  return { label: "⚠ Needs Push", color: "var(--warning, #f59e0b)" };
  return { label: "🚨 Immediate Attention", color: "var(--danger, #ef4444)" };
}

// Formats today's date using browser local time (NOT sheet data).
// Example: "Wednesday, 09 Jul 2026"
function getFormattedTodayDate(){
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "short", year: "numeric"
  });
}

// Normalizes the Unit Snapshot's Financial Year value into an "FY ..." label
// without hardcoding the year — reads whatever the sheet provides.
function getFinancialYearLabel(rawValue){
  const value = String(rawValue || "").trim();
  if (!value || value === "—") return "—";
  return value.toUpperCase().startsWith("FY") ? value : `FY ${value}`;
}

/* ---------------------------------------------------------------------------
   3. ANIMATION HELPERS
   --------------------------------------------------------------------------- */

function animateValue(el, endValue, { formatter = formatNumber, duration = 700 } = {}){
  if (!el || !Number.isFinite(endValue)){
    if (el) el.textContent = "—";
    return;
  }

  const startTime = performance.now();

  function tick(now){
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = endValue * eased;
    el.textContent = formatter(current);

    if (progress < 1){
      requestAnimationFrame(tick);
    } else {
      el.textContent = formatter(endValue);
    }
  }

  requestAnimationFrame(tick);
}

// Updated: animates the fill smoothly AND colors it based on percent.
function animateProgress(fillEl, trackEl, percent){
  if (!fillEl) return;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));

  fillEl.style.inlineSize = "0%";
  fillEl.style.transition = "inline-size 700ms ease-out, background-color 300ms ease";
  fillEl.style.backgroundColor = getProgressColor(clamped);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fillEl.style.inlineSize = `${clamped}%`;
    });
  });

  if (trackEl){
    trackEl.setAttribute("aria-valuenow", clamped.toFixed(0));
  }
}

/* ---------------------------------------------------------------------------
   4. SESSION HELPERS
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
   4b. THEME TOGGLE (light / dark) — localStorage persisted, system-aware
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
   4c. PORTAL TABS (new — Dashboard / Sales Details switching)
   No page reload, no additional API calls — purely toggles visibility and
   remembers the last-selected tab in sessionStorage.
   --------------------------------------------------------------------------- */

const PORTAL_TAB_STORAGE_KEY = "salesmanPortalTab";

function getSavedPortalTab(){
  try {
    const value = sessionStorage.getItem(PORTAL_TAB_STORAGE_KEY);
    return value === "dashboard" || value === "details" ? value : null;
  } catch (err) {
    console.error("Failed to read saved portal tab from sessionStorage:", err);
    return null;
  }
}

function savePortalTab(tabName){
  try {
    sessionStorage.setItem(PORTAL_TAB_STORAGE_KEY, tabName);
  } catch (err) {
    console.error("Failed to save portal tab to sessionStorage:", err);
  }
}

function activatePortalTab(tabName){
  const isDashboard = tabName === "dashboard";

  if (dom.dashboardView){
    dom.dashboardView.hidden = !isDashboard;
  }
  if (dom.salesDetailsView){
    dom.salesDetailsView.hidden = isDashboard;
  }

  if (dom.dashboardTabBtn){
    dom.dashboardTabBtn.classList.toggle("is-active", isDashboard);
    dom.dashboardTabBtn.setAttribute("aria-selected", String(isDashboard));
    dom.dashboardTabBtn.tabIndex = isDashboard ? 0 : -1;
  }

  if (dom.detailsTabBtn){
    dom.detailsTabBtn.classList.toggle("is-active", !isDashboard);
    dom.detailsTabBtn.setAttribute("aria-selected", String(!isDashboard));
    dom.detailsTabBtn.tabIndex = isDashboard ? -1 : 0;
  }

  savePortalTab(tabName);
}

function initPortalTabs(){
  if (dom.dashboardTabBtn){
    dom.dashboardTabBtn.addEventListener("click", () => activatePortalTab("dashboard"));
  }

  if (dom.detailsTabBtn){
    dom.detailsTabBtn.addEventListener("click", () => activatePortalTab("details"));
  }

  // Restore last-selected tab (defaults to "dashboard" if none saved).
  const savedTab = getSavedPortalTab() || "dashboard";
  activatePortalTab(savedTab);
}

/* ---------------------------------------------------------------------------
   5. LOADING / ERROR STATE HELPERS
   --------------------------------------------------------------------------- */

function setLoadingState(isLoading){
  if (!dom.page) return;
  dom.page.setAttribute("aria-busy", String(isLoading));
}

function setFatalMessage(message){
  const subtitleEls = [
    dom.mtdSaleSubtitle, dom.monthlyTargetSubtitle, dom.achievementSubtitle,
    dom.pendingTargetSubtitle, dom.todaysRequiredSaleSubtitle, dom.overallUobSubtitle
  ];

  subtitleEls.forEach((el) => {
    if (el) el.textContent = message;
  });
}

/* ---------------------------------------------------------------------------
   6. SALESMAN LOOKUP (exact sheet column name — Email)
   --------------------------------------------------------------------------- */

function findSalesmanRow(salesmanSnapshot, email){
  if (!Array.isArray(salesmanSnapshot)) return null;

  return salesmanSnapshot.find(
    (row) =>
      String(row.Email).trim().toLowerCase() ===
      String(email).trim().toLowerCase()
  ) || null;
}

/* ---------------------------------------------------------------------------
   7. HEADER POPULATION — greeting + avatar fallback added
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
    // Uses the browser's local time, NOT the sheet's Today's Date / Financial
    // Year Start Date — always reflects the visitor's actual current date.
    dom.todaysDateChip.textContent = getFormattedTodayDate();
  }
}

/* ---------------------------------------------------------------------------
   7b. RANK CALCULATION (based on Overall Sale, not Role)
   --------------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------------
   8. OVERALL KPI CALCULATION + POPULATION — required sale edge cases + wording
   --------------------------------------------------------------------------- */

function computeOverallKpis(salesmanRow, unit){
  const targetPharma = Number(salesmanRow.TargetPharma) || 0;
  const targetPI = Number(salesmanRow.TargetPI) || 0;
  const targetZenvito = Number(salesmanRow.TargetZenvito) || 0;

  const achievementPharma = Number(salesmanRow.AchievementPharma) || 0;
  const achievementPI = Number(salesmanRow.AchievementPI) || 0;
  const achievementZenvito = Number(salesmanRow.AchievementZenvito) || 0;

  const uobPharma = Number(salesmanRow.UOBPharma) || 0;
  const uobPI = Number(salesmanRow.UOBPI) || 0;
  const uobZenvito = Number(salesmanRow.UOBZenvito) || 0;

  const overallTarget = targetPharma + targetPI + targetZenvito;
  const overallSale = achievementPharma + achievementPI + achievementZenvito;
  const pendingTarget = overallTarget - overallSale;
  const overallAchievementPct = overallTarget > 0 ? (overallSale / overallTarget) * 100 : 0;
  const overallUob = uobPharma + uobPI + uobZenvito;

  const remainingWorkingDays = Number(unit?.["Remaining Working Days"]) || 0;

  const isPeriodCompleted = remainingWorkingDays <= 0;
  const isTargetAchieved = pendingTarget <= 0;
  const todaysRequiredSale = (!isPeriodCompleted && !isTargetAchieved)
    ? pendingTarget / remainingWorkingDays
    : 0;

  return {
    overallTarget,
    overallSale,
    pendingTarget,
    overallAchievementPct,
    overallUob,
    todaysRequiredSale,
    remainingWorkingDays,
    isPeriodCompleted,
    isTargetAchieved
  };
}

function populateOverallKpis(kpis){
  animateValue(dom.mtdSaleValue, kpis.overallSale, { formatter: formatCurrency });
  animateValue(dom.monthlyTargetValue, kpis.overallTarget, { formatter: formatCurrency });
  animateValue(dom.achievementValue, kpis.overallAchievementPct, { formatter: formatPercent });
  animateValue(dom.pendingTargetValue, kpis.pendingTarget, { formatter: formatCurrency });
  animateValue(dom.overallUobValue, kpis.overallUob, { formatter: formatNumber });

  if (dom.todaysRequiredSaleValue){
    if (kpis.isPeriodCompleted){
      dom.todaysRequiredSaleValue.textContent = "Target Period Completed";
    } else if (kpis.isTargetAchieved){
      dom.todaysRequiredSaleValue.textContent = "Target Achieved 🎉";
    } else {
      animateValue(dom.todaysRequiredSaleValue, kpis.todaysRequiredSale, { formatter: formatCurrency });
    }
  }

  if (dom.mtdSaleSubtitle) dom.mtdSaleSubtitle.textContent = "Month to date";
  if (dom.monthlyTargetSubtitle) dom.monthlyTargetSubtitle.textContent = "Assigned this month";
  if (dom.achievementSubtitle) dom.achievementSubtitle.textContent = "Against monthly target";
  if (dom.pendingTargetSubtitle) dom.pendingTargetSubtitle.textContent = "Remaining to achieve";
  if (dom.todaysRequiredSaleSubtitle){
    dom.todaysRequiredSaleSubtitle.textContent = kpis.isPeriodCompleted
      ? "No working days remaining"
      : kpis.isTargetAchieved
        ? "Target already met — great work!"
        : `Over ${formatNumber(kpis.remainingWorkingDays)} working day(s) left`;
  }
  if (dom.overallUobSubtitle) dom.overallUobSubtitle.textContent = "Units on board";
}

/* ---------------------------------------------------------------------------
   9. COMPANY CARDS (Pharma / PI (PL) / Zenvito) — normalized %, status shown
      separately (not mixed into the value), skipped gracefully if no status
      element exists in the HTML.
   --------------------------------------------------------------------------- */

function populateCompanyCard(refs, target, achievement, achievementPct, uob){
  const pending = target - achievement;
  const normalizedPct = normalizePercent(achievementPct);
  const status = getCompanyStatus(normalizedPct);

  animateValue(refs.sale, achievement, { formatter: formatCurrency });
  animateValue(refs.target, target, { formatter: formatCurrency });

  // Animate ONLY the percentage — no status text mixed in.
  animateValue(refs.achievement, normalizedPct, { formatter: formatPercent });
  if (refs.achievement){
    refs.achievement.style.color = getProgressColor(normalizedPct);
  }

  // Status goes in its own element if present; otherwise skipped — never breaks.
  if (refs.status){
    refs.status.textContent = status;
    refs.status.style.color = getProgressColor(normalizedPct);
  }

  animateValue(refs.pending, pending, { formatter: formatCurrency });
  animateValue(refs.uob, uob, { formatter: formatNumber });
  animateProgress(refs.fill, refs.track, normalizedPct);
}

function populateCompanyCards(salesmanRow){
  const targetPharma = Number(salesmanRow.TargetPharma) || 0;
  const targetPI = Number(salesmanRow.TargetPI) || 0;
  const targetZenvito = Number(salesmanRow.TargetZenvito) || 0;

  const achievementPharma = Number(salesmanRow.AchievementPharma) || 0;
  const achievementPI = Number(salesmanRow.AchievementPI) || 0;
  const achievementZenvito = Number(salesmanRow.AchievementZenvito) || 0;

  const achievementPercentPharma = Number(salesmanRow.AchievementPercentPharma) || 0;
  const achievementPercentPI = Number(salesmanRow.AchievementPercentPI) || 0;
  const achievementPercentZenvito = Number(salesmanRow.AchievementPercentZenvito) || 0;

  const uobPharma = Number(salesmanRow.UOBPharma) || 0;
  const uobPI = Number(salesmanRow.UOBPI) || 0;
  const uobZenvito = Number(salesmanRow.UOBZenvito) || 0;

  populateCompanyCard(dom.pharma, targetPharma, achievementPharma, achievementPercentPharma, uobPharma);
  populateCompanyCard(dom.pl, targetPI, achievementPI, achievementPercentPI, uobPI);
  populateCompanyCard(dom.zenvito, targetZenvito, achievementZenvito, achievementPercentZenvito, uobZenvito);
}

/* ---------------------------------------------------------------------------
   10. RUN RATE — status label + daily difference in existing subtitle
   --------------------------------------------------------------------------- */

function computeRunRate(kpis, unit){
  const daysCompleted = Number(unit?.["Days Completed"]) || 0;
  const remainingWorkingDays = kpis.remainingWorkingDays;

  const currentRunRate = daysCompleted > 0 ? kpis.overallSale / daysCompleted : 0;
  const requiredRunRate = remainingWorkingDays > 0
    ? kpis.pendingTarget / remainingWorkingDays
    : 0;

  return { currentRunRate, requiredRunRate, daysCompleted };
}

function populateRunRate(runRate){
  animateValue(dom.currentRunRateValue, runRate.currentRunRate, { formatter: formatCurrency });
  animateValue(dom.requiredRunRateValue, runRate.requiredRunRate, { formatter: formatCurrency });

  const status = getRunRateStatus(runRate.currentRunRate, runRate.requiredRunRate);

  if (dom.currentRunRateSubtitle){
    dom.currentRunRateSubtitle.textContent = runRate.daysCompleted > 0
      ? `Based on ${formatNumber(runRate.daysCompleted)} day(s) completed`
      : "Average daily sale so far";
  }
  if (dom.requiredRunRateSubtitle){
    dom.requiredRunRateSubtitle.textContent =
      `${status.label} · Diff ${formatCurrency(Math.abs(status.diff))}/day`;
    dom.requiredRunRateSubtitle.style.color = status.color;
  }
}

/* ---------------------------------------------------------------------------
   11. PROJECTION — forecast tiers per business rules
   --------------------------------------------------------------------------- */

function computeProjection(kpis, runRate, unit){
  const totalWorkingDays = Number(unit?.["Total Working Days"]) || 0;

  const projectedMonthEndSale = runRate.currentRunRate * totalWorkingDays;
  const gapToTarget = kpis.overallTarget - projectedMonthEndSale;

  return { projectedMonthEndSale, gapToTarget };
}

function populateProjection(projection, kpis){
  animateValue(dom.projectedMonthEndValue, projection.projectedMonthEndSale, { formatter: formatCurrency });
  animateValue(dom.gapToTargetValue, projection.gapToTarget, { formatter: formatCurrency });

  const forecast = getForecastStatus(projection.projectedMonthEndSale, kpis.overallTarget);

  if (dom.projectedMonthEndSubtitle){
    dom.projectedMonthEndSubtitle.textContent = `At current run rate · ${forecast.label}`;
    dom.projectedMonthEndSubtitle.style.color = forecast.color;
  }
  if (dom.gapToTargetSubtitle){
    dom.gapToTargetSubtitle.textContent = projection.gapToTarget > 0
      ? "Projected shortfall"
      : "Projected surplus";
  }
}

/* ---------------------------------------------------------------------------
   12. RETURNS
   Summary sheet has NO Email column — filtered by SalesmanName ("Salesman").
   --------------------------------------------------------------------------- */

function computeReturns(summary, salesmanName){
  const normalizedName = String(salesmanName).trim().toLowerCase();

  const ownRows = Array.isArray(summary)
    ? summary.filter((row) => String(row.Salesman).trim().toLowerCase() === normalizedName)
    : [];

  const pharmaRows = ownRows.filter((row) => row.Company === "Pharma");
  const plRows = ownRows.filter((row) => row.Company === "PL");

  const sumReturn = (rows) =>
    rows.reduce((total, row) => total + (Number(row["Return Value"]) || 0), 0);

  const sumSale = (rows) =>
    rows.reduce((total, row) => total + (Number(row["Sales Value"]) || 0), 0);

  const pharmaReturn = sumReturn(pharmaRows);
  const plReturn = sumReturn(plRows);

  const totalReturn = pharmaReturn + plReturn;
  const totalSale = sumSale(pharmaRows) + sumSale(plRows);
  const returnPercent = totalSale > 0 ? (totalReturn / totalSale) * 100 : 0;

  return { pharmaReturn, plReturn, returnPercent };
}

function populateReturns(returns){
  animateValue(dom.pharmaReturnValue, returns.pharmaReturn, { formatter: formatCurrency });
  animateValue(dom.plReturnValue, returns.plReturn, { formatter: formatCurrency });
  animateValue(dom.returnPercentValue, returns.returnPercent, { formatter: formatPercent });
}

/* ---------------------------------------------------------------------------
   13. INIT / ORCHESTRATION
   --------------------------------------------------------------------------- */

async function initSalesmanDashboard(){
  setLoadingState(true);

  const sessionUser = getLoggedInUser();

  if (!sessionUser){
    setFatalMessage("Please sign in again to view your dashboard.");
    setLoadingState(false);
    return;
  }

  try {
    const data = await fetchFromAppsScript();
    if (!data) {
        throw new Error("Unable to load dashboard data.");
    }
    const { summary, salesmanSnapshot, unitSnapshot } = data;

    // unitSnapshot may arrive as an object or as an array containing one object.
    const unit = Array.isArray(unitSnapshot) ? unitSnapshot[0] : unitSnapshot;

    const salesmanRow = findSalesmanRow(salesmanSnapshot, sessionUser.email);

    if (!salesmanRow){
      setFatalMessage("We couldn't find performance data for your account. Contact your administrator.");
      setLoadingState(false);
      return;
    }

    const rank = computeSalesmanRank(salesmanSnapshot, sessionUser.email);
    populateHeader(salesmanRow, unit, sessionUser, rank);

    const overallKpis = computeOverallKpis(salesmanRow, unit);
    populateOverallKpis(overallKpis);

    populateCompanyCards(salesmanRow);

    const runRate = computeRunRate(overallKpis, unit);
    populateRunRate(runRate);

    const projection = computeProjection(overallKpis, runRate, unit);
    populateProjection(projection, overallKpis);

    const returns = computeReturns(summary, salesmanRow.SalesmanName);
    populateReturns(returns);

  } catch (err) {
    console.error("Failed to load salesman dashboard:", err);
    setFatalMessage("Dashboard data is temporarily unavailable. Please try again shortly.");
  } finally {
    setLoadingState(false);
  }
}

/* ---------------------------------------------------------------------------
   14. ENTRY POINT
   Theme is applied immediately (no need to wait on the API call), portal
   tabs are wired next, then the dashboard data load kicks off. Single set
   of listeners — no duplicates.
   --------------------------------------------------------------------------- */

function bootSalesmanDashboard(){
  initThemeToggle();
  initPortalTabs();
  initSalesmanDashboard();
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", bootSalesmanDashboard);
} else {
  bootSalesmanDashboard();
}