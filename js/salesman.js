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
    track: document.getElementById("pharmaProgressTrack")
  },
  pl: {
    sale: document.getElementById("plSaleValue"),
    target: document.getElementById("plTargetValue"),
    achievement: document.getElementById("plAchievementValue"),
    pending: document.getElementById("plPendingValue"),
    uob: document.getElementById("plUobValue"),
    fill: document.getElementById("plProgressFill"),
    track: document.getElementById("plProgressTrack")
  },
  zenvito: {
    sale: document.getElementById("zenvitoSaleValue"),
    target: document.getElementById("zenvitoTargetValue"),
    achievement: document.getElementById("zenvitoAchievementValue"),
    pending: document.getElementById("zenvitoPendingValue"),
    uob: document.getElementById("zenvitoUobValue"),
    fill: document.getElementById("zenvitoProgressFill"),
    track: document.getElementById("zenvitoProgressTrack")
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

function animateProgress(fillEl, trackEl, percent){
  if (!fillEl) return;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  requestAnimationFrame(() => {
    fillEl.style.inlineSize = `${clamped}%`;
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
   7. HEADER POPULATION
   --------------------------------------------------------------------------- */

function populateHeader(salesmanRow, unit, sessionUser, rank){
  if (dom.salesmanName){
    dom.salesmanName.textContent = salesmanRow.SalesmanName || "—";
  }

  if (dom.profilePhoto && sessionUser?.photo){
    dom.profilePhoto.src = sessionUser.photo;
    dom.profilePhoto.alt = `${salesmanRow.SalesmanName || "Salesman"} profile photo`;
  }

  if (dom.rankBadge){
    dom.rankBadge.textContent = rank ? `#${rank}` : "—";
  }

  if (dom.financialMonthChip){
    dom.financialMonthChip.textContent = unit?.["Financial Year"] || "—";
  }

  if (dom.todaysDateChip){
    const todayRaw = unit?.["Today's Date"];
    dom.todaysDateChip.textContent = todayRaw
      ? new Date(todayRaw).toLocaleDateString("en-IN", {
          weekday: "short", day: "2-digit", month: "short", year: "numeric"
        })
      : "—";
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
   8. OVERALL KPI CALCULATION + POPULATION
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
  const todaysRequiredSale = remainingWorkingDays > 0
    ? pendingTarget / remainingWorkingDays
    : 0;

  return {
    overallTarget,
    overallSale,
    pendingTarget,
    overallAchievementPct,
    overallUob,
    todaysRequiredSale,
    remainingWorkingDays
  };
}

function populateOverallKpis(kpis){
  animateValue(dom.mtdSaleValue, kpis.overallSale, { formatter: formatCurrency });
  animateValue(dom.monthlyTargetValue, kpis.overallTarget, { formatter: formatCurrency });
  animateValue(dom.achievementValue, kpis.overallAchievementPct, { formatter: formatPercent });
  animateValue(dom.pendingTargetValue, kpis.pendingTarget, { formatter: formatCurrency });
  animateValue(dom.todaysRequiredSaleValue, kpis.todaysRequiredSale, { formatter: formatCurrency });
  animateValue(dom.overallUobValue, kpis.overallUob, { formatter: formatNumber });

  if (dom.mtdSaleSubtitle) dom.mtdSaleSubtitle.textContent = "Month to date";
  if (dom.monthlyTargetSubtitle) dom.monthlyTargetSubtitle.textContent = "Assigned this month";
  if (dom.achievementSubtitle) dom.achievementSubtitle.textContent = "Against monthly target";
  if (dom.pendingTargetSubtitle) dom.pendingTargetSubtitle.textContent = "Remaining to achieve";
  if (dom.todaysRequiredSaleSubtitle){
    dom.todaysRequiredSaleSubtitle.textContent = kpis.remainingWorkingDays > 0
      ? `Over ${formatNumber(kpis.remainingWorkingDays)} working day(s) left`
      : "No working days remaining";
  }
  if (dom.overallUobSubtitle) dom.overallUobSubtitle.textContent = "Units on board";
}

/* ---------------------------------------------------------------------------
   9. COMPANY CARDS (Pharma / PI (PL) / Zenvito)
   --------------------------------------------------------------------------- */

function populateCompanyCard(refs, target, achievement, achievementPct, uob){
  const pending = target - achievement;

  animateValue(refs.sale, achievement, { formatter: formatCurrency });
  animateValue(refs.target, target, { formatter: formatCurrency });
  animateValue(refs.achievement, achievementPct, { formatter: formatPercent });
  animateValue(refs.pending, pending, { formatter: formatCurrency });
  animateValue(refs.uob, uob, { formatter: formatNumber });
  animateProgress(refs.fill, refs.track, achievementPct);
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
   10. RUN RATE
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

  if (dom.currentRunRateSubtitle){
    dom.currentRunRateSubtitle.textContent = runRate.daysCompleted > 0
      ? `Based on ${formatNumber(runRate.daysCompleted)} day(s) completed`
      : "Average daily sale so far";
  }
  if (dom.requiredRunRateSubtitle) dom.requiredRunRateSubtitle.textContent = "Needed daily to hit target";
}

/* ---------------------------------------------------------------------------
   11. PROJECTION
   --------------------------------------------------------------------------- */

function computeProjection(kpis, runRate, unit){
  const totalWorkingDays = Number(unit?.["Total Working Days"]) || 0;

  const projectedMonthEndSale = runRate.currentRunRate * totalWorkingDays;
  const gapToTarget = kpis.overallTarget - projectedMonthEndSale;

  return { projectedMonthEndSale, gapToTarget };
}

function populateProjection(projection){
  animateValue(dom.projectedMonthEndValue, projection.projectedMonthEndSale, { formatter: formatCurrency });
  animateValue(dom.gapToTargetValue, projection.gapToTarget, { formatter: formatCurrency });

  if (dom.projectedMonthEndSubtitle) dom.projectedMonthEndSubtitle.textContent = "At current run rate";
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
    populateProjection(projection);

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
   --------------------------------------------------------------------------- */

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initSalesmanDashboard);
} else {
  initSalesmanDashboard();
}