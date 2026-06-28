// Constants
const BACKEND_URL = "http://127.0.0.1:5001/check";
const REPORT_URL = "http://127.0.0.1:5001/report";

// DOM Elements
const currentUrlEl = document.getElementById("current-url");
const resultContainer = document.getElementById("result-container");
const resultBadge = document.getElementById("result-badge");
const resultStatus = document.getElementById("result-status");
const scoreArea = document.getElementById("score-area");
const riskScoreEl = document.getElementById("risk-score");
const reasonsList = document.getElementById("reasons-list");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const recheckBtn = document.getElementById("recheck-btn");



let currentCheckedUrl = "";

/**
 * Gets the URL of the currently active tab.
 * @returns {Promise<string>} The active tab's URL
 */
async function getActiveTabUrl() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
                resolve(tabs[0].url);
            } else {
                reject(new Error("Could not determine active tab."));
            }
        });
    });
}

/**
 * Calls the local backend to analyze the given URL.
 * @param {string} url The URL to check
 * @returns {Promise<Object>} The analysis result
 */
async function analyzeUrl(url) {
    try {
        const response = await fetch(`${BACKEND_URL}?url=${encodeURIComponent(url)}`, { cache: 'no-store' });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        // Distinguish between network errors (backend not running) and other errors
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            throw new Error("Couldn't reach the safety checker. Is the local backend running?");
        }
        throw error;
    }
}



/**
 * Updates the UI to show the loading state.
 * @param {string} url The URL being checked
 */
function showLoadingState(url) {
    currentUrlEl.textContent = url;
    currentUrlEl.title = url;
    
    resultContainer.classList.remove("hidden");
    errorContainer.classList.add("hidden");
    
    // Reset badge
    resultBadge.className = "badge neutral";
    resultStatus.textContent = "Checking...";
    
    // Reset score and reasons
    scoreArea.classList.add("hidden");
    reasonsList.innerHTML = "";
    
    recheckBtn.disabled = true;
}

/**
 * Updates the UI with the successful analysis results.
 * @param {Object} result The analysis result from the backend
 */
function showResults(result) {
    resultBadge.className = result.is_safe ? "badge safe" : "badge unsafe";
    resultStatus.textContent = result.is_safe ? "\u2713 Safe" : "\u2715 Unsafe";
    
    // Append (Cached) if from cache
    if (result.cached) {
        resultStatus.textContent += " (Cached)";
    }
    
    riskScoreEl.textContent = result.risk_score;
    scoreArea.classList.remove("hidden");
    
    reasonsList.innerHTML = "";
    if (result.reasons && result.reasons.length > 0) {
        result.reasons.forEach(reason => {
            const li = document.createElement("li");
            li.textContent = reason;
            reasonsList.appendChild(li);
        });
    }

    // Inject report section if not already present
    let reportContainer = document.getElementById("report-container");
    if (!reportContainer) {
        reportContainer = document.createElement("div");
        reportContainer.id = "report-container";
        reportContainer.className = "report-container";
        reportContainer.innerHTML = `
            <p class="report-label">Was this result correct?</p>
            <div class="report-buttons">
                <button id="report-safe-btn" class="report-button safe-btn">✓ It's Safe</button>
                <button id="report-unsafe-btn" class="report-button unsafe-btn">✕ It's Unsafe</button>
            </div>
            <p id="report-message" class="report-message hidden"></p>
        `;
        resultContainer.appendChild(reportContainer);

        document.getElementById("report-safe-btn").addEventListener("click", () => submitReport(true));
        document.getElementById("report-unsafe-btn").addEventListener("click", () => submitReport(false));
    } else {
        // Reset buttons if re-checking
        document.getElementById("report-safe-btn").disabled = false;
        document.getElementById("report-unsafe-btn").disabled = false;
        document.getElementById("report-message").classList.add("hidden");
        document.getElementById("report-message").textContent = "";
    }
    
    recheckBtn.disabled = false;
}

/**
 * Submits a user report to the backend.
 * @param {boolean} reportedIsSafe Whether the user thinks the site is safe
 */
async function submitReport(reportedIsSafe) {
    const safeBtnEl = document.getElementById("report-safe-btn");
    const unsafeBtnEl = document.getElementById("report-unsafe-btn");
    const reportMsgEl = document.getElementById("report-message");

    safeBtnEl.disabled = true;
    unsafeBtnEl.disabled = true;

    try {
        const response = await fetch(REPORT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentCheckedUrl, reported_is_safe: reportedIsSafe })
        });

        if (!response.ok) throw new Error("Server error");

        reportMsgEl.textContent = "✓ Thanks for your report!";
        reportMsgEl.classList.remove("hidden");
    } catch (err) {
        reportMsgEl.textContent = "Could not submit report.";
        reportMsgEl.style.color = "var(--color-unsafe)";
        reportMsgEl.classList.remove("hidden");
        // Re-enable buttons on failure
        safeBtnEl.disabled = false;
        unsafeBtnEl.disabled = false;
    }
}

/**
 * Updates the UI to show an error message.
 * @param {Error} error The error that occurred
 */
function showError(error) {
    resultContainer.classList.add("hidden");
    errorContainer.classList.remove("hidden");
    
    errorMessage.textContent = error.message;
    
    recheckBtn.disabled = false;
}

/**
 * Main execution function triggered when popup opens or recheck is clicked.
 */
async function runCheck() {
    try {
        recheckBtn.disabled = true;
        currentUrlEl.textContent = "Getting tab information...";
        
        const url = await getActiveTabUrl();
        currentCheckedUrl = url;
        
        // Skip internal chrome:// URLs
        if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
            currentUrlEl.textContent = url;
            resultContainer.classList.add("hidden");
            errorContainer.classList.remove("hidden");
            errorMessage.textContent = "Browser internal pages cannot be checked.";
            return;
        }
        
        showLoadingState(url);
        
        const result = await analyzeUrl(url);
        
        showResults(result);
    } catch (error) {
        console.error("Check failed:", error);
        showError(error);
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    runCheck();
});

recheckBtn.addEventListener("click", () => {
    runCheck();
});