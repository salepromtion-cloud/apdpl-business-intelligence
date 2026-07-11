/* ==========================================================================
   APDPL BUSINESS INTELLIGENCE
   File: js/api.js
   Purpose: Central API module — sole responsibility is communication
            with the Google Apps Script backend (Google Sheets database).
   Notes:
     - No data filtering, transformation, or DOM manipulation here.
     - Consumers (dashboard.js, salesman.js, charts.js, reports.js, etc.)
       handle their own logic and do not need any changes to keep working.
   ========================================================================== */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyjrb4mhxvuY2LK_rsgKAoZnC2Th9OFOglCpKmoMDH0mx9ASt2Y5YT05M_RZ_CfCcZltw/exec';

/* ---------------------------------------------------------------------------
   CACHE LAYER
   Goal: fetch the Apps Script data only ONCE per browser session.

   Two tiers, checked in this order on every call:
     1. In-memory cache (appCache)      → fastest, but lost on page reload.
     2. sessionStorage (apdpl_app_cache) → survives reloads within the same
                                            browser tab/session.
   Only when BOTH are empty do we actually hit the network.

   Flow on first request:
     fetch from Apps Script
       → save to appCache (in-memory)
       → save to sessionStorage (apdpl_app_cache)
       → return data

   Flow on every later request (same session):
     appCache has data?        → return it immediately, no fetch.
     appCache empty but
     sessionStorage has data?  → hydrate appCache from sessionStorage,
                                   return it immediately, no fetch.
     both empty                → fetch from Apps Script (as above).
   --------------------------------------------------------------------------- */

const SESSION_CACHE_KEY = 'apdpl_app_cache';

// In-memory cache — lives only as long as this module instance does.
let appCache = null;

/* ---------------------------------------------------------------------------
   IN-FLIGHT REQUEST DEDUPLICATION
   Goal: if multiple modules (dashboard.js, salesman.js, charts.js, ...) all
   call fetchFromAppsScript() before the very first network request has
   finished, they must NOT each trigger their own fetch(). Only the first
   caller actually hits the network; every other caller that arrives while
   that request is still in flight simply awaits the SAME Promise.

   pendingRequest holds that shared in-flight Promise. It is:
     - created by the first caller when both caches are empty
     - returned as-is to any caller that arrives while it's still pending
     - reset to null the moment the request settles (success OR failure),
       so it never stays "locked" and blocks future fetches forever.
   --------------------------------------------------------------------------- */

let pendingRequest = null;

/**
 * Fetches JSON data from the Google Apps Script endpoint.
 * Uses the two-tier cache described above so the network is hit at most
 * once per browser session, and deduplicates concurrent in-flight requests
 * so simultaneous callers share a single fetch instead of triggering many.
 *
 * @param {Object} [params] - Optional query parameters to append to the request.
 * @returns {Promise<Object|null>} Parsed JSON response, or null on failure.
 */
async function fetchFromAppsScript(params = {}) {
  // --- Tier 1: in-memory cache -------------------------------------------
  if (appCache) {
    return appCache;
  }

  // --- Tier 2: sessionStorage cache ---------------------------------------
  try {
    const stored = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (stored) {
      appCache = JSON.parse(stored);
      return appCache;
    }
  } catch (storageReadError) {
    // If sessionStorage is unavailable or the stored value is corrupt,
    // fall through and fetch fresh data instead of failing.
    console.error('[api.js] Failed to read sessionStorage cache:', storageReadError);
  }

  // --- Tier 3: a request is already in flight — reuse it, don't refetch ---
  if (pendingRequest) {
    return pendingRequest;
  }

  // --- Both caches empty AND no request in flight: fetch from Apps Script -
  // This whole operation is wrapped in a single shared Promise so that any
  // caller arriving before it settles gets the exact same Promise back
  // (see the `if (pendingRequest)` check above) instead of starting a
  // second, redundant fetch().
  pendingRequest = (async () => {
    try {
      const url = new URL(APPS_SCRIPT_URL);

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        console.error(`[api.js] HTTP error: ${response.status} ${response.statusText}`);
        return null;
      }

      let data;

      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[api.js] Failed to parse JSON response:', parseError);
        return null;
      }

      // Populate both cache tiers so subsequent calls this session never
      // need to hit the network again.
      appCache = data;

      try {
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
      } catch (storageWriteError) {
        // Non-fatal — in-memory cache still works for the rest of this
        // page's lifetime even if sessionStorage can't be written to.
        console.error('[api.js] Failed to write sessionStorage cache:', storageWriteError);
      }

      return data;
    } catch (error) {
      console.error('[api.js] Network error while contacting Apps Script:', error);
      return null;
    } finally {
      // Whether the request succeeded or failed, it's no longer in flight.
      // Clearing this is essential — otherwise a failed request would
      // permanently block all future fetches by leaving pendingRequest set.
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}

/**
 * Clears all cache layers, forcing the next fetchFromAppsScript() call to
 * hit the network again. Useful for manual refresh actions or logout flows.
 */
function clearAppCache() {
  appCache = null;
  pendingRequest = null;

  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
  } catch (storageClearError) {
    console.error('[api.js] Failed to clear sessionStorage cache:', storageClearError);
  }
}

export {
    APPS_SCRIPT_URL,
    fetchFromAppsScript,
    clearAppCache
};