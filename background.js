import {CONFIG} from "./config.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.local.get(['gem_api'], (result) => {
        const userKey = result.gem_api;

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
        }
        if (request.action === "getAISummary"){
            if (!userKey) {
                sendResponse({success:false, error: "Please set your Gemini API Key in the extension popup!!"});
                return;
            }

            fetchSummary(request.id, request.title, request.author, request.description, userKey).then(summary => sendResponse({success: true, summary}))
                .catch(err => sendResponse({success: false, error: err.message}));
        }
    });

    return true;
});

async function getTranscript(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();
        
        console.log("[Transcript] HTML fetched, length:", html.length);

        const splitHtml = html.split('"captionTracks":')
        console.log("[Transcript] captionTracks splits found:", splitHtml.length);

        if (splitHtml.length < 2 ){
            console.warn("[Transcript] 'captionTracks' ntot found in HTML, yt didnt return caption data");
            return null;
        }

        const lastPart = splitHtml[1].split(']')[0] + ']';
        console.log("[Transcript] raw caption json slide:", lastPart.substring(0,200));

        let captions;
        try {
            captions = JSON.parse(lastPart); 
            console.log("[Transcript] Parsed captions count:", captions.length);
            console.log("[Transcript] Available languages:", captions.map(t => t.languageCode));
        } catch(parseErr){
            console.warn("[Transcript] ❌ PROBLEM: JSON.parse failed on caption slice:", parseErr.message);
            console.log("[Transcript] Problematic string was:", lastPart.substring(0, 500));
            return null;
        }

        

        const track = captions.find(t => t.languageCode === 'en') || captions[0];
        console.log("[Transcript] Selected track:", track?.languageCode, "| has baseUrl:", !!track?.baseUrl);

        if(!track || !track.baseUrl){
            console.warn("[Transcript] no valid track or baseUrl found");
            return null;
        }


        const xmlRes = await fetch(track.baseUrl);
        const xmlText = await xmlRes.text();
        console.log("[Transcript] Is actual XML?", xmlText.trimStart().startsWith('<?xml'));
        console.log("[Transcript] XML fetched, length:", xmlText.length);
        console.log("[Transcript] XML preview:", xmlText.substring(0, 300));       

        const result =  xmlText.replace(/<text/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;quot;/g, '"').replace(/\s+/g, ' ').trim().substring(0, 10000);

        console.log("[Transcript] ✅ Final transcript length:", result.length);
        console.log("[Transcript] Transcript preview:", result.substring(0, 200));
        return result;

    } catch(e){
        console.warn("[Transcript] uncaught error", e)
        return null;
    }
}

async function fetchSummary(videoId, title, author, description, apiKey){
    const transcript = await getTranscript(videoId);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`

    const safeDesc = (description || "").replace(/https?:\/\/\S+/g, '').substring(0,500);
    const prompt = `
    you are an expert content analyser, generate a exact conclusion of the
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
    7. do not use uncertain or hedging language (e.g., "likely", "appears", "suggests").
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
            contents: [{parts: [{text: prompt}] }],
            generationConfig: {
                temperature: 0.1,
                topP: 0.8,
                topK: 40
            }
        })
    });
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    if (!data.candidates || !data.candidates[0].content){
        throw new Error("Gemnini returned an empty response :(");
    }

    return data.candidates[0].content.parts[0].text;
}