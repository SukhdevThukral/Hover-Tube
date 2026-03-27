let hoverTime;
let popup;

document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const videoId = extractId(link.href);
    if (videoId) {
        hoverTime = setTimeout(() => {
            renderPopup(e.pageX, e.pageY, videoId);
            updatePopupWithData(videoId);
        }, 400);
    }
});

document.addEventListener('mouseout', () => {
    clearTimeout(hoverTime);
    if (popup) {
        popup.remove();
        popup = null;
    }
});

function extractId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function renderPopup(x,y,id){

    if (popup) popup.remove();

    popup = document.createElement('div')
    popup.className = 'hover-tube-card';

    const finalX = (x+350 > window.innerWidth) ? x - 350 : x + 20;
    const finalY = (y+250 > window.innerHeight) ? y- 250 : y + 20;

    popup.style.left = `${finalX}px`;
    popup.style.top = `${finalY}px`;

    popup.innerHTML = `
        <div class="ht-meta-header">
            <span class="ht-brand-tag">Analyzing</span>
            <span class="font-size: 10px; color: #fff; font-family: monospace;">ID: ${id}</span>
        </div>
        <div style="font-weight: 600;color: #fff; margin-bottom: 8px; font-size: 14px;" id="ht-title">
            Fetching YouTube Data...
        </div>
        <div class="ht-scanner" id="ht-loader"></div>
        <div id="ai-summary-box" style="opacity: 0; transform: translateY(10px); display: none;"></div>
    `;
    document.body.appendChild(popup);
}

async function updatePopupWithData(id){
    if (!popup) return;

    chrome.runtime.sendMessage({action: "getYTData", id: id}, (response) => {

        if (!popup || !document.contains(popup)){
            console.log("popup was closed before fetch got overr")
            return;
        }
        if (response && response.success){
            const data =  response.data;
            if (data.items && data.items.length > 0){
                const video = data.items[0];
                const title = video.snippet.title;
                const views = Number(video.statistics.viewCount).toLocaleString();
                const likes = video.statistics.likeCount
                ? Number(video.statistics.likeCount).toLocaleString()
                : "N/A";
                
                const titleEl = document.getElementById('ht-title');
                const brandTag = document.querySelector('.ht-brand-tag');
                if (titleEl) titleEl.innerText = title;
                if (brandTag) brandTag.innerText = "Summarizing";
                
                popup.innerHTML = `
                    <div style="font-family: sans-serif; max-width: 280px;">
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #fff;">
                            ${title}
                        </div>
                        <div style="display: flex; gap: 15px; border-top: 1px solid #444; padding-top: 8px;">
                            <div>
                                <div style="color: #aaa; font-size: 10px; text-transform: uppercase;">Views</div>
                                <div style="color: #fff; font-weight: 600; font-size: 13px;">${views}</div>
                            </div>
                            <div>
                                <div style="color: #aaa; font-size: 10px; text-transform: uppercase;">Likes</div>
                                <div style="color: #fff; font-weight: 600; font-size: 13px;">${likes}</div>
                            </div>
                        </div>
                        <div id="ai-summary-box" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #555; font-size: 10px; line-height: 1.4;">
                            <span style="color: #aaa; font-style: italic;">Generating AI Summary...</span>
                        </div>
                    </div>
            `;

            chrome.runtime.sendMessage({
                action: "getAISummary",
                id: id,
                title: title,
                author: video.snippet.channelTitle,
                description: video.snippet.description
            }, (aiResponse) => {
                const sumamryBox = document.getElementById('ai-summary-box');
                if (!sumamryBox || !popup || !document.contains(popup)) return;

                if (aiResponse && aiResponse.success){
                    sumamryBox.innerHTML = `<span style="color: #4da6ff; font-weight: bold;">TL;DR:</span> ${aiResponse.summary}`;
                } else {
                    sumamryBox.innerHTML = `<span style="color: #ff4d4d;">Summary unavailable for this video.</span>`;
                }
            });

            } else {
                popup.innerHTML = "<div>vid cant be found</div>"
            }
        } else {
            popup.innerHTML = "<div>err fetching the data</div>"
        }
    });
}