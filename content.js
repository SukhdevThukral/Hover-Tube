console.log("%c >>> HOVER TUBE ACTIVE <<< ", "color: yellow; background: black; font-size: 20px;");

let hoverTime;
let popup;

document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const videoId = extractId(link.href);
    if (videoId) {
        hoverTime = setTimeout(() => {
            renderPopup(e.pageX, e.pageY, videoId);
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
    popup = document.createElement('div')
    popup.className = 'hover-tube-card';
    popup.style.left = `${x + 15}px`;
    popup.style.top = `${y + 15}px`;
    popup.innerHTML = `<strong>Video ID:</strong> ${id}<br><em>Fetching stats...</em>`;
    document.body.appendChild(popup);
}