/* ---------------------------------------------------------------------------
   1. DOM REFERENCES — add optional status lookups (safe if ids don't exist)
   --------------------------------------------------------------------------- */
// Add these lines inside the existing `dom.pharma / dom.pl / dom.zenvito` objects,
// right after each `track:` line. They use getElementById, which safely returns
// null if the id isn't present in your HTML — nothing breaks either way.
//
// pharma:   status: document.getElementById("pharmaStatusValue"),
// pl:       status: document.getElementById("plStatusValue"),
// zenvito:  status: document.getElementById("zenvitoStatusValue"),

/* ---------------------------------------------------------------------------
   2. NEW HELPERS (added once — no duplicates, no renames of existing helpers)
   --------------------------------------------------------------------------- */

// Auto-detects fraction (0.78) vs whole percent (78) from the sheet.
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

// Forecast status per the business tiers you specified.
function getForecastStatus(projectedSale, target){
  if (target <= 0) return { label: "—", color: "inherit" };
  const pct = (projectedSale / target) * 100;

  if (pct >= 100) return { label: "🏆 Target Achieved", color: "var(--success, #22c55e)" };
  if (pct >= 95)  return { label: "🎯 Almost There", color: "var(--success, #22c55e)" };
  if (pct >= 80)  return { label: "👍 On Track", color: "var(--warning, #f59e0b)" };
  if (pct >= 60)  return { label: "⚠ Needs Push", color: "var(--warning, #f59e0b)" };
  return { label: "🚨 Immediate Attention", color: "var(--danger, #ef4444)" };
}

/* ---------------------------------------------------------------------------
   3. ANIMATION HELPERS — animateProgress updated for color + smooth fill-in
   --------------------------------------------------------------------------- */

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

  if (dom.mtdSaleSubtitle) dom.mtdSaleSubtitle.textContent = "Total sale achieved this month";
  if (dom.monthlyTargetSubtitle) dom.monthlyTargetSubtitle.textContent = "Total target assigned this month";
  if (dom.achievementSubtitle) dom.achievementSubtitle.textContent = "Overall achievement against target";
  if (dom.pendingTargetSubtitle) dom.pendingTargetSubtitle.textContent = "Balance target to reach";
  if (dom.todaysRequiredSaleSubtitle){
    dom.todaysRequiredSaleSubtitle.textContent = kpis.isPeriodCompleted
      ? "No working days remaining"
      : kpis.isTargetAchieved
        ? "Target already met — great work!"
        : `Today's need over ${formatNumber(kpis.remainingWorkingDays)} working day(s) left`;
  }
  if (dom.overallUobSubtitle) dom.overallUobSubtitle.textContent = "Total units on board";
}

/* ---------------------------------------------------------------------------
   9. COMPANY CARDS — normalized %, status shown separately (not inside value)
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

  // Status goes in its own element if present; otherwise nothing extra is shown.
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

function populateRunRate(runRate){
  animateValue(dom.currentRunRateValue, runRate.currentRunRate, { formatter: formatCurrency });
  animateValue(dom.requiredRunRateValue, runRate.requiredRunRate, { formatter: formatCurrency });

  const status = getRunRateStatus(runRate.currentRunRate, runRate.requiredRunRate);

  if (dom.currentRunRateSubtitle){
    dom.currentRunRateSubtitle.textContent = runRate.daysCompleted > 0
      ? `Average based on ${formatNumber(runRate.daysCompleted)} day(s) completed`
      : "Average daily sale so far";
  }
  if (dom.requiredRunRateSubtitle){
    dom.requiredRunRateSubtitle.textContent =
      `${status.label} · Diff ${formatCurrency(Math.abs(status.diff))}/day`;
    dom.requiredRunRateSubtitle.style.color = status.color;
  }
}

/* ---------------------------------------------------------------------------
   11. PROJECTION — forecast tiers updated to your new business logic
   --------------------------------------------------------------------------- */

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
   13. INIT / ORCHESTRATION — only the populateProjection call signature changes
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