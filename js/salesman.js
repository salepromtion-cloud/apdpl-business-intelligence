<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salesman Dashboard — APDPL Business Intelligence</title>
  <meta name="description" content="APDPL Business Intelligence — Salesman performance dashboard showing MTD sales, targets, achievement, run rate, projections, returns, focus products and announcements.">

  <link rel="icon" type="image/png" href="../assets/images/logo.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

  <link rel="stylesheet" href="../css/salesman.css">
  <link rel="stylesheet" href="../css/sales-analysis.css">
</head>
<body>

  <main class="salesman-page" id="salesmanPage">

    <!-- ================= HEADER ================= -->
    <header class="salesman-header" id="salesmanHeader">

      <!-- Row 1 (mobile): Logo + Profile | Desktop: Logo (left segment) -->
      <div class="header-row header-row-top">

        <div class="header-brand">
          <img
            src="../assets/images/logo.png"
            alt="APDPL Business Intelligence logo"
            class="header-logo"
            id="headerLogo">
        </div>

        <!-- Profile moved up here so it sits beside the logo on mobile;
             desktop layout keeps it at the end of the row via CSS order. -->
        <div class="profile-block" id="profileBlock">
          <div class="profile-photo-wrap">
            <img
              src=""
              alt="Salesman profile photo"
              class="profile-photo"
              id="profilePhoto">
            <span class="rank-badge" id="rankBadge">—</span>
          </div>
        </div>

      </div>

      <!-- Row 2 (mobile): Welcome + Salesman Name | Desktop: middle segment -->
      <div class="header-row header-row-welcome">

        <div class="header-welcome" id="headerWelcome">
          <p class="welcome-line">
            <span class="salesman-name" id="salesmanName">—</span>
          </p>
          <p class="header-subtitle" id="headerSubtitle">My Performance Dashboard</p>
          <div class="welcome-meta">
            <span class="meta-chip" id="financialMonth">
              <i class="bi bi-calendar3" aria-hidden="true"></i>
              <span>—</span>
            </span>
          </div>
        </div>

      </div>

      <!-- Row 3 (mobile): Date + Theme + Notification | Desktop: right segment -->
      <div class="header-row header-row-meta">

        <div class="header-actions">
          <span class="meta-chip" id="todaysDate">
            <i class="bi bi-clock-history" aria-hidden="true"></i>
            <span>—</span>
          </span>

          <button type="button" class="theme-toggle-btn" id="themeToggleBtn" aria-label="Toggle light or dark theme" aria-pressed="false">
            <i class="bi bi-moon-stars" aria-hidden="true"></i>
          </button>

          <button type="button" class="notification-btn" id="notificationBtn" aria-label="Notifications">
            <i class="bi bi-bell" aria-hidden="true"></i>
            <span class="notification-dot" id="notificationDot" hidden></span>
          </button>
        </div>

      </div>

    </header>

    <!-- ================= PORTAL NAVIGATION ================= -->
    <nav class="portal-tabs" id="portalTabs" role="tablist" aria-label="Salesman portal views">
      <button
        type="button"
        class="portal-tab is-active"
        id="dashboardTabBtn"
        role="tab"
        aria-selected="true"
        aria-controls="dashboardView">
        <i class="bi bi-speedometer2" aria-hidden="true"></i>
        <span>Dashboard</span>
      </button>

      <button
        type="button"
        class="portal-tab"
        id="detailsTabBtn"
        role="tab"
        aria-selected="false"
        aria-controls="salesDetailsView"
        tabindex="-1">
        <i class="bi bi-table" aria-hidden="true"></i>
        <span>Sales Details</span>
      </button>
    </nav>

    <!-- ================= DASHBOARD VIEW (Tab 1) ================= -->
    <div id="dashboardView" role="tabpanel" aria-labelledby="dashboardTabBtn">

    <!-- ================= SECTION 1 — OVERALL PERFORMANCE ================= -->
    <section class="dashboard-section" id="overallPerformanceSection" aria-labelledby="overallPerformanceTitle">
      <div class="section-heading">
        <h2 id="overallPerformanceTitle">Overall Performance</h2>
      </div>

      <div class="kpi-grid" id="overallPerformanceGrid">

        <article class="kpi-card" id="kpiMtdSale">
          <div class="kpi-icon kpi-icon-blue">
            <i class="bi bi-graph-up-arrow" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">MTD Sale</p>
          <p class="kpi-value" id="mtdSaleValue">—</p>
          <p class="kpi-subtitle" id="mtdSaleSubtitle">Month to date</p>
        </article>

        <article class="kpi-card" id="kpiMonthlyTarget">
          <div class="kpi-icon kpi-icon-indigo">
            <i class="bi bi-bullseye" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Monthly Target</p>
          <p class="kpi-value" id="monthlyTargetValue">—</p>
          <p class="kpi-subtitle" id="monthlyTargetSubtitle">Assigned this month</p>
        </article>

        <article class="kpi-card" id="kpiAchievement">
          <div class="kpi-icon kpi-icon-teal">
            <i class="bi bi-speedometer2" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Achievement %</p>
          <p class="kpi-value" id="achievementValue">—</p>
          <p class="kpi-subtitle" id="achievementSubtitle">Against monthly target</p>
        </article>

        <article class="kpi-card" id="kpiPendingTarget">
          <div class="kpi-icon kpi-icon-amber">
            <i class="bi bi-hourglass-split" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Pending Target</p>
          <p class="kpi-value" id="pendingTargetValue">—</p>
          <p class="kpi-subtitle" id="pendingTargetSubtitle">Remaining to achieve</p>
        </article>

        <article class="kpi-card" id="kpiTodaysRequiredSale">
          <div class="kpi-icon kpi-icon-rose">
            <i class="bi bi-calendar2-check" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Today's Required Sale</p>
          <p class="kpi-value" id="todaysRequiredSaleValue">—</p>
          <p class="kpi-subtitle" id="todaysRequiredSaleSubtitle">To stay on track</p>
        </article>

        <article class="kpi-card" id="kpiOverallUob">
          <div class="kpi-icon kpi-icon-blue">
            <i class="bi bi-box-seam" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Overall UOB</p>
          <p class="kpi-value" id="overallUobValue">—</p>
          <p class="kpi-subtitle" id="overallUobSubtitle">Units on board</p>
        </article>

      </div>
    </section>

    <!-- ================= SECTION 2 — COMPANY PERFORMANCE ================= -->
    <section class="dashboard-section" id="companyPerformanceSection" aria-labelledby="companyPerformanceTitle">
      <div class="section-heading">
        <h2 id="companyPerformanceTitle">Company Performance</h2>
      </div>

      <div class="company-grid" id="companyPerformanceGrid">

        <article class="company-card" id="companyCardPharma">
          <div class="company-card-header">
            <span class="company-icon" aria-hidden="true">💊</span>
            <h3 class="company-name">Pharma</h3>
          </div>

          <dl class="company-metrics">
            <div class="company-metric">
              <dt>Sale</dt>
              <dd id="pharmaSaleValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Target</dt>
              <dd id="pharmaTargetValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Achievement %</dt>
              <dd id="pharmaAchievementValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Pending</dt>
              <dd id="pharmaPendingValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>UOB</dt>
              <dd id="pharmaUobValue">—</dd>
            </div>
          </dl>

          <div class="progress-track" id="pharmaProgressTrack" role="progressbar" aria-label="Pharma achievement progress" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" id="pharmaProgressFill"></div>
          </div>
        </article>

        <article class="company-card" id="companyCardPl">
          <div class="company-card-header">
            <span class="company-icon" aria-hidden="true">🏷️</span>
            <h3 class="company-name">PL</h3>
          </div>

          <dl class="company-metrics">
            <div class="company-metric">
              <dt>Sale</dt>
              <dd id="plSaleValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Target</dt>
              <dd id="plTargetValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Achievement %</dt>
              <dd id="plAchievementValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Pending</dt>
              <dd id="plPendingValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>UOB</dt>
              <dd id="plUobValue">—</dd>
            </div>
          </dl>

          <div class="progress-track" id="plProgressTrack" role="progressbar" aria-label="PL achievement progress" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" id="plProgressFill"></div>
          </div>
        </article>

        <article class="company-card" id="companyCardZenvito">
          <div class="company-card-header">
            <span class="company-icon" aria-hidden="true">🌿</span>
            <h3 class="company-name">Zenvito</h3>
          </div>

          <dl class="company-metrics">
            <div class="company-metric">
              <dt>Sale</dt>
              <dd id="zenvitoSaleValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Target</dt>
              <dd id="zenvitoTargetValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Achievement %</dt>
              <dd id="zenvitoAchievementValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>Pending</dt>
              <dd id="zenvitoPendingValue">—</dd>
            </div>
            <div class="company-metric">
              <dt>UOB</dt>
              <dd id="zenvitoUobValue">—</dd>
            </div>
          </dl>

          <div class="progress-track" id="zenvitoProgressTrack" role="progressbar" aria-label="Zenvito achievement progress" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" id="zenvitoProgressFill"></div>
          </div>
        </article>

      </div>
    </section>

    <!-- ================= SECTION 3 — RUN RATE ================= -->
    <section class="dashboard-section" id="runRateSection" aria-labelledby="runRateTitle">
      <div class="section-heading">
        <h2 id="runRateTitle">Run Rate</h2>
      </div>

      <div class="run-rate-grid" id="runRateGrid">

        <article class="run-rate-card" id="currentRunRateCard">
          <div class="kpi-icon kpi-icon-teal">
            <i class="bi bi-speedometer" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Current Run Rate (CRR)</p>
          <p class="kpi-value" id="currentRunRateValue">—</p>
          <p class="kpi-subtitle" id="currentRunRateSubtitle">Average daily sale so far</p>
        </article>

        <article class="run-rate-card" id="requiredRunRateCard">
          <div class="kpi-icon kpi-icon-amber">
            <i class="bi bi-graph-up" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Required Run Rate (RRR)</p>
          <p class="kpi-value" id="requiredRunRateValue">—</p>
          <p class="kpi-subtitle" id="requiredRunRateSubtitle">Needed daily to hit target</p>
        </article>

      </div>
    </section>

    <!-- ================= SECTION 4 — PROJECTION ================= -->
    <section class="dashboard-section" id="projectionSection" aria-labelledby="projectionTitle">
      <div class="section-heading">
        <h2 id="projectionTitle">Projection</h2>
      </div>

      <div class="projection-grid" id="projectionGrid">

        <article class="projection-card" id="projectedMonthEndCard">
          <div class="kpi-icon kpi-icon-blue">
            <i class="bi bi-graph-up-arrow" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Projected Month End Sale</p>
          <p class="kpi-value" id="projectedMonthEndValue">—</p>
          <p class="kpi-subtitle" id="projectedMonthEndSubtitle">At current run rate</p>
        </article>

        <article class="projection-card" id="gapToTargetCard">
          <div class="kpi-icon kpi-icon-rose">
            <i class="bi bi-exclamation-diamond" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Gap To Target</p>
          <p class="kpi-value" id="gapToTargetValue">—</p>
          <p class="kpi-subtitle" id="gapToTargetSubtitle">Projected shortfall / surplus</p>
        </article>

      </div>
    </section>

    <!-- ================= SECTION 5 — RETURNS ================= -->
    <section class="dashboard-section" id="returnsSection" aria-labelledby="returnsTitle">
      <div class="section-heading">
        <h2 id="returnsTitle">Returns</h2>
      </div>

      <div class="returns-grid" id="returnsGrid">

        <article class="returns-card" id="pharmaReturnCard">
          <div class="kpi-icon kpi-icon-indigo">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Pharma Return</p>
          <p class="kpi-value" id="pharmaReturnValue">—</p>
        </article>

        <article class="returns-card" id="plReturnCard">
          <div class="kpi-icon kpi-icon-indigo">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">PL Return</p>
          <p class="kpi-value" id="plReturnValue">—</p>
        </article>

        <article class="returns-card" id="returnPercentCard">
          <div class="kpi-icon kpi-icon-rose">
            <i class="bi bi-percent" aria-hidden="true"></i>
          </div>
          <p class="kpi-label">Return %</p>
          <p class="kpi-value" id="returnPercentValue">—</p>
        </article>

      </div>
    </section>

    <!-- ================= SECTION 6 — FOCUS PRODUCTS ================= -->
    <section class="dashboard-section" id="focusProductsSection" aria-labelledby="focusProductsTitle">
      <div class="section-heading">
        <h2 id="focusProductsTitle">Focus Products</h2>
      </div>

      <article class="list-card" id="focusProductsCard">
        <ul class="scrollable-list" id="focusProductsList">
          <li class="empty-state" id="focusProductsEmptyState">
            <i class="bi bi-clipboard2-data" aria-hidden="true"></i>
            <p>No focus products assigned yet.</p>
          </li>
        </ul>
      </article>
    </section>

    <!-- ================= SECTION 7 — ANNOUNCEMENTS ================= -->
    <section class="dashboard-section" id="announcementsSection" aria-labelledby="announcementsTitle">
      <div class="section-heading">
        <h2 id="announcementsTitle">Announcements</h2>
      </div>

      <article class="list-card" id="announcementsCard">
        <ul class="scrollable-list" id="announcementsList">
          <li class="empty-state" id="announcementsEmptyState">
            <i class="bi bi-megaphone" aria-hidden="true"></i>
            <p>No announcements at this time.</p>
          </li>
        </ul>
      </article>
    </section>

    </div>
    <!-- ================= END DASHBOARD VIEW ================= -->

    <!-- ================= SALES DETAILS VIEW (Tab 2) ================= -->
    <div id="salesDetailsView" role="tabpanel" aria-labelledby="detailsTabBtn" hidden>

      <!-- ================= SECTION — SALES ANALYSIS TABS ================= -->
      <section class="dashboard-section" id="salesAnalysisSection" aria-labelledby="salesAnalysisTitle">
        <div class="section-heading">
          <h2 id="salesAnalysisTitle">Sales Analysis</h2>
        </div>

        <!-- Tab navigation (ARIA tabs pattern). Switching is handled by JS
             elsewhere — this markup only defines structure and the default
             visible panel via the native `hidden` attribute. -->
        <div class="tabs-nav" id="salesAnalysisTabs" role="tablist" aria-label="Sales analysis views">
          <button
            type="button"
            class="tab-btn is-active"
            id="dayWiseTabBtn"
            role="tab"
            aria-selected="true"
            aria-controls="dayWisePanel">
            <span class="tab-icon" aria-hidden="true">📅</span>
            <span class="tab-label">Day Wise</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            id="customerWiseTabBtn"
            role="tab"
            aria-selected="false"
            aria-controls="customerWisePanel"
            tabindex="-1">
            <span class="tab-icon" aria-hidden="true">👥</span>
            <span class="tab-label">Customer Wise</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            id="routeWiseTabBtn"
            role="tab"
            aria-selected="false"
            aria-controls="routeWisePanel"
            tabindex="-1">
            <span class="tab-icon" aria-hidden="true">🗺</span>
            <span class="tab-label">Route Wise</span>
          </button>
        </div>

        <!-- ============ TAB PANEL 1 — DAY WISE ============ -->
        <div
          class="tab-panel"
          id="dayWisePanel"
          role="tabpanel"
          aria-labelledby="dayWiseTabBtn"
          tabindex="0">

          <!-- Summary card -->
          <div class="kpi-grid analysis-summary-grid" id="dayWiseSummaryGrid">

            <article class="kpi-card" id="dayWiseTotalSaleCard">
              <div class="kpi-icon kpi-icon-blue">
                <i class="bi bi-graph-up-arrow" aria-hidden="true"></i>
              </div>
              <p class="kpi-label">Total Sale</p>
              <p class="kpi-value" id="dayWiseTotalSale">—</p>
            </article>

            <article class="kpi-card" id="dayWiseTotalReturnCard">
              <div class="kpi-icon kpi-icon-rose">
                <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
              </div>
              <p class="kpi-label">Total Return</p>
              <p class="kpi-value" id="dayWiseTotalReturn">—</p>
            </article>

            <article class="kpi-card" id="dayWiseTotalNetSaleCard">
              <div class="kpi-icon kpi-icon-teal">
                <i class="bi bi-cash-stack" aria-hidden="true"></i>
              </div>
              <p class="kpi-label">Total Net Sale</p>
              <p class="kpi-value" id="dayWiseTotalNetSale">—</p>
            </article>

          </div>

          <!-- Responsive table -->
          <div class="data-table-wrapper" id="dayWiseTableWrapper">
            <table class="data-table" id="dayWiseTable">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Sale</th>
                  <th scope="col">Return</th>
                  <th scope="col">Net Sale</th>
                </tr>
              </thead>
              <tbody id="dayWiseTableBody">
                <tr class="table-empty-row" id="dayWiseTableEmptyState">
                  <td colspan="4">
                    <div class="empty-state">
                      <i class="bi bi-clipboard2-data" aria-hidden="true"></i>
                      <p>No data available.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============ TAB PANEL 2 — CUSTOMER WISE ============ -->
        <div
          class="tab-panel"
          id="customerWisePanel"
          role="tabpanel"
          aria-labelledby="customerWiseTabBtn"
          tabindex="0"
          hidden>

          <!-- Search box -->
          <div class="table-search-bar" id="customerSearchBar">
            <label class="visually-hidden" for="customerSearch">Search customer name or customer code</label>
            <span class="table-search-icon" aria-hidden="true">
              <i class="bi bi-search"></i>
            </span>
            <input
              type="search"
              class="table-search-input"
              id="customerSearch"
              placeholder="Search Customer Name or Customer Code"
              autocomplete="off">
          </div>

          <!-- Responsive table -->
          <div class="data-table-wrapper" id="customerTableWrapper">
            <table class="data-table" id="customerTable">
              <thead>
                <tr>
                  <th scope="col">Customer Code</th>
                  <th scope="col">Customer Name</th>
                  <th scope="col">Sale</th>
                  <th scope="col">Return</th>
                  <th scope="col">Expiry</th>
                  <th scope="col">Net Sale</th>
                </tr>
              </thead>
              <tbody id="customerTableBody">
                <tr class="table-empty-row" id="customerTableEmptyState">
                  <td colspan="6">
                    <div class="empty-state">
                      <i class="bi bi-clipboard2-data" aria-hidden="true"></i>
                      <p>No data available.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============ TAB PANEL 3 — ROUTE WISE ============ -->
        <div
          class="tab-panel"
          id="routeWisePanel"
          role="tabpanel"
          aria-labelledby="routeWiseTabBtn"
          tabindex="0"
          hidden>

          <!-- Search box -->
          <div class="table-search-bar" id="routeSearchBar">
            <label class="visually-hidden" for="routeSearch">Search route</label>
            <span class="table-search-icon" aria-hidden="true">
              <i class="bi bi-search"></i>
            </span>
            <input
              type="search"
              class="table-search-input"
              id="routeSearch"
              placeholder="Search Route"
              autocomplete="off">
          </div>

          <!-- Responsive table -->
          <div class="data-table-wrapper" id="routeTableWrapper">
            <table class="data-table" id="routeTable">
              <thead>
                <tr>
                  <th scope="col">Route Name</th>
                  <th scope="col">Customer Count</th>
                  <th scope="col">Sale</th>
                  <th scope="col">Return</th>
                  <th scope="col">Expiry</th>
                  <th scope="col">Net Sale</th>
                </tr>
              </thead>
              <tbody id="routeTableBody">
                <tr class="table-empty-row" id="routeTableEmptyState">
                  <td colspan="6">
                    <div class="empty-state">
                      <i class="bi bi-clipboard2-data" aria-hidden="true"></i>
                      <p>No data available.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

    </div>
    <!-- ================= END SALES DETAILS VIEW ================= -->

    <!-- ================= FOOTER ================= -->
    <footer class="salesman-footer" id="salesmanFooter">
      <span id="footerCopyright">&copy; 2026 APDPL Business Intelligence</span>
      <span id="footerVersion">v1.0.0</span>
    </footer>

  </main>

  <script type="module" src="../js/salesman.js" defer></script>
</body>
</html>