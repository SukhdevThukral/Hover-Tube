let hoverTime,popup, currentId;

document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const videoId = extractId(link.href);
    if (videoId && videoId !== currentId) {
        clearTimeout(hoverTime);
        hoverTime = setTimeout(() => {
            currentId = videoId;
            renderPopup(e.pageX, e.pageY, videoId);
            updatePopupWithData(videoId);
        }, 400);
    }
});

document.addEventListener('mouseout', (e) => {
    const link =  e.target.closest('a');
    if (!link) return;

    clearTimeout(hoverTime);
    if (popup) {

        currentId = null;

        gsap.to(popup,{
            opacity: 0, 
            scale: 0.95,
            duration: 0.2,
            onComplete: () => {
                if (popup && !currentId){
                    popup.remove();
                    popup = null;
                } 
            }
        });
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
            <span style="font-size: 10px; color: #fff; font-family: monospace;">ID: ${id}</span>
        </div>
        <div style="font-weight: 600;color: #fff; margin-bottom: 8px; font-size: 14px;" id="ht-title">
            Fetching YouTube Data...
        </div>
        <div class="ht-scanner" id="ht-loader"></div>
        <div id="ai-summary-box" style="opacity: 0; transform: translateY(10px); display: none;"></div>
    `;
    document.body.appendChild(popup);

    gsap.fromTo(popup, 
        {scale: 0.95, opacity: 0, y: 10},
        {scale: 1, opacity: 1, y:0, duration: 0.4, ease:"power2.out"}
    );
}

async function updatePopupWithData(id){
    if (!popup) return;

    if ( typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
        console.warn("Hover Tube: Extension context invalidated. Please refresh the page.");
        const titleEl = document.getElementById('ht-title');
        if (titleEl) titleEl.innerText = "Please refresh the page to continue.";
        return;
    }

    try{
        chrome.runtime.sendMessage({action: "getYTData", id: id}, (response) => {
        if (!popup || !document.contains(popup) || id !== currentId) return;
        
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

                chrome.runtime.sendMessage({
                    action: "getAISummary",
                    id: id,
                    title: title,
                    author: video.snippet.channelTitle,
                    description: video.snippet.description
                }, (aiResponse) => {
                    const summaryBox = document.getElementById('ai-summary-box');
                    const loaderEl  = document.getElementById('ht-loader');

                    if (!summaryBox || !popup || !document.contains(popup) || id !== currentId) return;

                    if (aiResponse && aiResponse.success){
                        summaryBox.innerHTML = 
                        `
                        <div style="color: #4dbaff; font-size: 10px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase;">Conclusion</div>
                        <div style="color: #eee; font-size: 13.5px; line-height:1.5;">${aiResponse.summary}</div>

                        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 10px; color: #777; display:flex; gap:12px;">
                            <span><strong style="color:#aaa">VIEWS</strong> ${views}</span>
                            <span><strong style="color:#aaa">LIKES</strong> ${likes}</span>
                            <span style="margin-left: auto;">${video.snippet.channelTitle}</span>
                        </div>
                        `;
                    } else {
                        summaryBox.innerHTML = `<span style="color: #ff4d4d;">AI was unable to process this video.</span>`;
                    }

                    summaryBox.style.display = 'block';
                    const tl = gsap.timeline();
                    tl.to(loaderEl, {opacity: 0, height: 0, margin: 0, duration: 0.3}).to(summaryBox, {
                        opacity: 1, y:0, duration: 0.5, ease:"power3.out"
                    }, "-=0.1"). set(document.querySelector('.ht-brand-tag'), {
                        innerText: "Ready",
                        backgroundColor: "rgba(0,255,136,0.1)",
                        color: "#00ff88"
                    });
                });

            } else {
                const titleEl = document.getElementById('ht-title');
                if (titleEl) titleEl.innerText = "Error trying to fetch the video.";
                const loader = document.getElementById('ht-loader');
                if (loader) loader.style.display = 'none';
            }
        } 
        });
    } catch (err){
        console.error('Communication breakdown:', err);
    }

}