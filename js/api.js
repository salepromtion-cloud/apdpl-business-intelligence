/* ==========================================================================
   APDPL BUSINESS INTELLIGENCE
   File: js/api.js
   Purpose: Central API module — sole responsibility is communication
            with the Google Apps Script backend (Google Sheets database).
   Notes:
     - No data filtering, transformation, or DOM manipulation here.
     - Consumers (dashboard.js, charts.js, etc.) handle their own logic.
   ========================================================================== */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwRZaI4MRLuDIc64YoUYI3xx8Q9OW2HUxIhTyUp0SpMD1cuB7y8k7iv_tskL2d1HnYSDQ/exec';

/**
 * Fetches JSON data from the Google Apps Script endpoint.
 * @param {Object} [params] - Optional query parameters to append to the request.
 * @returns {Promise<Object|null>} Parsed JSON response, or null on failure.
 */
async function fetchFromAppsScript(params = {}) {
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

    return data;
  } catch (error) {
    console.error('[api.js] Network error while contacting Apps Script:', error);
    return null;
  }
}

export { APPS_SCRIPT_URL, fetchFromAppsScript };
