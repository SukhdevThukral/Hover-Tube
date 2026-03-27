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
        
        const regex = /"captionTracks":\s*(\[.*?\])/;
        const match= html.match(regex);
        if (!match) return null;

        const captionTracks = JSON.parse(match[1]);
        const track = captionTracks.find(t => t.vssId.startsWith('.en')) || captionTracks[0];

        const xmlResponse = await fetch(track.baseUrl);
        const xml = await xmlResponse.text();

        let cleanText = xml.replace(/<text>[^>]*>/g, ' ').replace(/<\/text>/g, ' ').replace(/&amp;#39;/g, "'")
        .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

        if (cleanText.length > 8000){
            const start = cleanText.substring(0,4000);
            const end = cleanText.substring(cleanText.length - 4000);
            return `[START OF VIDEO]: ${start} ... [END OF VIDEO]: ${end}`;
        }
        return cleanText;

    } catch(e){
        return null;
    }
}

async function fetchSummary(videoId, title, author, description){
    const transcript = await getTranscript(videoId);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${CONFIG.gem_api}`

    const safeDesc = (description || "No description is provided").substring(0,300);
    const prompt = `
    you are an expert content summarizer, generate a concise and accurate summary of the
    folowing youtube video.

    inputs:
    Author: ${author}
    Title: ${title}
    Description: ${safeDesc}
    Transcript Snippet: ${transcript || "N/A"}

    Instructions:
    1. if a transcript is provided, base the summary strictly on it. Ignore assumptions from title/description unless supported.
    2.  If no transcript is available, infer the core message only from the title and description.
    3. Identify and summarize the single core argument or key takeaway of the video (not just topics).
    4. avoid generic phrasing like "the video discusses" or "explores".
    5. do not include minor details, examples, or filler.
    6. ensure factual accuracy with no added assumptions.
    7. do not use uncertain or hedgin language (e.g., "likely", "appears", "suggests").
    8. write the summary as a definitive statement of the main conclusion.
    9. do not restate the same idea in different words

    good examples:
    ❌ Bad: The video discusses the impact of social media on society.
    ✅ Good: Social media platforms amplify misinformation by prioritizing engagement over accuracy.

    ❌ Bad: The video explores India's food culture and debates.
    ✅ Good: Claims about uniform Hindu dietary restrictions are misleading, as historical and regional practices show significant variation.

    Output Requirements:
    - 1-2 sentences (prefer 1 if possible).
    - clear, specific, and conclusion-focused
    - no extra commentary or labels

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