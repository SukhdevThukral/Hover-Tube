import "./config.js"

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getYTData"){
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${request.id}&key=${CONFIG.YT_api}`;

        fetch(url)
            .then(res=>res.json()).then(data => sendResponse({success: true, data}))
            .catch(err => sendResponse({success: false, error: err.message}));
        
        return true;
    }
});