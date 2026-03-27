import {CONFIG} from "./config.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getYTData"){
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${request.id}&key=${CONFIG.YT_api}`;

        fetch(url)
            .then(res=>res.json()).then(data => {
                if (data.error){
                    sendResponse({success: false, error: data.error.message});
                } else {
                    sendResponse({success: true, data: data});
                }
            })
            .catch(err => sendResponse({success: false, error: err.message}));
        
        return true;
    }

    if (request.action === "getAISummary"){
        fetchSummary(request.id, request.title, request.author, request.description).then(summary => sendResponse({success: true, summary}))
            .catch(err => sendResponse({success: false, error: err.message}));
        return true;
    }
});

async function getTranscript(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();

        const parts = html.split('"captionTracks":[');
        if (parts.length <2 ) return null;

        const trackPart = parts[1].split(`]`)[0];
        const track = JSON.parse(`{"data": [${trackPart}] }`).data[0];

        const xmlResponse = await fetch(track.baseUrl);
        const xml = await xmlResponse.text();

        return xml.replace(/<[^>]*>/g, ' ').replace(/&amp;#39;/g, "'").substring(0, 5000);

    } catch(e){
        return null;
    }
}

async function fetchSummary(videoId, title, author, description){
    const transcript = await getTranscript(videoId);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.gem_api}`

    const safeDesc = (description || "").substring(0,300);
    const prompt = `
    you are an expert content summarizer, generate a concise and accurate summary of the
    folowing youtube video.

    inputs:
    Author: ${author}
    Title: ${title}
    Description: ${description.substring(0, 300)}
    Transcript Snippet: ${transcript || "N/A"}

    Instructions:
    1. if a transcript is provided, prioritize it as the primary source and summarise based strictly on what is said.
    2. if no transcription is available, infer the core message from the title and description only.
    3. focus on the main idea or key takeaway - avoid filler, speculation, or minor details.
    4. ensure factual alignment with the provided content

    Output Requirements:
    - maximum 2-3 sentences.
    - clear, direct, and informative
    - begin with exactly one revelant emoji
    - do not include any extra commentary, labels or formatting

    `;

    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            contents: [{parts: [{text: prompt}] }]
        })
    });
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    if (!data.candidates || !data.candidates[0].content){
        throw new Error("Gemnini returned an empty response :(");
    }

    return data.candidates[0].content.parts[0].text;
}