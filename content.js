

console.log("%c >>> HOVER TUBE ACTIVE <<< ", "color: yellow; background: black; font-size: 20px;");

if (typeof CONFIG === 'undefined'){
    console.error("critical: config is still not defined");
    var CONFIG = {YT_api: ""};
}

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
    popup.style.left = `${x + 15}px`;
    popup.style.top = `${y + 15}px`;

    popup.innerHTML = `
        <div style = "font-family: sans-serif; min-width: 150px;">
            <div style="color: #aaa; font-size: 10px;">ID: ${id}</div>
            <div style="margin-top: 5px;">Fetching stats...</div>
        </div>
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
                    </div>
            `;
            } else {
                popup.innerHTML = "<div>vid cant be found</div>"
            }
        } else {
            popup.innerHTML = "<div>err fetching the data</div>"
        }
    });
}