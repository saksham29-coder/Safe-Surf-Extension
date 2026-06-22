// Keep track of the current overlay to prevent duplicates
let currentOverlay = null;

// Listen for messages from the background worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SAFETY_CHECK_RESULT") {
        showSafetySymbol(message.data);
    } else if (message.type === "SAFETY_CHECK_ERROR") {
        // Treat errors as unsafe so we only show green tick or red cross
        showSafetySymbol({
            is_safe: false,
            risk_score: 100,
            reasons: ["Safety check failed: " + message.message]
        });
    }
});

function createOverlayElement() {
    // Remove existing overlay if present
    if (currentOverlay) {
        currentOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.className = "safe-site-checker-overlay";
    document.body.appendChild(overlay);
    currentOverlay = overlay;
    return overlay;
}

function showSafetySymbol(data) {
    const overlay = createOverlayElement();
    
    // Create the small symbol
    const symbol = document.createElement("div");
    symbol.className = `ssc-symbol ${data.is_safe ? 'safe' : 'unsafe'}`;
    
    // Use the native title attribute to show details on hover
    if (data.is_safe) {
        symbol.title = "Site is Safe";
    } else {
        let titleText = `Suspicious Site! Risk Score: ${data.risk_score}/100\n`;
        if (data.reasons && data.reasons.length > 0) {
            titleText += "\nReasons:\n- " + data.reasons.join("\n- ");
        }
        symbol.title = titleText;
    }
    
    // Clicking the symbol removes it
    symbol.onclick = () => overlay.remove();
    
    overlay.appendChild(symbol);
    
    // Trigger animation to show it
    setTimeout(() => {
        overlay.classList.add("visible");
    }, 50);
}


