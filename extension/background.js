const BACKEND_URL = "http://127.0.0.1:5001/check";


chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only proceed if the URL has changed and the page has finished loading
    if (changeInfo.status === 'complete' && tab.url) {
        
        // Skip browser internal pages
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
            return;
        }



        try {
            // Call the backend
            const response = await fetch(`${BACKEND_URL}?url=${encodeURIComponent(tab.url)}`, { cache: 'no-store' });
            if (response.ok) {
                const result = await response.json();
                
                // Send the result to the content script running on that tab
                chrome.tabs.sendMessage(tabId, {
                    type: "SAFETY_CHECK_RESULT",
                    data: result
                }).catch(() => {
                    // Ignore errors where content script might not be loaded yet
                });
            }
        } catch (error) {
            console.error("Background check failed:", error);
            // Optionally tell the content script that the backend is down
            chrome.tabs.sendMessage(tabId, {
                type: "SAFETY_CHECK_ERROR",
                message: "Couldn't reach the local safety checker."
            }).catch(() => {});
        }
    }
});

